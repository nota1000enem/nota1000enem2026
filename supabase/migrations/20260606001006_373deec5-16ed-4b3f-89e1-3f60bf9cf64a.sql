CREATE POLICY "authenticated can read safe quiz rows"
ON public.questoes_simulado
FOR SELECT
TO authenticated
USING (true);

GRANT SELECT (id, simulado_id, numero, area, enunciado, alt_a, alt_b, alt_c, alt_d, alt_e, peso)
ON public.questoes_simulado
TO authenticated;

GRANT SELECT ON public.questoes_simulado_publica TO authenticated;