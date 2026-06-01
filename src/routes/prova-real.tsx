import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Download, CheckCircle2, Lock, Crown } from "lucide-react";
import { usePlanAccess } from "@/hooks/use-plan-access";

export const Route = createFileRoute("/prova-real")({
  head: () => ({
    meta: [
      { title: "Prova REAL ENEM – Provas e Gabaritos Oficiais | Nota 1000 ENEM" },
      {
        name: "description",
        content:
          "Baixe as provas reais do ENEM 2022, 2023, 2024 e 2025 (Dia 1 e Dia 2) com gabaritos oficiais em PDF.",
      },
    ],
  }),
  component: ProvaRealPage,
});

type Ano = {
  ano: number;
  provas: {
    dia: 1 | 2;
    prova: string;
    gabarito: string;
  }[];
};

const ANOS: Ano[] = [
  {
    ano: 2025,
    provas: [
      { dia: 1, prova: "/pdfs/enem-2025-dia-1.pdf", gabarito: "/pdfs/gabarito-enem-2025-dia-1.pdf" },
      { dia: 2, prova: "/pdfs/enem-2025-dia-2.pdf", gabarito: "/pdfs/gabarito-enem-2025-dia-2.pdf" },
    ],
  },
  {
    ano: 2024,
    provas: [
      { dia: 1, prova: "/pdfs/enem-2024-dia-1.pdf", gabarito: "/pdfs/gabarito-enem-2024-dia-1.pdf" },
      { dia: 2, prova: "/pdfs/enem-2024-dia-2.pdf", gabarito: "/pdfs/gabarito-enem-2024-dia-2.pdf" },
    ],
  },
  {
    ano: 2023,
    provas: [
      { dia: 1, prova: "/pdfs/enem-2023-dia-1.pdf", gabarito: "/pdfs/gabarito-enem-2023-dia-1.pdf" },
      { dia: 2, prova: "/pdfs/enem-2023-dia-2.pdf", gabarito: "/pdfs/gabarito-enem-2023-dia-2.pdf" },
    ],
  },
  {
    ano: 2022,
    provas: [
      { dia: 1, prova: "/pdfs/enem-2022-dia-1.pdf", gabarito: "/pdfs/gabarito-enem-2022-dia-1.pdf" },
      { dia: 2, prova: "/pdfs/enem-2022-dia-2.pdf", gabarito: "/pdfs/gabarito-enem-2022-dia-2.pdf" },
    ],
  },
];

function ProvaRealPage() {
  const { isPaid, loading } = usePlanAccess();
  const navigate = useNavigate();

  function handleDownload(e: React.MouseEvent) {
    if (!isPaid) {
      e.preventDefault();
      navigate({ to: "/planos" });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-12">
        <Badge variant="outline" className="border-primary/40 text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> Provas oficiais
        </Badge>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">
          Prova <span className="gradient-text">REAL</span> ENEM
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Baixe as provas oficiais aplicadas no ENEM com os respectivos gabaritos. Treine no formato
          real e confira suas respostas.
        </p>

        {!loading && !isPaid && (
          <Card className="card-glass mt-6 p-5 border-primary/40 bg-primary/5">
            <div className="flex items-start gap-3">
              <Crown className="mt-0.5 h-5 w-5 text-primary" />
              <div className="text-sm flex-1">
                <p className="font-semibold">Provas REAIS do ENEM são exclusivas para alunos pagos</p>
                <p className="mt-1 text-muted-foreground">
                  Assine qualquer plano (Light, Pro, Full ou Vitalício) para liberar todas as
                  PROVAS REAIS DO ENEM.
                </p>
              </div>
              <Link to="/planos">
                <Button size="sm" className="glow-blue">
                  Ver planos
                </Button>
              </Link>
            </div>
          </Card>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {ANOS.map((a) => (
            <Card
              key={a.ano}
              className="card-glass relative overflow-hidden border-primary/30 p-6"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{ background: "var(--gradient-primary, linear-gradient(135deg, hsl(var(--primary)/0.15), transparent))" }}
              />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <h2 className="text-4xl font-extrabold tracking-tight text-primary">{a.ano}</h2>
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                    {!loading && !isPaid ? (
                      <><Lock className="mr-1 h-3 w-3" /> Premium</>
                    ) : (
                      "ENEM"
                    )}
                  </Badge>
                </div>

                <div className="mt-6 space-y-5">
                  {a.provas.map((p) => (
                    <div key={p.dia} className="rounded-xl border border-border/60 bg-card/40 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="grid h-8 w-8 place-content-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-primary">
                          ENEM {String(a.ano).slice(-2)} — Prova Dia {p.dia}
                        </h3>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {isPaid ? (
                          <a href={p.prova} target="_blank" rel="noopener noreferrer">
                            <Button className="w-full glow-blue">
                              <Download className="mr-1 h-4 w-4" /> Prova Dia {p.dia}
                            </Button>
                          </a>
                        ) : (
                          <Button onClick={handleDownload} variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/10">
                            <Lock className="mr-1 h-4 w-4" /> Prova Dia {p.dia}
                          </Button>
                        )}
                        {isPaid ? (
                          <a href={p.gabarito} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/10">
                              <CheckCircle2 className="mr-1 h-4 w-4" /> Gabarito Dia {p.dia}
                            </Button>
                          </a>
                        ) : (
                          <Button onClick={handleDownload} variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/10">
                            <Lock className="mr-1 h-4 w-4" /> Gabarito Dia {p.dia}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
