CREATE OR REPLACE FUNCTION public.pode_corrigir_redacao(_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sub RECORD;
  usadas_total INT;
BEGIN
  -- Ownership guard: só pode consultar a si mesmo
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO sub FROM public.subscriptions WHERE user_id = _user_id;

  IF NOT FOUND THEN
    SELECT COUNT(*) INTO usadas_total FROM public.redacoes WHERE user_id = _user_id;
    RETURN jsonb_build_object(
      'pode', usadas_total < 3, 'plano', 'free', 'usadas', usadas_total,
      'limite', 3, 'creditos', GREATEST(0, 3 - usadas_total), 'ativo', false,
      'motivo', CASE WHEN usadas_total < 3 THEN 'ok' ELSE 'limite_gratuito_atingido' END
    );
  END IF;

  IF sub.status <> 'ACTIVE' OR sub.current_period_end <= now() THEN
    RETURN jsonb_build_object('pode', false, 'plano', sub.plan_type, 'ativo', false,
      'creditos', 0, 'motivo', 'assinatura_expirada', 'period_end', sub.current_period_end);
  END IF;

  IF sub.credits_remaining <= 0 THEN
    RETURN jsonb_build_object('pode', false, 'plano', sub.plan_type, 'ativo', true,
      'creditos', 0, 'motivo', 'creditos_esgotados', 'period_end', sub.current_period_end);
  END IF;

  RETURN jsonb_build_object('pode', true, 'plano', sub.plan_type, 'ativo', true,
    'creditos', sub.credits_remaining, 'limite', sub.credits_remaining,
    'usadas', 0, 'motivo', 'ok', 'period_end', sub.current_period_end);
END;
$function$;