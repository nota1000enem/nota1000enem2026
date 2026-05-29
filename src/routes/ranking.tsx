import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award, Sparkles, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Top Notas da Semana – Nota 1000 ENEM" },
      { name: "description", content: "Veja o ranking das melhores notas de redação ENEM da semana. Entre para competir e evoluir sua nota." },
    ],
  }),
  component: RankingPage,
});

type Row = { user_id: string; nome: string; melhor_nota: number; total_redacoes: number };

function RankingPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_ranking_global");
      setRows((data as unknown as Row[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const podio = rows.slice(0, 3);
  const resto = rows.slice(3, 100);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-5xl px-4 py-12">
        <Badge variant="outline" className="border-primary/40 text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> Atualizado em tempo real
        </Badge>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">
          Top Notas da <span className="gradient-text">Semana</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Os alunos com as maiores notas dos últimos 7 dias. Treine como quem tira nota alta.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/redacao"><Button className="glow-blue"><Trophy className="mr-1 h-4 w-4" /> Entrar no Ranking</Button></Link>
          <Link to="/dashboard"><Button variant="outline">Ver meu progresso</Button></Link>
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-muted-foreground">Carregando ranking...</p>
        ) : rows.length === 0 ? (
          <Card className="card-glass mt-10 p-10 text-center">
            <Trophy className="mx-auto h-12 w-12 text-primary/50" />
            <p className="mt-4 text-muted-foreground">Ainda não há notas registradas esta semana.</p>
            <p className="text-sm text-muted-foreground">Seja o primeiro a entrar no topo!</p>
            <Link to="/redacao" className="mt-4 inline-block"><Button className="glow-blue">Corrigir agora</Button></Link>
          </Card>
        ) : (
          <>
            {/* PÓDIO */}
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {podio.map((r, i) => {
                const cores = [
                  { ring: "ring-yellow-400/60", icon: Trophy, color: "text-yellow-400", label: "1º Lugar", glow: "glow-blue" },
                  { ring: "ring-slate-300/60", icon: Medal, color: "text-slate-300", label: "2º Lugar", glow: "" },
                  { ring: "ring-orange-400/60", icon: Award, color: "text-orange-400", label: "3º Lugar", glow: "" },
                ][i];
                const Icon = cores.icon;
                return (
                  <Card key={r.user_id} className={`card-glass p-6 text-center ring-2 ${cores.ring} ${cores.glow}`}>
                    <Icon className={`mx-auto h-10 w-10 ${cores.color}`} />
                    <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{cores.label}</p>
                    <p className="mt-3 text-lg font-semibold truncate">{r.nome}</p>
                    <p className="mt-2 text-4xl font-bold gradient-text text-glow">{r.melhor_nota}</p>
                    <p className="text-xs text-muted-foreground">/1000</p>
                  </Card>
                );
              })}
            </div>

            {/* RESTANTE */}
            {resto.length > 0 && (
              <div className="mt-8 space-y-2">
                {resto.map((r, i) => (
                  <Card key={r.user_id} className="card-glass flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="grid h-10 w-10 place-content-center rounded-full border border-primary/30 bg-primary/5 font-bold text-primary">
                        {i + 4}º
                      </div>
                      <div>
                        <p className="font-medium">{r.nome}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> {r.total_redacoes} redação(ões)
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold gradient-text">{r.melhor_nota}</p>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </section>
      <Footer />
    </div>
  );
}