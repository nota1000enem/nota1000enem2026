import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, ShieldCheck, Loader2, CheckCircle2, Crown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createCheckout, forcarConfirmacaoMP, type PlanType } from "@/lib/mercadopago.functions";
import planosImg from "@/assets/planos-img.png";
import aprovado1 from "@/assets/enem-aprovado-1.jpg";
import aprovado2 from "@/assets/enem-aprovado-2.jpg";
import aprovado3 from "@/assets/enem-aprovado-3.jpg";
import aprovado4 from "@/assets/enem-aprovado-4.jpg";
import printNota840 from "@/assets/print-nota-840.png";
import printNota1000 from "@/assets/print-nota-1000.png";
import printRanking from "@/assets/ranking-enem.png";
import printVideoAulas from "@/assets/videoaulas-enem.png";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos Nota 1000 ENEM – A partir de R$ 19,90/mês" },
      { name: "description", content: "Escolha o plano ideal para sua aprovação no ENEM: correção de redação por IA, simulados, vídeo aulas e plano de estudo. A partir de R$ 19,90/mês." },
      { property: "og:title", content: "Planos Nota 1000 ENEM" },
      { property: "og:description", content: "Correção de redação por IA, simulados e vídeo aulas. A partir de R$ 19,90/mês." },
      { property: "og:url", content: "https://nota1000enem.online/planos" },
    ],
    links: [{ rel: "canonical", href: "https://nota1000enem.online/planos" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: [
            { name: "ENEM Light", price: "19.90", desc: "15 redações/mês, 1.000 questões e simulados, plano de estudo IA." },
            { name: "ENEM Pro", price: "29.90", desc: "30 redações/mês, todas as áreas, simulados e plano de estudo IA." },
            { name: "ENEM Full", price: "39.90", desc: "Redações ilimitadas, todas as áreas, vídeo aulas e plano de estudo IA." },
            { name: "ENEM Vitalício", price: "297.00", desc: "Acesso vitalício a todos os recursos: redações, simulados, vídeo aulas e plano de estudo IA." },
          ].map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Product",
              name: p.name,
              description: p.desc,
              brand: { "@type": "Brand", name: "Nota 1000 ENEM" },
              offers: {
                "@type": "Offer",
                price: p.price,
                priceCurrency: "BRL",
                availability: "https://schema.org/InStock",
                url: "https://nota1000enem.online/planos",
              },
            },
          })),
        }),
      },
    ],
  }),
  component: Planos,
});

function useFakePromoTimer() {
  // Contagem regressiva de 30 min sempre ativa: ao zerar, reinicia automaticamente
  // (gera escassez constante sem janelas "mortas").
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

const planos: Array<{
  name: string;
  planType: PlanType;
  price: string;
  oldPrice: string | null;
  periodo: string;
  desc: string;
  popular: boolean;
  upgrade: boolean;
  items: string[];
}> = [
  {
    name: "ENEM Light",
    planType: "LIGHT",
    price: "19,90",
    oldPrice: null,
    periodo: "/mês",
    desc: "Para começar com o pé direito.",
    popular: false,
    upgrade: true,
    items: [
      "10 redações nota 1000 prontas",
      "+ 50 BÔNUS incluso",
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
    planType: "PRO",
    price: "29,90",
    oldPrice: "49,90",
    periodo: "/mês",
    desc: "O queridinho dos aprovados.",
    popular: true,
    upgrade: true,
    items: [
      "10 redações nota 1000 prontas",
      "+ 50 BÔNUS incluso",
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
    planType: "FULL",
    price: "44,90",
    oldPrice: "99,90",
    periodo: "/mês",
    desc: "Tudo, sem limites.",
    popular: false,
    upgrade: false,
    items: [
      "10 redações nota 1000 prontas",
      "+ 50 BÔNUS incluso",
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
    planType: "VITALICIO",
    price: "499",
    oldPrice: null,
    periodo: "uma vez",
    desc: "Pague uma vez, use para SEMPRE.",
    popular: false,
    upgrade: false,
    items: [
      "10 redações nota 1000 prontas",
      "+ 50 BÔNUS incluso",
      "Acesso ETERNO — sem mensalidade",
      "70 redações por mês (renova a cada 30 dias)",
      "Tudo do Full Acess",
      "Redação completa",
      "BÔNUS — 9 segredos para aprovação no vestibular",
      "Correção IA ilimitada",
      "1.000 questões avançadas",
      "Vídeo aulas completas",
      "Simulados ilimitados",
      "Templates premium",
      "Ranking de alunos",
      "IA Professor Rígido vitalício",
      "Plano de Estudo com IA vitalício",
      "Repertórios automáticos",
      "Estratégias de aprovação",
      "Atualizações futuras incluídas",
      "Sem renovação, sem cobrança recorrente",
      "Grupo VIP + Network",
    ],
  },
];

const PLAN_VALUES: Record<PlanType, number> = {
  LIGHT: 19.9,
  PRO: 29.9,
  FULL: 49.9,
  VITALICIO: 499,
};

const galeria = [
  { src: planosImg, alt: "Correção de redações ENEM com inteligência artificial Nota 1000 ENEM" },
  { src: printNota1000, alt: "Print de redação nota 1000 corrigida pela IA" },
  { src: aprovado1, alt: "Estudante brasileiro aprovado no ENEM" },
  { src: printRanking, alt: "Ranking dos melhores alunos do Nota 1000 ENEM" },
  { src: aprovado2, alt: "Aluno estudando para o ENEM com IA" },
  { src: printNota840, alt: "Print de redação nota 840 corrigida pela IA" },
  { src: aprovado3, alt: "Alunos comemorando aprovação no ENEM" },
  { src: printVideoAulas, alt: "Catálogo de vídeo aulas Nota 1000 ENEM" },
  { src: aprovado4, alt: "Estudante aprovado em medicina pelo ENEM" },
];

function Planos() {
  const checkoutFn = useServerFn(createCheckout);
  const confirmarFn = useServerFn(forcarConfirmacaoMP);
  const checkoutInFlightRef = useRef<PlanType | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [aguardandoPgto, setAguardandoPgto] = useState<{ plan: PlanType; checkoutUrl: string } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("mp_pending_v1");
      return raw ? (JSON.parse(raw) as { plan: PlanType; checkoutUrl: string }) : null;
    } catch { return null; }
  });
  const [confirmando, setConfirmando] = useState(false);
  const promo = useFakePromoTimer();
  const galeriaAutoplay = useRef(
    Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true }),
  );

  // Persiste/limpa o estado de "aguardando pagamento" entre reloads
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (aguardandoPgto) {
      localStorage.setItem("mp_pending_v1", JSON.stringify(aguardandoPgto));
    } else {
      localStorage.removeItem("mp_pending_v1");
    }
  }, [aguardandoPgto]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status === "success") {
      toast.success("Pagamento aprovado! Acesso liberado em instantes.", { duration: 6000 });
    } else if (status === "pending") {
      toast.info(
        "Pagamento pendente. Assim que o Mercado Pago confirmar, seu acesso será liberado automaticamente.",
        { duration: 6000 },
      );
    } else if (status === "failure") {
      toast.error("O pagamento não foi concluído. Tente novamente.");
    }
  }, []);

  // Polling enquanto a tela "Aguardando pagamento" está aberta
  useEffect(() => {
    if (!aguardandoPgto) return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 200; // ~10 min

    (async () => {
      while (!cancelled && attempts < maxAttempts) {
        attempts++;
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const uid = session?.user?.id;
          if (uid) {
            const { data: sub } = await supabase
              .from("subscriptions")
              .select("status, plan_type, current_period_end")
              .eq("user_id", uid)
              .maybeSingle();
            if (
              sub?.status === "ACTIVE" &&
              sub.current_period_end &&
              new Date(sub.current_period_end) > new Date()
            ) {
              if (!cancelled) {
                window.location.href = `/dashboard?status=success&plan=${aguardandoPgto.plan}`;
              }
              return;
            }
          }
        } catch (e) {
          console.warn("poll subscription erro:", e);
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [aguardandoPgto]);

  async function handleCheckout(planType: PlanType, label: string) {
    if (checkoutInFlightRef.current) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Faça login antes de assinar um plano.");
      window.location.href = "/auth?redirect=/planos";
      return;
    }
    checkoutInFlightRef.current = planType;
    setLoadingPlan(planType);
    try {
      try {
        const { pixelTrack } = await import("@/lib/meta-pixel");
        pixelTrack("InitiateCheckout", {
          content_name: label,
          content_category: "subscription",
          content_ids: [planType],
          currency: "BRL",
          value: PLAN_VALUES[planType],
        });
      } catch {}
      const res = await checkoutFn({ data: { planType } });
      if (!res?.init_point) throw new Error("Resposta inválida do servidor");
      // Abre o checkout do MP em nova aba e mantém polling nesta tela
      const w = window.open(res.init_point, "_blank", "noopener,noreferrer");
      if (!w) {
        // Pop-up bloqueado: redireciona como antes
        window.location.href = res.init_point;
        return;
      }
      setAguardandoPgto({ plan: planType, checkoutUrl: res.init_point });
    } catch (e: unknown) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : `Não foi possível abrir o checkout de ${label}.`,
      );
    } finally {
      checkoutInFlightRef.current = null;
      setLoadingPlan(null);
    }
  }

  const renderCard = (p: typeof planos[number]) => (
    <Card
      key={p.name}
      className={`relative flex h-full flex-col p-6 card-glass card-gradient-border ${p.popular ? "glow-blue ring-2 ring-primary/60" : ""}`}
    >
      {p.popular && (
        <div className="mb-3 flex justify-center">
          <Badge className="btn-gradient-hot text-white shadow-md border-2 border-background">
            <Crown className="mr-1 h-3 w-3" /> MAIS VENDIDO
          </Badge>
        </div>
      )}
      <h3 className={`font-bold font-display ${p.popular ? "text-2xl text-primary" : "text-xl"}`}>
        {p.popular && <Crown className="inline h-5 w-5 mr-1 -mt-1" />}
        {p.name}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
      {p.oldPrice && promo.active && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-muted-foreground line-through">R$ {p.oldPrice}</span>
          <Badge className="bg-destructive/20 text-destructive border border-destructive/40">
            🔥 {promo.label}
          </Badge>
        </div>
      )}
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-sm text-muted-foreground">R$</span>
        <span className="text-5xl font-bold font-display">{p.price}</span>
        <span className="text-sm text-muted-foreground">{p.periodo}</span>
      </div>
      <ul className="mt-6 flex-1 space-y-2 text-sm">
        {p.items.map((it) => (
          <li key={it} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {it}
          </li>
        ))}
      </ul>
      {p.upgrade && (
        <p className="mt-4 text-center text-xs text-primary">
          ↗ Upgrade disponível a qualquer momento
        </p>
      )}
      <Button
        onClick={() => handleCheckout(p.planType, p.name)}
        disabled={loadingPlan !== null}
        size="lg"
        className={
          p.popular
            ? "mt-6 w-full whitespace-normal break-words leading-tight text-sm sm:text-base btn-gradient-hot font-extrabold uppercase tracking-wide"
            : "mt-6 w-full whitespace-normal break-words leading-tight text-sm sm:text-base btn-gradient-primary font-bold"
        }
      >
        {loadingPlan === p.planType ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Abrindo checkout…
          </>
        ) : p.popular ? (
          <>🔥 QUERO O {p.name.toUpperCase()} →</>
        ) : (
          <>Assinar {p.name} →</>
        )}
      </Button>
    </Card>
  );


  return (
    <div className="min-h-screen bg-background">
      {aguardandoPgto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="card-glass max-w-md w-full p-8 text-center rounded-2xl">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h2 className="mt-4 text-2xl font-bold">Aguardando pagamento…</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Finalize o pagamento na aba do Mercado Pago. Assim que confirmarmos,
              você será redirecionado automaticamente para o painel.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button
                className="bg-green-600 hover:bg-green-500 font-bold"
                disabled={confirmando}
                onClick={async () => {
                  setConfirmando(true);
                  try {
                    const r = await confirmarFn();
                    if (r.ok) {
                      toast.success("Pagamento confirmado! Liberando acesso...");
                      window.location.href = `/dashboard?status=success&plan=${aguardandoPgto.plan}`;
                    } else {
                      toast.error(
                        "Ainda não recebemos a confirmação do Mercado Pago. Se você acabou de pagar via PIX, aguarde uns segundos e tente de novo.",
                      );
                    }
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Erro ao consultar pagamento.");
                  } finally {
                    setConfirmando(false);
                  }
                }}
              >
                {confirmando ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando…</>) : "✅ Já paguei — verificar agora"}
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(aguardandoPgto.checkoutUrl, "_blank", "noopener,noreferrer")}
              >
                Reabrir checkout
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setAguardandoPgto(null)}>
                Cancelar
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Após pagar no PIX, clique em <b>“Já paguei”</b> para liberar o acesso imediatamente.
            </p>
          </div>
        </div>
      )}
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-16 text-center">
        <Badge variant="outline" className="border-primary/40 text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> Garantia de 7 dias
        </Badge>
        <h1 className="mt-3 text-4xl font-bold md:text-5xl">
          Invista no seu <span className="gradient-text">futuro</span>
        </h1>
        <p className="mx-auto mt-3 max-w-3xl text-muted-foreground">
          Planos pensados para diferentes momentos do seu estudo, o SONHO da NOTA 1000 está PRÓXIMO.
          Cancele quando quiser.
        </p>

        {/* Destaque NÃO PRECISA CARTÃO DE CRÉDITO */}
        <div className="mx-auto mt-6 max-w-2xl rounded-2xl bg-primary/10 p-5 shadow-lg shadow-primary/20 card-gradient-border">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <p className="text-xl font-bold text-primary md:text-2xl font-display">NÃO PRECISA CARTÃO DE CRÉDITO</p>
          </div>
        </div>


        {promo.active && (
          <div className="mx-auto mt-6 max-w-xl rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-center">
            <p className="text-sm font-semibold text-destructive">
              🔥 Promoção relâmpago — termina em{" "}
              <span className="font-mono text-base">{promo.label}</span>
            </p>
          </div>
        )}

        {/* Mobile carousel */}
        <div className="mt-12 md:hidden">
          <Carousel opts={{ align: "start" }} className="px-8 text-left">
            <CarouselContent>
              {planos.map((p) => (
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
        <div className="mt-12 hidden gap-6 text-left md:grid md:grid-cols-2 lg:grid-cols-4">
          {planos.map(renderCard)}
        </div>

        {/* Galeria abaixo dos planos */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold md:text-3xl">
            Veja o <span className="gradient-text">Nota 1000 ENEM</span> em ação
          </h2>
          <Carousel
            opts={{ loop: true, align: "center" }}
            plugins={[galeriaAutoplay.current]}
            className="mx-auto mt-6 max-w-5xl px-10"
          >
            <CarouselContent>
              {galeria.map((img, i) => (
                <CarouselItem key={i} className="basis-[85%] md:basis-1/2 lg:basis-1/3">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="aspect-square w-full rounded-2xl object-cover"
                    loading="lazy"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </Carousel>
        </div>

        <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-6 rounded-2xl border border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Garantia de 7 dias
          </div>
          <div>Pague com cartão, Pix ou boleto</div>
          <div>Cancele quando quiser</div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Ainda em dúvida?{" "}
          <Link to="/redacao" className="text-primary underline">
            Teste uma correção grátis
          </Link>
          .
        </p>
      </section>
      <Footer />
    </div>
  );
}
