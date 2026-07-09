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
import { usePlanAccess } from "@/hooks/use-plan-access";
import { ProfileIncompleteBanner } from "@/components/profile-incomplete-banner";

import { Sparkles, Brain, Flame, Loader2 } from "lucide-react";
import { Lock, Crown, Zap } from "lucide-react";

export const Route = createFileRoute("/redacao")({
  head: () => ({
    meta: [
      { title: "Corrigir Redação ENEM com IA – Nota 1000 ENEM" },
      { name: "description", content: "Cole sua redação do ENEM e receba correção completa pelas 5 competências em segundos. Nota 0-1000 na grade oficial INEP." },
      { property: "og:title", content: "Corrigir Redação ENEM com IA – Nota 1000 ENEM" },
      { property: "og:description", content: "Correção da redação ENEM por IA pelas 5 competências, em segundos." },
      { property: "og:url", content: "https://nota1000enem.online/redacao" },
    ],
    links: [{ rel: "canonical", href: "https://nota1000enem.online/redacao" }],
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

const CORRECTION_TIMEOUT_MS = 75_000;

async function withTimeout<T>(promise: PromiseLike<T>, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), CORRECTION_TIMEOUT_MS);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function RedacaoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const access = usePlanAccess();
  const [tema, setTema] = useState("");
  const [texto, setTexto] = useState("");
  const [modoRigido, setModoRigido] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [motivoBloqueio, setMotivoBloqueio] = useState<string>("");
  const [limite, setLimite] = useState<number>(1);
  const [usadas, setUsadas] = useState<number>(0);
  const [creditos, setCreditos] = useState<number>(0);

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  async function recarregarStatus() {
    if (!user) return;
    const { data } = await supabase.rpc("pode_corrigir_redacao", { _user_id: user.id });
    const r = (data ?? {}) as {
      pode?: boolean;
      motivo?: string;
      limite?: number;
      usadas?: number;
      creditos?: number;
    };
    setBloqueado(!r.pode);
    setMotivoBloqueio(r.motivo ?? "");
    setLimite(r.limite ?? 1);
    setUsadas(r.usadas ?? 0);
    setCreditos(r.creditos ?? 0);
  }

  useEffect(() => {
    recarregarStatus(); /* eslint-disable-next-line */
  }, [user]);

  const modoRigidoLiberado = access.isPremium;

  async function handleSubmit() {
    if (!user) {
      toast.error("Você precisa estar logado para corrigir uma redação.");
      router.navigate({ to: "/auth" });
      return;
    }
    if (bloqueado) {
      const msgs: Record<string, string> = {
        limite_gratuito_atingido:
          "Você já usou suas 2 correções gratuitas. Escolha um plano para continuar.",
        limite_mensal_atingido: `Você atingiu o limite de ${limite} redações deste mês (${usadas}/${limite}). Faça upgrade para corrigir mais.`,
        creditos_esgotados:
          "Seus créditos de redação acabaram neste ciclo. Renove seu plano para corrigir mais.",
        assinatura_expirada: "Sua assinatura expirou. Renove para continuar corrigindo.",
        profile_nao_encontrado:
          "Seu perfil ainda não foi criado. Faça logout e login novamente para sincronizar.",
      };
      toast.error(
        msgs[motivoBloqueio] ??
          `Acesso bloqueado (${motivoBloqueio || "motivo desconhecido"}). Entre em contato pelo Telegram se persistir.`,
      );
      return;
    }
    if (!tema.trim() || tema.trim().length < 8) {
      toast.error("O TEMA E OBRIGATÓRIO PRA PROSSEGUIR");
      return;
    }
    if (texto.trim().length < 50) {
      toast.error(
        `Cole uma redação completa — mínimo 50 caracteres (você colou ${texto.trim().length}).`,
      );
      return;
    }
    if (texto.length > 2500) {
      toast.error(
        "Limite de caracteres excedido. Reduza sua redação para no máximo 2500 caracteres.",
      );
      return;
    }
    if (modoRigido && !modoRigidoLiberado) {
      toast.error("Modo Professor Rígido está disponível apenas nos planos Pro, Full e Vitalício.");
      return;
    }

    setSubmitting(true);
    setResultado(null);
    setCorrectionError(null);
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke("corrigir-redacao", {
          body: { texto, tema, modoRigido },
        }),
        "A correção demorou demais para responder. Tente novamente em instantes.",
      );
      // Se houve erro HTTP (non-2xx), tentar extrair a mensagem real do corpo
      if (error) {
        let serverMsg = "";
        let statusCode: number | undefined;
        try {
          const ctx = (error as { context?: { response?: Response } }).context;
          if (ctx?.response) {
            statusCode = ctx.response.status;
            const bodyText = await ctx.response.clone().text();
            try {
              const j = JSON.parse(bodyText);
              serverMsg = j.error || j.message || "";
              if (j.motivo) serverMsg += ` (motivo: ${j.motivo})`;
            } catch {
              serverMsg = bodyText;
            }
          }
        } catch {
          /* ignore */
        }
        const friendly =
          serverMsg ||
          (error instanceof Error ? error.message : "Erro desconhecido ao corrigir.");
        throw new Error(statusCode ? `Erro ${statusCode}: ${friendly}` : friendly);
      }
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      const r = data as Resultado;
      setResultado(r);
      const { error: insertError } = await supabase.from("redacoes").insert({
        user_id: user!.id,
        tema,
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
      if (insertError) throw insertError;
      if (typeof window !== "undefined") {
        const w = window as Window & { dataLayer?: Array<Record<string, unknown>> };
        w.dataLayer = w.dataLayer || [];
        w.dataLayer.push({ event: "redacao_enviada" });
      }
      await recarregarStatus();
      toast.success(`Correção concluída! Nota: ${r.nota_total}/1000`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao corrigir";
      setCorrectionError(message);
      toast.error(message, { duration: 8000 });
    } finally {
      setSubmitting(false);
    }
  }

  // Sugestões de como abordar o tema
  const sugestoesTema =
    tema.trim().length > 4
      ? [
          `Comece a introdução contextualizando "${tema}" com um dado, citação histórica ou referência cultural relevante.`,
          "Desenvolva 2 parágrafos argumentativos: 1 com causa/contexto e outro com consequência/impacto social.",
          "Use repertórios concretos: Constituição de 1988, ODS da ONU, autores como Bauman, Foucault, Milton Santos.",
          "Conecte parágrafos com conectivos avançados (todavia, ademais, por conseguinte, em virtude disso).",
          "Proposta de intervenção COMPLETA: agente + ação + meio + finalidade + detalhamento. NUNCA esqueça os 5 elementos.",
          `Cuidado para não fugir de "${tema}" — toda argumentação precisa retomar o tema explicitamente.`,
          "Cite dados atuais (últimos 5 anos) ligados ao tema: IBGE, OMS, ONU dão autoridade ao texto.",
          "Evite clichês ('desde os primórdios', 'no mundo atual'). Comece direto e específico.",
          "Use 3ª pessoa, evite gírias e marcas pessoais ('eu acho', 'na minha opinião').",
          "Releia: cada parágrafo precisa ter uma ideia central clara e estar conectado à tese.",
        ]
      : [];

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
        <p className="mt-2 text-muted-foreground">
          Cole abaixo e receba avaliação completa pelas 5 competências.
        </p>

        <div className="mt-6"><ProfileIncompleteBanner /></div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          <Card className="card-glass p-6">
            {bloqueado && (
              <div className="mb-4 rounded-lg border border-primary/40 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {motivoBloqueio === "limite_gratuito_atingido" &&
                        `Você usou suas 2 correções gratuitas (${usadas}/2).`}
                      {motivoBloqueio === "limite_mensal_atingido" &&
                        `Limite mensal atingido (${usadas}/${limite}).`}
                      {motivoBloqueio === "assinatura_expirada" && "Sua assinatura expirou."}
                      {motivoBloqueio === "profile_nao_encontrado" &&
                        "Seu perfil ainda não foi sincronizado."}
                      {!motivoBloqueio && "Acesso bloqueado."}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {motivoBloqueio === "assinatura_expirada"
                        ? "Renove sua assinatura para liberar o acesso novamente — mesmo email, mesma senha."
                        : motivoBloqueio === "profile_nao_encontrado"
                          ? "Faça logout e login novamente. Se persistir, fale conosco pelo Telegram."
                          : "Escolha um plano (ou faça upgrade) para continuar evoluindo sua nota."}
                    </p>
                    <Link to="/planos" className="mt-3 inline-block">
                      <Button size="sm" className="glow-blue">
                        <Crown className="mr-1 h-3 w-3" /> Ver Planos
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="tema" className="flex items-center gap-1">
                Tema <span className="text-destructive">*</span>
              </Label>
              <span className="flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                <Zap className="h-3 w-3" />
                {access.isPaid
                  ? `${creditos} ${creditos === 1 ? "crédito" : "créditos"} restantes`
                  : `${Math.max(0, 2 - usadas)}/2 Grátis`}
              </span>
            </div>
            <Input
              id="tema"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Ex: Os desafios da educação digital no Brasil"
              required
              className="mt-2"
            />
            {sugestoesTema.length > 0 && (
              <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <p className="text-xs font-semibold text-primary">
                  💡 Como abordar este tema (não fuja!):
                </p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {sugestoesTema.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Label htmlFor="texto" className="mt-4 block">
              Sua redação
            </Label>
            <Textarea
              id="texto"
              value={texto}
              maxLength={2500}
              onChange={(e) => {
                if (e.target.value.length >= 2500 && texto.length < 2500) {
                  toast.error("Limite de caracteres excedido. O máximo é 2500 caracteres.");
                }
                setTexto(e.target.value);
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData("text");
                if (texto.length + pasted.length > 2500) {
                  e.preventDefault();
                  toast.error(
                    "Opa! Seu texto excedeu o limite equivalente às 30 linhas (2500 caracteres) do ENEM. Resuma seu argumento para se adequar à folha oficial!",
                  );
                }
              }}
              placeholder="Cole aqui sua redação completa..."
              className="mt-2 min-h-[400px]"
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span
                className={
                  texto.length >= 2500 ? "font-semibold text-destructive" : "text-muted-foreground"
                }
              >
                {texto.length} / 2500 caracteres
              </span>
              <span className="text-muted-foreground">≈ 30 linhas (folha ENEM)</span>
            </div>

            <div
              className={`mt-4 rounded-lg border p-3 ${modoRigidoLiberado ? "border-destructive/30 bg-destructive/5" : "border-border/40 bg-muted/20 opacity-70"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {modoRigidoLiberado ? (
                    <Flame className="h-4 w-4 text-destructive" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div>
                    <Label htmlFor="rigido" className={modoRigidoLiberado ? "cursor-pointer" : ""}>
                      Modo Professor Rígido {!modoRigidoLiberado && "(Pro / Full / Vitalício)"}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {modoRigidoLiberado
                        ? "Comentários brutalmente honestos."
                        : "Disponível nos planos R$ 77, R$ 99 e Anual."}
                    </p>
                  </div>
                </div>
                <Switch
                  id="rigido"
                  checked={modoRigido}
                  onCheckedChange={setModoRigido}
                  disabled={!modoRigidoLiberado}
                />
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-2 text-[11px] text-yellow-200">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
                <p>
                  <strong>Aviso:</strong> o Modo Rígido usa linguagem direta, dura e sem rodeios —
                  como um professor que não passa a mão na cabeça. É ótimo pra acelerar evolução,
                  mas pode <strong>ferir alunos mais sensíveis</strong>. Se você prefere um tom
                  acolhedor, mantenha desligado.
                </p>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              size="lg"
              className="mt-4 w-full glow-blue"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Corrigindo...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" /> Corrigir agora
                </>
              )}
            </Button>
          </Card>

          <Card className="card-glass p-6">
            {!resultado && !submitting && !correctionError && (
              <div className="grid h-full place-content-center text-center text-muted-foreground">
                <Brain className="mx-auto h-12 w-12 opacity-30" />
                <p className="mt-3 text-sm">O resultado da IA aparecerá aqui.</p>
              </div>
            )}
            {!resultado && !submitting && correctionError && (
              <div className="grid h-full place-content-center text-center">
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
                  {correctionError}
                </div>
              </div>
            )}
            {submitting && (
              <div className="grid h-full place-content-center text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">
                  A IA está analisando sua redação...
                </p>
              </div>
            )}
            {resultado && (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Nota total</p>
                  <p className="text-6xl font-bold gradient-text text-glow">
                    {resultado.nota_total}
                  </p>
                  <p className="text-sm text-muted-foreground">/ 1000</p>
                </div>
                <div className="space-y-3">
                  {comps.map((c) => (
                    <div key={c.n}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span>
                          C{c.n} – {c.label}
                        </span>
                        <span className="font-semibold">{c.v}/200</span>
                      </div>
                      <Progress value={(c.v / 200) * 100} />
                    </div>
                  ))}
                </div>
                <h2 className="text-lg font-bold text-primary text-glow">
                  Como melhorar sua redação
                </h2>
                <div className="rounded-lg border border-border/60 bg-background/60 p-4">
                  <h3 className="text-sm font-semibold">Comentário geral</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{resultado.comentario_geral}</p>
                </div>
                {(["erros_gramaticais", "sugestoes", "melhorias", "repertorios"] as const).map(
                  (k) => {
                    const titles: Record<string, string> = {
                      erros_gramaticais: "Erros gramaticais",
                      sugestoes: "Sugestões",
                      melhorias: "Melhorias",
                      repertorios: "Repertórios socioculturais",
                    };
                    const arr = resultado[k];
                    if (!arr?.length) return null;
                    return (
                      <div
                        key={k}
                        className="rounded-lg border border-border/60 bg-background/60 p-4"
                      >
                        <h3 className="text-sm font-semibold">{titles[k]}</h3>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                          {arr.map((it, i) => (
                            <li key={i}>
                              {it.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                                part.startsWith("**") && part.endsWith("**") ? (
                                  <strong key={j} className="font-bold text-destructive">
                                    {part.slice(2, -2)}
                                  </strong>
                                ) : (
                                  <span key={j}>{part}</span>
                                ),
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  },
                )}
                <Link to="/dashboard">
                  <Button variant="outline" className="w-full">
                    Ver no dashboard
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
}
