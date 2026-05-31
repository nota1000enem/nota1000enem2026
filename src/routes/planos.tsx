import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createCheckout, type PlanType } from "@/lib/mercadopago.functions";
import planosImg from "@/assets/planos-img.png";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos – Nota 1000 ENEM" },
      {
        name: "description",
        content: "Escolha o plano ideal para sua aprovação no ENEM. A partir de R$ 19,90/mês.",
      },
    ],
  }),
  component: Planos,
});

const planos: Array<{
  name: string;
  planType: PlanType;
  price: string;
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
    periodo: "/mês",
    desc: "Para começar com o pé direito.",
    popular: false,
    upgrade: true,
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
    ],
  },
  {
    name: "ENEM Pro",
    planType: "PRO",
    price: "29,90",
    periodo: "/mês",
    desc: "O queridinho dos aprovados.",
    popular: true,
    upgrade: true,
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
    ],
  },
  {
    name: "Full Acess ENEM",
    planType: "FULL",
    price: "49,90",
    periodo: "/mês",
    desc: "Tudo, sem limites.",
    popular: false,
    upgrade: false,
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
    ],
  },
  {
    name: "Full Acess ENEM Vitalício",
    planType: "VITALICIO",
    price: "499",
    periodo: "uma vez",
    desc: "Pague uma vez, use para SEMPRE.",
    popular: false,
    upgrade: false,
    items: [
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
    ],
  },
];

function Planos() {
  const checkoutFn = useServerFn(createCheckout);
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);

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

  async function handleCheckout(planType: PlanType, label: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Faça login antes de assinar um plano.");
      window.location.href = "/auth?redirect=/planos";
      return;
    }
    setLoadingPlan(planType);
    try {
      const res = await checkoutFn({ data: { planType } });
      if (!res?.init_point) throw new Error("Resposta inválida do servidor");
      window.location.href = res.init_point;
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? `Não foi possível abrir o checkout de ${label}.`);
      setLoadingPlan(null);
    }
  }
  return (
    <div className="min-h-screen bg-background">
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
          Cancele quando quiser. NÃO PRECISA CARTÃO DE CRÉDITO
        </p>

        <img
          src={planosImg}
          alt="Correção de redações ENEM com inteligência artificial Nota 1000 ENEM"
          className="mx-auto mt-8 w-full max-w-6xl rounded-2xl border border-primary/30 object-cover shadow-2xl shadow-primary/20"
          loading="lazy"
        />

        <div className="mt-12 grid gap-6 text-left md:grid-cols-2 lg:grid-cols-4">
          {planos.map((p) => (
            <Card
              key={p.name}
              className={`relative p-6 ${p.popular ? "card-glass border-primary/50 glow-blue" : "card-glass"}`}
            >
              {p.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  MAIS VENDIDO
                </Badge>
              )}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-sm text-muted-foreground">R$</span>
                <span className="text-5xl font-bold">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.periodo}</span>
              </div>
              <Button
                onClick={() => handleCheckout(p.planType, p.name)}
                disabled={loadingPlan !== null}
                className={`mt-6 w-full ${p.popular ? "glow-blue" : ""}`}
                variant={p.popular ? "default" : "outline"}
              >
                {loadingPlan === p.planType ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Abrindo checkout…
                  </>
                ) : (
                  <>Assinar {p.name}</>
                )}
              </Button>
              {p.upgrade && (
                <p className="mt-2 text-center text-xs text-primary">
                  ↗ Upgrade disponível a qualquer momento
                </p>
              )}
              <ul className="mt-6 space-y-2 text-sm">
                {p.items.map((it) => (
                  <li key={it} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {it}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
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
