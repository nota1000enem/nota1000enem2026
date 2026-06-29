GRANT SELECT ON public.simulados TO anon;
CREATE POLICY "anon view simulados ativos" ON public.simulados FOR SELECT TO anon USING (ativo = true);