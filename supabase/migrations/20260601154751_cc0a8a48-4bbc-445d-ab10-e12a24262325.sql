
-- 1) Recreate public view with security_invoker so it uses caller's perms (fixes Security Definer View)
DROP VIEW IF EXISTS public.questoes_simulado_publica;
CREATE VIEW public.questoes_simulado_publica
WITH (security_invoker = on) AS
  SELECT id, simulado_id, numero, area, enunciado,
         alt_a, alt_b, alt_c, alt_d, alt_e, peso
  FROM public.questoes_simulado;

GRANT SELECT ON public.questoes_simulado_publica TO anon, authenticated;

-- Allow view to read base table (RLS still denies direct access via base policies)
-- Since view is security_invoker, we need a SELECT policy on base table for read via view
DROP POLICY IF EXISTS "read questoes via view only" ON public.questoes_simulado;
CREATE POLICY "anyone read questoes basic cols"
  ON public.questoes_simulado FOR SELECT
  TO anon, authenticated
  USING (true);
-- Note: resposta_correta column still exposed via base table grants. Revoke column-level access:
REVOKE SELECT ON public.questoes_simulado FROM anon, authenticated;
GRANT SELECT (id, simulado_id, numero, area, enunciado, alt_a, alt_b, alt_c, alt_d, alt_e, peso)
  ON public.questoes_simulado TO anon, authenticated;

-- 2) Avatars bucket: restrict listing to owner's own folder; public CDN access still works via bucket public flag
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars owner list"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 3) Revoke EXECUTE on SECURITY DEFINER functions from anon (they should require sign-in)
REVOKE EXECUTE ON FUNCTION public.corrigir_simulado(uuid, jsonb) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.corrigir_simulado(uuid, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_minhas_tentativas(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_minhas_tentativas(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.pode_corrigir_redacao(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.pode_corrigir_redacao(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.user_plan_tier(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_plan_tier(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.cleanup_redacoes_antigas() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, PUBLIC;

-- get_ranking_global / get_top_semana stay open for leaderboard
-- handle_new_user / consumir_credito_redacao / touch_updated_at / cleanup_respostas_apos_finalizar are trigger fns, not callable via API
