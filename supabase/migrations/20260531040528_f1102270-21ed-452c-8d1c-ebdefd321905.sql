CREATE OR REPLACE FUNCTION public.cleanup_redacoes_antigas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.redacoes
     SET texto = '[apagado após 7 dias]',
         feedback = NULL
   WHERE created_at < now() - interval '7 days'
     AND (texto IS DISTINCT FROM '[apagado após 7 dias]' OR feedback IS NOT NULL);

  DELETE FROM public.planos_estudo
   WHERE created_at < now() - interval '7 days';
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-redacoes-antigas') THEN
    PERFORM cron.unschedule('cleanup-redacoes-antigas');
  END IF;
END $$;

SELECT cron.schedule('cleanup-redacoes-antigas', '0 3 * * *', $$SELECT public.cleanup_redacoes_antigas();$$);