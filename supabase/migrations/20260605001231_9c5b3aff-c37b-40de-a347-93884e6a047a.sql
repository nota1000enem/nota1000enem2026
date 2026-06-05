
DROP POLICY IF EXISTS "users update own profile safe fields" ON public.profiles;

CREATE POLICY "users update own profile safe fields"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND plan = (SELECT p.plan FROM public.profiles p WHERE p.id = auth.uid())
  AND plan_vitalicio = (SELECT p.plan_vitalicio FROM public.profiles p WHERE p.id = auth.uid())
  AND NOT (plan_expires_at IS DISTINCT FROM (SELECT p.plan_expires_at FROM public.profiles p WHERE p.id = auth.uid()))
  AND NOT (mp_customer_id IS DISTINCT FROM (SELECT p.mp_customer_id FROM public.profiles p WHERE p.id = auth.uid()))
);
