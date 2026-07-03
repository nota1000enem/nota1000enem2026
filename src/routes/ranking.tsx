import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Sparkles, TrendingUp, MapPin, User as UserIcon, Lock } from "lucide-react";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking ENEM – Top alunos com nota 1000 em Redação" },
      { name: "description", content: "Veja o ranking dos melhores alunos do ENEM em correção de redação por IA. Compita pelo TOP 3 nacional e mostre sua nota." },
      { property: "og:title", content: "Ranking ENEM – Top alunos Nota 1000" },
      { property: "og:description", content: "Compita pelo TOP 3 nacional na correção de redação por IA." },
      { property: "og:url", content: "https://nota1000enem.online/ranking" },
    ],
    links: [{ rel: "canonical", href: "https://nota1000enem.online/ranking" }],
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
  const [isLogged, setIsLogged] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: rk }, { data: auth }] = await Promise.all([
        supabase.rpc("get_ranking_global"),
        supabase.auth.getUser(),
      ]);
      setRows((rk as unknown as Row[]) ?? []);
      setIsLogged(!!auth.user);
      setMyUserId(auth.user?.id ?? null);
      setLoading(false);
    })();
  }, []);

  const podio = rows.slice(0, 3);
  const resto = isLogged ? rows.slice(3, 100) : [];


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
          <Link to="/redacao"><Button className="btn-gradient-primary"><Trophy className="mr-1 h-4 w-4" /> Entrar no Ranking</Button></Link>
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
                  { ring: "ring-yellow-400/70", color: "text-yellow-400", label: "1º Lugar", shadow: "shadow-[0_0_30px_-5px_rgba(250,204,21,0.5)]" },
                  { ring: "ring-slate-300/70", color: "text-slate-300", label: "2º Lugar", shadow: "shadow-[0_0_30px_-5px_rgba(203,213,225,0.45)]" },
                  { ring: "ring-orange-400/70", color: "text-orange-400", label: "3º Lugar", shadow: "shadow-[0_0_30px_-5px_rgba(251,146,60,0.45)]" },
                ][i];
                return (
                  <Card key={r.user_id} className={`card-glass card-gradient-border podio-active glow-blue p-3 md:p-6 text-center ${cores.shadow}`}>
                    <div className="relative mx-auto h-14 w-14 md:h-24 md:w-24">
                      <div className="absolute inset-0 rounded-full p-[2px] btn-gradient-primary">
                        <div className="h-full w-full overflow-hidden rounded-full bg-muted">
                          {r.avatar_url ? (
                            <img src={r.avatar_url} alt={r.nome} className="h-full w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="grid h-full w-full place-content-center">
                              <UserIcon className="h-6 w-6 md:h-10 md:w-10 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Trophy className={`mx-auto mt-2 h-5 w-5 md:h-7 md:w-7 ${cores.color}`} />
                    <p className={`mt-1 text-[10px] md:text-xs uppercase tracking-wider font-semibold ${cores.color}`}>{cores.label}</p>
                    <p className={`mt-1 text-sm md:text-lg font-semibold truncate font-display ${cores.color}`}>{r.nome}</p>
                    <p className={`text-[10px] md:text-xs truncate ${cores.color} opacity-80`}>
                      {[r.idade ? `${r.idade} anos` : null, r.estado].filter(Boolean).join(" · ") || "—"}
                    </p>
                    <p className="mt-2 text-2xl md:text-4xl font-bold gradient-text text-glow font-display">{r.melhor_nota}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">/1000</p>
                  </Card>
                );

              })}
            </div>

            {/* RESTANTE — sem foto, com estado/idade */}
            {resto.length > 0 && (
              <div className="mt-6 md:mt-8 space-y-1.5 md:space-y-2">
                {resto.map((r, i) => (
                  <Card key={r.user_id} className="card-glass flex items-center justify-between p-2.5 md:p-4">
                    <div className="flex items-center gap-2 md:gap-4 min-w-0">
                      <div className="grid h-8 w-8 md:h-10 md:w-10 shrink-0 place-content-center rounded-full border border-primary/30 bg-primary/5 text-xs md:text-base font-bold text-primary">
                        {i + 4}º
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm md:text-base font-medium truncate">{r.nome}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          {r.idade && <span>{r.idade} anos</span>}
                          {r.estado && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.estado}</span>}
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {r.total_redacoes} red.</span>
                        </p>
                      </div>
                    </div>
                    <p className="text-lg md:text-2xl font-bold gradient-text shrink-0">{r.melhor_nota}</p>
                  </Card>
                ))}
              </div>
            )}

            {!isLogged && rows.length > 3 && (
              <Card className="card-glass mt-8 p-8 text-center border-primary/40 bg-primary/5">
                <Lock className="mx-auto h-10 w-10 text-primary" />
                <h2 className="mt-3 text-xl font-semibold">Ranking completo é exclusivo para alunos logados</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Faça login para ver os {rows.length - 3} demais colocados e disputar seu lugar no TOP 3.
                </p>
                <Link to="/auth" className="mt-4 inline-block">
                  <Button className="glow-blue">Entrar / Criar conta</Button>
                </Link>
              </Card>
            )}
          </>

        )}
      </section>
      <Footer />
    </div>
  );
}
