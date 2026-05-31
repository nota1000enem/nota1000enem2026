import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fonte única de verdade para acesso a recursos pagos.
 * Combina profiles (plan/plan_vitalicio/plan_expires_at) + subscriptions (status/period_end).
 * Aceita 'plan' em qualquer caixa (FULL, full, Full…).
 */

export type PlanTier = "free" | "light" | "pro" | "full" | "vitalicio";

export type PlanAccess = {
  loading: boolean;
  loggedIn: boolean;
  tier: PlanTier;
  vitalicio: boolean;
  expiresAt: Date | null;
  daysLeft: number | null;
  /** Tem plano pago ativo (qualquer pago + dentro do prazo). */
  isPaid: boolean;
  /** Tem modo rígido / IA premium (Pro, Full, Vitalício). */
  isPremium: boolean;
  credits: number | null;
  refetch: () => Promise<void>;
};

function normalize(p?: string | null): PlanTier {
  const s = (p ?? "free").toLowerCase().trim();
  if (s === "light" || s === "pro" || s === "full" || s === "vitalicio") return s;
  return "free";
}

export function usePlanAccess(): PlanAccess {
  const [state, setState] = useState<PlanAccess>({
    loading: true,
    loggedIn: false,
    tier: "free",
    vitalicio: false,
    expiresAt: null,
    daysLeft: null,
    isPaid: false,
    isPremium: false,
    credits: null,
    refetch: async () => {},
  });

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setState((s) => ({ ...s, loading: false, loggedIn: false, isPaid: false, isPremium: false }));
      return;
    }
    const [{ data: prof }, { data: sub }] = await Promise.all([
      supabase.from("profiles").select("plan, plan_vitalicio, plan_expires_at").eq("id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("plan_type, status, current_period_end, credits_remaining").eq("user_id", user.id).maybeSingle(),
    ]);

    const tierFromProf = normalize(prof?.plan);
    const tierFromSub = normalize(sub?.plan_type);
    // pega o "melhor" tier conhecido
    const order: PlanTier[] = ["free", "light", "pro", "full", "vitalicio"];
    const tier = order[Math.max(order.indexOf(tierFromProf), order.indexOf(tierFromSub))] as PlanTier;

    const vitalicio = Boolean(prof?.plan_vitalicio) || tier === "vitalicio";
    const expiresAt = prof?.plan_expires_at ? new Date(prof.plan_expires_at) : sub?.current_period_end ? new Date(sub.current_period_end) : null;
    const dentroDoPrazo = vitalicio || (!!expiresAt && expiresAt.getTime() > Date.now());
    const subAtiva = !sub || sub.status === "ACTIVE";
    const isPaid = tier !== "free" && dentroDoPrazo && subAtiva;
    const isPremium = isPaid && (tier === "pro" || tier === "full" || tier === "vitalicio");
    const daysLeft = expiresAt && !vitalicio ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 86400000)) : null;

    setState({
      loading: false,
      loggedIn: true,
      tier,
      vitalicio,
      expiresAt,
      daysLeft,
      isPaid,
      isPremium,
      credits: sub?.credits_remaining ?? null,
      refetch: load,
    });
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  return state;
}
