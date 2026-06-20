CREATE OR REPLACE FUNCTION public.pode_corrigir_redacao(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT plan, plan_expires_at, plan_vitalicio
    INTO prof
    FROM public.profiles
   WHERE id = _user_id;

  SELECT *
    INTO sub
    FROM public.subscriptions
   WHERE user_id = _user_id
   ORDER BY updated_at DESC NULLS LAST
   LIMIT 1;

  SELECT plano, status, vence_em
    INTO assinatura
    FROM public.assinaturas
   WHERE user_id = _user_id
   ORDER BY created_at DESC NULLS LAST
   LIMIT 1;

  SELECT COUNT(*) INTO usadas_total FROM public.redacoes WHERE user_id = _user_id;
  SELECT COUNT(*) INTO usadas_mes FROM public.redacoes WHERE user_id = _user_id AND created_at >= date_trunc('month', now());

  IF prof IS NULL AND sub IS NULL AND assinatura IS NULL THEN
    RETURN jsonb_build_object('pode', false, 'motivo', 'profile_nao_encontrado', 'creditos', 0);
  END IF;

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
    WHEN 'light' THEN 15
    WHEN 'pro' THEN 30
    WHEN 'full' THEN 60
    WHEN 'vitalicio' THEN 70
    ELSE 2
  END;

  IF NOT ativo OR plano_norm = 'free' THEN
    RETURN jsonb_build_object(
      'pode', usadas_total < 2,
      'plano', 'free',
      'usadas', usadas_total,
      'limite', 2,
      'creditos', GREATEST(0, 2 - usadas_total),
      'ativo', false,
      'motivo', CASE WHEN usadas_total < 2 THEN 'ok' ELSE 'limite_gratuito_atingido' END
    );
  END IF;

  IF creditos IS NOT NULL THEN
    IF creditos <= 0 THEN
      RETURN jsonb_build_object('pode', false, 'plano', plano_norm, 'ativo', true,
        'creditos', 0, 'limite', limite, 'usadas', usadas_mes, 'motivo', 'creditos_esgotados');
    END IF;
    RETURN jsonb_build_object('pode', true, 'plano', plano_norm, 'ativo', true,
      'creditos', creditos, 'limite', limite, 'usadas', usadas_mes, 'motivo', 'ok');
  END IF;

  RETURN jsonb_build_object(
    'pode', usadas_mes < limite,
    'plano', plano_norm,
    'ativo', true,
    'creditos', GREATEST(0, limite - usadas_mes),
    'limite', limite,
    'usadas', usadas_mes,
    'motivo', CASE WHEN usadas_mes < limite THEN 'ok' ELSE 'limite_mensal_atingido' END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.consumir_credito_redacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.subscriptions
     SET credits_remaining = GREATEST(0, credits_remaining - 1),
         updated_at = now()
   WHERE user_id = NEW.user_id
     AND lower(coalesce(status, '')) IN ('active', 'ativa', 'approved', 'aprovado')
     AND current_period_end > now()
     AND credits_remaining > 0;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.pode_corrigir_redacao(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.pode_corrigir_redacao(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.consumir_credito_redacao() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.consumir_credito_redacao() TO service_role;