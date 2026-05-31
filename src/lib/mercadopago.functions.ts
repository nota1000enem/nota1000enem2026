import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
        success: `${origin}/dashboard?status=success`,
        failure: `${origin}/planos?status=failure`,
        pending: `${origin}/planos?status=pending`,
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
