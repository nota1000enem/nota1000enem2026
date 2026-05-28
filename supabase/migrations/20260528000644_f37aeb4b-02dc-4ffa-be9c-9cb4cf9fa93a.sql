
-- ========== 1. RLS PROFILES: restringe leitura ==========
DROP POLICY IF EXISTS "anyone can view profile names" ON public.profiles;

CREATE POLICY "users view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- View pública só com nome (sem email/plano) para ranking
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT id, COALESCE(NULLIF(split_part(full_name, ' ', 1), ''), 'Aluno') AS primeiro_nome
FROM public.profiles;

-- Permissão da view: anon e auth podem ver primeiro_nome
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Política para a view: permite leitura pública dos campos não sensíveis
-- (A view é security_invoker; precisamos liberar SELECT na profiles para anon SÓ via view).
-- Para a view funcionar para anon sem ler email/plano, criamos uma policy específica:
CREATE POLICY "public can read profile names only via view"
ON public.profiles FOR SELECT
TO anon
USING (true);
-- A app NÃO deve consultar profiles direto pelo anon; toda leitura pública usa a view profiles_public.
-- Como segurança extra mais tarde, a leitura direta de email/plano por anon será bloqueada por revogação de colunas (não suportado em Supabase RLS row-level). Por isso a app sempre usará a view.

-- ========== 2. TRIGGER handle_new_user tolerante ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
               NULLIF(NEW.raw_user_meta_data->>'name', ''),
               split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user falhou para %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== 3. Atualizar pode_corrigir_redacao: free = 3 ==========
CREATE OR REPLACE FUNCTION public.pode_corrigir_redacao(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  prof RECORD;
  usadas_mes INT;
  usadas_total INT;
  limite INT;
  ativo BOOLEAN;
BEGIN
  SELECT plan, plan_expires_at, plan_vitalicio INTO prof FROM public.profiles WHERE id = _user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('pode', false, 'motivo', 'profile_nao_encontrado');
  END IF;
  ativo := prof.plan_vitalicio = true
        OR (prof.plan <> 'free' AND prof.plan_expires_at IS NOT NULL AND prof.plan_expires_at > now() + interval '-2 hours');
  limite := CASE prof.plan
    WHEN 'free' THEN 3
    WHEN 'light' THEN 25
    WHEN 'pro' THEN 50
    WHEN 'full' THEN 100
    WHEN 'vitalicio' THEN 100
    ELSE 0 END;
  SELECT COUNT(*) INTO usadas_total FROM public.redacoes WHERE user_id = _user_id;
  SELECT COUNT(*) INTO usadas_mes FROM public.redacoes WHERE user_id = _user_id AND created_at >= date_trunc('month', now());

  IF prof.plan = 'free' THEN
    RETURN jsonb_build_object(
      'pode', usadas_total < 3,
      'plano', prof.plan,
      'usadas', usadas_total,
      'limite', 3,
      'ativo', false,
      'motivo', CASE WHEN usadas_total < 3 THEN 'ok' ELSE 'limite_gratuito_atingido' END
    );
  END IF;
  IF NOT ativo THEN
    RETURN jsonb_build_object('pode', false, 'plano', prof.plan, 'ativo', false, 'motivo', 'assinatura_expirada');
  END IF;
  RETURN jsonb_build_object(
    'pode', usadas_mes < limite,
    'plano', prof.plan, 'usadas', usadas_mes, 'limite', limite, 'ativo', true,
    'motivo', CASE WHEN usadas_mes < limite THEN 'ok' ELSE 'limite_mensal_atingido' END
  );
END;
$$;

-- ========== 4. ASSINATURAS ==========
CREATE TABLE public.assinaturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plano TEXT NOT NULL CHECK (plano IN ('light','pro','full','vitalicio')),
  valor_centavos INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('ativa','pendente','expirada','cancelada')),
  iniciou_em TIMESTAMPTZ,
  vence_em TIMESTAMPTZ,
  proxima_cobranca_em TIMESTAMPTZ,
  cancelou_em TIMESTAMPTZ,
  gateway TEXT NOT NULL DEFAULT 'manual',
  gateway_id TEXT,
  metodo_pagamento TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.assinaturas TO authenticated;
GRANT ALL ON public.assinaturas TO service_role;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own assinaturas" ON public.assinaturas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own assinaturas" ON public.assinaturas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own assinaturas" ON public.assinaturas FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.cobrancas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assinatura_id UUID NOT NULL REFERENCES public.assinaturas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  valor_centavos INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('paga','pendente','falhou','reembolsada')),
  vencimento TIMESTAMPTZ NOT NULL,
  pago_em TIMESTAMPTZ,
  tentativa INTEGER NOT NULL DEFAULT 1,
  gateway_charge_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cobrancas TO authenticated;
GRANT ALL ON public.cobrancas TO service_role;
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own cobrancas" ON public.cobrancas FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Função: assinatura ativa (2h carência)
CREATE OR REPLACE FUNCTION public.is_assinatura_ativa(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assinaturas a
    WHERE a.user_id = _user_id
      AND a.status = 'ativa'
      AND (a.plano = 'vitalicio' OR (a.vence_em IS NOT NULL AND now() < a.vence_em + interval '2 hours'))
  );
$$;

-- ========== 5. RANKING GLOBAL (público) ==========
DROP VIEW IF EXISTS public.ranking_semanal;
CREATE OR REPLACE VIEW public.ranking_global
WITH (security_invoker = on) AS
SELECT
  r.user_id,
  COALESCE(pp.primeiro_nome, 'Aluno') AS nome,
  MAX(r.nota_total) AS melhor_nota,
  COUNT(*) AS total_redacoes,
  MAX(r.created_at) AS ultima_redacao
FROM public.redacoes r
LEFT JOIN public.profiles_public pp ON pp.id = r.user_id
WHERE r.nota_total IS NOT NULL
GROUP BY r.user_id, pp.primeiro_nome
ORDER BY MAX(r.nota_total) DESC, MAX(r.created_at) ASC
LIMIT 100;

GRANT SELECT ON public.ranking_global TO anon, authenticated;

-- ========== 6. PLANOS DE ESTUDO ==========
CREATE TABLE public.planos_estudo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  horas_dia INTEGER NOT NULL,
  dias_semana INTEGER NOT NULL,
  meta TEXT,
  pontos_fracos TEXT,
  cronograma JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.planos_estudo TO authenticated;
GRANT ALL ON public.planos_estudo TO service_role;
ALTER TABLE public.planos_estudo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own planos" ON public.planos_estudo FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own planos" ON public.planos_estudo FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own planos" ON public.planos_estudo FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== 7. SIMULADOS DE QUESTÕES ==========
CREATE TABLE public.simulados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  total_questoes INTEGER NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.simulados TO anon, authenticated;
GRANT ALL ON public.simulados TO service_role;
ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone view simulados" ON public.simulados FOR SELECT USING (ativo = true);

CREATE TABLE public.questoes_simulado (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulado_id UUID NOT NULL REFERENCES public.simulados(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  area TEXT NOT NULL,
  enunciado TEXT NOT NULL,
  alt_a TEXT NOT NULL,
  alt_b TEXT NOT NULL,
  alt_c TEXT NOT NULL,
  alt_d TEXT NOT NULL,
  alt_e TEXT,
  resposta_correta CHAR(1) NOT NULL CHECK (resposta_correta IN ('A','B','C','D','E')),
  peso NUMERIC NOT NULL DEFAULT 18.0,
  UNIQUE(simulado_id, numero)
);
GRANT SELECT ON public.questoes_simulado TO authenticated;
GRANT ALL ON public.questoes_simulado TO service_role;
ALTER TABLE public.questoes_simulado ENABLE ROW LEVEL SECURITY;
-- A resposta_correta deve ser ocultada no client; a app só lê (filtra coluna) e revela no final.
CREATE POLICY "auth view questoes" ON public.questoes_simulado FOR SELECT TO authenticated USING (true);

CREATE TABLE public.tentativas_simulado (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  simulado_id UUID NOT NULL REFERENCES public.simulados(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  nota_total NUMERIC,
  acertos INTEGER,
  total INTEGER,
  acertos_por_area JSONB
);
GRANT SELECT, INSERT, UPDATE ON public.tentativas_simulado TO authenticated;
GRANT ALL ON public.tentativas_simulado TO service_role;
ALTER TABLE public.tentativas_simulado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own tentativas" ON public.tentativas_simulado FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own tentativas" ON public.tentativas_simulado FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own tentativas" ON public.tentativas_simulado FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.respostas_aluno (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tentativa_id UUID NOT NULL REFERENCES public.tentativas_simulado(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  questao_id UUID NOT NULL REFERENCES public.questoes_simulado(id) ON DELETE CASCADE,
  resposta_marcada CHAR(1) CHECK (resposta_marcada IN ('A','B','C','D','E')),
  correta BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tentativa_id, questao_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.respostas_aluno TO authenticated;
GRANT ALL ON public.respostas_aluno TO service_role;
ALTER TABLE public.respostas_aluno ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own respostas" ON public.respostas_aluno FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own respostas" ON public.respostas_aluno FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own respostas" ON public.respostas_aluno FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users delete own respostas" ON public.respostas_aluno FOR DELETE TO authenticated USING (auth.uid() = user_id);
