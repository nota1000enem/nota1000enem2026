import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-content-center rounded-lg bg-primary/20 ring-1 ring-primary/40">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold">Nota<span className="gradient-text">900</span> AI</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">A IA que vai te aprovar no ENEM. Correção, simulados e metodologia de aprovados.</p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Produto</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/redacao">Corrigir Redação</Link></li>
            <li><Link to="/aulas">Vídeo Aulas</Link></li>
            <li><Link to="/planos">Planos</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Conta</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth">Entrar</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Termos de uso</li>
            <li>Privacidade</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Nota900 AI · Todos os direitos reservados
      </div>
    </footer>
  );
}