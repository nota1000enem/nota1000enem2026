import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, ArrowLeft, Trophy, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/simulado/$id")({
  head: () => ({ meta: [{ title: "Simulado ENEM – Nota 1000 ENEM" }] }),
  component: SimuladoPage,
});

type Questao = {
  id: string;
  numero: number;
  area: string;
  enunciado: string;
  alt_a: string; alt_b: string; alt_c: string; alt_d: string; alt_e: string | null;
  resposta_correta: string;
  peso: number;
};

const AREA_LABEL: Record<string, string> = {
  LINGUAGENS: "Linguagens",
  HUMANAS: "Humanas",
  NATUREZA: "Natureza",
  MATEMATICA: "Matemática",
};

function SimuladoPage() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [simNome, setSimNome] = useState("");
  const [idx, setIdx] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [fetching, setFetching] = useState(true);
  const [finished, setFinished] = useState(false);
  const [resultado, setResultado] = useState<{ nota: number; acertos: number; total: number; porArea: Record<string, { acertos: number; total: number }> } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !user) router.navigate({ to: "/auth" }); }, [loading, user, router]);

  useEffect(() => {
    (async () => {
      const { data: sim } = await supabase.from("simulados").select("nome").eq("id", id).maybeSingle();
      setSimNome(sim?.nome ?? "Simulado");
      const { data } = await supabase
        .from("questoes_simulado")
        .select("*")
        .eq("simulado_id", id)
        .order("numero", { ascending: true });
      setQuestoes((data as Questao[]) ?? []);
      setFetching(false);
    })();
  }, [id]);

  const atual = questoes[idx];
  const total = questoes.length;
  const respondidas = Object.keys(respostas).length;
  const progresso = total ? Math.round((respondidas / total) * 100) : 0;

  function escolher(alt: string) {
    if (!atual) return;
    setRespostas((r) => ({ ...r, [atual.id]: alt }));
  }

  async function finalizar() {
    if (!user || finished) return;
    setSaving(true);
    let acertos = 0;
    const porArea: Record<string, { acertos: number; total: number }> = {};
    for (const q of questoes) {
      const marc = respostas[q.id];
      const area = q.area;
      porArea[area] ??= { acertos: 0, total: 0 };
      porArea[area].total += 1;
      if (marc && marc.toUpperCase() === q.resposta_correta.toUpperCase()) {
        acertos += 1;
        porArea[area].acertos += 1;
      }
    }
    const nota = total ? Math.round((acertos / total) * 1000) : 0;

    // cria tentativa
    const { data: tent, error: e1 } = await supabase
      .from("tentativas_simulado")
      .insert({ user_id: user.id, simulado_id: id, started_at: new Date().toISOString(), finished_at: new Date().toISOString(), nota_total: nota, acertos, total, acertos_por_area: porArea })
      .select("id").single();
    if (e1) {
      toast.error("Não conseguimos salvar sua tentativa. Tente novamente.");
      setSaving(false);
      return;
    }

    // salva respostas
    const rows = questoes.map((q) => ({
      tentativa_id: tent.id,
      user_id: user.id,
      questao_id: q.id,
      resposta_marcada: respostas[q.id] ?? null,
      correta: respostas[q.id] ? respostas[q.id].toUpperCase() === q.resposta_correta.toUpperCase() : false,
    }));
    await supabase.from("respostas_aluno").insert(rows);

    setResultado({ nota, acertos, total, porArea });
    setFinished(true);
    setSaving(false);
  }

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando prova...
        </div>
      </div>
    );
  }

  if (questoes.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-muted-foreground">Esta prova ainda não tem questões.</p>
          <Link to="/questoes"><Button className="mt-4">Voltar</Button></Link>
        </div>
      </div>
    );
  }

  if (finished && resultado) {
    const aprovado = resultado.nota >= 600;
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="mx-auto max-w-3xl px-4 py-12">
          <Card className="card-glass p-8 text-center">
            <Trophy className={`mx-auto h-14 w-14 ${aprovado ? "text-yellow-400" : "text-primary/60"}`} />
            <h1 className="mt-3 text-3xl font-bold">Sua nota</h1>
            <p className="mt-4 text-6xl font-bold gradient-text text-glow">{resultado.nota}</p>
            <p className="text-sm text-muted-foreground">/1000 (escala ENEM)</p>
            <p className="mt-4 text-lg">{resultado.acertos} de {resultado.total} acertos</p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 text-left">
              {Object.entries(resultado.porArea).map(([area, v]) => (
                <div key={area} className="rounded-lg border border-border/60 bg-card/40 p-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{AREA_LABEL[area] ?? area}</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-primary">{v.acertos}/{v.total}</span>
                    <span className="text-xs text-muted-foreground">{Math.round((v.acertos / v.total) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Link to="/dashboard"><Button className="glow-blue">Ver no dashboard</Button></Link>
              <Link to="/questoes"><Button variant="outline">Outras provas</Button></Link>
            </div>
          </Card>

          <h2 className="mt-10 mb-3 text-xl font-semibold">Gabarito comentado</h2>
          <div className="space-y-3">
            {questoes.map((q, i) => {
              const marc = respostas[q.id];
              const ok = marc && marc.toUpperCase() === q.resposta_correta.toUpperCase();
              return (
                <Card key={q.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {ok ? <CheckCircle2 className="mt-1 h-5 w-5 text-green-500" /> : <XCircle className="mt-1 h-5 w-5 text-destructive" />}
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Questão {i + 1} · {AREA_LABEL[q.area] ?? q.area}</p>
                      <p className="mt-1 text-sm">{q.enunciado}</p>
                      <p className="mt-2 text-xs">
                        Sua resposta: <span className={ok ? "text-green-500 font-semibold" : "text-destructive font-semibold"}>{marc ?? "—"}</span>
                        {" · "}Gabarito: <span className="text-primary font-semibold">{q.resposta_correta}</span>
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  const alternativas: Array<[string, string | null]> = [
    ["A", atual.alt_a], ["B", atual.alt_b], ["C", atual.alt_c], ["D", atual.alt_d], ["E", atual.alt_e],
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="border-primary/40 text-primary">{simNome}</Badge>
          <span className="text-xs text-muted-foreground">Questão {idx + 1} de {total}</span>
        </div>
        <Progress value={progresso} className="mt-3" />

        <Card className="card-glass mt-6 p-6">
          <div className="mb-2 text-xs uppercase tracking-wider text-primary">{AREA_LABEL[atual.area] ?? atual.area}</div>
          <h2 className="text-lg font-semibold">{atual.numero}. {atual.enunciado}</h2>

          <div className="mt-5 space-y-2">
            {alternativas.filter(([, t]) => t !== null).map(([letra, t]) => {
              const selected = respostas[atual.id] === letra;
              return (
                <button
                  key={letra}
                  onClick={() => escolher(letra)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                    selected
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border/60 hover:border-primary/50 hover:bg-muted/40"
                  }`}
                >
                  <span className="mr-2 inline-grid h-6 w-6 place-content-center rounded-full border border-primary/40 text-xs font-bold text-primary">{letra}</span>
                  {t}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Anterior
          </Button>
          {idx < total - 1 ? (
            <Button onClick={() => setIdx((i) => i + 1)} disabled={!respostas[atual.id]} className="glow-blue">
              Próxima <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finalizar} disabled={saving || respondidas < total} className="glow-blue">
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {saving ? "Corrigindo..." : "Finalizar e ver nota"}
            </Button>
          )}
        </div>

        {respondidas < total && idx === total - 1 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-yellow-500">
            <AlertTriangle className="h-3 w-3" /> Você ainda tem {total - respondidas} questão(ões) sem resposta. Volte e responda antes de finalizar.
          </div>
        )}
      </section>
    </div>
  );
}
