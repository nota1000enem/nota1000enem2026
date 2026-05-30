
-- 1) PROTEGER GABARITO DAS QUESTÕES: criar view sem resposta_correta
CREATE OR REPLACE VIEW public.questoes_publicas
WITH (security_invoker = true) AS
SELECT id, simulado_id, numero, area, enunciado, alt_a, alt_b, alt_c, alt_d, alt_e, peso
FROM public.questoes_simulado;

GRANT SELECT ON public.questoes_publicas TO authenticated;

-- Revogar leitura direta da tabela (gabarito só via edge function com service_role)
DROP POLICY IF EXISTS "auth view questoes" ON public.questoes_simulado;
REVOKE SELECT ON public.questoes_simulado FROM authenticated;
REVOKE SELECT ON public.questoes_simulado FROM anon;

-- 2) BLOQUEAR INSERT/UPDATE DE ASSINATURAS PELO USUÁRIO (só service_role/edge function)
DROP POLICY IF EXISTS "users insert own assinaturas" ON public.assinaturas;
DROP POLICY IF EXISTS "users update own assinaturas" ON public.assinaturas;
-- Mantém apenas SELECT próprio (já existe)

-- 3) ADICIONAR UPDATE EM PLANOS_ESTUDO (usuário pode editar o próprio plano)
CREATE POLICY "users update own planos"
ON public.planos_estudo
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4) FUNÇÃO PARA TOP NOTAS DA SEMANA (últimos 7 dias) - usada na home
CREATE OR REPLACE FUNCTION public.get_top_semana()
RETURNS TABLE(user_id uuid, nome text, melhor_nota integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    r.user_id,
    COALESCE(split_part(p.full_name, ' ', 1), 'Aluno') AS nome,
    MAX(r.nota_total) AS melhor_nota
  FROM public.redacoes r
  LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.nota_total IS NOT NULL
    AND r.created_at >= now() - interval '7 days'
  GROUP BY r.user_id, p.full_name
  ORDER BY MAX(r.nota_total) DESC NULLS LAST
  LIMIT 10;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_semana() TO anon, authenticated;
