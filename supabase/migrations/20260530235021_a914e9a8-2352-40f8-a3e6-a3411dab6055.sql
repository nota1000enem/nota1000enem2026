
-- Garante leitura pública das questões e simulados pelos alunos autenticados
GRANT SELECT ON public.questoes_simulado TO authenticated, anon;
GRANT SELECT ON public.simulados TO authenticated, anon;

ALTER TABLE public.questoes_simulado ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone read questoes" ON public.questoes_simulado;
CREATE POLICY "anyone read questoes" ON public.questoes_simulado
  FOR SELECT TO authenticated, anon USING (true);

-- Function para calcular nota normalizada do simulado (escala 0-1000)
CREATE OR REPLACE FUNCTION public.get_minhas_tentativas(_user_id uuid)
RETURNS TABLE(id uuid, simulado_nome text, nota_total numeric, acertos int, total int, finished_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.id, s.nome, t.nota_total, t.acertos, t.total, t.finished_at
  FROM public.tentativas_simulado t
  JOIN public.simulados s ON s.id = t.simulado_id
  WHERE t.user_id = _user_id AND t.finished_at IS NOT NULL
  ORDER BY t.finished_at DESC
  LIMIT 20;
$$;
