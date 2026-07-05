-- 1) Coluna para rastrear se o lembrete de vencimento (3 dias antes) já foi enviado no ciclo atual
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_expiration_reminder_sent_at timestamptz;

-- 2) Atualiza a RPC pode_corrigir_redacao com os novos limites:
--    LIGHT 10, PRO 20, FULL 30, "VITALICIO" (agora Anual) 40
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

  -- NOVOS LIMITES: 10 / 20 / 30 / 40
  limite := CASE plano_norm
    WHEN 'light' THEN 10
    WHEN 'pro' THEN 20
    WHEN 'full' THEN 30
    WHEN 'vitalicio' THEN 40
    ELSE 2
  END;

  IF NOT ativo OR plano_norm = 'free' THEN
    RETURN jsonb_build_object(
      'pode', usadas_total < 2, 'plano', 'free', 'usadas', usadas_total, 'limite', 2,
      'creditos', GREATEST(0, 2 - usadas_total), 'ativo', false,
      'motivo', CASE WHEN usadas_total < 2 THEN 'ok' ELSE 'limite_gratuito_atingido' END);
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
    'pode', usadas_mes < limite, 'plano', plano_norm, 'ativo', true,
    'creditos', GREATEST(0, limite - usadas_mes), 'limite', limite, 'usadas', usadas_mes,
    'motivo', CASE WHEN usadas_mes < limite THEN 'ok' ELSE 'limite_mensal_atingido' END);
END;
$function$;

-- 3) Agenda cron diária às 09:00 UTC (06:00 BRT) para downgrade + lembretes
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove agendamento antigo se existir
DO $$ BEGIN
  PERFORM cron.unschedule('cron-plano-vencendo-diario');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'cron-plano-vencendo-diario',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://nota1000enem.online/api/public/cron-plano-vencendo',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);