import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const PLAN_CONFIG = {
  LIGHT: { price: 19.9, credits: 15, tier: "PRO_BASIC", label: "ENEM Light" },
  PRO: { price: 29.9, credits: 30, tier: "FULL_PREMIUM", label: "ENEM Pro" },
  FULL: { price: 49.9, credits: 60, tier: "FULL_ACESS", label: "Full Acess ENEM" },
  VITALICIO: { price: 499, credits: 70, tier: "FULL_ACESS", label: "Full Acess Vitalício" },
} as const;

export type PlanType = keyof typeof PLAN_CONFIG;

const checkoutInput = z.object({
  planType: z.enum(["LIGHT", "PRO", "FULL", "VITALICIO"]),
});

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => checkoutInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { claims } = context as unknown as { claims?: { email?: string } };

    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) {
      throw new Error("Mercado Pago não configurado. Contate o suporte.");
    }

    const plan = PLAN_CONFIG[data.planType];
    const email = claims?.email ?? undefined;

    // Origin para back_urls e notification_url
    const origin = process.env.PUBLIC_APP_URL ?? "https://nota1000enem.online";

    const notificationUrl = `${origin}/api/public/mp-webhook`;

    const preference = {
      items: [
        {
          id: data.planType,
          title: `Nota 1000 ENEM — ${plan.label}`,
          description: `Acesso de 30 dias ao plano ${plan.label}`,
          quantity: 1,
          currency_id: "BRL",
          unit_price: plan.price,
        },
      ],
      payer: email ? { email } : undefined,
      metadata: {
        user_id: userId,
        plan_type: data.planType,
      },
      external_reference: `${userId}:${data.planType}:${Date.now()}`,
      payment_methods: {
        excluded_payment_types: [],
        installments: 12,
      },
      back_urls: {
        success: `${origin}/dashboard?status=success&plan=${encodeURIComponent(data.planType)}`,
        failure: `${origin}/planos?status=failure&plan=${encodeURIComponent(data.planType)}`,
        pending: `${origin}/planos?status=pending&plan=${encodeURIComponent(data.planType)}`,
      },
      auto_return: "approved",
      notification_url: notificationUrl,
      statement_descriptor: "NOTA1000ENEM",
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(preference),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("MP preference error:", res.status, txt);
      throw new Error(`Falha ao criar checkout (${res.status}). Tente novamente em instantes.`);
    }

    const json = (await res.json()) as {
      id: string;
      init_point: string;
      sandbox_init_point: string;
    };

    // Marca subscription como PENDING (sem dar acesso) só para registrar tentativa
    await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan_type: data.planType,
        status: "PENDING",
        current_period_end: new Date().toISOString(),
        credits_remaining: 0,
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    );

    return {
      init_point: json.init_point,
      preference_id: json.id,
    };
  });

// ============================================================
// Fallback robusto: usuário clica "Já paguei, confirmar agora"
// Buscamos no MP os pagamentos recentes do usuário e processamos
// o mais recente aprovado, sem depender do webhook.
// ============================================================

const PLAN_CREDITS_FN: Record<string, number> = {
  LIGHT: 15, PRO: 30, FULL: 60, VITALICIO: 70,
};
const PLAN_VALOR_CENTAVOS_FN: Record<string, number> = {
  LIGHT: 1990, PRO: 2990, FULL: 4990, VITALICIO: 49900,
};
const VITALICIO_END_FN = "2099-12-31T23:59:59.000Z";

export const forcarConfirmacaoMP = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) throw new Error("Mercado Pago não configurado.");

    // 1) Busca pagamentos recentes do usuário via external_reference prefix
    const url = new URL("https://api.mercadopago.com/v1/payments/search");
    url.searchParams.set("sort", "date_created");
    url.searchParams.set("criteria", "desc");
    url.searchParams.set("range", "date_created");
    const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    url.searchParams.set("begin_date", fromDate);
    url.searchParams.set("end_date", new Date().toISOString());
    url.searchParams.set("limit", "25");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("MP search err:", res.status, t);
      throw new Error("Não conseguimos consultar o Mercado Pago. Tente em instantes.");
    }
    const json = (await res.json()) as { results?: Array<{
      id: number | string;
      status: string;
      metadata?: { user_id?: string; plan_type?: string };
      external_reference?: string;
      transaction_amount?: number;
      payer?: { id?: string };
    }> };

    const meus = (json.results ?? []).filter((p) => {
      const fromMeta = p.metadata?.user_id === userId;
      const fromExtRef = typeof p.external_reference === "string" && p.external_reference.startsWith(`${userId}:`);
      return fromMeta || fromExtRef;
    });
    const aprovado = meus.find((p) => p.status === "approved");
    if (!aprovado) {
      return { ok: false, motivo: "sem_pagamento_aprovado" as const };
    }

    let planType = aprovado.metadata?.plan_type;
    if (!planType && aprovado.external_reference) {
      planType = aprovado.external_reference.split(":")[1];
    }
    if (!planType || !(planType in PLAN_CREDITS_FN)) {
      return { ok: false, motivo: "plano_invalido" as const };
    }

    // 2) Idempotência
    const { error: txError } = await supabaseAdmin.from("payment_transactions").insert({
      user_id: userId,
      mp_payment_id: String(aprovado.id),
      plan_type: planType,
      valor_centavos: Math.round((aprovado.transaction_amount ?? 0) * 100) || PLAN_VALOR_CENTAVOS_FN[planType],
      status: aprovado.status,
      raw: aprovado,
    });
    const jaProcessado = txError && (txError as { code?: string }).code === "23505";
    if (txError && !jaProcessado) {
      console.error("Erro tx insert:", txError);
    }

    // 3) Calcula period_end
    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .maybeSingle();

    let newPeriodEnd: string;
    if (planType === "VITALICIO") {
      newPeriodEnd = VITALICIO_END_FN;
    } else if (existing?.status === "ACTIVE" && existing.current_period_end && new Date(existing.current_period_end) > new Date()) {
      const base = new Date(existing.current_period_end);
      base.setDate(base.getDate() + 30);
      newPeriodEnd = base.toISOString();
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      newPeriodEnd = d.toISOString();
    }

    // 4) Upsert subscription
    if (!jaProcessado) {
      await supabaseAdmin.from("subscriptions").upsert({
        user_id: userId,
        plan_type: planType,
        status: "ACTIVE",
        current_period_end: newPeriodEnd,
        credits_remaining: PLAN_CREDITS_FN[planType],
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      const planLower = planType.toLowerCase();
      await supabaseAdmin.from("profiles").update({
        plan: planLower,
        plan_expires_at: planType === "VITALICIO" ? null : newPeriodEnd,
        plan_vitalicio: planType === "VITALICIO",
        ...(aprovado.payer?.id ? { mp_customer_id: String(aprovado.payer.id) } : {}),
      }).eq("id", userId);
    }

    return { ok: true as const, plan_type: planType };
  });

