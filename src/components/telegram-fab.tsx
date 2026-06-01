import { Send } from "lucide-react";

/**
 * Botão flutuante para o grupo do Telegram.
 * Cores em gradiente azul → roxo → rosa, espelhando o "100" do logo Nota 1000 ENEM.
 * Animação "shimmer" + pulse para chamar atenção (mesma vibe do botão Pro).
 */
export function TelegramFab() {
  return (
    <a
      href="https://t.me/+wr3mUBagkQkyODYx"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GRUPO VIP ENEM ! CLIQUE AQUI"
      className="group fixed bottom-5 right-5 z-[60] flex max-w-[260px] items-center gap-2 overflow-hidden rounded-full bg-[length:200%_200%] bg-gradient-to-r from-[#2ab4ee] via-[#8b5cf6] to-[#ec4899] px-4 py-3 font-bold text-white shadow-2xl shadow-purple-500/60 ring-2 ring-white/40 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 animate-[gradient-shift_3s_ease_infinite]"
    >
      <span
        className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-[#2ab4ee] via-[#8b5cf6] to-[#ec4899] opacity-70 blur-lg animate-pulse"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full transition-transform duration-1000"
        aria-hidden="true"
      />
      <Send className="h-5 w-5 drop-shadow" />
      <span className="text-xs font-bold leading-tight sm:text-sm">
        GRUPO VIP ENEM ! CLIQUE AQUI
      </span>
    </a>
  );
}
