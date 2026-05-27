
-- 1. Adicionar colunas de controle de assinatura
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_vitalicio BOOLEAN NOT NULL DEFAULT false;

-- 2. Função: plano está ativo?
CREATE OR REPLACE FUNCTION public.plano_ativo(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id
      AND p.plan <> 'free'
      AND (p.plan_vitalicio = true OR (p.plan_expires_at IS NOT NULL AND p.plan_expires_at > now()))
  );
$$;

-- 3. Função: pode corrigir mais uma redação?
CREATE OR REPLACE FUNCTION public.pode_corrigir_redacao(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prof RECORD;
  usadas_mes INT;
  usadas_total INT;
  limite INT;
  ativo BOOLEAN;
BEGIN
  SELECT plan, plan_expires_at, plan_vitalicio INTO prof
  FROM public.profiles WHERE id = _user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('pode', false, 'motivo', 'profile_nao_encontrado');
  END IF;

  ativo := prof.plan_vitalicio = true
        OR (prof.plan <> 'free' AND prof.plan_expires_at IS NOT NULL AND prof.plan_expires_at > now());

  limite := CASE prof.plan
    WHEN 'free' THEN 1
    WHEN 'light' THEN 25
    WHEN 'pro' THEN 50
    WHEN 'full' THEN 100
    WHEN 'vitalicio' THEN 100
    ELSE 0
  END;

  SELECT COUNT(*) INTO usadas_total FROM public.redacoes WHERE user_id = _user_id;
  SELECT COUNT(*) INTO usadas_mes FROM public.redacoes
    WHERE user_id = _user_id AND created_at >= date_trunc('month', now());

  -- Free: 1 redacao total na vida
  IF prof.plan = 'free' THEN
    RETURN jsonb_build_object(
      'pode', usadas_total < 1,
      'plano', prof.plan,
      'usadas', usadas_total,
      'limite', 1,
      'ativo', false,
      'motivo', CASE WHEN usadas_total < 1 THEN 'ok' ELSE 'limite_gratuito_atingido' END
    );
  END IF;

  -- Assinaturas pagas: precisam estar ativas
  IF NOT ativo THEN
    RETURN jsonb_build_object(
      'pode', false,
      'plano', prof.plan,
      'ativo', false,
      'motivo', 'assinatura_expirada'
    );
  END IF;

  RETURN jsonb_build_object(
    'pode', usadas_mes < limite,
    'plano', prof.plan,
    'usadas', usadas_mes,
    'limite', limite,
    'ativo', true,
    'motivo', CASE WHEN usadas_mes < limite THEN 'ok' ELSE 'limite_mensal_atingido' END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.plano_ativo(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pode_corrigir_redacao(uuid) TO authenticated;
