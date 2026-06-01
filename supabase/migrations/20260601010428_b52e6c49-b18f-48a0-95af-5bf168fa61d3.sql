CREATE OR REPLACE FUNCTION public.get_ranking_global()
 RETURNS TABLE(user_id uuid, nome text, melhor_nota integer, total_redacoes bigint, avatar_url text, estado text, idade integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    r.user_id,
    CASE
      WHEN p.full_name IS NULL OR btrim(p.full_name) = '' THEN 'Aluno'
      WHEN array_length(string_to_array(btrim(p.full_name), ' '), 1) = 1 THEN btrim(p.full_name)
      ELSE split_part(btrim(p.full_name), ' ', 1) || ' ' || split_part(btrim(p.full_name), ' ', -1)
    END AS nome,
    MAX(r.nota_total) AS melhor_nota,
    COUNT(*) AS total_redacoes,
    p.avatar_url,
    p.estado,
    p.idade
  FROM public.redacoes r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.nota_total IS NOT NULL
  GROUP BY r.user_id, p.full_name, p.avatar_url, p.estado, p.idade
  ORDER BY MAX(r.nota_total) DESC NULLS LAST
  LIMIT 100;
$function$;