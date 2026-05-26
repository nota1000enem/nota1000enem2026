import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const links = [
    { to: "/", label: "Início" },
    { to: "/redacao", label: "Corrigir Redação" },
    { to: "/ranking", label: "Ranking" },
    { to: "/aulas", label: "Vídeo Aulas" },
    { to: "/planos", label: "Planos" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-content-center rounded-lg bg-primary/20 ring-1 ring-primary/40">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold tracking-tight">Nota <span className="gradient-text">1000</span> ENEM</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link to="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
              <Button size="sm" variant="outline" onClick={async () => { await supabase.auth.signOut(); router.navigate({ to: "/" }); }}>Sair</Button>
            </>
          ) : (
            <>
              <Link to="/auth"><Button variant="ghost" size="sm">Entrar</Button></Link>
              <Link to="/planos"><Button size="sm" className="glow-blue">Começar agora</Button></Link>
            </>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/40 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                {l.label}
              </Link>
            ))}
            {user ? (
              <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-muted">Dashboard</Link>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-muted">Entrar / Cadastrar</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}