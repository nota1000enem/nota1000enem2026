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
  head: () => ({
    meta: [
      { title: "Simulado ENEM – Nota 1000 ENEM" },
      { name: "description", content: "Faça um simulado ENEM cronometrado e acompanhe sua nota na escala 0-1000." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Simulado ENEM – Nota 1000 ENEM" },
      { property: "og:description", content: "Faça um simulado ENEM cronometrado e acompanhe sua nota na escala 0-1000." },
      { property: "og:url", content: "https://nota1000enem.online/simulado" },
    ],
    links: [{ rel: "canonical", href: "https://nota1000enem.online/simulado" }],
  }),
  component: SimuladoPage,
});

type Questao = {
  id: string;
  numero: number;
  area: string;
  enunciado: string;
  alt_a: string; alt_b: string; alt_c: string; alt_d: string; alt_e: string | null;
  peso: number;
};

type GabaritoItem = { questao_id: string; marcada: string | null; correta: string; ok: boolean };

const SIMULADO_CORRECTION_TIMEOUT_MS = 30_000;

async function withSimuladoTimeout<T>(promise: PromiseLike<T>, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), SIMULADO_CORRECTION_TIMEOUT_MS);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

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
  const [resultado, setResultado] = useState<{ nota: number; acertos: number; total: number; porArea: Record<string, { acertos: number; total: number }>; gabarito: Record<string, GabaritoItem> } | null>(null);
  const [saving, setSaving] = useState(false);


  useEffect(() => { if (!loading && !user) router.navigate({ to: "/auth" }); }, [loading, user, router]);

  useEffect(() => {
    (async () => {
      if (loading) return;
      if (!user) {
        setFetching(false);
        return;
      }

      setFetching(true);
      const { data: sim } = await supabase.from("simulados").select("nome").eq("id", id).maybeSingle();
      setSimNome(sim?.nome ?? "Simulado");
      const { data, error } = await supabase
        .from("questoes_simulado_publica")
        .select("*")
        .eq("simulado_id", id)
        .order("numero", { ascending: true });
      if (error) {
        toast.error("Não conseguimos carregar as questões. Reabra a prova em instantes.");
      }
      setQuestoes((data as Questao[]) ?? []);
      setFetching(false);
    })();
  }, [id, loading, user]);

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
    try {
      const { data, error } = await withSimuladoTimeout(
        supabase.rpc("corrigir_simulado", {
          _simulado_id: id,
          _respostas: respostas,
        }),
        "A correção da prova demorou demais. Tente novamente em instantes.",
      );

      if (error || !data) {
        throw new Error("Não conseguimos corrigir sua prova. Tente novamente.");
      }

      const r = data as unknown as {
        nota: number; acertos: number; total: number;
        porArea: Record<string, { acertos: number; total: number }>;
        gabarito: GabaritoItem[];
      };
      const gabMap: Record<string, GabaritoItem> = {};
      for (const g of r.gabarito) gabMap[g.questao_id] = g;

      setResultado({ nota: r.nota, acertos: r.acertos, total: r.total, porArea: r.porArea, gabarito: gabMap });
      setFinished(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não conseguimos corrigir sua prova. Tente novamente.");
    } finally {
      setSaving(false);
    }
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
              const g = resultado.gabarito[q.id];
              const marc = g?.marcada ?? respostas[q.id] ?? null;
              const ok = g?.ok ?? false;
              const correta = g?.correta ?? "—";
              return (
                <Card key={q.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {ok ? <CheckCircle2 className="mt-1 h-5 w-5 text-green-500" /> : <XCircle className="mt-1 h-5 w-5 text-destructive" />}
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Questão {i + 1} · {AREA_LABEL[q.area] ?? q.area}</p>
                      <p className="mt-1 text-sm">{q.enunciado}</p>
                      <p className="mt-2 text-xs">
                        Sua resposta: <span className={ok ? "text-green-500 font-semibold" : "text-destructive font-semibold"}>{marc ?? "—"}</span>
                        {" · "}Gabarito: <span className="text-primary font-semibold">{correta}</span>
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
