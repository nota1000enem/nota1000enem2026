-- Desativar provas bugadas (1, 2, 5, 6, 7, 8) e renumerar as restantes 1..14
UPDATE public.simulados SET ativo = false
WHERE id IN (
  'a1a1a1a1-0001-0001-0001-000000000001',
  'a1a1a1a1-0002-0002-0002-000000000002',
  'c33e1dc6-8fd9-461c-abcc-ce21879af94f',
  '15369b0d-8927-47ad-bf6e-323e06c3a4c4',
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888'
);

-- Renumerar ordem + nome das ativas mantendo a sequência relativa atual
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY ordem) AS nova_ordem
  FROM public.simulados
  WHERE ativo = true
)
UPDATE public.simulados s
SET ordem = r.nova_ordem,
    nome = 'Simulado ENEM — Prova ' || r.nova_ordem
FROM ranked r
WHERE s.id = r.id;

-- Mudar o limite gratuito de 3 para 2 correções
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
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO sub FROM public.subscriptions WHERE user_id = _user_id;

  IF NOT FOUND THEN
    SELECT COUNT(*) INTO usadas_total FROM public.redacoes WHERE user_id = _user_id;
    RETURN jsonb_build_object(
      'pode', usadas_total < 2, 'plano', 'free', 'usadas', usadas_total,
      'limite', 2, 'creditos', GREATEST(0, 2 - usadas_total), 'ativo', false,
      'motivo', CASE WHEN usadas_total < 2 THEN 'ok' ELSE 'limite_gratuito_atingido' END
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