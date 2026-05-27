import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos – Nota 1000 ENEM" },
      { name: "description", content: "Escolha o plano ideal para sua aprovação no ENEM. A partir de R$ 19,90/mês." },
    ],
  }),
  component: Planos,
});

const planos = [
  {
    name: "ENEM Light",
    price: "19,90",
    periodo: "/mês",
    desc: "Para começar com o pé direito.",
    popular: false,
    upgrade: true,
    items: ["Até 25 redações corrigidas por mês", "Matemática", "Português", "Redação", "1000 questões", "PDF metodologia de estudos", "Cronograma de 30 dias", "Templates de redação nota 1000", "Acesso básico IA"],
  },
  {
    name: "ENEM Pro",
    price: "29,90",
    periodo: "/mês",
    desc: "O queridinho dos aprovados.",
    popular: true,
    upgrade: true,
    items: ["Até 50 redações corrigidas por mês", "Matemática", "Português", "História", "Geografia", "Ciências da Natureza", "Redação", "20 vídeo aulas", "1000 questões para passar", "Simulados", "Correção IA avançada", "IA Professor Rígido", "Repertórios automáticos", "Cronograma inteligente"],
  },
  {
    name: "Full Acess ENEM",
    price: "49,90",
    periodo: "/mês",
    desc: "Tudo, sem limites.",
    popular: false,
    upgrade: false,
    items: ["Até 100 redações corrigidas por mês", "Matemática", "Linguagens e Códigos", "Ciências Humanas", "Ciências da Natureza", "Redação completa", "Correção IA ilimitada", "1000 questões avançadas", "Vídeo aulas completas", "Simulados ilimitados", "Templates premium", "Ranking de alunos", "IA Professor Rígido", "Repertórios automáticos", "Estratégias de aprovação", "Atualizações futuras"],
  },
  {
    name: "Full Acess ENEM Vitalício",
    price: "499",
    periodo: "uma vez",
    desc: "Pague uma vez, use para SEMPRE.",
    popular: false,
    upgrade: false,
    items: ["Acesso ETERNO — sem mensalidade", "Até 100 redações corrigidas por mês", "Matemática", "Linguagens e Códigos", "Ciências Humanas", "Ciências da Natureza", "Redação completa", "Correção IA ilimitada", "1000 questões avançadas", "Vídeo aulas completas", "Simulados ilimitados", "Templates premium", "Ranking de alunos", "IA Professor Rígido vitalício", "Repertórios automáticos", "Estratégias de aprovação", "Atualizações futuras incluídas", "Sem renovação, sem cobrança recorrente"],
  },
];

function Planos() {
  function handleCheckout(plano: string) {
    toast.info(`Checkout do plano ${plano} em breve – integração Mercado Pago.`);
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
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Planos pensados para diferentes momentos do seu estudo. Cancele quando quiser.
        </p>

        <div className="mt-12 grid gap-6 text-left md:grid-cols-2 lg:grid-cols-4">
          {planos.map((p) => (
            <Card key={p.name} className={`relative p-6 ${p.popular ? "card-glass border-primary/50 glow-blue" : "card-glass"}`}>
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
                onClick={() => handleCheckout(p.name)}
                className={`mt-6 w-full ${p.popular ? "glow-blue" : ""}`}
                variant={p.popular ? "default" : "outline"}
              >
                Assinar {p.name}
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
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Garantia de 7 dias</div>
          <div>Pague com cartão, Pix ou boleto</div>
          <div>Cancele quando quiser</div>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Ainda em dúvida? <Link to="/redacao" className="text-primary underline">Teste uma correção grátis</Link>.
        </p>
      </section>
      <Footer />
    </div>
  );
}