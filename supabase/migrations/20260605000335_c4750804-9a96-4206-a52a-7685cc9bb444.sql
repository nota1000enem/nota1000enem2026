-- Restringe acesso direto à tabela questoes_simulado (que contém resposta_correta).
-- O app usa a view questoes_simulado_publica (sem resposta_correta), e a correção
-- é feita pela função SECURITY DEFINER corrigir_simulado.
DROP POLICY IF EXISTS "authenticated read questoes" ON public.questoes_simulado;
REVOKE SELECT ON public.questoes_simulado FROM authenticated, anon;
-- mantém service_role e a função SECURITY DEFINER (corrigir_simulado) com acesso pleno.