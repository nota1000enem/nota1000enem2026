DROP POLICY IF EXISTS "authenticated can read safe quiz rows" ON public.questoes_simulado;
DROP POLICY IF EXISTS "anyone read questoes basic cols" ON public.questoes_simulado;

CREATE POLICY "authenticated can read quiz public rows"
  ON public.questoes_simulado
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.questoes_simulado FROM anon, authenticated;
GRANT SELECT (id, simulado_id, numero, area, enunciado, alt_a, alt_b, alt_c, alt_d, alt_e, peso)
  ON public.questoes_simulado TO authenticated;
GRANT ALL ON public.questoes_simulado TO service_role;

REVOKE SELECT ON public.questoes_simulado_publica FROM anon;
GRANT SELECT ON public.questoes_simulado_publica TO authenticated;