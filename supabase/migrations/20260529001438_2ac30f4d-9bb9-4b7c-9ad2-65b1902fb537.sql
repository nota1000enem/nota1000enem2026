ALTER VIEW public.ranking_global SET (security_invoker = false);
ALTER VIEW public.profiles_public SET (security_invoker = false);
GRANT SELECT ON public.ranking_global TO anon, authenticated;
GRANT SELECT ON public.profiles_public TO anon, authenticated;