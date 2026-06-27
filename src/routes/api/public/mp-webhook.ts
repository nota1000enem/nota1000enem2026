import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createHmac, timingSafeEqual } from "crypto";
import { sendMetaCapiPurchase } from "@/lib/meta-capi.server";


/**
 * Valida o header x-signature do Mercado Pago.
 * Formato: "ts=1234567890,v1=abcdef..."
 * Manifest: "id:{data.id};request-id:{x-request-id};ts:{ts};"
 */
function verifyMpSignature(opts: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string;
  secret: string;
}): boolean {
  const { signatureHeader, requestId, dataId, secret } = opts;
  if (!signatureHeader || !secret) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=").map((s) => s.trim());
      return [k, v];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId ?? ""};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  try {
    const a = Buffer.from(v1, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const PLAN_CREDITS: Record<string, number> = {
  LIGHT: 15,
  PRO: 30,
  FULL: 60,
  VITALICIO: 70,
};

const PLAN_VALOR_CENTAVOS: Record<string, number> = {
  LIGHT: 1990,
  PRO: 2990,
  FULL: 4990,
  VITALICIO: 49900,
};

const VITALICIO_END = "2099-12-31T23:59:59.000Z";

async function processPayment(paymentId: string) {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    console.error("MERCADO_PAGO_ACCESS_TOKEN ausente");
    return;
  }

  // 1) Buscar pagamento na API do MP (fonte da verdade)
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.error("Falha ao buscar pagamento MP:", paymentId, res.status, await res.text());
    return;
  }
  const pay = (await res.json()) as {
    id: number | string;
    status: string;
    metadata?: { user_id?: string; plan_type?: string };
    payer?: { id?: string; email?: string };
    transaction_amount?: number;
  };

  if (pay.status !== "approved") {
    console.log(`Pagamento ${paymentId} status=${pay.status} — ignorado`);
    return;
  }

  const userId = pay.metadata?.user_id;
  const planType = pay.metadata?.plan_type;
  if (!userId || !planType || !(planType in PLAN_CREDITS)) {
    console.error("Pagamento aprovado sem metadata válida:", paymentId, pay.metadata);
    return;
  }

  // 2) Idempotência: registra (ou ignora se já existe)
  const { error: txError } = await supabaseAdmin
    .from("payment_transactions")
    .insert({
      user_id: userId,
      mp_payment_id: String(pay.id),
      plan_type: planType,
      valor_centavos: Math.round((pay.transaction_amount ?? 0) * 100) || PLAN_VALOR_CENTAVOS[planType],
      status: pay.status,
      raw: pay,
    });

  if (txError) {
    if ((txError as any).code === "23505") {
      console.log(`Pagamento ${pay.id} já processado — skip.`);
      return;
    }
    console.error("Erro ao inserir payment_transactions:", txError);
    return;
  }

  // 3) Calcular novo period_end
  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  let newPeriodEnd: string;
  if (planType === "VITALICIO") {
    newPeriodEnd = VITALICIO_END;
  } else if (
    existing &&
    existing.status === "ACTIVE" &&
    existing.current_period_end &&
    new Date(existing.current_period_end) > new Date()
  ) {
    // Renovação antecipada: soma +30d ao fim atual
    const base = new Date(existing.current_period_end);
    base.setDate(base.getDate() + 30);
    newPeriodEnd = base.toISOString();
  } else {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    newPeriodEnd = d.toISOString();
  }

  // 4) Upsert subscription com créditos do plano (zera os antigos)
  const { error: subError } = await supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan_type: planType,
        status: "ACTIVE",
        current_period_end: newPeriodEnd,
        credits_remaining: PLAN_CREDITS[planType],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (subError) {
    console.error("Erro ao atualizar subscription:", subError);
    return;
  }

  // 5) Espelha no profiles (compat com código legado) + mp_customer_id
  const planLower = planType.toLowerCase();
  await supabaseAdmin
    .from("profiles")
    .update({
      plan: planLower,
      plan_expires_at: planType === "VITALICIO" ? null : newPeriodEnd,
      plan_vitalicio: planType === "VITALICIO",
      ...(pay.payer?.id ? { mp_customer_id: String(pay.payer.id) } : {}),
    })
    .eq("id", userId);

  console.log(`✅ Pagamento ${pay.id} processado: user=${userId} plano=${planType} até=${newPeriodEnd}`);
}

export const Route = createFileRoute("/api/public/mp-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const bodyText = await request.text();
          let body: any = {};
          try {
            body = bodyText ? JSON.parse(bodyText) : {};
          } catch {
            body = {};
          }

          // ID do pagamento pode vir de várias formas
          const paymentId =
            body?.data?.id ??
            body?.resource?.toString().split("/").pop() ??
            url.searchParams.get("data.id") ??
            url.searchParams.get("id");

          const type =
            body?.type ?? body?.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic");

          if (!paymentId || !type || !["payment", "payment.updated", "payment.created"].includes(String(type))) {
            // Pode ser ping inicial — responde 200
            return new Response("ok", { status: 200 });
          }

          // CRÍTICO: valida assinatura HMAC do MP antes de qualquer processamento
          const secret = process.env.MP_WEBHOOK_SECRET;
          if (!secret) {
            console.error("MP_WEBHOOK_SECRET ausente — rejeitando webhook");
            return new Response("server misconfigured", { status: 503 });
          }
          const signatureOk = verifyMpSignature({
            signatureHeader: request.headers.get("x-signature"),
            requestId: request.headers.get("x-request-id"),
            dataId: String(paymentId),
            secret,
          });
          if (!signatureOk) {
            console.warn("Webhook MP com assinatura inválida — rejeitado");
            return new Response("invalid signature", { status: 401 });
          }


          // CRÍTICO: em Cloudflare Workers o runtime termina após o Response.
          // Precisamos aguardar o processamento antes de responder, senão
          // a transação nunca é salva (bug que deixou pagamentos reais sem ativar plano).
          try {
            await processPayment(String(paymentId));
          } catch (e) {
            console.error("Webhook MP erro processamento:", e);
          }

          return new Response("ok", { status: 200 });
        } catch (e) {
          console.error("Webhook MP erro:", e);
          // Mesmo em erro, responde 200 pra MP não retentar infinito
          return new Response("ok", { status: 200 });
        }
      },
      GET: async () => new Response("ok", { status: 200 }),
    },
  },
});
