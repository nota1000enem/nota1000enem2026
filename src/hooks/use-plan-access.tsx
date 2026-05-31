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
  const s = (p ?? "free")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "")
    .trim();
  if (s.includes("vitalicio")) return "vitalicio";
  if (s.includes("full")) return "full";
  if (s.includes("pro")) return "pro";
  if (s.includes("light") || s.includes("basic")) return "light";
  return "free";
}

function isActiveStatus(status?: string | null) {
  const s = (status ?? "").toLowerCase().trim();
  return ["active", "ativa", "approved", "aprovado"].includes(s);
}

function isFuture(date?: string | null) {
  return !!date && new Date(date).getTime() > Date.now();
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
    const [{ data: prof }, { data: sub }, { data: assinatura }] = await Promise.all([
      supabase.from("profiles").select("plan, plan_vitalicio, plan_expires_at").eq("id", user.id).maybeSingle(),
      supabase.from("subscriptions").select("plan_type, status, current_period_end, credits_remaining").eq("user_id", user.id).maybeSingle(),
      supabase.from("assinaturas").select("plano, status, vence_em").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const tierFromProf = normalize(prof?.plan);
    const tierFromSub = normalize(sub?.plan_type);
    const tierFromAssinatura = normalize(assinatura?.plano);
    // pega o "melhor" tier conhecido
    const order: PlanTier[] = ["free", "light", "pro", "full", "vitalicio"];
    const tier = order[Math.max(order.indexOf(tierFromProf), order.indexOf(tierFromSub), order.indexOf(tierFromAssinatura))] as PlanTier;

    const vitalicio = Boolean(prof?.plan_vitalicio) || tier === "vitalicio";
    const expiresAt = prof?.plan_expires_at ? new Date(prof.plan_expires_at) : sub?.current_period_end ? new Date(sub.current_period_end) : assinatura?.vence_em ? new Date(assinatura.vence_em) : null;
    const perfilAtivo = tierFromProf !== "free" && (Boolean(prof?.plan_vitalicio) || isFuture(prof?.plan_expires_at));
    const subAtiva = tierFromSub !== "free" && isActiveStatus(sub?.status) && (tierFromSub === "vitalicio" || isFuture(sub?.current_period_end));
    const assinaturaAtiva = tierFromAssinatura !== "free" && isActiveStatus(assinatura?.status) && (tierFromAssinatura === "vitalicio" || isFuture(assinatura?.vence_em));
    const isPaid = tier !== "free" && (vitalicio || perfilAtivo || subAtiva || assinaturaAtiva);
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
