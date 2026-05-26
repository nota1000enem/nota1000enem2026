import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Lock, Sparkles, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/aulas")({
  head: () => ({
    meta: [
      { title: "Vídeo Aulas ENEM – Nota 1000 ENEM" },
      { name: "description", content: "Vídeo aulas focadas em alta performance no ENEM: redação, matemática, linguagens e mais." },
    ],
  }),
  component: Aulas,
});

const trilhas = [
  {
    area: "Redação Nota 1000",
    cor: "from-primary/30 to-primary/5",
    aulas: [
      { t: "Estrutura dissertativo-argumentativa", min: 12, free: true },
      { t: "Repertórios socioculturais que pontuam", min: 18, free: true },
      { t: "Proposta de intervenção perfeita", min: 14, free: false },
      { t: "Coesão e conectivos avançados", min: 16, free: false },
    ],
  },
  {
    area: "Matemática estratégica",
    cor: "from-blue-500/30 to-blue-500/5",
    aulas: [
      { t: "As 10 questões que sempre caem", min: 22, free: true },
      { t: "Geometria sem decoreba", min: 19, free: false },
      { t: "Funções na prática do ENEM", min: 24, free: false },
    ],
  },
  {
    area: "Linguagens e Códigos",
    cor: "from-fuchsia-500/30 to-fuchsia-500/5",
    aulas: [
      { t: "Interpretação de texto que não falha", min: 17, free: true },
      { t: "Literatura cobrada de verdade", min: 21, free: false },
      { t: "Inglês/Espanhol em 1h", min: 28, free: false },
    ],
  },
];

function Aulas() {
  const [openLock, setOpenLock] = useState(false);
  const [aulaSelecionada, setAulaSelecionada] = useState<string>("");

  function handleClick(titulo: string) {
    setAulaSelecionada(titulo);
    setOpenLock(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-12">
        <Badge variant="outline" className="border-primary/40 text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> Conteúdo focado em aprovação
        </Badge>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">
          Vídeo aulas <span className="gradient-text">Nota 1000 ENEM</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Trilhas curtas e diretas ao ponto, sem enrolação, focadas no que mais cai no ENEM.
        </p>

        <div className="mt-10 space-y-10">
          {trilhas.map((tr) => (
            <div key={tr.area}>
              <h2 className="mb-4 text-xl font-semibold">{tr.area}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tr.aulas.map((a) => (
                  <Card
                    key={a.t}
                    onClick={() => handleClick(a.t)}
                    className="card-glass cursor-pointer overflow-hidden transition-transform hover:-translate-y-1 hover:glow-blue"
                  >
                    <div className={`relative aspect-video bg-gradient-to-br ${tr.cor}`}>
                      <div className="absolute inset-0 grid place-content-center">
                        <PlayCircle className="h-14 w-14 text-primary/40 drop-shadow-lg" />
                      </div>
                      <div className="absolute inset-0 grid place-content-center bg-background/40 backdrop-blur-sm">
                        <div className="grid h-16 w-16 place-content-center rounded-full bg-background/80 ring-2 ring-primary/40">
                          <Lock className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      <Badge className="absolute top-3 right-3" variant="outline">
                        <Lock className="mr-1 h-3 w-3" /> Premium
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium">{a.t}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{a.min} min</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Card className="card-glass mt-12 p-8 text-center">
          <h3 className="text-2xl font-bold">Desbloqueie todas as aulas</h3>
          <p className="mt-2 text-muted-foreground">Acesso completo com o plano Pro ou Full Acesso.</p>
          <Link to="/planos" className="mt-4 inline-block">
            <Button size="lg" className="glow-blue">Ver planos</Button>
          </Link>
        </Card>
      </section>

      <Dialog open={openLock} onOpenChange={setOpenLock}>
        <DialogContent className="card-glass border-primary/30 sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 grid h-14 w-14 place-content-center rounded-full bg-primary/10 ring-2 ring-primary/40">
              <Crown className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-center text-2xl">Escolha um plano para começar!</DialogTitle>
            <DialogDescription className="text-center">
              A aula <span className="font-medium text-foreground">"{aulaSelecionada}"</span> faz parte do conteúdo premium.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 grid gap-2">
            <Link to="/planos"><Button className="w-full" variant="outline">Ver Plano Light — R$ 19,90</Button></Link>
            <Link to="/planos"><Button className="w-full glow-blue">Ver Plano Pro — R$ 29,90</Button></Link>
            <Link to="/planos"><Button className="w-full" variant="outline">Ver Plano Full — R$ 49,90</Button></Link>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}