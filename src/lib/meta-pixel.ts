/**
 * Wrapper tipado em torno do Meta Pixel (fbq) carregado no <head> via __root.tsx.
 * Use em handlers do cliente para enviar eventos padrão do Facebook Ads.
 * Documentação dos eventos: https://developers.facebook.com/docs/meta-pixel/reference
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type StandardEvent =
  | "PageView"
  | "ViewContent"
  | "Lead"
  | "CompleteRegistration"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Subscribe"
  | "StartTrial"
  | "Contact";

export function pixelTrack(event: StandardEvent, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    window.fbq?.("track", event, params ?? {});
  } catch {
    // silencioso — pixel é melhor-esforço, nunca quebra a UI
  }
}

export function pixelTrackCustom(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    window.fbq?.("trackCustom", name, params ?? {});
  } catch {}
}

/** Dispara PageView em mudanças de rota SPA (PageView inicial já é enviado no <head>). */
export function pixelPageView() {
  pixelTrack("PageView");
}
