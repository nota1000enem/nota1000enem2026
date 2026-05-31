import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, TrendingUp, Trophy, Sparkles, Plus, GraduationCap, Play, Brain } from "lucide-react";
import { WeeklyRetentionSummary } from "@/components/weekly-retention-summary";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard – Nota 1000 ENEM" },
      { name: "description", content: "Acompanhe seu progresso e suas redações corrigidas." },
    ],
  }),
  component: Dashboard,
});

type Redacao = { id: string; tema: string | null; nota_total: number | null; created_at: string };
type Tentativa = { id: string; simulado_nome: string; nota_total: number; acertos: number; total: number; finished_at: string };
type PlanoResumo = { id: string; horas_dia: number; dias_semana: number; meta: string | null; created_at: string };

function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redacoes, setRedacoes] = useState<Redacao[]>([]);
  const [tentativas, setTentativas] = useState<Tentativa[]>([]);
  const [ultimoPlano, setUltimoPlano] = useState<PlanoResumo | null>(null);
  const [nome, setNome] = useState<string>("estudante");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: redData }, { data: tentData }, { data: prof }, { data: planoData }] = await Promise.all([
        supabase.from("redacoes").select("id, tema, nota_total, created_at").order("created_at", { ascending: false }).limit(20),
        supabase.rpc("get_minhas_tentativas", { _user_id: user.id }),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("planos_estudo").select("id, horas_dia, dias_semana, meta, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setRedacoes((redData as Redacao[]) ?? []);
      setTentativas((tentData as Tentativa[]) ?? []);
      setUltimoPlano((planoData as PlanoResumo | null) ?? null);
      const fn = (prof?.full_name as string | null)?.trim();
      setNome(fn && fn.length ? fn.split(" ")[0] : "estudante");
      setFetching(false);
    })();
  }, [user]);

  const media = redacoes.length ? Math.round(redacoes.reduce((a, r) => a + (r.nota_total ?? 0), 0) / redacoes.length) : 0;
  const melhor = redacoes.reduce((m, r) => Math.max(m, r.nota_total ?? 0), 0);

  const mediaSim = tentativas.length ? Math.round(tentativas.reduce((a, t) => a + Number(t.nota_total ?? 0), 0) / tentativas.length) : 0;
  const melhorSim = tentativas.reduce((m, t) => Math.max(m, Number(t.nota_total ?? 0)), 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="outline" className="border-primary/40 text-primary">
              <Sparkles className="mr-1 h-3 w-3" /> Sua jornada rumo ao 900+
            </Badge>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">
              Olá, <span className="gradient-text">{nome}</span>
            </h1>
            <p className="mt-1 text-muted-foreground">Aqui está o seu progresso recente.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/redacao"><Button className="glow-blue"><Plus className="mr-1 h-4 w-4" /> Nova redação</Button></Link>
            <Link to="/questoes"><Button variant="outline"><Play className="mr-1 h-4 w-4" /> Fazer simulado</Button></Link>
          </div>
        </div>

        <WeeklyRetentionSummary userId={user?.id} />

        {/* Redação */}
        <h2 className="mt-10 mb-3 text-sm uppercase tracking-wider text-muted-foreground">Redação</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-glass p-6">
            <FileText className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Redações corrigidas</p>
            <p className="mt-1 text-3xl font-bold">{redacoes.length}</p>
          </Card>
          <Card className="card-glass p-6">
            <TrendingUp className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Nota média</p>
            <p className="mt-1 text-3xl font-bold gradient-text">{media}</p>
          </Card>
          <Card className="card-glass p-6">
            <Trophy className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Melhor nota</p>
            <p className="mt-1 text-3xl font-bold gradient-text">{melhor}</p>
          </Card>
        </div>

        {/* Simulados */}
        <h2 className="mt-10 mb-3 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" /> Simulados
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-glass p-6">
            <p className="text-sm text-muted-foreground">Simulados feitos</p>
            <p className="mt-1 text-3xl font-bold">{tentativas.length}</p>
          </Card>
          <Card className="card-glass p-6">
            <p className="text-sm text-muted-foreground">Nota média</p>
            <p className="mt-1 text-3xl font-bold gradient-text">{mediaSim}</p>
          </Card>
          <Card className="card-glass p-6">
            <p className="text-sm text-muted-foreground">Melhor nota</p>
            <p className="mt-1 text-3xl font-bold gradient-text">{melhorSim}</p>
          </Card>
        </div>

        {/* Plano de estudo atual */}
        <h2 className="mt-10 mb-3 text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" /> Plano de estudo da semana
        </h2>
        {ultimoPlano ? (
          <Card className="card-glass flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-medium">{ultimoPlano.dias_semana} dias × {ultimoPlano.horas_dia}h — {ultimoPlano.meta || "sem meta"}</p>
              <p className="text-xs text-muted-foreground">
                Gerado em {new Date(ultimoPlano.created_at).toLocaleDateString("pt-BR")} · Lembre-se de gerar um novo todo domingo.
              </p>
            </div>
            <Link to="/plano-estudo"><Button variant="outline" size="sm"><Brain className="mr-1 h-4 w-4" /> Abrir plano</Button></Link>
          </Card>
        ) : (
          <Card className="card-glass flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-muted-foreground">Você ainda não gerou nenhum plano de estudo.</p>
            <Link to="/plano-estudo"><Button size="sm" className="glow-blue"><Brain className="mr-1 h-4 w-4" /> Gerar meu plano</Button></Link>
          </Card>
        )}

        {/* Histórico redação */}
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Histórico de redações</h2>
          {fetching ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : redacoes.length === 0 ? (
            <Card className="card-glass p-10 text-center">
              <p className="text-muted-foreground">Você ainda não corrigiu nenhuma redação.</p>
              <Link to="/redacao" className="mt-4 inline-block"><Button className="glow-blue">Corrigir minha primeira redação</Button></Link>
            </Card>
          ) : (
            <div className="grid gap-3">
              {redacoes.map((r) => (
                <Card key={r.id} className="card-glass flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{r.tema ?? "Sem tema"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold gradient-text">{r.nota_total ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">/1000</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Histórico simulados */}
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Histórico de simulados</h2>
          {fetching ? null : tentativas.length === 0 ? (
            <Card className="card-glass p-10 text-center">
              <p className="text-muted-foreground">Você ainda não fez nenhum simulado.</p>
              <Link to="/questoes" className="mt-4 inline-block"><Button className="glow-blue">Começar agora</Button></Link>
            </Card>
          ) : (
            <div className="grid gap-3">
              {tentativas.map((t) => (
                <Card key={t.id} className="card-glass flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{t.simulado_nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.acertos}/{t.total} acertos · {new Date(t.finished_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold gradient-text">{Math.round(Number(t.nota_total))}</p>
                    <p className="text-xs text-muted-foreground">/1000</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
