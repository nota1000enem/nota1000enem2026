/**
 * Meta Conversions API (CAPI) helper — server-side Purchase events.
 * Requer META_CAPI_TOKEN e META_PIXEL_ID nas env vars.
 * Em caso de ausência ou erro, retorna silenciosamente — pixel client-side ainda funciona.
 */
import { createHash } from "crypto";

const PIXEL_ID = "1547784333801355"; // mesmo do client-side

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export type CapiPurchaseInput = {
  email?: string;
  externalId?: string; // user_id
  value: number; // em reais
  currency?: string;
  eventId: string; // dedup com pixel client-side
  ip?: string;
  userAgent?: string;
  contentName?: string; // plano
};

export async function sendMetaCapiPurchase(input: CapiPurchaseInput): Promise<void> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    console.log("META_CAPI_TOKEN ausente — CAPI Purchase ignorado");
    return;
  }

  const userData: Record<string, string | string[]> = {};
  if (input.email) userData.em = [sha256(input.email)];
  if (input.externalId) userData.external_id = [sha256(input.externalId)];
  if (input.ip) userData.client_ip_address = input.ip;
  if (input.userAgent) userData.client_user_agent = input.userAgent;

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId, // dedup com pixel
        action_source: "website",
        event_source_url: "https://nota1000enem.online/dashboard",
        user_data: userData,
        custom_data: {
          currency: input.currency ?? "BRL",
          value: Number(input.value.toFixed(2)),
          content_name: input.contentName,
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      console.error("Meta CAPI Purchase falhou:", res.status, text);
    } else {
      console.log(`✅ Meta CAPI Purchase enviado (event_id=${input.eventId})`);
    }
  } catch (e) {
    console.error("Meta CAPI Purchase erro:", e);
  }
}
