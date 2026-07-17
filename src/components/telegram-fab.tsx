import { Send } from "lucide-react";

/**
 * Botão flutuante do Telegram — versão mobile-safe.
 * No celular usa formato compacto (icone + label curto) que nunca vaza fora da tela;
 * no desktop expande com o CTA completo.
 */
export function TelegramFab() {
  return (
    <a
      href="https://t.me/+wr3mUBagkQkyODYx"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Entrar no grupo VIP do Telegram"
      className="group fixed bottom-5 right-5 z-[60] hidden max-w-[calc(100vw-2rem)] items-center gap-2 overflow-hidden rounded-full bg-[length:200%_200%] bg-gradient-to-r from-[#dc2626] via-[#ef4444] to-[#7f1d1d] px-4 py-3 font-bold text-white shadow-2xl shadow-red-500/60 ring-2 ring-white/40 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 animate-[gradient-shift_3s_ease_infinite] md:flex"
    >
      <span
        className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-[#dc2626] via-[#ef4444] to-[#7f1d1d] opacity-70 blur-lg animate-pulse"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full transition-transform duration-1000"
        aria-hidden="true"
      />
      <Send className="h-4 w-4 shrink-0 drop-shadow sm:h-5 sm:w-5" />
      <span className="hidden text-xs font-bold leading-tight sm:inline sm:text-sm">
        GRUPO VIP ENEM ! CLIQUE AQUI
      </span>
      <span className="text-[11px] font-bold leading-tight sm:hidden">
        GRUPO VIP
      </span>
    </a>
  );
}
