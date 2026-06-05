import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertTriangle, BookOpen, Play, Lock, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePlanAccess } from "@/hooks/use-plan-access";

export const Route = createFileRoute("/questoes")({
  head: () => ({
    meta: [
      { title: "1.000 Questões ENEM com Simulados Cronometrados | Nota 1000 ENEM" },
      { name: "description", content: "Simulados ENEM com mais de 1.000 questões nas 4 áreas: Linguagens, Humanas, Natureza e Matemática. Correção na escala 0-1000." },
      { property: "og:title", content: "Simulados ENEM – 1.000 questões com gabarito" },
      { property: "og:description", content: "Simulados ENEM cronometrados com correção na escala 0-1000." },
      { property: "og:url", content: "https://nota1000enem.online/questoes" },
    ],
    links: [{ rel: "canonical", href: "https://nota1000enem.online/questoes" }],
  }),
  component: QuestoesPage,
});

type Sim = {
  id: string;
  nome: string;
  descricao: string | null;
  total_questoes: number;
  ordem: number;
};

function QuestoesPage() {
  const navigate = useNavigate();
  const [sims, setSims] = useState<Sim[]>([]);
  const { isPaid: planoPago, loading: planLoading } = usePlanAccess();
  const carregado = !planLoading;

  useEffect(() => {
    (async () => {
      const { data: simData } = await supabase
        .from("simulados")
        .select("*")
        .eq("ativo", true)
        .order("ordem");
      setSims((simData as Sim[]) ?? []);
    })();
  }, []);

  function handleProva(id: string) {
    if (!planoPago) {
      navigate({ to: "/planos" });
      return;
    }
    navigate({ to: "/simulado/$id", params: { id } });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-5xl px-4 py-12">
        <Badge variant="outline" className="border-primary/40 text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> Simulado completo
        </Badge>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">
          1.000 Questões <span className="gradient-text">ENEM</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Provas mistas cobrindo Linguagens, Humanas, Natureza e Matemática. Nota calculada na
          escala ENEM (0–1000).
        </p>


        {carregado && !planoPago && (
          <Card className="card-glass mt-4 p-5 border-primary/40 bg-primary/5">
            <div className="flex items-start gap-3">
              <Crown className="mt-0.5 h-5 w-5 text-primary" />
              <div className="text-sm flex-1">
                <p className="font-semibold">Simulados são exclusivos para alunos com plano pago</p>
                <p className="mt-1 text-muted-foreground">
                  Assine qualquer plano (Light, Pro, Full ou Vitalício) para liberar todas as
                  provas.
                </p>
              </div>
              <Link to="/planos">
                <Button size="sm" className="glow-blue">
                  Ver planos
                </Button>
              </Link>
            </div>
          </Card>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {sims.map((s) => (
            <Card
              key={s.id}
              className={`card-glass p-6 relative ${!planoPago ? "overflow-hidden" : ""}`}
            >
              {!planoPago && (
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    <Lock className="mr-1 h-3 w-3" /> Premium
                  </Badge>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="h-3 w-3" /> {s.total_questoes} questões mistas
              </div>
              <h2 className="mt-2 text-xl font-bold text-primary">{s.nome}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{s.descricao}</p>
              <Button
                onClick={() => handleProva(s.id)}
                className={`mt-4 w-full ${planoPago ? "glow-blue" : ""}`}
                variant={planoPago ? "default" : "outline"}
              >
                {planoPago ? (
                  <>
                    <Play className="mr-1 h-4 w-4" /> Iniciar prova
                  </>
                ) : (
                  <>
                    <Lock className="mr-1 h-4 w-4" /> Desbloquear aulas premium
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
