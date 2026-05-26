import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, TrendingUp, Trophy, Sparkles, Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard – Nota900 AI" },
      { name: "description", content: "Acompanhe seu progresso e suas redações corrigidas." },
    ],
  }),
  component: Dashboard,
});

type Redacao = {
  id: string;
  tema: string | null;
  nota_total: number | null;
  created_at: string;
};

function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [redacoes, setRedacoes] = useState<Redacao[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("redacoes")
        .select("id, tema, nota_total, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      setRedacoes((data as Redacao[]) ?? []);
      setFetching(false);
    })();
  }, [user]);

  const media = redacoes.length
    ? Math.round(redacoes.reduce((a, r) => a + (r.nota_total ?? 0), 0) / redacoes.length)
    : 0;
  const melhor = redacoes.reduce((m, r) => Math.max(m, r.nota_total ?? 0), 0);

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
              Olá, <span className="gradient-text">{user?.email?.split("@")[0] ?? "estudante"}</span>
            </h1>
            <p className="mt-1 text-muted-foreground">Aqui está o seu progresso recente.</p>
          </div>
          <Link to="/redacao">
            <Button className="glow-blue"><Plus className="mr-1 h-4 w-4" /> Nova redação</Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
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

        <div className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Histórico de redações</h2>
          {fetching ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : redacoes.length === 0 ? (
            <Card className="card-glass p-10 text-center">
              <p className="text-muted-foreground">Você ainda não corrigiu nenhuma redação.</p>
              <Link to="/redacao" className="mt-4 inline-block">
                <Button className="glow-blue">Corrigir minha primeira redação</Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-3">
              {redacoes.map((r) => (
                <Card key={r.id} className="card-glass flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{r.tema ?? "Sem tema"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </p>
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
      </section>
      <Footer />
    </div>
  );
}