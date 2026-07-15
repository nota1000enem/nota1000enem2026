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
import { UpgradeDialog } from "@/components/upgrade-dialog";
import { CupomResgate } from "@/components/cupom-resgate";



export const Route = createFileRoute("/questoes")({
  head: () => ({
    meta: [
      { title: "1.000 Questões ENEM e Simulados | Nota 1000 ENEM" },
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
  const { isPaid: planoPago, loading: planLoading, tier, loggedIn } = usePlanAccess();
  const carregado = !planLoading;
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [provaSelecionada, setProvaSelecionada] = useState<string | undefined>();
  const [cupomSimAtivo, setCupomSimAtivo] = useState(false);

  async function loadCupom() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCupomSimAtivo(false); return; }
    const { data } = await supabase
      .from("beneficios_cupom")
      .select("simulado_expira_em")
      .eq("user_id", user.id)
      .maybeSingle();
    const exp = data?.simulado_expira_em ? new Date(data.simulado_expira_em) : null;
    setCupomSimAtivo(!!exp && exp.getTime() > Date.now());
  }

  useEffect(() => {
    (async () => {
      const { data: simData } = await supabase
        .from("simulados")
        .select("*")
        .eq("ativo", true)
        .order("ordem");
      setSims((simData as Sim[]) ?? []);
    })();
    loadCupom();
  }, []);

  const acessoLiberado = planoPago || cupomSimAtivo;

  const isFreeSim = (id: string) => {
    const idx = sims.findIndex((s) => s.id === id);
    return idx >= 0 && idx < 4;
  };

  function handleProva(id: string) {
    const free = isFreeSim(id);
    if (acessoLiberado || (loggedIn && free)) {
      navigate({ to: "/simulado/$id", params: { id } });
      return;
    }
    if (free && !loggedIn) {
      navigate({ to: "/auth" });
      return;
    }
    const sim = sims.find((s) => s.id === id);
    setProvaSelecionada(sim ? `O simulado "${sim.nome}"` : undefined);
    setShowUpgrade(true);
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


        {carregado && !planoPago && !cupomSimAtivo && (
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

        {carregado && cupomSimAtivo && !planoPago && (
          <Card className="card-glass mt-4 p-4 border-emerald-500/40 bg-emerald-500/5">
            <p className="text-sm text-emerald-300 font-semibold">
              🎁 Acesso liberado por cupom — simulados desbloqueados por 30 dias.
            </p>
          </Card>
        )}

        {loggedIn && !planoPago && (
          <CupomResgate tipo="simulado" onResgatado={loadCupom} />
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {sims.map((s, idx) => {
            const free = idx < 4;
            const liberado = acessoLiberado || (loggedIn && free);
            return (
              <Card key={s.id} className="card-glass p-6 relative">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BookOpen className="h-3 w-3" /> {s.total_questoes} questões mistas
                  </div>
                  {!free && !acessoLiberado && (
                    <Badge variant="outline" className="shrink-0 border-primary/40 text-primary">
                      <Lock className="mr-1 h-3 w-3" /> Premium
                    </Badge>
                  )}
                </div>
                <h2 className="mt-2 text-xl font-bold text-primary">{s.nome}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{s.descricao}</p>
                <Button
                  onClick={() => handleProva(s.id)}
                  className={`mt-4 w-full ${liberado ? "glow-blue" : ""}`}
                  variant={liberado ? "default" : "outline"}
                >
                  {liberado ? (
                    <><Play className="mr-1 h-4 w-4" /> Iniciar prova</>
                  ) : free && !loggedIn ? (
                    <><Lock className="mr-1 h-4 w-4" /> Entrar para acessar</>
                  ) : (
                    <><Lock className="mr-1 h-4 w-4" /> Desbloquear simulados</>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      </section>
      <UpgradeDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        currentTier={tier}
        featureName={provaSelecionada}
      />
      <Footer />
    </div>
  );
}


