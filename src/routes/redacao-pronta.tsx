import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import redacaoPronta from "@/assets/redacao-pronta.png.asset.json";

export const Route = createFileRoute("/redacao-pronta")({
  head: () => ({
    meta: [
      { title: "Redação Pronta ENEM — Modelo Coringa | Nota 1000" },
      {
        name: "description",
        content:
          "Acesse gratuitamente um modelo de redação pronta para o ENEM. Estrutura coringa que se adapta a qualquer tema.",
      },
    ],
    links: [{ rel: "canonical", href: "https://nota1000enem.online/redacao-pronta" }],
  }),
  component: RedacaoProntaPage,
});

function RedacaoProntaPage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm text-primary">
            <FileText className="h-4 w-4" /> Modelo Coringa ENEM
          </div>
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            Redação <span className="gradient-text">Pronta</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Um modelo de redação coringa que se adapta a praticamente qualquer tema do ENEM. Basta
            preencher os campos em destaque com o tema escolhido.
          </p>
        </div>

        <Card className="card-glass mt-10 overflow-hidden p-0">
          {loading ? (
            <div className="flex h-96 items-center justify-center text-muted-foreground">
              Carregando…
            </div>
          ) : user ? (
            <img
              src={redacaoPronta.url}
              alt="Modelo de redação pronta para o ENEM"
              className="h-auto w-full"
              loading="lazy"
            />
          ) : (
            <div className="relative">
              <img
                src={redacaoPronta.url}
                alt="Modelo de redação pronta para o ENEM (bloqueado)"
                className="h-auto w-full blur-md select-none pointer-events-none"
                aria-hidden
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/70 backdrop-blur-sm p-6 text-center">
                <Lock className="h-12 w-12 text-primary" />
                <h2 className="text-2xl font-bold md:text-3xl">
                  Faça Login para acessar Grátis
                </h2>
                <p className="max-w-md text-muted-foreground">
                  Acesso 100% gratuito. Entre com sua conta para ver a redação pronta completa.
                </p>
                <Link to="/auth">
                  <Button size="lg" className="glow-blue">
                    Fazer Login Grátis
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </section>

      <Footer />
    </div>
  );
}
