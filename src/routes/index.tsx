import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  Sparkles,
  Zap,
  Brain,
  FileText,
  Trophy,
  Check,
  Star,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import aprovado1 from "@/assets/enem-aprovado-1.jpg";
import aprovado2 from "@/assets/enem-aprovado-2.jpg";
import aprovado3 from "@/assets/enem-aprovado-3.jpg";
import aprovado4 from "@/assets/enem-aprovado-4.jpg";
import printNota840 from "@/assets/print-nota-840.png";
import printNota1000 from "@/assets/print-nota-1000.png";
import printRanking from "@/assets/ranking-enem.png";
import printVideoAulas from "@/assets/videoaulas-enem.png";
import { useServerFn } from "@tanstack/react-start";
import { createCheckout, type PlanType } from "@/lib/mercadopago.functions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ENEM 2026: Corretor de Redação com IA | Nota 1000 ENEM" },
      {
        name: "description",
        content:
          "Plataforma de preparação para o ENEM: correção de Redação por IA, 1.000+ questões, simulados e plano de estudo personalizado. Treine para a nota 1000.",
      },
      { name: "keywords", content: "ENEM 2026, redação ENEM, corretor de redação IA, nota 1000, simulado ENEM, questões ENEM, vídeo aulas ENEM" },
      { property: "og:title", content: "Nota 1000 ENEM – Redação por IA + Simulados" },
      {
        property: "og:description",
        content:
          "Corrija sua Redação do ENEM por IA em segundos, treine com simulados e vídeo aulas.",
      },
      { property: "og:url", content: "https://nota1000enem.online/" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://nota1000enem.online/" },
      { rel: "preload", as: "image", href: printNota1000, fetchpriority: "high" },
    ],
  }),
  component: Index,
});

function useFakePromoTimer() {
  // Contagem regressiva de 30 min sempre ativa: ao zerar, reinicia.
  const ACTIVE = 30 * 60;
  const KEY = "promo_start_ts_v2";
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!localStorage.getItem(KEY)) {
      localStorage.setItem(KEY, String(Math.floor(Date.now() / 1000)));
    }
    setNow(Math.floor(Date.now() / 1000));
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return { active: true, label: "30:00" };
  const start = Number(localStorage.getItem(KEY) ?? now);
  const elapsed = (now - start) % ACTIVE;
  if (elapsed >= ACTIVE - 1) localStorage.setItem(KEY, String(now + 1));
  const remaining = ACTIVE - elapsed;
  const m = String(Math.floor(remaining / 60)).padStart(2, "0");
  const s = String(remaining % 60).padStart(2, "0");
  return { active: true, label: `${m}:${s}` };
}

function Index() {
  const autoplay = useRef(
    Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true }),
  );
  const heroAutoplay = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }),
  );
  const [topSemana, setTopSemana] = useState<Array<{ nome: string; melhor_nota: number; avatar_url: string | null; estado: string | null; idade: number | null }>>([]);
  const checkoutFn = useServerFn(createCheckout);
  const checkoutInFlightRef = useRef<PlanType | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const promo = useFakePromoTimer();
  useEffect(() => {
    supabase.rpc("get_ranking_global").then(({ data }) => {
      if (data && Array.isArray(data)) setTopSemana((data as Array<{ nome: string; melhor_nota: number; avatar_url: string | null; estado: string | null; idade: number | null }>).slice(0, 3));
    });
  }, []);
  async function handleBuy(planType: PlanType) {
    if (checkoutInFlightRef.current) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = `/auth?redirect=/planos`;
      return;
    }
    checkoutInFlightRef.current = planType;
    setLoadingPlan(planType);
    const PLAN_VALUES_HOME: Record<PlanType, number> = {
      LIGHT: 19.9, PRO: 29.9, FULL: 49.9, VITALICIO: 499,
    };
    try {
      try {
        const { pixelTrack } = await import("@/lib/meta-pixel");
        pixelTrack("InitiateCheckout", {
          content_name: `Plano ${planType}`,
          content_category: "subscription",
          content_ids: [planType],
          currency: "BRL",
          value: PLAN_VALUES_HOME[planType],
        });
      } catch {}
      const res = await checkoutFn({ data: { planType } });
      if (!res?.init_point) throw new Error("Resposta inválida");
      window.location.href = res.init_point;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Não foi possível abrir o checkout.");
      setLoadingPlan(null);
      checkoutInFlightRef.current = null;
    }
  }
  // Intercala: print, aluno, print, aluno...
  const heroImgs = [
    { src: printNota1000, alt: "Print de redação nota 1000 corrigida pela IA" },
    { src: aprovado1, alt: "Estudante brasileiro aprovado no ENEM" },
    { src: printRanking, alt: "Ranking dos melhores alunos do Nota 1000 ENEM" },
    { src: aprovado2, alt: "Aluno estudando para o ENEM com IA" },
    { src: printNota840, alt: "Print de redação nota 840 corrigida pela IA" },
    { src: aprovado3, alt: "Alunos comemorando aprovação no ENEM" },
    { src: printVideoAulas, alt: "Catálogo de vídeo aulas Nota 1000 ENEM" },
    { src: aprovado4, alt: "Estudante aprovado em medicina pelo ENEM" },
  ];
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* HERO */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div className="space-y-6">
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 text-primary backdrop-blur"
            >
              <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <Sparkles className="mr-1 h-3 w-3" /> IA treinada nas competências do ENEM
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Descubra sua nota do ENEM em segundos com{" "}
              <span className="gradient-text text-glow">NOTA 1000 ENEM 2026</span>
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              <span className="block text-xl font-semibold text-foreground">
                Corrija sua redação com IA e descubra onde melhorar.
              </span>
              <span className="mt-3 block">
                Vídeo aulas, corretor de redação por competência e plano de estudos personalizado —
                tudo focado na sua aprovação.
              </span>
              <span className="mt-3 block">
                <span className="font-semibold text-primary">TESTE GRÁTIS AGORA.</span>{" "}
                <span className="font-semibold text-foreground">Sem cartão de crédito.</span>
              </span>
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/redacao">
                <Button size="lg" className="glow-blue animate-pulse-glow">
                  Corrigir minha redação grátis <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/planos">
                <Button size="lg" variant="outline" className="border-primary/40 backdrop-blur hover:bg-primary/10">
                  MAPA da APROVAÇÃO 2026
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" /> 4.9/5 alunos
              </div>
              <div>+ de 78 mil redações corrigidas</div>
            </div>
          </div>
          <div className="relative animate-float">
            <div className="mockup-frame">
              <Carousel
                opts={{ loop: true, align: "center" }}
                plugins={[heroAutoplay.current]}
                className="relative"
              >
                <CarouselContent>
                  {heroImgs.map((img, i) => (
                    <CarouselItem key={i} className="basis-full">
                      <div className="relative overflow-hidden rounded-2xl">
                        <img
                          src={img.src}
                          alt={img.alt}
                          width={1024}
                          height={1024}
                          className="aspect-square w-full rounded-2xl object-cover transition-transform duration-700 hover:scale-[1.02]"
                          loading={i === 0 ? "eager" : "lazy"}
                          fetchPriority={i === 0 ? "high" : "auto"}
                          decoding={i === 0 ? "sync" : "async"}
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-2 border-primary/30 bg-background/70 backdrop-blur md:-left-4" />
                <CarouselNext className="-right-2 border-primary/30 bg-background/70 backdrop-blur md:-right-4" />
              </Carousel>
            </div>
          </div>
        </div>


        {/* Faixa de áreas + AULA NOVA — agora em linhas gradiente, mais tech */}
        <div className="mx-auto max-w-5xl px-4 pb-16">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
            Trilhas do ENEM
          </p>
          <ul className="mt-6 mx-auto max-w-2xl divide-y divide-transparent">
            {[
              "Matemática e suas Tecnologias",
              "Linguagens, Códigos e suas Tecnologias",
              "Ciências Humanas e suas Tecnologias",
              "Ciências da Natureza e suas Tecnologias",
              "Redação",
              "+ 1.000 questões em VÍDEO",
            ].map((t, i, arr) => (
              <li key={t} data-reveal>
                <div className="py-4 text-center text-base font-medium text-foreground md:text-lg">
                  {t}
                </div>
                {i < arr.length - 1 && <div className="divider-gradient" />}
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center" data-reveal>
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary ring-1 ring-primary/30">
              ✦ Aula nova toda semana
            </span>
            <p className="mx-auto mt-4 max-w-3xl text-sm text-muted-foreground md:text-base">
              Estude todas as áreas do ENEM com correções inteligentes, trilhas
              personalizadas e foco na <span className="gradient-text font-semibold">nota 1.000</span>.
              Tudo em um só lugar — <span className="font-semibold text-foreground">AQUI e AGORA</span>.
            </p>
          </div>
        </div>
      </section>


      {/* COMO FUNCIONA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline">Como funciona</Badge>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              3 passos para sua <span className="gradient-text">nota 1000</span>
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: FileText,
                n: "01",
                title: "Cole sua redação",
                desc: "Basta colar seu texto no editor e começar a análise imediatamente. Sem precisar enviar arquivos, criar documentos ou perder tempo com etapas complicadas.",
              },
              {
                icon: Brain,
                n: "02",
                title: "Nós avaliamos sua redação em profundidade",
                desc: "Analisamos gramática, ortografia, coesão, coerência, argumentação, repertório sociocultural e desenvolvimento das ideias, além das 5 competências cobradas oficialmente no ENEM.",
              },
              {
                icon: Trophy,
                n: "03",
                title: "Receba um feedback completo e estratégico",
                desc: "Veja sua nota estimada, entenda seus erros, descubra pontos fortes e receba sugestões detalhadas de melhoria, exemplos de repertórios e orientações para aumentar seu desempenho na redação.",
              },
            ].map(({ icon: Icon, n, title, desc }) => (
              <Card key={n} className="card-glass p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="grid h-12 w-12 place-content-center rounded-xl bg-primary/10 ring-1 ring-primary/30">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-3xl font-bold text-muted-foreground/30">{n}</span>
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* APROVADOS / CHECKLIST DE BENEFÍCIOS */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <Badge variant="outline" className="border-primary/40 text-primary">
            <Trophy className="mr-1 h-3 w-3" /> Resultados
          </Badge>
          <h2 className="mt-3 text-3xl font-bold md:text-5xl">
            <span className="gradient-text">1.890 alunos aprovados</span> em 2025
          </h2>
          <p className="mt-3 text-muted-foreground">Seja você o próximo.</p>
          <ul className="mx-auto mt-8 grid max-w-3xl gap-3 text-left text-sm md:text-base">
            {[
              "1.000 questões em VÍDEO. Te ensino a como resolver do Zero!",
              "Correção inteligente de redações baseada nos critérios oficiais do ENEM",
              "Plano de estudos personalizado com IA treinada 100% no ENEM",
              "Questões comentadas de Matemática, Linguagens e Códigos, Ciências da Natureza e Humanas",
              "Feedback instantâneo para identificar erros e acelerar sua evolução",
              "Simulados completos com análise detalhada de desempenho",
              "Trilhas de estudo focadas nas competências que mais caem no ENEM",
              "Relatórios inteligentes para acompanhar sua evolução em tempo real",
              "Estratégias e repertórios prontos para tirar nota alta na redação",
              "Ranking de desempenho para acompanhar seu progresso e motivação",
              "Videoaulas, exercícios e revisões organizadas em uma única plataforma",
            ].map((b) => (
              <li
                key={b}
                className="flex items-start gap-3 rounded-lg border border-border/40 bg-card/40 p-3"
              >
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link to="/planos">
              <Button size="lg" className="glow-blue">
                Quero ser o próximo aprovado <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* MODO PROFESSOR RIGIDO */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <Card className="card-glass overflow-hidden p-8 md:p-12">
            <Badge className="bg-destructive/20 text-destructive border border-destructive/40">
              🔥 Novo
            </Badge>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Modo <span className="gradient-text">Professor Rígido</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              Ative e receba comentários brutalmente honestos (e engraçados) que vão te fazer
              escrever melhor por orgulho.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-background/60 p-4 text-sm italic text-muted-foreground">
                "Seu argumento começou forte mas virou passeio no parque no segundo parágrafo."
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-4 text-sm italic text-muted-foreground">
                "Essa conclusão ficou mais perdida que aluno sem repertório sociocultural."
              </div>
            </div>
            <div className="mt-6">
              <Link to="/redacao">
                <Button className="glow-blue">
                  Ativar e testar <Zap className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* TOP NOTAS DA SEMANA */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <Badge variant="outline" className="border-primary/40 text-primary">
            <Trophy className="mr-1 h-3 w-3" /> Top Notas da Semana
          </Badge>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Veja quem está <span className="gradient-text">no topo</span> esta semana
          </h2>
          <p className="mt-3 text-muted-foreground">
            Ranking ao vivo dos alunos com as melhores notas dos últimos 7 dias.
          </p>
          <div className="mt-8 grid gap-4 grid-cols-3">
            {(topSemana.length > 0
              ? topSemana.map((t, i) => ({
                  pos: `${i + 1}º`,
                  nome: t.nome,
                  nota: t.melhor_nota,
                  avatar_url: t.avatar_url,
                  estado: t.estado,
                  idade: t.idade,
                  color:
                    i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : "text-orange-400",
                  ring:
                    i === 0
                      ? "ring-yellow-400/60"
                      : i === 1
                        ? "ring-slate-300/60"
                        : "ring-orange-400/60",
                  glow: i === 0 ? "glow-blue" : "",
                }))
              : [0, 1, 2].map((i) => ({
                  pos: `${i + 1}º`,
                  nome: "—",
                  nota: 0,
                  avatar_url: null as string | null,
                  estado: null as string | null,
                  idade: null as number | null,
                  color:
                    i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : "text-orange-400",
                  ring:
                    i === 0
                      ? "ring-yellow-400/60"
                      : i === 1
                        ? "ring-slate-300/60"
                        : "ring-orange-400/60",
                  glow: i === 0 ? "glow-blue" : "",
                }))
            ).map((p) => (
              <Card key={p.pos} className={`card-glass p-3 md:p-6 text-center ring-2 ${p.ring} ${p.glow}`}>
                <div className={`mx-auto h-14 w-14 md:h-20 md:w-20 overflow-hidden rounded-full border-2 border-background ring-2 ${p.ring} bg-muted`}>
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.nome} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="grid h-full w-full place-content-center">
                      <Trophy className={`h-6 w-6 md:h-8 md:w-8 ${p.color} opacity-50`} />
                    </div>
                  )}
                </div>
                <p className={`mt-2 text-[10px] md:text-xs uppercase tracking-wider font-semibold ${p.color}`}>
                  {p.pos} lugar
                </p>
                <p className="mt-1 text-sm md:text-lg font-semibold truncate">{p.nome}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                  {[p.idade ? `${p.idade} anos` : null, p.estado].filter(Boolean).join(" · ") || "\u00a0"}
                </p>
                <p className="mt-2 text-2xl md:text-4xl font-bold gradient-text text-glow">{p.nota || "—"}</p>
              </Card>
            ))}
          </div>
          <div className="mt-8">
            <Link to="/ranking">
              <Button size="lg" className="glow-blue">
                Entrar no Ranking <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS (antes dos planos) */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline">Provas sociais</Badge>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Resultados de quem usou a <span className="gradient-text">Nota 1000 ENEM</span>
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Maria Eduarda Cavalcanti, 18",
                curso: "Medicina – UFPE",
                nota: 980,
                text: "Saí de 720 para 980 na redação em 4 meses. A IA do Nota 1000 ENEM aponta o erro EXATO e cita a regra — coisa que nenhum cursinho meu fazia.",
              },
              {
                name: "João Vitor Albuquerque, 19",
                curso: "Engenharia Aeroespacial – ITA",
                nota: 960,
                text: "Treinei 1 redação por dia. Em 60 dias dobrei minha nota de C5. O Modo Professor Rígido é cruel mas funciona.",
              },
              {
                name: "Beatriz Stelzer, 17",
                curso: "Direito – USP",
                nota: 970,
                text: "Os repertórios automáticos me deram repertório real de Bauman, Foucault, Constituição. Passei em primeira chamada.",
              },
            ].map((t) => (
              <Card key={t.name} className="card-glass p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    Nota {t.nota}
                  </Badge>
                </div>
                <p className="text-sm">"{t.text}"</p>
                <div className="mt-4 border-t border-border/40 pt-3">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.curso}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* CARROSSEL DE DEPOIMENTOS REAIS */}
          <div className="mt-12">
            <div className="mb-6 text-center">
              <Badge variant="outline" className="border-primary/40 text-primary">
                <Star className="mr-1 h-3 w-3 fill-primary" /> Mais histórias reais
              </Badge>
              <h3 className="mt-3 text-2xl font-bold md:text-3xl">
                + de 78 mil alunos <span className="gradient-text">evoluíram</span> com a Nota 1000
                ENEM
              </h3>
            </div>
            <Carousel
              opts={{ align: "start", loop: true }}
              plugins={[autoplay.current]}
              className="mx-auto max-w-6xl px-12 md:px-16"
            >
              <CarouselContent>
                {[
                  {
                    name: "Isadora Bernardes, 18",
                    curso: "Psicologia – UFRGS",
                    nota: "740 → 940",
                    text: "Antes eu chutava conectivos. Hoje sei contar inter e intraparágrafos e nunca mais tomei menos de 180 na C4.",
                  },
                  {
                    name: "Caio Henrique Sampaio, 17",
                    curso: "Medicina – UNIFESP",
                    nota: "820 → 980",
                    text: "A IA mostrou erro de regência que 3 professores meus deixaram passar. Subi 160 pontos só na C1.",
                  },
                  {
                    name: "Letícia Marques, 19",
                    curso: "Arquitetura – UFMG",
                    nota: "660 → 900",
                    text: "Sem repertório eu nunca passava de 700. Os repertórios sugeridos pelo Nota 1000 ENEM viraram parte do meu vocabulário.",
                  },
                  {
                    name: "Felipe Tavares, 18",
                    curso: "Ciência da Computação – UFRJ",
                    nota: "700 → 960",
                    text: "O Modo Professor Rígido me humilhou na primeira correção. Na quinta eu agradeci. Passei na UFRJ.",
                  },
                  {
                    name: "Amanda Sousa, 16",
                    curso: "2º EM – preparando medicina",
                    nota: "540 → 860",
                    text: "Em 5 meses comecei a entender O QUE é uma proposta de intervenção completa. A IA é didática como cursinho caro.",
                  },
                  {
                    name: "Rodrigo Pacheco, 19",
                    curso: "Direito – PUC-RS",
                    nota: "820 → 960",
                    text: "Usei o ranking pra me motivar. Brigar pelo top 10 me fez treinar todo dia. Passei com folga.",
                  },
                  {
                    name: "Helena Quintanilha, 18",
                    curso: "Veterinária – UFV",
                    nota: "680 → 940",
                    text: "A IA não inventa erro. Quando tira ponto, ela CITA a frase e a regra. Confio 100% no feedback.",
                  },
                  {
                    name: "Murilo Andrade, 17",
                    curso: "Engenharia Civil – UFSC",
                    nota: "600 → 880",
                    text: "Plano de estudo com IA foi divisor de águas. Pomodoro real, com matérias que EU precisava, não plano genérico.",
                  },
                  {
                    name: "Sofia Vasconcelos, 18",
                    curso: "Jornalismo – UFBA",
                    nota: "740 → 960",
                    text: "Tirei 200 na C2 pela primeira vez depois que entendi como fugir do tema. A IA me corrigiu sem dó até eu acertar.",
                  },
                ].map((t, i) => (
                  <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                    <Card className="card-glass h-full p-6">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, k) => (
                            <Star key={k} className="h-3.5 w-3.5 fill-primary text-primary" />
                          ))}
                        </div>
                        <Badge variant="outline" className="border-primary/40 text-xs text-primary">
                          {t.nota}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed">"{t.text}"</p>
                      <div className="mt-4 flex items-center gap-3 border-t border-border/40 pt-3">
                        <div className="grid h-10 w-10 place-content-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/30">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.curso}</p>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0" />
              <CarouselNext className="right-0" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline">Planos</Badge>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Escolha seu caminho para a <span className="gradient-text">aprovação</span>
            </h2>
          </div>
          {promo.active && (
            <div className="mb-8 mx-auto max-w-xl rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-destructive">
                🔥 Promoção relâmpago — termina em{" "}
                <span className="font-mono text-base">{promo.label}</span>
              </p>
            </div>
          )}
          {(() => {
            const planosArr = [
              {
                name: "ENEM Light",
                planType: "LIGHT" as PlanType,
                price: "19,90",
                oldPrice: null as string | null,
                periodo: "/mês",
                cta: "Começar Agora",
                popular: false,
                items: [
                  "15 redações por mês",
                  "Linguagens, Códigos e suas Tecnologias",
                  "Ciências da Natureza e suas Tecnologias",
                  "1.000 questões e simulados",
                  "Plano de Estudo com IA",
                  "PDF metodologia de estudos",
                  "Cronograma de 30 dias",
                  "Templates de redação nota 1000",
                  "Acesso básico IA",
                  "Grupo VIP + Network",
                ],
              },
              {
                name: "ENEM Pro",
                planType: "PRO" as PlanType,
                price: "29,90",
                oldPrice: "49,90" as string | null,
                periodo: "/mês",
                cta: "Quero o Pro",
                popular: true,
                items: [
                  "30 redações por mês",
                  "Tudo do Light",
                  "Ciências Humanas e suas Tecnologias",
                  "Matemática e suas Tecnologias",
                  "As 4 áreas do ENEM liberadas",
                  "20 vídeo aulas",
                  "1.000 questões para passar",
                  "Simulados",
                  "Correção IA avançada",
                  "IA Professor Rígido",
                  "Plano de Estudo com IA",
                  "Repertórios automáticos",
                  "Cronograma inteligente",
                  "Grupo VIP + Network",
                ],
              },
              {
                name: "Full Acess ENEM",
                planType: "FULL" as PlanType,
                price: "44,90",
                oldPrice: "99,90",
                periodo: "/mês",
                cta: "Quero Acesso Total",
                popular: false,
                items: [
                  "60 redações por mês",
                  "Tudo do Pro",
                  "Redação completa",
                  "BÔNUS — 9 segredos para aprovação no vestibular",
                  "Correção IA ilimitada",
                  "1.000 questões avançadas",
                  "Vídeo aulas completas",
                  "Simulados ilimitados",
                  "Templates premium",
                  "Ranking de alunos",
                  "IA Professor Rígido",
                  "Plano de Estudo com IA",
                  "Repertórios automáticos",
                  "Estratégias de aprovação",
                  "Atualizações futuras",
                  "Grupo VIP + Network",
                ],
              },
              {
                name: "Full Acess ENEM Vitalício",
                planType: "VITALICIO" as PlanType,
                price: "499",
                oldPrice: null,
                periodo: "uma vez",
                cta: "Quero Vitalício",
                popular: false,
                items: [
                  "Acesso ETERNO — sem mensalidade",
                  "70 redações por mês",
                  "Tudo do Full Acess",
                  "Redação completa",
                  "BÔNUS — 9 segredos para aprovação no vestibular",
                  "IA Professor Rígido vitalício",
                  "Plano de Estudo com IA vitalício",
                  "Atualizações futuras incluídas",
                  "Sem renovação, sem cobrança recorrente",
                  "Grupo VIP + Network",
                ],
              },
            ];
            const renderCard = (p: typeof planosArr[number]) => (
              <Card
                key={p.name}
                className={`relative h-full p-6 ${p.popular ? "card-glass border-primary/50 glow-blue pt-9" : "card-glass"}`}
              >
                {p.popular && (
                  <Badge className="absolute top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-md">
                    MAIS VENDIDO
                  </Badge>
                )}
                <h3 className="text-xl font-bold">{p.name}</h3>
                {p.oldPrice && promo.active && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground line-through">R$ {p.oldPrice}</span>
                    <Badge className="bg-destructive/20 text-destructive border border-destructive/40">-25%</Badge>
                  </div>
                )}
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.periodo}</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm">
                  {p.items.map((it) => (
                    <li key={it} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {it}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleBuy(p.planType)}
                  disabled={loadingPlan !== null}
                  size="lg"
                  className={
                    p.popular
                      ? "mt-6 w-full animate-pulse bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 font-extrabold uppercase tracking-wide text-white shadow-xl shadow-orange-500/50 ring-2 ring-amber-300 hover:scale-[1.03] hover:from-amber-300 hover:to-rose-400 transition-all"
                      : "mt-6 w-full bg-gradient-to-r from-primary to-primary/80 font-bold text-primary-foreground shadow-lg shadow-primary/40 ring-1 ring-primary/60 hover:from-primary hover:to-primary hover:shadow-primary/60 hover:scale-[1.02] transition-all"
                  }
                >
                  {loadingPlan === p.planType ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Abrindo checkout…
                    </>
                  ) : p.popular ? (
                    <>🔥 {p.cta.toUpperCase()} →</>
                  ) : (
                    p.cta
                  )}
                </Button>
              </Card>
            );
            return (
              <>
                {/* Mobile carousel */}
                <div className="md:hidden">
                  <Carousel opts={{ align: "start" }} className="px-8">
                    <CarouselContent>
                      {planosArr.map((p) => (
                        <CarouselItem key={p.name} className="basis-[85%]">
                          {renderCard(p)}
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-0" />
                    <CarouselNext className="right-0" />
                  </Carousel>
                </div>
                {/* Desktop grid */}
                <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-4">
                  {planosArr.map(renderCard)}
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-4 text-3xl font-bold md:text-5xl">
            Sua nota 1000 começa <span className="gradient-text">hoje</span>.
          </h2>
          <p className="mt-3 text-muted-foreground">Teste grátis. Sem cartão. Sem enrolação.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/redacao">
              <Button size="lg" className="glow-blue">
                Corrigir minha redação agora <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
