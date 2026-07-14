import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  Home,
  PenLine,
  ListChecks,
  PlayCircle,
  MoreHorizontal,
  User,
  Trophy,
  FileText,
  BookOpen,
  GraduationCap,
  ClipboardList,
  CreditCard,
  LogOut,
  LogIn,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

type Item = {
  to: string;
  label: string;
  icon: typeof Home;
  match: (path: string) => boolean;
};

const primary: Item[] = [
  { to: "/", label: "Início", icon: Home, match: (p) => p === "/" },
  { to: "/redacao", label: "Redação", icon: PenLine, match: (p) => p.startsWith("/redacao") },
  { to: "/questoes", label: "Simulados", icon: ListChecks, match: (p) => p.startsWith("/questoes") || p.startsWith("/simulado") },
  { to: "/aulas", label: "Aulas", icon: PlayCircle, match: (p) => p.startsWith("/aulas") },
];

export function BottomNav() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openMore, setOpenMore] = useState(false);

  useEffect(() => {
    setOpenMore(false);
  }, [pathname]);

  useEffect(() => {
    if (!openMore) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openMore]);

  const moreActive =
    !primary.some((i) => i.match(pathname)) && openMore
      ? true
      : !primary.some((i) => i.match(pathname));

  const moreLinks: Item[] = [
    { to: "/plano-estudo", label: "Plano de Estudo", icon: GraduationCap, match: (p) => p.startsWith("/plano-estudo") },
    { to: "/redacao-pronta", label: "Redação Pronta", icon: BookOpen, match: (p) => p.startsWith("/redacao-pronta") },
    { to: "/pdfs", label: "PDFs", icon: FileText, match: (p) => p.startsWith("/pdfs") },
    { to: "/prova-real", label: "Provas ENEM", icon: ClipboardList, match: (p) => p.startsWith("/prova-real") },
    { to: "/ranking", label: "Ranking", icon: Trophy, match: (p) => p.startsWith("/ranking") },
    { to: "/planos", label: "Planos & Preços", icon: CreditCard, match: (p) => p.startsWith("/planos") },
  ];

  const accountLinks: Item[] = user
    ? [
        { to: "/dashboard", label: "Dashboard", icon: Home, match: (p) => p.startsWith("/dashboard") },
        { to: "/perfil", label: "Meu Perfil", icon: User, match: (p) => p.startsWith("/perfil") },
        { to: "/minha-assinatura", label: "Minha Assinatura", icon: CreditCard, match: (p) => p.startsWith("/minha-assinatura") },
      ]
    : [{ to: "/auth", label: "Entrar / Cadastrar", icon: LogIn, match: (p) => p.startsWith("/auth") }];

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="bottom-nav fixed inset-x-0 bottom-0 z-50 md:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-around gap-1 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
          {primary.map((it) => {
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
                    <span className="absolute -top-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-primary" />
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
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setOpenMore(true)}
              className={`bottom-nav-item group relative flex w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 text-[10px] font-semibold transition ${
                openMore ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label="Mais opções"
              aria-expanded={openMore}
            >
              {openMore && (
                <span className="absolute -top-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_12px_oklch(0.58_0.32_25/0.8)]" />
              )}
              <MoreHorizontal
                className={`h-5 w-5 transition-transform ${openMore ? "scale-110" : "group-active:scale-90"}`}
                strokeWidth={openMore ? 2.4 : 2}
              />
              <span className="leading-none">Mais</span>
            </button>
          </li>
        </ul>
      </nav>

      {openMore && (
        <div
          className="fixed inset-0 z-[200] md:hidden isolate"
          role="dialog"
          aria-modal="true"
          aria-label="Mais opções"
          style={{ contain: "layout paint" }}
        >
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setOpenMore(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-md animate-in fade-in"
          />
          <div className="more-sheet absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border/50 bg-background shadow-[0_-20px_60px_-20px_oklch(0_0_0/0.8)]">
            <div className="relative mx-auto flex max-w-md flex-col gap-4 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/30" />
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold tracking-tight">Explorar tudo</h2>
                <button
                  type="button"
                  onClick={() => setOpenMore(false)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-muted/60 text-muted-foreground active:scale-95"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {moreLinks.map((l) => {
                  const Icon = l.icon;
                  const active = l.match(pathname);
                  return (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setOpenMore(false)}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center text-[11px] font-semibold transition active:scale-95 ${
                        active
                          ? "border-primary/60 bg-primary/10 text-primary"
                          : "border-border/50 bg-muted/30 text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="leading-tight">{l.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="flex flex-col gap-1.5 rounded-2xl border border-border/50 bg-muted/20 p-1.5">
                {accountLinks.map((l) => {
                  const Icon = l.icon;
                  return (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setOpenMore(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition active:scale-[0.98] hover:bg-muted/40"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{l.label}</span>
                    </Link>
                  );
                })}
                {user && (
                  <button
                    type="button"
                    onClick={async () => {
                      setOpenMore(false);
                      await supabase.auth.signOut();
                      router.navigate({ to: "/" });
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-destructive transition active:scale-[0.98] hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
