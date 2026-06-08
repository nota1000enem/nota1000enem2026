
-- 1. Remove direct authenticated read on questoes_simulado (answer key exposure).
-- The questoes_simulado_publica view + corrigir_simulado SECURITY DEFINER RPC remain the only access paths.
DROP POLICY IF EXISTS "authenticated can read safe quiz rows" ON public.questoes_simulado;

-- 2. Restrict simulados list to authenticated users only.
DROP POLICY IF EXISTS "anyone view simulados" ON public.simulados;
CREATE POLICY "authenticated view simulados"
  ON public.simulados
  FOR SELECT
  TO authenticated
  USING (ativo = true);

-- 3. Tighten profile UPDATE policy to authenticated role only.
DROP POLICY IF EXISTS "users update own profile safe fields" ON public.profiles;
CREATE POLICY "users update own profile safe fields"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND plan = (SELECT p.plan FROM public.profiles p WHERE p.id = auth.uid())
    AND plan_vitalicio = (SELECT p.plan_vitalicio FROM public.profiles p WHERE p.id = auth.uid())
    AND NOT (plan_expires_at IS DISTINCT FROM (SELECT p.plan_expires_at FROM public.profiles p WHERE p.id = auth.uid()))
    AND NOT (mp_customer_id IS DISTINCT FROM (SELECT p.mp_customer_id FROM public.profiles p WHERE p.id = auth.uid()))
  );
