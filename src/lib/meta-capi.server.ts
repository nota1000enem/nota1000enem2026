/**
 * Meta Conversions API REMOVIDA a pedido do usuário.
 * Função mantida como no-op para não quebrar imports do webhook do Mercado Pago.
 */

export type CapiPurchaseInput = {
  email?: string;
  externalId?: string;
  value: number;
  currency?: string;
  eventId: string;
  ip?: string;
  userAgent?: string;
  contentName?: string;
};

export async function sendMetaCapiPurchase(_input: CapiPurchaseInput): Promise<void> {
  // no-op — nenhum evento enviado ao Facebook
}
