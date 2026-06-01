
-- ============================================================
-- 1) ESCONDER GABARITO + CORREÇÃO NO SERVIDOR
-- ============================================================

-- View pública sem a coluna resposta_correta
CREATE OR REPLACE VIEW public.questoes_simulado_publica AS
SELECT id, simulado_id, numero, area, enunciado, alt_a, alt_b, alt_c, alt_d, alt_e, peso
FROM public.questoes_simulado;

GRANT SELECT ON public.questoes_simulado_publica TO anon, authenticated;

-- Remove leitura pública da tabela base (que expunha resposta_correta)
DROP POLICY IF EXISTS "anyone read questoes" ON public.questoes_simulado;
REVOKE SELECT ON public.questoes_simulado FROM anon, authenticated;
GRANT ALL ON public.questoes_simulado TO service_role;

-- Função SECURITY DEFINER que corrige o simulado no servidor
CREATE OR REPLACE FUNCTION public.corrigir_simulado(_simulado_id uuid, _respostas jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _acertos int := 0;
  _total int := 0;
  _por_area jsonb := '{}'::jsonb;
  _gabarito jsonb := '[]'::jsonb;
  _nota int;
  _tent_id uuid;
  r record;
  marcada text;
  ok boolean;
  area_acc int;
  area_tot int;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated';
  END IF;

  FOR r IN
    SELECT id, area, resposta_correta, numero
    FROM public.questoes_simulado
    WHERE simulado_id = _simulado_id
    ORDER BY numero
  LOOP
    _total := _total + 1;
    marcada := upper(coalesce(_respostas ->> r.id::text, ''));
    ok := marcada = upper(r.resposta_correta);
    IF ok THEN _acertos := _acertos + 1; END IF;

    area_acc := coalesce((_por_area -> r.area ->> 'acertos')::int, 0);
    area_tot := coalesce((_por_area -> r.area ->> 'total')::int, 0);
    _por_area := jsonb_set(_por_area, ARRAY[r.area],
      jsonb_build_object('acertos', area_acc + (CASE WHEN ok THEN 1 ELSE 0 END), 'total', area_tot + 1), true);

    _gabarito := _gabarito || jsonb_build_array(jsonb_build_object(
      'questao_id', r.id,
      'marcada', nullif(marcada,''),
      'correta', upper(r.resposta_correta),
      'ok', ok
    ));
  END LOOP;

  _nota := CASE WHEN _total > 0 THEN round((_acertos::numeric / _total) * 1000) ELSE 0 END;

  INSERT INTO public.tentativas_simulado
    (user_id, simulado_id, started_at, finished_at, nota_total, acertos, total, acertos_por_area)
  VALUES (_user, _simulado_id, now(), now(), _nota, _acertos, _total, _por_area)
  RETURNING id INTO _tent_id;

  RETURN jsonb_build_object(
    'tentativa_id', _tent_id,
    'nota', _nota,
    'acertos', _acertos,
    'total', _total,
    'porArea', _por_area,
    'gabarito', _gabarito
  );
END;
$$;

REVOKE ALL ON FUNCTION public.corrigir_simulado(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.corrigir_simulado(uuid, jsonb) TO authenticated;

-- ============================================================
-- 2) TRAVAR VÍDEOS POR PLANO
-- ============================================================

CREATE OR REPLACE FUNCTION public.tier_rank(_t text)
RETURNS int LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE lower(coalesce(_t,'free'))
    WHEN 'vitalicio' THEN 4
    WHEN 'full' THEN 3
    WHEN 'pro' THEN 2
    WHEN 'light' THEN 1
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.user_plan_tier(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN p.plan_vitalicio THEN 'vitalicio'
    WHEN p.plan_expires_at IS NULL OR p.plan_expires_at > now() THEN coalesce(p.plan,'free')
    ELSE 'free'
  END
  FROM public.profiles p WHERE p.id = _user_id;
$$;
REVOKE ALL ON FUNCTION public.user_plan_tier(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_plan_tier(uuid) TO authenticated;

DROP POLICY IF EXISTS "authenticated read video_lessons" ON public.video_lessons;
CREATE POLICY "video_lessons by plan"
  ON public.video_lessons FOR SELECT TO authenticated
  USING (public.tier_rank(public.user_plan_tier(auth.uid())) >= public.tier_rank(access_tier));

-- ============================================================
-- 3) FIX search_path EM FUNÇÕES PGMQ
-- ============================================================

ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

-- ============================================================
-- 4) REVOGAR EXECUTE DE anon EM FUNÇÕES PRIVADAS
-- ============================================================

REVOKE ALL ON FUNCTION public.get_minhas_tentativas(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_minhas_tentativas(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.pode_corrigir_redacao(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_corrigir_redacao(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_assinatura_ativa(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_assinatura_ativa(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.plano_ativo(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.plano_ativo(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.cleanup_redacoes_antigas() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_respostas_apos_finalizar() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consumir_credito_redacao() FROM PUBLIC, anon, authenticated;

-- Ranking pode ficar público (já é mostrado sem login na home)
-- então mantemos EXECUTE para anon nas funções get_ranking_global e get_top_semana
