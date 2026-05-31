import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain,
  Calendar,
  Loader2,
  Sparkles,
  Lock,
  Crown,
  History,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { toast } from "sonner";


export const Route = createFileRoute("/plano-estudo")({
  head: () => ({
    meta: [
      { title: "Plano de Estudo Semanal com IA – Nota 1000 ENEM" },
      {
        name: "description",
        content:
          "Gere um plano de estudo SEMANAL personalizado para o ENEM com sequência pedagógica real, blocos curtos e foco nas suas fraquezas.",
      },
    ],
  }),
  component: PlanoEstudoPage,
});

type PlanoIA = {
  resumo: string;
  dicas_gerais: string[];
  cronograma: Array<{
    dia: string;
    blocos: Array<{ horario: string; materia: string; topico: string; tipo: string }>;
  }>;
};

type PlanoSalvo = {
  id: string;
  horas_dia: number;
  dias_semana: number;
  meta: string | null;
  pontos_fracos: string | null;
  cronograma: PlanoIA;
  created_at: string;
};

function PlanoEstudoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [horasDia, setHorasDia] = useState("3");
  const [diasSemana, setDiasSemana] = useState("5");
  const [horaInicio, setHoraInicio] = useState("19");
  const [fraquezas, setFraquezas] = useState("");
  const [meta, setMeta] = useState("Aprovação em medicina");
  const [diasAteProva, setDiasAteProva] = useState("180");
  const [carregando, setCarregando] = useState(false);
  const [plano, setPlano] = useState<PlanoIA | null>(null);
  const [planoAbertoId, setPlanoAbertoId] = useState<string | null>(null);
  const { isPaid: liberado, loading: carregandoPlano } = usePlanAccess();
  const [historico, setHistorico] = useState<PlanoSalvo[]>([]);

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: planos } = await supabase
        .from("planos_estudo")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      const lista = (planos as unknown as PlanoSalvo[] | null) ?? [];
      setHistorico(lista);
      // Não auto-abre plano antigo — usuário precisa clicar em "Ver plano" ou gerar novo
    })();
  }, [user]);

  function validar(): string | null {
    const h = Number(horasDia);
    const d = Number(diasSemana);
    const hi = Number(horaInicio);
    if (!h || h < 2) return "Mínimo de 2h por dia.";
    if (h > 8) return "Máximo de 8h por dia (evite burnout).";
    if (!d || d < 5) return "Mínimo de 5 dias por semana.";
    if (d > 6) return "Máximo de 6 dias por semana (1 dia de descanso é essencial).";
    if (!Number.isFinite(hi) || hi < 5 || hi > 22) return "Horário de início inválido (use 5 a 22h).";
    if (hi + h > 24) return "Carga ultrapassa a meia-noite. Reduza horas ou comece mais cedo.";
    return null;
  }

  // Aviso inline mostrado abaixo dos inputs (sempre visível enquanto inválido)
  const avisoMinimos = validar();

  async function apagarPlano(id: string) {
    if (!confirm("Apagar este plano? Essa ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("planos_estudo").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível apagar o plano.");
      return;
    }
    setHistorico((h) => h.filter((p) => p.id !== id));
    if (planoAbertoId === id) {
      setPlano(null);
      setPlanoAbertoId(null);
    }
    toast.success("Plano apagado.");
  }

  async function gerar() {
    if (carregandoPlano) {
      toast.error("Ainda estamos verificando sua assinatura. Tente novamente em alguns segundos.");
      return;
    }
    if (!liberado) {
      toast.error(
        "Plano de Estudo com IA está disponível apenas nas assinaturas pagas e no Vitalício.",
      );
      return;
    }
    const erro = validar();
    if (erro) {
      toast.error(erro);
      return;
    }

    setCarregando(true);
    setPlano(null);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-plano-estudo", {
        body: {
          horasDia: Number(horasDia),
          diasSemana: Number(diasSemana),
          fraquezas,
          meta,
          diasAteProva: Number(diasAteProva),
        },
      });
      if (error) throw error;
      const r = data as PlanoIA & { error?: string };
      if (r.error) throw new Error(r.error);
      const planoGerado = {
        resumo: r.resumo,
        dicas_gerais: r.dicas_gerais,
        cronograma: r.cronograma,
      };
      setPlano(planoGerado);
      const salvo = (data as PlanoIA & { plano_salvo?: PlanoSalvo | null }).plano_salvo;
      setPlanoAbertoId(salvo?.id ?? "novo");
      if (salvo) setHistorico([salvo, ...historico.filter((h) => h.id !== salvo.id)].slice(0, 5));
      toast.success("Plano semanal gerado e salvo!");
      setTimeout(
        () =>
          document
            .getElementById("plano-gerado")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        100,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar plano");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-5xl px-4 py-12">
        <Badge variant="outline" className="border-primary/40 text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> IA personalizada • Plano SEMANAL
        </Badge>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">
          Plano de Estudo <span className="gradient-text">com IA</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Gere um plano <b>novo a cada semana</b> de acordo com a sua evolução, sua agenda e seus
          pontos fracos do momento. A IA monta uma sequência pedagógica real (teoria → exercício →
          revisão), em blocos curtos de 15-30 min, cobrindo as 4 áreas do ENEM + redação.
        </p>
        

        <div className="mt-3 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            <b>Dica:</b> gere um novo plano todo <b>domingo</b> revisando o que aprendeu na semana
            anterior. Seus planos antigos ficam salvos no histórico abaixo e também no seu
            Dashboard.
          </p>
        </div>

        {!liberado && !carregandoPlano && !loading && user && (
          <Card className="card-glass mt-8 border-primary/40 p-8 text-center">
            <Lock className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-2xl font-bold">
              Disponível apenas para <span className="gradient-text">planos pagos</span>
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              O Plano de Estudo com IA é exclusivo para assinantes <b>Light, Pro, Full</b> e{" "}
              <b>Vitalício</b>.
            </p>
            <Link to="/planos" className="mt-6 inline-block">
              <Button size="lg" className="glow-blue">
                <Crown className="mr-2 h-4 w-4" /> Ver planos e desbloquear
              </Button>
            </Link>
          </Card>
        )}

        {liberado && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card id="plano-gerado" className="card-glass scroll-mt-24 p-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>
                    Horas/dia <span className="text-xs text-muted-foreground">(mín 2h)</span>
                  </Label>
                  <Input
                    type="number"
                    min={2}
                    max={8}
                    value={horasDia}
                    onChange={(e) => setHorasDia(e.target.value)}
                  />
                </div>
                <div>
                  <Label>
                    Dias/semana <span className="text-xs text-muted-foreground">(mín 5, máx 6)</span>
                  </Label>
                  <Input
                    type="number"
                    min={5}
                    max={6}
                    value={diasSemana}
                    onChange={(e) => setDiasSemana(e.target.value)}
                  />
                </div>
              </div>
              {avisoMinimos && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <b>Ajuste os valores:</b> {avisoMinimos} O cronograma só pode ser gerado dentro
                    desses limites pedagógicos.
                  </span>
                </div>
              )}
              <div className="mt-4">
                <Label>Dias até a prova</Label>
                <Input
                  type="number"
                  min={1}
                  max={730}
                  value={diasAteProva}
                  onChange={(e) => setDiasAteProva(e.target.value)}
                />
              </div>
              <div className="mt-4">
                <Label>Meta de aprovação</Label>
                <Input
                  value={meta}
                  onChange={(e) => setMeta(e.target.value)}
                  placeholder="Ex: medicina, engenharia, direito..."
                />
              </div>
              <div className="mt-4">
                <Label>Pontos fracos (peso dobrado)</Label>
                <Textarea
                  value={fraquezas}
                  onChange={(e) => setFraquezas(e.target.value)}
                  placeholder="Ex: matemática (funções), redação (proposta), física..."
                  className="min-h-[100px]"
                />
              </div>
              <Button
                onClick={gerar}
                disabled={carregando}
                size="lg"
                className="mt-4 w-full glow-blue"
              >
                {carregando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" /> Gerar plano da semana
                  </>
                )}
              </Button>
            </Card>

            <Card className="card-glass p-6">
              {!plano && !carregando && (
                <div className="grid h-full place-content-center text-center text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 opacity-30" />
                  <p className="mt-3 text-sm">Seu plano semanal aparecerá aqui.</p>
                </div>
              )}
              {carregando && (
                <div className="grid h-full place-content-center text-center">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    A IA está montando seu cronograma...
                  </p>
                </div>
              )}
              {plano && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold">Plano semanal salvo</h3>
                    {planoAbertoId && (
                      <Badge variant="outline" className="border-primary/40 text-primary">
                        Aberto agora
                      </Badge>
                    )}
                  </div>
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                    {plano.resumo}
                  </div>
                  {plano.dicas_gerais?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold">Dicas estratégicas</h4>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                        {plano.dicas_gerais.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="space-y-3">
                    {plano.cronograma?.map((dia, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border/60 bg-background/60 p-3"
                      >
                        <h4 className="text-sm font-bold text-primary">{dia.dia}</h4>
                        <div className="mt-2 space-y-1.5">
                          {dia.blocos.map((b, j) => (
                            <div key={j} className="flex items-start gap-2 text-xs">
                              <span className="min-w-[100px] font-mono text-muted-foreground">
                                {b.horario}
                              </span>
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase text-primary">
                                {b.tipo}
                              </span>
                              <span className="flex-1">
                                <b>{b.materia}</b> — {b.topico}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {liberado && historico.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
              <History className="h-4 w-4 text-primary" /> Seus últimos planos salvos
            </h2>
            <div className="grid gap-2">
              {historico.map((p) => (
                <Card
                  key={p.id}
                  className="card-glass flex flex-wrap items-center justify-between gap-2 p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {p.dias_semana} dias × {p.horas_dia}h — meta: {p.meta || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPlano(p.cronograma);
                        setPlanoAbertoId(p.id);
                        setTimeout(
                          () =>
                            document
                              .getElementById("plano-gerado")
                              ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                          50,
                        );
                      }}
                    >
                      Ver plano
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => apagarPlano(p.id)}
                      aria-label="Apagar plano"
                    >
                      Apagar
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
