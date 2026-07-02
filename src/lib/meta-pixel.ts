/**
 * Meta Pixel REMOVIDO a pedido do usuário.
 * Todos os helpers viraram no-ops — nenhum evento é enviado ao Facebook.
 * Mantido apenas para preservar imports existentes sem quebrar o build.
 */

export function pixelTrack(_event: string, _params?: Record<string, unknown>, _eventID?: string) {
  // no-op
}

export function pixelTrackCustom(_name: string, _params?: Record<string, unknown>) {
  // no-op
}

export function pixelPageView() {
  // no-op
}
