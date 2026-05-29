import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Calendar, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/plano-estudo")({
  head: () => ({
    meta: [
      { title: "Plano de Estudo com IA – Nota 1000 ENEM" },
      { name: "description", content: "A IA monta um plano de estudo personalizado para o ENEM com base nas suas horas disponíveis e nos seus pontos fracos." },
    ],
  }),
  component: PlanoEstudoPage,
});

function PlanoEstudoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [horasDia, setHorasDia] = useState("3");
  const [diasSemana, setDiasSemana] = useState("6");
  const [fraquezas, setFraquezas] = useState("");
  const [meta, setMeta] = useState("Aprovação em medicina");
  const [diasAteProva, setDiasAteProva] = useState("180");
  const [carregando, setCarregando] = useState(false);
  const [plano, setPlano] = useState<PlanoIA | null>(null);

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  async function gerar() {
    setCarregando(true); setPlano(null);
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
      setPlano(r);
      if (user) {
        await supabase.from("planos_estudo").insert({
          user_id: user.id,
          horas_dia: Number(horasDia),
          dias_semana: Number(diasSemana),
          pontos_fracos: fraquezas,
          meta,
          cronograma: r as unknown as Record<string, unknown>,
        });
      }
      toast.success("Plano de estudo gerado!");
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
          <Sparkles className="mr-1 h-3 w-3" /> IA personalizada para você
        </Badge>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">
          Plano de Estudo <span className="gradient-text">com IA</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Diga quantas horas você tem disponíveis e a IA monta um cronograma detalhado, focado nas suas fraquezas e na sua meta de aprovação.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="card-glass p-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Horas/dia</Label>
                <Input type="number" min={1} max={16} value={horasDia} onChange={e => setHorasDia(e.target.value)} />
              </div>
              <div>
                <Label>Dias/semana</Label>
                <Input type="number" min={1} max={7} value={diasSemana} onChange={e => setDiasSemana(e.target.value)} />
              </div>
            </div>
            <div className="mt-4">
              <Label>Dias até a prova</Label>
              <Input type="number" min={1} max={730} value={diasAteProva} onChange={e => setDiasAteProva(e.target.value)} />
            </div>
            <div className="mt-4">
              <Label>Meta de aprovação</Label>
              <Input value={meta} onChange={e => setMeta(e.target.value)} placeholder="Ex: medicina, engenharia, direito..." />
            </div>
            <div className="mt-4">
              <Label>Seus pontos fracos</Label>
              <Textarea value={fraquezas} onChange={e => setFraquezas(e.target.value)} placeholder="Ex: matemática, redação, física..." className="min-h-[100px]" />
            </div>
            <Button onClick={gerar} disabled={carregando} size="lg" className="mt-4 w-full glow-blue">
              {carregando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando seu plano...</> : <><Brain className="mr-2 h-4 w-4" /> Gerar meu plano</>}
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
                <p className="mt-3 text-sm text-muted-foreground">A IA está montando seu cronograma...</p>
              </div>
            )}
            {plano && (
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">{plano.resumo}</div>
                {plano.dicas_gerais?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold">Dicas estratégicas</h4>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                      {plano.dicas_gerais.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                )}
                <div className="space-y-3">
                  {plano.cronograma?.map((dia, i) => (
                    <div key={i} className="rounded-lg border border-border/60 bg-background/60 p-3">
                      <h4 className="text-sm font-bold text-primary">{dia.dia}</h4>
                      <div className="mt-2 space-y-1.5">
                        {dia.blocos.map((b, j) => (
                          <div key={j} className="flex items-start gap-2 text-xs">
                            <span className="min-w-[90px] font-mono text-muted-foreground">{b.horario}</span>
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase text-primary">{b.tipo}</span>
                            <span className="flex-1"><b>{b.materia}</b> — {b.topico}</span>
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
      </section>
      <Footer />
    </div>
  );
}

type PlanoIA = {
  resumo: string;
  dicas_gerais: string[];
  cronograma: Array<{
    dia: string;
    blocos: Array<{ horario: string; materia: string; topico: string; tipo: string }>;
  }>;
};