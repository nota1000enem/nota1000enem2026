-- ============ PROVA 7 ============
INSERT INTO simulados (id,nome,descricao,total_questoes,ordem,ativo) VALUES ('77777777-7777-7777-7777-777777777777','Simulado ENEM — Prova 7','Simulado completo com 50 questões',50,7,true) ON CONFLICT (id) DO UPDATE SET nome=EXCLUDED.nome,total_questoes=EXCLUDED.total_questoes,ordem=EXCLUDED.ordem,ativo=true;
DELETE FROM questoes_simulado WHERE simulado_id='77777777-7777-7777-7777-777777777777';

-- ============ PROVA 8 ============
INSERT INTO simulados (id,nome,descricao,total_questoes,ordem,ativo) VALUES ('88888888-8888-8888-8888-888888888888','Simulado ENEM — Prova 8','Simulado com 12 questões (parcial)',12,8,true) ON CONFLICT (id) DO UPDATE SET nome=EXCLUDED.nome,total_questoes=EXCLUDED.total_questoes,ordem=EXCLUDED.ordem,ativo=true;
DELETE FROM questoes_simulado WHERE simulado_id='88888888-8888-8888-8888-888888888888';

-- (questões serão inseridas em segundo arquivo seguinte)

-- ============ Trigger: apaga respostas após finalizar tentativa ============
CREATE OR REPLACE FUNCTION public.cleanup_respostas_apos_finalizar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.finished_at IS NOT NULL THEN
    DELETE FROM public.respostas_aluno WHERE tentativa_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_respostas ON public.tentativas_simulado;
CREATE TRIGGER trg_cleanup_respostas
AFTER INSERT OR UPDATE OF finished_at ON public.tentativas_simulado
FOR EACH ROW EXECUTE FUNCTION public.cleanup_respostas_apos_finalizar();

-- Limpa retroativamente
DELETE FROM public.respostas_aluno r
USING public.tentativas_simulado t
WHERE r.tentativa_id = t.id AND t.finished_at IS NOT NULL;

-- ============ Cleanup de redações > 7 dias ============
CREATE OR REPLACE FUNCTION public.cleanup_redacoes_antigas()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  UPDATE public.redacoes
     SET texto = '[arquivado após 7 dias]',
         feedback = NULL
   WHERE created_at < now() - interval '7 days'
     AND texto <> '[arquivado após 7 dias]';
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname='cleanup-redacoes-antigas') THEN
    PERFORM cron.unschedule('cleanup-redacoes-antigas');
  END IF;
END $$;
SELECT cron.schedule('cleanup-redacoes-antigas','0 3 * * *', $$SELECT public.cleanup_redacoes_antigas();$$);