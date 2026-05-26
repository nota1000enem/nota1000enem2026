import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Brain, Flame, Loader2 } from "lucide-react";
import { Lock, Crown } from "lucide-react";

export const Route = createFileRoute("/redacao")({
  head: () => ({
    meta: [
      { title: "Corrigir Redação com IA – Nota 1000 ENEM" },
      { name: "description", content: "Cole sua redação do ENEM e receba correção completa pelas 5 competências em segundos." },
    ],
  }),
  component: RedacaoPage,
});

type Resultado = {
  competencia_1: number;
  competencia_2: number;
  competencia_3: number;
  competencia_4: number;
  competencia_5: number;
  nota_total: number;
  comentario_geral: string;
  erros_gramaticais: string[];
  sugestoes: string[];
  melhorias: string[];
  repertorios: string[];
};

function RedacaoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tema, setTema] = useState("");
  const [texto, setTexto] = useState("");
  const [modoRigido, setModoRigido] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [plano, setPlano] = useState<string>("free");
  const [usadas, setUsadas] = useState<number>(0);
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { count }] = await Promise.all([
        supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
        supabase.from("redacoes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      const p = (prof?.plan as string) ?? "free";
      setPlano(p);
      setUsadas(count ?? 0);
      if (p === "free" && (count ?? 0) >= 1) setBloqueado(true);
    })();
  }, [user]);

  async function handleSubmit() {
    if (bloqueado) {
      toast.error("Você já usou sua correção gratuita.");
      return;
    }
    if (texto.trim().length < 50) {
      toast.error("Cole uma redação completa (mínimo 50 caracteres).");
      return;
    }
    setSubmitting(true);
    setResultado(null);
    try {
      const { data, error } = await supabase.functions.invoke("corrigir-redacao", {
        body: { texto, tema, modoRigido },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      const r = data as Resultado;
      setResultado(r);
      await supabase.from("redacoes").insert({
        user_id: user!.id,
        tema: tema || null,
        texto,
        nota_total: r.nota_total,
        competencia_1: r.competencia_1,
        competencia_2: r.competencia_2,
        competencia_3: r.competencia_3,
        competencia_4: r.competencia_4,
        competencia_5: r.competencia_5,
        feedback: r,
        modo_rigido: modoRigido,
      });
      const novoTotal = usadas + 1;
      setUsadas(novoTotal);
      if (plano === "free" && novoTotal >= 1) setBloqueado(true);
      toast.success(`Correção concluída! Nota: ${r.nota_total}/1000`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao corrigir");
    } finally {
      setSubmitting(false);
    }
  }

  const comps = resultado
    ? [
        { n: 1, label: "Norma culta", v: resultado.competencia_1 },
        { n: 2, label: "Compreensão do tema", v: resultado.competencia_2 },
        { n: 3, label: "Argumentação", v: resultado.competencia_3 },
        { n: 4, label: "Coesão", v: resultado.competencia_4 },
        { n: 5, label: "Proposta de intervenção", v: resultado.competencia_5 },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-12">
        <Badge variant="outline" className="border-primary/40 text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> Correção com IA
        </Badge>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">
          Corrigir <span className="gradient-text">redação ENEM</span>
        </h1>
        <p className="mt-2 text-muted-foreground">Cole abaixo e receba avaliação completa pelas 5 competências.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="card-glass p-6">
            {bloqueado && (
              <div className="mb-4 rounded-lg border border-primary/40 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Você usou sua correção gratuita.</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Escolha um plano para continuar evoluindo sua nota.
                    </p>
                    <Link to="/planos" className="mt-3 inline-block">
                      <Button size="sm" className="glow-blue"><Crown className="mr-1 h-3 w-3" /> Ver Planos</Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            <Label htmlFor="tema">Tema (opcional)</Label>
            <Input
              id="tema"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex: Os desafios da educação digital no Brasil"
              className="mt-2"
            />
            <Label htmlFor="texto" className="mt-4 block">Sua redação</Label>
            <Textarea
              id="texto"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Cole aqui sua redação completa..."
              className="mt-2 min-h-[400px]"
            />
            <div className="mt-2 text-xs text-muted-foreground">{texto.length} caracteres</div>

            <div className="mt-4 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-destructive" />
                <div>
                  <Label htmlFor="rigido" className="cursor-pointer">Modo Professor Rígido</Label>
                  <p className="text-xs text-muted-foreground">Comentários brutalmente honestos.</p>
                </div>
              </div>
              <Switch id="rigido" checked={modoRigido} onCheckedChange={setModoRigido} />
            </div>

            <Button onClick={handleSubmit} disabled={submitting} size="lg" className="mt-4 w-full glow-blue">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Corrigindo...</> : <><Brain className="mr-2 h-4 w-4" /> Corrigir agora</>}
            </Button>
          </Card>

          <Card className="card-glass p-6">
            {!resultado && !submitting && (
              <div className="grid h-full place-content-center text-center text-muted-foreground">
                <Brain className="mx-auto h-12 w-12 opacity-30" />
                <p className="mt-3 text-sm">O resultado da IA aparecerá aqui.</p>
              </div>
            )}
            {submitting && (
              <div className="grid h-full place-content-center text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">A IA está analisando sua redação...</p>
              </div>
            )}
            {resultado && (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Nota total</p>
                  <p className="text-6xl font-bold gradient-text text-glow">{resultado.nota_total}</p>
                  <p className="text-sm text-muted-foreground">/ 1000</p>
                </div>
                <div className="space-y-3">
                  {comps.map((c) => (
                    <div key={c.n}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>C{c.n} – {c.label}</span>
                        <span className="font-semibold">{c.v}/200</span>
                      </div>
                      <Progress value={(c.v / 200) * 100} />
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-border/60 bg-background/60 p-4">
                  <h4 className="text-sm font-semibold">Comentário geral</h4>
                  <p className="mt-2 text-sm text-muted-foreground">{resultado.comentario_geral}</p>
                </div>
                {(["erros_gramaticais", "sugestoes", "melhorias", "repertorios"] as const).map((k) => {
                  const titles: Record<string, string> = {
                    erros_gramaticais: "Erros gramaticais",
                    sugestoes: "Sugestões",
                    melhorias: "Melhorias",
                    repertorios: "Repertórios socioculturais",
                  };
                  const arr = resultado[k];
                  if (!arr?.length) return null;
                  return (
                    <div key={k} className="rounded-lg border border-border/60 bg-background/60 p-4">
                      <h4 className="text-sm font-semibold">{titles[k]}</h4>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {arr.map((it, i) => <li key={i}>{it}</li>)}
                      </ul>
                    </div>
                  );
                })}
                <Link to="/dashboard"><Button variant="outline" className="w-full">Ver no dashboard</Button></Link>
              </div>
            )}
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
}