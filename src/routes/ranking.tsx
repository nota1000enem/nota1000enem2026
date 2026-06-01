import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award, Sparkles, TrendingUp, MapPin, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking ENEM – Top alunos com nota 1000 em Redação" },
      { name: "description", content: "Veja o ranking dos melhores alunos do ENEM em correção de redação por IA. Compita pelo TOP 3 nacional e mostre sua nota." },
    ],
  }),
  component: RankingPage,
});

type Row = {
  user_id: string;
  nome: string;
  melhor_nota: number;
  total_redacoes: number;
  avatar_url: string | null;
  estado: string | null;
  idade: number | null;
};

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
          Os alunos com as maiores notas. <strong>TOP 3 ganha destaque com foto.</strong>
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/redacao"><Button className="glow-blue"><Trophy className="mr-1 h-4 w-4" /> Entrar no Ranking</Button></Link>
          <Link to="/perfil"><Button variant="outline">Adicionar foto/estado/idade</Button></Link>
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-muted-foreground">Carregando ranking...</p>
        ) : rows.length === 0 ? (
          <Card className="card-glass mt-10 p-10 text-center">
            <Trophy className="mx-auto h-12 w-12 text-primary/50" />
            <p className="mt-4 text-muted-foreground">Ainda não há notas registradas.</p>
            <Link to="/redacao" className="mt-4 inline-block"><Button className="glow-blue">Corrigir agora</Button></Link>
          </Card>
        ) : (
          <>
            {/* PÓDIO com fotos */}
            <div className="mt-10 grid gap-3 grid-cols-3">
              {podio.map((r, i) => {
                const cores = [
                  { ring: "ring-yellow-400/60", icon: Trophy, color: "text-yellow-400", label: "1º Lugar", glow: "glow-blue" },
                  { ring: "ring-slate-300/60", icon: Medal, color: "text-slate-300", label: "2º Lugar", glow: "" },
                  { ring: "ring-orange-400/60", icon: Award, color: "text-orange-400", label: "3º Lugar", glow: "" },
                ][i];
                const Icon = cores.icon;
                return (
                  <Card key={r.user_id} className={`card-glass p-3 md:p-6 text-center ring-2 ${cores.ring} ${cores.glow}`}>
                    <div className={`mx-auto h-14 w-14 md:h-24 md:w-24 overflow-hidden rounded-full border-2 md:border-4 border-background ring-2 ${cores.ring} bg-muted`}>
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt={r.nome} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="grid h-full w-full place-content-center">
                          <UserIcon className="h-6 w-6 md:h-10 md:w-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <Icon className={`mx-auto mt-2 h-5 w-5 md:h-7 md:w-7 ${cores.color}`} />
                    <p className="mt-1 text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground">{cores.label}</p>
                    <p className="mt-1 text-sm md:text-lg font-semibold truncate">{r.nome}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                      {[r.idade ? `${r.idade} anos` : null, r.estado].filter(Boolean).join(" · ") || "—"}
                    </p>
                    <p className="mt-2 text-2xl md:text-4xl font-bold gradient-text text-glow">{r.melhor_nota}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">/1000</p>
                  </Card>
                );
              })}
            </div>

            {/* RESTANTE — sem foto, com estado/idade */}
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
                        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                          {r.idade && <span>{r.idade} anos</span>}
                          {r.estado && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.estado}</span>}
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {r.total_redacoes} redação(ões)</span>
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
