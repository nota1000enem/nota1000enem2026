
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.email_verifications (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  codigo TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_verifications TO authenticated;
GRANT ALL ON public.email_verifications TO service_role;

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ver_proprio" ON public.email_verifications;
CREATE POLICY "ver_proprio" ON public.email_verifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.gerar_codigo_verificacao_email()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _email text;
  _codigo text;
  _ultimo timestamptz;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = _user;
  IF _email IS NULL THEN
    RAISE EXCEPTION 'email_nao_encontrado';
  END IF;

  -- cooldown de 60s entre envios
  SELECT sent_at INTO _ultimo FROM public.email_verifications WHERE user_id = _user;
  IF _ultimo IS NOT NULL AND _ultimo > now() - interval '60 seconds' THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'cooldown',
      'aguarde_segundos', extract(epoch from (_ultimo + interval '60 seconds' - now()))::int);
  END IF;

  _codigo := lpad(floor(random() * 1000000)::text, 6, '0');

  INSERT INTO public.email_verifications (user_id, email, codigo, expires_at, sent_at, attempts)
  VALUES (_user, _email, _codigo, now() + interval '30 minutes', now(), 0)
  ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email,
        codigo = EXCLUDED.codigo,
        expires_at = EXCLUDED.expires_at,
        sent_at = now(),
        attempts = 0;

  RETURN jsonb_build_object('ok', true, 'email', _email, 'codigo', _codigo);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.gerar_codigo_verificacao_email() FROM anon;

CREATE OR REPLACE FUNCTION public.verificar_codigo_email(_codigo text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  v RECORD;
BEGIN
  IF _user IS NULL THEN
    RAISE EXCEPTION 'unauthenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v FROM public.email_verifications WHERE user_id = _user;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'sem_codigo');
  END IF;

  IF v.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'expirado');
  END IF;

  IF v.attempts >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'tentativas_excedidas');
  END IF;

  UPDATE public.email_verifications SET attempts = attempts + 1 WHERE user_id = _user;

  IF trim(_codigo) <> v.codigo THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'codigo_invalido');
  END IF;

  UPDATE public.profiles SET email_verified_at = now() WHERE id = _user;
  DELETE FROM public.email_verifications WHERE user_id = _user;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verificar_codigo_email(text) FROM anon;
