import { Link, useRouterState } from "@tanstack/react-router";
import { Home, PenLine, Trophy, ListChecks, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type Item = {
  to: string;
  label: string;
  icon: typeof Home;
  match: (path: string) => boolean;
};

export function BottomNav() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items: Item[] = [
    { to: "/", label: "Início", icon: Home, match: (p) => p === "/" },
    { to: "/redacao", label: "Redação", icon: PenLine, match: (p) => p.startsWith("/redacao") },
    { to: "/questoes", label: "Simulados", icon: ListChecks, match: (p) => p.startsWith("/questoes") || p.startsWith("/simulado") },
    { to: "/ranking", label: "Ranking", icon: Trophy, match: (p) => p.startsWith("/ranking") },
    user
      ? { to: "/perfil", label: "Perfil", icon: User, match: (p) => p.startsWith("/perfil") || p.startsWith("/dashboard") || p.startsWith("/minha-assinatura") }
      : { to: "/auth", label: "Entrar", icon: User, match: (p) => p.startsWith("/auth") },
  ];

  return (
    <nav
      aria-label="Navegação principal"
      className="bottom-nav fixed inset-x-0 bottom-0 z-50 md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around gap-1 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {items.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <li key={it.to} className="flex-1">
              <Link
                to={it.to}
                className={`bottom-nav-item group relative flex flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 text-[10px] font-semibold transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {active && (
                  <span className="absolute -top-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_12px_oklch(0.58_0.32_25/0.8)]" />
                )}
                <Icon
                  className={`h-5 w-5 transition-transform ${active ? "scale-110" : "group-active:scale-90"}`}
                  strokeWidth={active ? 2.4 : 2}
                  fill={active ? "currentColor" : "none"}
                  fillOpacity={active ? 0.15 : 0}
                />
                <span className="leading-none">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
