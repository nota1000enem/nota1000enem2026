
-- Tabela de benefícios ativos por cupom
CREATE TABLE public.beneficios_cupom (
  user_id uuid PRIMARY KEY,
  redacao_creditos int NOT NULL DEFAULT 0,
  simulado_expira_em timestamptz,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.beneficios_cupom TO authenticated;
GRANT ALL ON public.beneficios_cupom TO service_role;
ALTER TABLE public.beneficios_cupom ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user sees own beneficios" ON public.beneficios_cupom
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Registro de cupons já resgatados por usuário
CREATE TABLE public.cupons_resgatados (
  user_id uuid NOT NULL,
  codigo text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, codigo)
);
GRANT SELECT ON public.cupons_resgatados TO authenticated;
GRANT ALL ON public.cupons_resgatados TO service_role;
ALTER TABLE public.cupons_resgatados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user sees own resgates" ON public.cupons_resgatados
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- RPC de resgate
CREATE OR REPLACE FUNCTION public.resgatar_cupom(_codigo text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
DECLARE
  _user uuid := auth.uid();
  _cod text := upper(btrim(coalesce(_codigo,'')));
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE='42501';
  END IF;

  IF _cod NOT IN ('REDACAO10','SIMULA10') THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'codigo_invalido');
  END IF;

  IF EXISTS(SELECT 1 FROM public.cupons_resgatados WHERE user_id=_user AND codigo=_cod) THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'ja_usado');
  END IF;

  IF _cod = 'REDACAO10' THEN
    INSERT INTO public.beneficios_cupom(user_id, redacao_creditos, atualizado_em)
    VALUES(_user, 10, now())
    ON CONFLICT (user_id) DO UPDATE SET
      redacao_creditos = public.beneficios_cupom.redacao_creditos + 10,
      atualizado_em = now();
  ELSE
    INSERT INTO public.beneficios_cupom(user_id, simulado_expira_em, atualizado_em)
    VALUES(_user, now() + interval '30 days', now())
    ON CONFLICT (user_id) DO UPDATE SET
      simulado_expira_em = GREATEST(coalesce(public.beneficios_cupom.simulado_expira_em, now()), now()) + interval '30 days',
      atualizado_em = now();
  END IF;

  INSERT INTO public.cupons_resgatados(user_id, codigo) VALUES(_user, _cod);

  RETURN jsonb_build_object('ok', true, 'codigo', _cod);
END; $$;
GRANT EXECUTE ON FUNCTION public.resgatar_cupom(text) TO authenticated;

-- Atualiza pode_corrigir_redacao para considerar créditos de cupom
CREATE OR REPLACE FUNCTION public.pode_corrigir_redacao(_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  prof RECORD;
  sub RECORD;
  assinatura RECORD;
  usadas_total INT := 0;
  usadas_mes INT := 0;
  plano_text TEXT := 'free';
  plano_norm TEXT := 'free';
  ativo BOOLEAN := false;
  limite INT := 2;
  creditos INT := NULL;
  _cupom_creditos INT := 0;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT plan, plan_expires_at, plan_vitalicio
    INTO prof FROM public.profiles WHERE id = _user_id;

  SELECT * INTO sub FROM public.subscriptions
   WHERE user_id = _user_id ORDER BY updated_at DESC NULLS LAST LIMIT 1;

  SELECT user_id, plano, status, vence_em INTO assinatura FROM public.assinaturas
   WHERE user_id = _user_id ORDER BY created_at DESC NULLS LAST LIMIT 1;

  SELECT COUNT(*) INTO usadas_total FROM public.redacoes WHERE user_id = _user_id;
  SELECT COUNT(*) INTO usadas_mes FROM public.redacoes
    WHERE user_id = _user_id AND created_at >= date_trunc('month', now());

  SELECT COALESCE(redacao_creditos, 0) INTO _cupom_creditos
    FROM public.beneficios_cupom WHERE user_id = _user_id;

  IF prof.plan_vitalicio IS TRUE THEN
    plano_text := 'vitalicio';
    ativo := true;
  ELSIF sub.user_id IS NOT NULL
    AND lower(coalesce(sub.status, '')) IN ('active', 'ativa', 'approved', 'aprovado')
    AND (lower(coalesce(sub.plan_type, '')) LIKE '%vitalicio%' OR sub.current_period_end > now()) THEN
    plano_text := coalesce(sub.plan_type, 'free');
    ativo := true;
    creditos := coalesce(sub.credits_remaining, 0);
  ELSIF prof.plan IS NOT NULL
    AND lower(coalesce(prof.plan, 'free')) <> 'free'
    AND (prof.plan_expires_at IS NULL OR prof.plan_expires_at > now()) THEN
    plano_text := prof.plan;
    ativo := true;
  ELSIF assinatura.user_id IS NOT NULL
    AND lower(coalesce(assinatura.status, '')) IN ('active', 'ativa', 'approved', 'aprovado')
    AND (lower(coalesce(assinatura.plano, '')) LIKE '%vitalicio%' OR assinatura.vence_em > now()) THEN
    plano_text := coalesce(assinatura.plano, 'free');
    ativo := true;
  END IF;

  plano_norm := lower(coalesce(plano_text, 'free'));
  IF plano_norm LIKE '%vitalicio%' THEN plano_norm := 'vitalicio';
  ELSIF plano_norm LIKE '%full%' THEN plano_norm := 'full';
  ELSIF plano_norm LIKE '%pro%' THEN plano_norm := 'pro';
  ELSIF plano_norm LIKE '%light%' OR plano_norm LIKE '%basic%' THEN plano_norm := 'light';
  ELSE plano_norm := 'free';
  END IF;

  limite := CASE plano_norm
    WHEN 'light' THEN 10
    WHEN 'pro' THEN 20
    WHEN 'full' THEN 30
    WHEN 'vitalicio' THEN 40
    ELSE 2
  END;

  -- Se não tem plano ativo, cupom de redação assume prioridade
  IF (NOT ativo OR plano_norm = 'free') AND _cupom_creditos > 0 THEN
    RETURN jsonb_build_object('pode', true, 'plano', 'cupom', 'ativo', true,
      'creditos', _cupom_creditos, 'limite', 10, 'usadas', GREATEST(0, 10 - _cupom_creditos),
      'motivo', 'ok');
  END IF;

  IF NOT ativo OR plano_norm = 'free' THEN
    RETURN jsonb_build_object(
      'pode', usadas_total < 2, 'plano', 'free', 'usadas', usadas_total, 'limite', 2,
      'creditos', GREATEST(0, 2 - usadas_total), 'ativo', false,
      'motivo', CASE WHEN usadas_total < 2 THEN 'ok' ELSE 'limite_gratuito_atingido' END);
  END IF;

  IF creditos IS NOT NULL THEN
    IF creditos <= 0 AND _cupom_creditos > 0 THEN
      RETURN jsonb_build_object('pode', true, 'plano', 'cupom', 'ativo', true,
        'creditos', _cupom_creditos, 'limite', 10, 'usadas', GREATEST(0, 10 - _cupom_creditos),
        'motivo', 'ok');
    END IF;
    IF creditos <= 0 THEN
      RETURN jsonb_build_object('pode', false, 'plano', plano_norm, 'ativo', true,
        'creditos', 0, 'limite', limite, 'usadas', usadas_mes, 'motivo', 'creditos_esgotados');
    END IF;
    RETURN jsonb_build_object('pode', true, 'plano', plano_norm, 'ativo', true,
      'creditos', creditos, 'limite', limite, 'usadas', usadas_mes, 'motivo', 'ok');
  END IF;

  RETURN jsonb_build_object(
    'pode', usadas_mes < limite, 'plano', plano_norm, 'ativo', true,
    'creditos', GREATEST(0, limite - usadas_mes), 'limite', limite, 'usadas', usadas_mes,
    'motivo', CASE WHEN usadas_mes < limite THEN 'ok' ELSE 'limite_mensal_atingido' END);
END;
$function$;

-- Trigger de consumo: debita cupom primeiro, se houver
CREATE OR REPLACE FUNCTION public.consumir_credito_redacao()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _deb INT := 0;
BEGIN
  UPDATE public.beneficios_cupom
     SET redacao_creditos = redacao_creditos - 1,
         atualizado_em = now()
   WHERE user_id = NEW.user_id AND redacao_creditos > 0;
  GET DIAGNOSTICS _deb = ROW_COUNT;

  IF _deb = 0 THEN
    UPDATE public.subscriptions
       SET credits_remaining = GREATEST(0, credits_remaining - 1),
           updated_at = now()
     WHERE user_id = NEW.user_id
       AND lower(coalesce(status, '')) IN ('active', 'ativa', 'approved', 'aprovado')
       AND current_period_end > now()
       AND credits_remaining > 0;
  END IF;
  RETURN NEW;
END;
$function$;
