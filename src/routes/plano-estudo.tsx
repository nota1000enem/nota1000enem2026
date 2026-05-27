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
  const [carregando, setCarregando] = useState(false);
  const [plano, setPlano] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  async function gerar() {
    setCarregando(true); setPlano("");
    try {
      const prompt = `Você é um mentor especialista em ENEM. Monte um plano de estudo SEMANAL altamente detalhado para um aluno com:
- Horas disponíveis por dia: ${horasDia}h
- Dias disponíveis por semana: ${diasSemana}
- Pontos fracos: ${fraquezas || "não informados"}
- Meta: ${meta}

Retorne em markdown organizado por DIA da semana, com BLOCOS de 50min + 10min pausa (técnica Pomodoro), distribuindo: Matemática, Linguagens, Ciências Humanas, Ciências da Natureza, Redação e revisão. Inclua 1 redação semanal e 1 simulado quinzenal. Seja prático e específico.`;
      const { data, error } = await supabase.functions.invoke("corrigir-redacao", {
        body: { texto: prompt, tema: "Plano de estudo personalizado", modoRigido: false, modo: "plano-estudo" },
      });
      if (error) throw error;
      // O endpoint retorna no formato de redação; usamos o comentario_geral como plano.
      const r = data as { comentario_geral?: string; error?: string };
      if (r.error) throw new Error(r.error);
      setPlano(r.comentario_geral || "A IA não conseguiu gerar o plano. Tente novamente.");
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
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{plano}</div>
            )}
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
}