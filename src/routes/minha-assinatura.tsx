import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Crown, Calendar, CreditCard, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/minha-assinatura")({
  head: () => ({ meta: [{ title: "Minha Assinatura – Nota 1000 ENEM" }] }),
  component: MinhaAssinaturaPage,
});

type Assinatura = {
  id: string;
  plano: string;
  status: string;
  valor_centavos: number;
  iniciou_em: string | null;
  vence_em: string | null;
  proxima_cobranca_em: string | null;
  cancelou_em: string | null;
};
type Cobranca = {
  id: string;
  valor_centavos: number;
  status: string;
  vencimento: string;
  pago_em: string | null;
};

function MinhaAssinaturaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: ass } = await supabase
        .from("assinaturas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setAssinatura(ass as Assinatura | null);
      if (ass) {
        const { data: cobs } = await supabase
          .from("cobrancas")
          .select("*")
          .eq("assinatura_id", (ass as Assinatura).id)
          .order("vencimento", { ascending: false });
        setCobrancas((cobs ?? []) as Cobranca[]);
      }
      setFetching(false);
    })();
  }, [user]);

  async function cancelar() {
    if (!assinatura) return;
    if (!confirm("Tem certeza que deseja cancelar sua assinatura?")) return;
    const { error } = await supabase
      .from("assinaturas")
      .update({ status: "cancelada", cancelou_em: new Date().toISOString() })
      .eq("id", assinatura.id);
    if (error) return toast.error(error.message);
    toast.success("Assinatura cancelada. Você mantém acesso até o vencimento.");
    setAssinatura({ ...assinatura, status: "cancelada", cancelou_em: new Date().toISOString() });
  }

  const formato = (c: number) => `R$ ${(c / 100).toFixed(2).replace(".", ",")}`;
  const diasRestantes = assinatura?.vence_em
    ? Math.max(0, Math.ceil((new Date(assinatura.vence_em).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-12">
        <Badge variant="outline" className="border-primary/40 text-primary">
          <Crown className="mr-1 h-3 w-3" /> Sua assinatura
        </Badge>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Minha <span className="gradient-text">Assinatura</span></h1>

        {fetching ? (
          <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>
        ) : !assinatura ? (
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
                  <p className="text-2xl font-bold gradient-text capitalize">{assinatura.plano}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formato(assinatura.valor_centavos)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-muted-foreground">Status</p>
                  <p className={`text-lg font-bold ${assinatura.status === "ativa" ? "text-green-500" : "text-yellow-500"}`}>
                    {assinatura.status}
                  </p>
                </div>
              </div>
              {assinatura.vence_em && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 p-3 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>Vence em <b>{new Date(assinatura.vence_em).toLocaleDateString("pt-BR")}</b> ({diasRestantes} dias restantes)</span>
                </div>
              )}
              {assinatura.cancelou_em && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-3 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span>Cancelada em {new Date(assinatura.cancelou_em).toLocaleDateString("pt-BR")}. Acesso até o vencimento.</span>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/planos"><Button variant="outline">Mudar de plano</Button></Link>
                {assinatura.status === "ativa" && !assinatura.cancelou_em && (
                  <Button variant="outline" onClick={cancelar}>Cancelar assinatura</Button>
                )}
              </div>
            </Card>

            <h2 className="mt-10 text-xl font-semibold">Histórico de cobranças</h2>
            {cobrancas.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Nenhuma cobrança ainda.</p>
            ) : (
              <div className="mt-4 grid gap-2">
                {cobrancas.map((c) => (
                  <Card key={c.id} className="card-glass flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{formato(c.valor_centavos)}</p>
                        <p className="text-xs text-muted-foreground">Venc.: {new Date(c.vencimento).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold uppercase ${c.status === "paga" ? "text-green-500" : c.status === "falhou" ? "text-red-500" : "text-yellow-500"}`}>
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