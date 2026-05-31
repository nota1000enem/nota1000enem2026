import { Send } from "lucide-react";

export function TelegramFab() {
  return (
    <a
      href="https://t.me/+wr3mUBagkQkyODYx"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GRUPO VIP ENEM ! CLIQUE AQUI"
      className="group fixed bottom-5 right-5 z-[60] flex max-w-[260px] items-center gap-2 rounded-full bg-gradient-to-r from-[#2ab4ee] to-[#229ED9] px-4 py-3 font-bold text-white shadow-2xl shadow-[#229ED9]/60 ring-2 ring-white/40 transition hover:scale-105 hover:from-[#3ec2f5] hover:to-[#1b8ec2] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
    >
      <span className="absolute inset-0 -z-10 rounded-full bg-[#2ab4ee] opacity-60 blur-md animate-pulse" aria-hidden="true" />
      <Send className="h-5 w-5 drop-shadow" />
      <span className="text-xs font-bold leading-tight sm:text-sm">
        GRUPO VIP ENEM ! CLIQUE AQUI
      </span>
    </a>
  );
}
