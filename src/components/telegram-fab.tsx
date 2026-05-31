import { Send } from "lucide-react";

export function TelegramFab() {
  return (
    <a
      href="https://t.me/+wr3mUBagkQkyODYx"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Entrar no grupo do Telegram NOTA 1000 ENEM 2026"
      className="fixed bottom-5 right-5 z-[60] flex max-w-[260px] items-center gap-2 rounded-full bg-[#229ED9] px-4 py-3 text-white shadow-lg shadow-[#229ED9]/40 ring-1 ring-white/20 transition hover:scale-105 hover:bg-[#1b8ec2]"
    >
      <Send className="h-5 w-5" />
      <span className="text-xs font-semibold leading-tight sm:text-sm">Entre no grupo via do ENEM! GRÁTIS!</span>
    </a>
  );
}
