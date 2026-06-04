DROP POLICY IF EXISTS "anyone read questoes basic cols" ON public.questoes_simulado;
CREATE POLICY "authenticated read questoes" ON public.questoes_simulado FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.questoes_simulado FROM anon;
REVOKE SELECT ON public.questoes_simulado_publica FROM anon;
GRANT SELECT ON public.questoes_simulado_publica TO authenticated;