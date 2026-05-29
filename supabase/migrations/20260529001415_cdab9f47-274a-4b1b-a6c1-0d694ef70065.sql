-- 1. SECURITY: remove o acesso público a profiles via RLS de anon
DROP POLICY IF EXISTS "public can read profile names only via view" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;

-- 2. SECURITY: impedir que o usuário altere o próprio plano/expiração
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile safe fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND plan = (SELECT plan FROM public.profiles WHERE id = auth.uid())
  AND plan_vitalicio = (SELECT plan_vitalicio FROM public.profiles WHERE id = auth.uid())
  AND plan_expires_at IS NOT DISTINCT FROM (SELECT plan_expires_at FROM public.profiles WHERE id = auth.uid())
);

-- 3. Atualiza limites: free=3 totais, light=30, pro=60, full=120, vitalicio=120
CREATE OR REPLACE FUNCTION public.pode_corrigir_redacao(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
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
    WHEN 'light' THEN 30
    WHEN 'pro' THEN 60
    WHEN 'full' THEN 120
    WHEN 'vitalicio' THEN 120
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
$function$;