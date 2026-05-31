import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Lock, Sparkles, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { VideoPlayer } from "@/components/video-player";
import { supabase } from "@/integrations/supabase/client";
import { type PlanTier, usePlanAccess } from "@/hooks/use-plan-access";
import { toast } from "sonner";

/**
 * Mapa de links de vídeo. Chave = título exato da aula (campo `t`).
 * Para liberar uma aula, basta adicionar a entrada com URL do YouTube.
 * Exemplo: "Estrutura dissertativo-argumentativa perfeita": "https://www.youtube.com/watch?v=XXXXX"
 */
const VIDEO_LINKS: Record<string, string> = {
  // Adicionar links aqui conforme forem enviados.
};

export const Route = createFileRoute("/aulas")({
  head: () => ({
    meta: [
      { title: "Vídeo Aulas ENEM – Nota 1000 ENEM" },
      { name: "description", content: "Vídeo aulas focadas em alta performance no ENEM: redação, matemática, linguagens e mais." },
    ],
  }),
  component: Aulas,
});

function gerar(titulos: string[]): { t: string; min: number }[] {
  return titulos.map((t, i) => ({ t, min: 10 + ((i * 3) % 22) }));
}

type VideoLesson = { title: string; video_url: string; access_tier: string };

function canAccessArea(tier: PlanTier, area: string) {
  if (tier === "full" || tier === "vitalicio") return true;
  if (tier === "pro") return ["Matemática e suas Tecnologias", "Linguagens, Códigos e suas Tecnologias", "Ciências Humanas e suas Tecnologias", "Ciências da Natureza e suas Tecnologias"].includes(area);
  if (tier === "light") return ["Linguagens, Códigos e suas Tecnologias", "Ciências da Natureza e suas Tecnologias"].includes(area);
  return false;
}

const trilhas = [
  {
    area: "Matemática e suas Tecnologias",
    cor: "from-blue-500/30 to-blue-500/5",
    aulas: gerar([
      "As 10 questões que sempre caem no ENEM",
      "Geometria plana sem decoreba",
      "Funções: lineares, quadráticas e exponenciais",
      "Porcentagem, juros e matemática financeira",
      "Probabilidade e análise combinatória",
      "Estatística: média, mediana e moda no ENEM",
      "Trigonometria essencial",
      "Geometria espacial: volumes e sólidos",
      "Razões, proporções e regra de três",
      "Resolução cronometrada: simulado relâmpago",
    ]),
  },
  {
    area: "Linguagens, Códigos e suas Tecnologias",
    cor: "from-fuchsia-500/30 to-fuchsia-500/5",
    aulas: gerar([
      "Interpretação de texto que não falha",
      "Figuras de linguagem cobradas no ENEM",
      "Literatura brasileira: o que estudar de verdade",
      "Variação linguística e norma culta",
      "Funções da linguagem na prática",
      "Gêneros textuais que mais aparecem",
      "Inglês: leitura estratégica em 1 hora",
      "Espanhol: cognatos e falsos amigos",
      "Artes, música e cultura no ENEM",
      "Educação física e esporte como tema",
    ]),
  },
  {
    area: "Ciências Humanas e suas Tecnologias",
    cor: "from-amber-500/30 to-amber-500/5",
    aulas: gerar([
      "História do Brasil: República em 1 aula",
      "Era Vargas e ditadura militar",
      "Geografia do Brasil: regiões e clima",
      "Globalização e geopolítica atual",
      "Filosofia: dos clássicos a Foucault",
      "Sociologia: Marx, Weber e Durkheim",
      "Movimentos sociais e cidadania",
      "Cartografia e leitura de mapas",
      "História Geral: revoluções e guerras",
      "Atualidades que sempre caem",
    ]),
  },
  {
    area: "Ciências da Natureza e suas Tecnologias",
    cor: "from-emerald-500/30 to-emerald-500/5",
    aulas: gerar([
      "Física: mecânica essencial para o ENEM",
      "Eletricidade e circuitos descomplicados",
      "Termologia e calorimetria",
      "Óptica e ondas",
      "Química orgânica em 1 aula",
      "Estequiometria sem sofrer",
      "Soluções, pH e equilíbrio químico",
      "Biologia: ecologia e meio ambiente",
      "Genética: Mendel ao DNA",
      "Fisiologia humana e doenças no ENEM",
    ]),
  },
  {
    area: "Redação completa",
    cor: "from-primary/30 to-primary/5",
    aulas: gerar([
      "Estrutura dissertativo-argumentativa perfeita",
      "Como construir uma tese forte",
      "Repertórios socioculturais que pontuam",
      "Argumentação por dados e citações",
      "Coesão e conectivos avançados",
      "Proposta de intervenção nota 1000",
      "Erros que zeram a redação",
      "Modo Professor Rígido: como usar",
      "Análise de redações nota 1000 reais",
      "Simulado: escreva e corrija em 1h",
    ]),
  },
  {
    area: "BÔNUS — 9 segredos para aprovação no vestibular",
    cor: "from-yellow-500/30 to-yellow-500/5",
    aulas: [
      { t: "Segredo 1: A rotina secreta dos aprovados", min: 18 },
      { t: "Segredo 2: Como estudar 3x mais rápido", min: 22 },
      { t: "Segredo 3: A técnica dos 90 minutos", min: 15 },
      { t: "Segredo 4: Memorizar sem decorar", min: 19 },
      { t: "Segredo 5: O que fazer 30 dias antes da prova", min: 24 },
      { t: "Segredo 6: Controle de ansiedade no dia D", min: 17 },
      { t: "Segredo 7: Como gabaritar com chute estratégico", min: 13 },
      { t: "Segredo 8: A mentalidade do aluno top 1%", min: 21 },
      { t: "Segredo 9: O ritual da véspera da prova", min: 14 },
    ],
  },
];

function Aulas() {
  const [openLock, setOpenLock] = useState(false);
  const [aulaSelecionada, setAulaSelecionada] = useState<string>("");
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const { tier, isPaid: planoPago, loading: planLoading } = usePlanAccess();
  const [videos, setVideos] = useState<Record<string, VideoLesson>>({});

  useEffect(() => {
    supabase.from("video_lessons").select("title, video_url, access_tier").then(({ data }) => {
      const mapa = Object.fromEntries(((data as VideoLesson[] | null) ?? []).map((v) => [v.title, v]));
      setVideos(mapa);
    });
  }, []);

  function handleClick(titulo: string, area: string) {
    const liberada = planoPago && canAccessArea(tier, area);
    const url = videos[titulo]?.video_url || VIDEO_LINKS[titulo];
    if (url && liberada) {
      setAulaSelecionada(titulo);
      setVideoUrl(url);
      setVideoOpen(true);
      return;
    }
    setAulaSelecionada(titulo);
    if (liberada) {
      toast.success("Aula liberada no seu plano. O vídeo será adicionado em breve.");
      return;
    }
    if (!planLoading) setOpenLock(true);
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
          <span className="font-semibold text-primary">Aula nova toda semana</span> (em cada matéria) até o dia da prova.
        </p>

        <div className="mt-10 space-y-14">
          {[...trilhas]
            .sort((a, b) => {
              const aLib = planoPago && canAccessArea(tier, a.area) ? 0 : 1;
              const bLib = planoPago && canAccessArea(tier, b.area) ? 0 : 1;
              return aLib - bLib;
            })
            .map((tr) => (
              <div key={tr.area}>
              <div className="mb-4 flex items-end justify-between gap-3">

                <div>
                  <h2 className="text-xl font-semibold md:text-2xl">{tr.area}</h2>
                  <p className="text-xs text-muted-foreground">{tr.aulas.length} aulas</p>
                </div>
                <Badge variant="outline" className="border-primary/40 text-primary">Trilha completa</Badge>
              </div>
              <Carousel opts={{ align: "start" }} className="px-10 md:px-12">
                <CarouselContent>
                  {tr.aulas.map((a, idx) => {
                    const liberada = planoPago && canAccessArea(tier, tr.area);
                    return <CarouselItem key={a.t} className="basis-4/5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                      <Card
                        onClick={() => handleClick(a.t, tr.area)}
                        className="card-glass h-full cursor-pointer overflow-hidden transition-transform hover:-translate-y-1 hover:glow-blue"
                      >
                        <div className={`relative aspect-video bg-gradient-to-br ${tr.cor}`}>
                          <div className="absolute inset-0 grid place-content-center">
                            <PlayCircle className="h-14 w-14 text-primary/40 drop-shadow-lg" />
                          </div>
                          {!liberada && (
                            <div className="absolute inset-0 grid place-content-center bg-background/40 backdrop-blur-sm">
                              <div className="grid h-14 w-14 place-content-center rounded-full bg-background/80 ring-2 ring-primary/40">
                                <Lock className="h-7 w-7 text-primary" />
                              </div>
                            </div>
                          )}
                          <Badge className="absolute top-3 right-3" variant="outline">
                            {liberada ? <><PlayCircle className="mr-1 h-3 w-3" /> Liberada</> : <><Lock className="mr-1 h-3 w-3" /> Premium</>}
                          </Badge>
                          <span className="absolute top-3 left-3 rounded-md bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/30">
                            Aula {String(idx + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <div className="p-4">
                          <h3 className="line-clamp-2 text-sm font-medium">{a.t}</h3>
                          <p className="mt-1 text-xs text-muted-foreground">{a.min} min</p>
                        </div>
                      </Card>
                    </CarouselItem>;
                  })}
                </CarouselContent>
                <CarouselPrevious className="left-0" />
                <CarouselNext className="right-0" />
              </Carousel>
              </div>
            ))}
        </div>


        <Card className="card-glass mt-12 p-8 text-center">
          <h3 className="text-2xl font-bold">Faça parte da nossa comunidade</h3>
          <p className="mt-2 text-muted-foreground">
            <a
              href="https://t.me/+wr3mUBagkQkyODYx"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Entre no GRUPO VIP do ENEM no Telegram pra fazer network e aprender ainda mais
            </a>
          </p>
          <a href="https://t.me/+wr3mUBagkQkyODYx" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
            <Button size="lg" className="glow-blue">Entrar no Telegram</Button>
          </a>
        </Card>
      </section>

      <Dialog open={openLock} onOpenChange={setOpenLock}>
        <DialogContent className="card-glass border-primary/30 sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 grid h-14 w-14 place-content-center rounded-full bg-primary/10 ring-2 ring-primary/40">
              <Crown className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-center text-2xl">
              {planoPago ? "Faça upgrade para liberar" : "Escolha um plano para começar!"}
            </DialogTitle>
            <DialogDescription className="text-center">
              A aula <span className="font-medium text-foreground">"{aulaSelecionada}"</span> faz parte do conteúdo premium.
              {planoPago && " Faça upgrade para um plano superior para acessar."}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 grid gap-2">
            {(() => {
              const upgrades = [
                { tier: "light" as PlanTier, label: "Ver Plano Light — R$ 19,90", variant: "outline" as const },
                { tier: "pro" as PlanTier, label: "Ver Plano Pro — R$ 29,90", variant: "default" as const, glow: true },
                { tier: "full" as PlanTier, label: "Ver Plano Full — R$ 49,90", variant: "outline" as const },
                { tier: "vitalicio" as PlanTier, label: "Ver Vitalício — R$ 499", variant: "outline" as const },
              ];
              const order: PlanTier[] = ["free", "light", "pro", "full", "vitalicio"];
              const currentIdx = order.indexOf(tier);
              const opcoes = upgrades.filter((u) => order.indexOf(u.tier) > currentIdx);
              return opcoes.map((u) => (
                <Link key={u.tier} to="/planos">
                  <Button className={`w-full ${u.glow ? "glow-blue" : ""}`} variant={u.variant}>
                    {u.label}
                  </Button>
                </Link>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>

      <VideoPlayer
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        videoUrl={videoUrl}
        title={aulaSelecionada}
      />


      <Footer />
    </div>
  );
}