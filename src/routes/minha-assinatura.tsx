import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Calendar, CreditCard, Check, Infinity as Inf, Zap } from "lucide-react";

export const Route = createFileRoute("/minha-assinatura")({
  head: () => ({
    meta: [
      { title: "Minha Assinatura – Nota 1000 ENEM" },
      { name: "description", content: "Gerencie sua assinatura, créditos e renovação no Nota 1000 ENEM." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "https://nota1000enem.online/minha-assinatura" }],
  }),
  component: MinhaAssinaturaPage,
});

type Pagamento = {
  id: string;
  valor_centavos: number;
  status: string;
  created_at: string;
  plan_type: string;
};

const PLAN_INFO: Record<string, { nome: string; preco: string; cor: string; beneficios: string[] }> = {
  light: {
    nome: "Light",
    preco: "R$ 57 / mês",
    cor: "text-red-400",
    beneficios: [
      "10 redações por mês",
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
  pro: {
    nome: "Pro",
    preco: "R$ 77 / mês",
    cor: "text-orange-400",
    beneficios: [
      "20 redações por mês",
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
  full: {
    nome: "Full",
    preco: "R$ 99 / mês",
    cor: "text-yellow-400",
    beneficios: [
      "30 redações por mês",
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
  vitalicio: {
    nome: "Anual",
    preco: "R$ 599 / ano",
    cor: "text-emerald-400",
    beneficios: [
      "Acesso por 12 meses completos",
      "40 redações por mês (renova a cada 30 dias)",
      "Tudo do Full Access",
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
      "Atualizações futuras incluídas",
      "Grupo VIP + Network",
    ],
  },
};

function MinhaAssinaturaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const access = usePlanAccess();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("payment_transactions")
      .select("id,valor_centavos,status,created_at,plan_type")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setPagamentos((data ?? []) as Pagamento[]));
  }, [user]);

  const formato = (c: number) => `R$ ${(c / 100).toFixed(2).replace(".", ",")}`;
  const info = PLAN_INFO[access.tier];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-12">
        <Badge variant="outline" className="border-primary/40 text-primary">
          <Crown className="mr-1 h-3 w-3" /> Sua assinatura
        </Badge>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">
          Minha <span className="gradient-text">Assinatura</span>
        </h1>

        {access.loading ? (
          <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>
        ) : !access.isPaid ? (
          <Card className="card-glass mt-8 p-8 text-center">
            <p className="text-muted-foreground">Você ainda não tem uma assinatura ativa.</p>
            <Link to="/planos" className="mt-4 inline-block">
              <Button className="glow-blue">Ver planos</Button>
            </Link>
          </Card>
        ) : (
          <>
            <Card className="card-glass mt-8 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Plano atual</p>
                  <p className={`text-3xl font-bold ${info?.cor ?? "gradient-text"}`}>
                    {info?.nome ?? access.tier}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{info?.preco ?? ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-muted-foreground">Status</p>
                  <p className="text-lg font-bold text-green-500">ATIVO</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 p-3 text-sm">
                  {access.vitalicio ? <Inf className="h-4 w-4 text-emerald-400" /> : <Calendar className="h-4 w-4 text-primary" />}
                  <span>
                    {access.vitalicio ? (
                      <>Acesso <b>vitalício</b> — nunca expira</>
                    ) : access.expiresAt ? (
                      <>Vence em <b>{access.expiresAt.toLocaleDateString("pt-BR")}</b> ({access.daysLeft} dias)</>
                    ) : (
                      "Acesso ativo"
                    )}
                  </span>
                </div>
                {access.credits !== null && (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm">
                    <Zap className="h-4 w-4 text-primary" />
                    <span><b className="text-primary">{access.credits}</b> créditos de redação restantes</span>
                  </div>
                )}
              </div>

              {info && (
                <div className="mt-6">
                  <p className="text-xs uppercase text-muted-foreground">Seus benefícios</p>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {info.beneficios.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <Link to="/planos"><Button variant="outline">Mudar de plano</Button></Link>
                <Link to="/dashboard"><Button className="glow-blue">Ir para o Dashboard</Button></Link>
              </div>
            </Card>

            <h2 className="mt-10 text-xl font-semibold">Histórico de pagamentos</h2>
            {pagamentos.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
            ) : (
              <div className="mt-4 grid gap-2">
                {pagamentos.map((c) => (
                  <Card key={c.id} className="card-glass flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{formato(c.valor_centavos)} <span className="text-muted-foreground">— {c.plan_type}</span></p>
                        <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold uppercase ${c.status === "approved" ? "text-green-500" : c.status === "rejected" ? "text-red-500" : "text-yellow-500"}`}>
                      {c.status}
                    </span>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </section>
      <Footer />
    </div>
  );
}
