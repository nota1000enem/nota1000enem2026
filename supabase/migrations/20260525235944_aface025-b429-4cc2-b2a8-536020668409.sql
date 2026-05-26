
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- redacoes
CREATE TABLE public.redacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  tema TEXT,
  texto TEXT NOT NULL,
  nota_total INTEGER,
  competencia_1 INTEGER,
  competencia_2 INTEGER,
  competencia_3 INTEGER,
  competencia_4 INTEGER,
  competencia_5 INTEGER,
  feedback JSONB,
  modo_rigido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.redacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own redacoes" ON public.redacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users insert own redacoes" ON public.redacoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own redacoes" ON public.redacoes FOR DELETE USING (auth.uid() = user_id);
