DROP VIEW IF EXISTS public.ranking_global;
DROP VIEW IF EXISTS public.profiles_public;

CREATE OR REPLACE FUNCTION public.get_ranking_global()
RETURNS TABLE(user_id uuid, nome text, melhor_nota integer, total_redacoes bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.user_id,
    COALESCE(split_part(p.full_name, ' ', 1), 'Aluno') AS nome,
    MAX(r.nota_total) AS melhor_nota,
    COUNT(*) AS total_redacoes
  FROM public.redacoes r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.nota_total IS NOT NULL
  GROUP BY r.user_id, p.full_name
  ORDER BY MAX(r.nota_total) DESC NULLS LAST
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION public.get_ranking_global() TO anon, authenticated;