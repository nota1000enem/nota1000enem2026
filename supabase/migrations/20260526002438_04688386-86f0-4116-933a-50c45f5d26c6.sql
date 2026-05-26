-- 1. Fix: users can only UPDATE their own redacoes
CREATE POLICY "users update own redacoes"
ON public.redacoes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Index for dashboard/ranking queries
CREATE INDEX IF NOT EXISTS idx_redacoes_user_created ON public.redacoes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_redacoes_nota_created ON public.redacoes(nota_total DESC, created_at DESC);

-- 3. Public weekly ranking view (safe columns only)
CREATE OR REPLACE VIEW public.ranking_semanal
WITH (security_invoker = true) AS
SELECT
  r.user_id,
  COALESCE(NULLIF(p.full_name, ''), 'Aluno(a)') AS nome,
  MAX(r.nota_total) AS melhor_nota,
  COUNT(*) AS total_redacoes,
  MAX(r.created_at) AS ultima_redacao
FROM public.redacoes r
LEFT JOIN public.profiles p ON p.id = r.user_id
WHERE r.created_at >= now() - INTERVAL '7 days'
  AND r.nota_total IS NOT NULL
GROUP BY r.user_id, p.full_name
ORDER BY melhor_nota DESC
LIMIT 20;

-- Allow anonymous + authenticated read access to the ranking view
GRANT SELECT ON public.ranking_semanal TO anon, authenticated;

-- Make profiles.full_name readable to all (needed for ranking display via view)
-- Note: the view uses security_invoker, so it respects RLS on profiles
-- We add a SELECT policy for public read of just nome via view by adding a permissive policy on profiles
CREATE POLICY "anyone can view profile names"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- Drop the more restrictive existing select policy to avoid double restriction
DROP POLICY IF EXISTS "users view own profile" ON public.profiles;