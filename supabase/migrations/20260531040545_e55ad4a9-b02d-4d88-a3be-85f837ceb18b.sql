REVOKE ALL ON FUNCTION public.cleanup_redacoes_antigas() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_redacoes_antigas() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_redacoes_antigas() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_redacoes_antigas() TO service_role;