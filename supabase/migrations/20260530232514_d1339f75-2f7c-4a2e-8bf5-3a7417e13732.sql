
-- 1) Profiles: mp_customer_id
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mp_customer_id TEXT UNIQUE;

-- 2) subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('ACTIVE','EXPIRED','PENDING')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('LIGHT','PRO','FULL','VITALICIO')),
  current_period_end TIMESTAMPTZ NOT NULL,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own subscription"
ON public.subscriptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);

-- 3) video_lessons
CREATE TABLE IF NOT EXISTS public.video_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  video_url TEXT NOT NULL,
  access_tier TEXT NOT NULL CHECK (access_tier IN ('PRO_BASIC','FULL_PREMIUM','FULL_ACESS')),
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.video_lessons TO authenticated;
GRANT ALL ON public.video_lessons TO service_role;

ALTER TABLE public.video_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated read video_lessons"
ON public.video_lessons FOR SELECT TO authenticated
USING (true);

-- 4) payment_transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  mp_payment_id TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL,
  valor_centavos INTEGER NOT NULL,
  status TEXT NOT NULL,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own payments"
ON public.payment_transactions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payment_tx_user ON public.payment_transactions(user_id);

-- 5) RPC pode_corrigir_redacao (agora usa subscriptions)
CREATE OR REPLACE FUNCTION public.pode_corrigir_redacao(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub RECORD;
  usadas_total INT;
BEGIN
  SELECT * INTO sub FROM public.subscriptions WHERE user_id = _user_id;

  IF NOT FOUND THEN
    -- Free: 3 correções vitalícias
    SELECT COUNT(*) INTO usadas_total FROM public.redacoes WHERE user_id = _user_id;
    RETURN jsonb_build_object(
      'pode', usadas_total < 3,
      'plano', 'free',
      'usadas', usadas_total,
      'limite', 3,
      'creditos', GREATEST(0, 3 - usadas_total),
      'ativo', false,
      'motivo', CASE WHEN usadas_total < 3 THEN 'ok' ELSE 'limite_gratuito_atingido' END
    );
  END IF;

  IF sub.status <> 'ACTIVE' OR sub.current_period_end <= now() THEN
    RETURN jsonb_build_object(
      'pode', false, 'plano', sub.plan_type, 'ativo', false,
      'creditos', 0, 'motivo', 'assinatura_expirada',
      'period_end', sub.current_period_end
    );
  END IF;

  IF sub.credits_remaining <= 0 THEN
    RETURN jsonb_build_object(
      'pode', false, 'plano', sub.plan_type, 'ativo', true,
      'creditos', 0, 'motivo', 'creditos_esgotados',
      'period_end', sub.current_period_end
    );
  END IF;

  RETURN jsonb_build_object(
    'pode', true, 'plano', sub.plan_type, 'ativo', true,
    'creditos', sub.credits_remaining, 'limite', sub.credits_remaining,
    'usadas', 0, 'motivo', 'ok',
    'period_end', sub.current_period_end
  );
END;
$$;

-- 6) Trigger: desconta 1 crédito ao inserir redação (se tem subscription ativa)
CREATE OR REPLACE FUNCTION public.consumir_credito_redacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.subscriptions
     SET credits_remaining = GREATEST(0, credits_remaining - 1),
         updated_at = now()
   WHERE user_id = NEW.user_id
     AND status = 'ACTIVE'
     AND current_period_end > now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_redacao_insert_consume ON public.redacoes;
CREATE TRIGGER on_redacao_insert_consume
AFTER INSERT ON public.redacoes
FOR EACH ROW EXECUTE FUNCTION public.consumir_credito_redacao();

-- 7) Updated_at trigger para subscriptions
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_subscriptions_updated ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
