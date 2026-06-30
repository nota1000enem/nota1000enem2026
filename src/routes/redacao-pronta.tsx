import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import redacaoPronta from "@/assets/redacao-pronta.png.asset.json";
import modelo1 from "@/assets/redacao-modelo-1.png.asset.json";
import modelo2 from "@/assets/redacao-modelo-2.webp.asset.json";
import modelo3 from "@/assets/redacao-modelo-3.webp.asset.json";
import modelo4 from "@/assets/redacao-modelo-4.jpg.asset.json";
import modelo5 from "@/assets/redacao-modelo-5.jpg.asset.json";

const MODELOS_EXTRAS = [
  { src: modelo1.url, alt: "Modelo de redação ENEM com estrutura introdução, desenvolvimento e conclusão" },
  { src: modelo2.url, alt: "Exemplo de redação nota 1000 com tese e argumentação" },
  { src: modelo3.url, alt: "Esqueleto de redação ENEM passo a passo" },
  { src: modelo4.url, alt: "Sugestão de esqueleto estrutural para texto dissertativo-argumentativo" },
  { src: modelo5.url, alt: "Modelo completo de redação com introdução, desenvolvimento 1 e 2 e conclusão" },
];

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

        {(() => {
          const TODOS = [
            { src: redacaoPronta.url, alt: "Modelo de redação pronta para o ENEM" },
            ...MODELOS_EXTRAS,
          ];

          if (loading) {
            return (
              <Card className="card-glass card-gradient-border mt-10 overflow-hidden p-[3px]">
                <div className="flex h-96 items-center justify-center text-muted-foreground">
                  Carregando…
                </div>
              </Card>
            );
          }

          if (user) {
            return (
              <div className="mt-10 space-y-8">
                {TODOS.map((m, i) => (
                  <Card key={i} className="card-glass card-gradient-border overflow-hidden p-[3px]">
                    <img src={m.src} alt={m.alt} className="h-auto w-full" loading={i === 0 ? "eager" : "lazy"} />
                  </Card>
                ))}
              </div>
            );
          }

          return (
            <div className="mt-10 space-y-8">
              {TODOS.map((m, i) => (
                <Card key={i} className="card-glass card-gradient-border overflow-hidden p-[3px]">
                  <div className="relative">
                    <img
                      src={m.src}
                      alt={`${m.alt} (bloqueado)`}
                      className="h-auto w-full blur-md select-none pointer-events-none"
                      aria-hidden
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/70 backdrop-blur-sm p-6 text-center">
                      <Lock className="h-12 w-12 text-primary" />
                      <h2 className="text-2xl font-bold md:text-3xl">
                        Faça Login para acessar Grátis
                      </h2>
                      <p className="max-w-md text-muted-foreground">
                        Acesso 100% gratuito. Entre com sua conta para ver as redações prontas completas.
                      </p>
                      <Link to="/auth">
                        <Button size="lg" className="glow-blue">
                          Fazer Login Grátis
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          );
        })()}
      </section>

      <Footer />
    </div>
  );
}
