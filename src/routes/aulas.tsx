import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Lock } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { VideoPlayer } from "@/components/video-player";
import { supabase } from "@/integrations/supabase/client";
import { type PlanTier, usePlanAccess } from "@/hooks/use-plan-access";
import { toast } from "sonner";
import thumbMatematica from "@/assets/thumb-matematica.png";
import thumbLinguagens from "@/assets/thumb-linguagens-codigos.png";
import thumbHumanas from "@/assets/thumb-ciencias-humanas.png";
import thumbNatureza from "@/assets/thumb-ciencias-natureza.png";
import thumbRedacao from "@/assets/thumb-redacao.png";
import thumbBonus from "@/assets/thumb-bonus.png";

const VIDEO_LINKS: Record<string, string> = {
  "🧠 SEMANA DA MATEMÁTICA BÁSICA!! Aulão Completo": "https://youtu.be/MgeQ_Cf7WWg",
  "TUDO DE MATEMÁTICA PARA O ENEM - Aula completa": "https://youtu.be/MA_ZrgV2xws",
  "📈 INTERPRETAÇÃO DE GRÁFICOS, EQUAÇÕES E FUNÇÕES: Aula Completa": "https://youtu.be/yFjm_ObxOzo",
  "TUDO DE PROBABILIDADE E ANÁLISE COMBINATÓRIA (Ensino Médio e ENEM)": "https://youtu.be/GDf8TkPh59k",
  "TUDO DE GEOMETRIA E TRIGONOMETRIA PARA O ENEM 2024!!": "https://youtu.be/EieOYCmWHHM",
  "TUDO de Matemática do Ensino FUNDAMENTAL pro ENEM 2026 (pra quem tem MUITA DIFICULDADE)": "https://youtu.be/JQfJMJrV5Bk",
  "AULÃO ENEM: O que mais cai em FÍSICA no Enem": "https://www.youtube.com/live/DYpF0DJHfk0",
  "TUDO de QUÍMICA GERAL pro ENEM 2026 (GANHE MUITOS ACERTOS)": "https://youtu.be/S5O-_kHn3W0",
  "Revisão Completa ENEM: Códigos, Linguagens e Redação!": "https://youtu.be/wSTuQIFBW7o",
  "TUDO sobre FUNÇÕES DA LINGUAGEM pro ENEM - Referencial, conativa, metalinguística, poética, fática": "https://youtu.be/fN-tmG-kzzw",
  "10 horas de aulas (Linguagens códigos e suas tecnologias)": "https://youtu.be/KwtFbA6QLWI",
  "TODOS OS EXERCÍCIOS - LINGUAGENS": "https://youtu.be/sTqMFMEMxr8",
  "11 Horas de Aula (Linguagens códigos e suas tecnologias)": "https://youtu.be/EcFsAkgu-_A",
  "Ciências Humanas e suas Tecnologias no ENEM": "https://www.youtube.com/live/53fJePeNMRA",
  "ENEM 2026 | REVISÃO COMPLETA DE CIÊNCIAS HUMANAS": "https://youtu.be/ka2w_C8rJfQ",
  "✅ MACETES de HUMANAS para o ENEM 2026 (+800 PONTOS com eles!)": "https://youtu.be/SX8fSMUTLGU",
  "Aulão de Revisão Enem: Ciências Humanas e suas Tecnologias": "https://www.youtube.com/live/e2ARULf5zIU",
  "CORREÇÃO ENEM 2025 | LINGUAGENS, CIÊNCIAS HUMANAS E REDAÇÃO": "https://www.youtube.com/live/ApF2ckyAMgQ",
  "Revisão Final ENEM (PROVA 2021) - Ciências Humanas": "https://youtu.be/mN5xjPTQl4Q",
  "RESOLUÇÃO 2º simulado enem SAS 2026 - NATUREZA PARTE I": "https://youtu.be/sTqMFMEMxr8",
  "INTENSIVÃO ENEM: Revisão COMPLETA de Ciências da Natureza": "https://www.youtube.com/live/4_BBzVvXg18",
  "💪 CORREÇÃO DO ENEM NATUREZA 2025 (45 Acertos) - Ciências da Natureza": "https://www.youtube.com/live/pYQpeY-i2gk",
  "Como GABARITAR Ciências da NATUREZA do Enem 2026 na PRÁTICA": "https://youtu.be/t-JNhC5Vvm0",
  "🍀🤯 Ciências da Natureza e suas Tecnologias para o ENEM 2026: Revisão Completa 3 ANOS EM 4 HORAS!!": "https://youtu.be/NOBaD0hCGYU",
  "Como começar uma REDAÇÃO ENEM 2026 (900+)": "https://youtu.be/LAfiDT4TpHY",
  "AULÃO DE REDAÇÃO PARA O ENEM: como alcançar a nota 1000": "https://youtu.be/cVlfWDcIAfo",
  "AULÃO ENEM DE LITERATURA E REDAÇÃO: OS TEMAS QUE MAIS CAEM | AULÃO ENEM 2025": "https://www.youtube.com/live/u8NOTQQglew",
  "NOVO MODELO REDAÇÃO ENEM 2026 (+900 em QUALQUER TEMA)": "https://youtu.be/wYkCtbXVUZU",
  "COMO FAZER UMA REDAÇÃO NOTA MÁXIMA? ENEM 2026": "https://youtu.be/mYmrLdf5AWE",
  "RESOLVENDO LINGUAGENS DO ENEM 2023 AO VIVO - Live BÔNUS": "https://www.youtube.com/live/z-7F_ulvD90",
  "QUÍMICA ORGÂNICA no ENEM 2026: Tudo o que Cai (AULA COMPLETA)": "https://www.youtube.com/live/dIpxNWr4ZDI",
  "🔴 [ENEM 2025] GABARITO EXTRAOFICIAL Matemática": "https://www.youtube.com/live/Kcz3Y5fmweE",
  "🍀 CORREÇÃO COMPLETA BIOLOGIA #Enem 2021: Questões resolvidas PASSO A PASSO": "https://youtu.be/N72FaKjGP6M",
  "🚗 TUDO DE CINEMÁTICA PARA O ENEM!! - Física Básica Completa": "https://youtu.be/NCxNuTLIu9Y",
  "TUDO de HISTÓRIA DO BRASIL pro ENEM 2026 (teoria + questões)": "https://www.youtube.com/live/7HEKqvV2JiU",
};

export const Route = createFileRoute("/aulas")({
  head: () => ({
    meta: [
      { title: "Vídeo Aulas ENEM – Trilhas por área | Nota 1000 ENEM" },
      { name: "description", content: "Vídeo aulas focadas em alta performance no ENEM: redação, matemática, linguagens, humanas e natureza. Aula nova toda semana." },
      { property: "og:title", content: "Vídeo Aulas ENEM por área" },
      { property: "og:description", content: "Trilhas semanais de Matemática, Linguagens, Humanas, Natureza e Redação." },
      { property: "og:url", content: "https://nota1000enem.online/aulas" },
    ],
    links: [{ rel: "canonical", href: "https://nota1000enem.online/aulas" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Course",
          name: "Vídeo Aulas ENEM – Trilhas por área",
          description:
            "Trilhas de vídeo aulas para o ENEM cobrindo Matemática, Linguagens, Ciências Humanas, Ciências da Natureza e Redação.",
          provider: {
            "@type": "EducationalOrganization",
            name: "Nota 1000 ENEM",
            sameAs: "https://nota1000enem.online",
          },
          inLanguage: "pt-BR",
          hasCourseInstance: {
            "@type": "CourseInstance",
            courseMode: "online",
            courseWorkload: "PT40H",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: Object.entries(VIDEO_LINKS).slice(0, 20).map(([title, url], i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "VideoObject",
              name: title,
              description: title,
              contentUrl: url,
              embedUrl: url,
              uploadDate: "2025-01-01",
              thumbnailUrl: "https://nota1000enem.online/logo-nota1000.png",
            },
          })),
        }),
      },
    ],
  }),
  component: Aulas,
});

type VideoLesson = { title: string; video_url: string; access_tier: string };

type Trilha = {
  area: string;
  cor: string;
  thumb: string;
  aulas: { t: string; min: number }[];
};

function canAccessArea(tier: PlanTier, area: string) {
  if (tier === "full" || tier === "vitalicio") return true;
  if (tier === "pro") return ["Matemática e suas Tecnologias", "Linguagens, Códigos e suas Tecnologias", "Ciências Humanas e suas Tecnologias", "Ciências da Natureza e suas Tecnologias"].includes(area);
  if (tier === "light") return ["Linguagens, Códigos e suas Tecnologias", "Ciências da Natureza e suas Tecnologias"].includes(area);
  return false;
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours}:${String(minutes).padStart(2, "0")} horas`;
}

const trilhas: Trilha[] = [
  {
    area: "Matemática e suas Tecnologias",
    cor: "from-blue-500/30 to-blue-500/5",
    thumb: thumbMatematica,
    aulas: [
      { t: "🧠 SEMANA DA MATEMÁTICA BÁSICA!! Aulão Completo", min: 151 },
      { t: "TUDO DE MATEMÁTICA PARA O ENEM - Aula completa", min: 387 },
      { t: "📈 INTERPRETAÇÃO DE GRÁFICOS, EQUAÇÕES E FUNÇÕES: Aula Completa", min: 128 },
      { t: "TUDO DE PROBABILIDADE E ANÁLISE COMBINATÓRIA (Ensino Médio e ENEM)", min: 212 },
      { t: "TUDO DE GEOMETRIA E TRIGONOMETRIA PARA O ENEM 2024!!", min: 208 },
      { t: "TUDO de Matemática do Ensino FUNDAMENTAL pro ENEM 2026 (pra quem tem MUITA DIFICULDADE)", min: 718 },
      { t: "AULÃO ENEM: O que mais cai em FÍSICA no Enem", min: 98 },
      { t: "TUDO de QUÍMICA GERAL pro ENEM 2026 (GANHE MUITOS ACERTOS)", min: 353 },
    ],
  },
  {
    area: "Linguagens, Códigos e suas Tecnologias",
    cor: "from-fuchsia-500/30 to-fuchsia-500/5",
    thumb: thumbLinguagens,
    aulas: [
      { t: "Revisão Completa ENEM: Códigos, Linguagens e Redação!", min: 149 },
      { t: "TUDO sobre FUNÇÕES DA LINGUAGEM pro ENEM - Referencial, conativa, metalinguística, poética, fática", min: 69 },
      { t: "10 horas de aulas (Linguagens códigos e suas tecnologias)", min: 620 },
      { t: "TODOS OS EXERCÍCIOS - LINGUAGENS", min: 129 },
      { t: "11 Horas de Aula (Linguagens códigos e suas tecnologias)", min: 720 },
    ],
  },
  {
    area: "Ciências Humanas e suas Tecnologias",
    cor: "from-amber-500/30 to-amber-500/5",
    thumb: thumbHumanas,
    aulas: [
      { t: "Ciências Humanas e suas Tecnologias no ENEM", min: 73 },
      { t: "ENEM 2026 | REVISÃO COMPLETA DE CIÊNCIAS HUMANAS", min: 162 },
      { t: "✅ MACETES de HUMANAS para o ENEM 2026 (+800 PONTOS com eles!)", min: 36 },
      { t: "Aulão de Revisão Enem: Ciências Humanas e suas Tecnologias", min: 360 },
      { t: "CORREÇÃO ENEM 2025 | LINGUAGENS, CIÊNCIAS HUMANAS E REDAÇÃO", min: 180 },
      { t: "Revisão Final ENEM (PROVA 2021) - Ciências Humanas", min: 74 },
    ],
  },
  {
    area: "Ciências da Natureza e suas Tecnologias",
    cor: "from-emerald-500/30 to-emerald-500/5",
    thumb: thumbNatureza,
    aulas: [
      { t: "INTENSIVÃO ENEM: Revisão COMPLETA de Ciências da Natureza", min: 550 },
      { t: "RESOLUÇÃO 2º simulado enem SAS 2026 - NATUREZA PARTE I", min: 129 },
      { t: "💪 CORREÇÃO DO ENEM NATUREZA 2025 (45 Acertos) - Ciências da Natureza", min: 201 },
      { t: "Como GABARITAR Ciências da NATUREZA do Enem 2026 na PRÁTICA", min: 40 },
      { t: "🍀🤯 Ciências da Natureza e suas Tecnologias para o ENEM 2026: Revisão Completa 3 ANOS EM 4 HORAS!!", min: 267 },
    ],
  },
  {
    area: "Redação completa",
    cor: "from-primary/30 to-primary/5",
    thumb: thumbRedacao,
    aulas: [
      { t: "Como começar uma REDAÇÃO ENEM 2026 (900+)", min: 79 },
      { t: "AULÃO DE REDAÇÃO PARA O ENEM: como alcançar a nota 1000", min: 73 },
      { t: "AULÃO ENEM DE LITERATURA E REDAÇÃO: OS TEMAS QUE MAIS CAEM | AULÃO ENEM 2025", min: 138 },
      { t: "NOVO MODELO REDAÇÃO ENEM 2026 (+900 em QUALQUER TEMA)", min: 43 },
      { t: "COMO FAZER UMA REDAÇÃO NOTA MÁXIMA? ENEM 2026", min: 34 },
    ],
  },
  {
    area: "BÔNUS — Aulões e correções extras",
    cor: "from-yellow-500/30 to-yellow-500/5",
    thumb: thumbBonus,
    aulas: [
      { t: "RESOLVENDO LINGUAGENS DO ENEM 2023 AO VIVO - Live BÔNUS", min: 149 },
      { t: "QUÍMICA ORGÂNICA no ENEM 2026: Tudo o que Cai (AULA COMPLETA)", min: 206 },
      { t: "🔴 [ENEM 2025] GABARITO EXTRAOFICIAL Matemática", min: 214 },
      { t: "🍀 CORREÇÃO COMPLETA BIOLOGIA #Enem 2021: Questões resolvidas PASSO A PASSO", min: 67 },
      { t: "🚗 TUDO DE CINEMÁTICA PARA O ENEM!! - Física Básica Completa", min: 143 },
      { t: "TUDO de HISTÓRIA DO BRASIL pro ENEM 2026 (teoria + questões)", min: 214 },
    ],
  },
];

function Aulas() {
  const navigate = useNavigate();
  const [aulaSelecionada, setAulaSelecionada] = useState<string>("");
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const { tier, isPaid: planoPago, loading: planLoading, loggedIn } = usePlanAccess();
  const [videos, setVideos] = useState<Record<string, VideoLesson>>({});

  useEffect(() => {
    supabase.from("video_lessons").select("title, video_url, access_tier").then(({ data }) => {
      const mapa = Object.fromEntries(((data as VideoLesson[] | null) ?? []).map((v) => [v.title, v]));
      setVideos(mapa);
    });
  }, []);

  function isLiberada(titulo: string, area: string, idx: number) {
    if (idx < 2 && loggedIn) return true;
    return planoPago && canAccessArea(tier, area);
  }

  function handleClick(titulo: string, area: string, idx: number) {
    const liberada = isLiberada(titulo, area, idx);
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
    if (planLoading) {
      toast.info("Carregando seu acesso...");
      return;
    }
    if (idx < 2 && !loggedIn) {
      navigate({ to: "/auth" });
      return;
    }
    navigate({ to: "/planos", hash: "pro" });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold md:text-5xl font-display">
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
                <div className="mb-4">
                  <h2 className="text-xl font-semibold md:text-2xl">{tr.area}</h2>
                  <p className="text-xs text-muted-foreground">{tr.aulas.length} aulas</p>
                </div>
                <Carousel opts={{ align: "start" }} className="px-10 md:px-12">
                  <CarouselContent>
                    {tr.aulas.map((a, idx) => {
                      const liberada = isLiberada(a.t, tr.area, idx);
                      const free = idx < 2;
                      return (
                        <CarouselItem key={a.t} className="basis-4/5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                          <Card
                            onClick={() => handleClick(a.t, tr.area, idx)}
                            className="card-glass card-gradient-border h-full cursor-pointer overflow-hidden transition-transform hover:-translate-y-1"
                          >
                            <div className={`relative aspect-video overflow-hidden bg-gradient-to-br ${tr.cor}`}>
                              <img
                                src={tr.thumb}
                                alt={`Thumb da trilha ${tr.area}`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/20" />
                              <div className="absolute inset-0 grid place-content-center">
                                <div className="grid h-16 w-16 place-content-center rounded-full bg-background/75 shadow-lg ring-2 ring-primary/40 backdrop-blur-sm">
                                  <PlayCircle className="h-8 w-8 text-primary drop-shadow-lg" />
                                </div>
                              </div>
                              {!liberada && (
                                <div className="absolute inset-0 grid place-content-center bg-background/40 backdrop-blur-sm">
                                  <div className="relative grid h-16 w-16 place-content-center rounded-full btn-gradient-primary shadow-xl">
                                    <Lock className="h-7 w-7 text-white" />
                                  </div>
                                </div>
                              )}
                              <Badge className="absolute right-3 top-3" variant="outline">
                                {liberada ? (
                                  <><PlayCircle className="mr-1 h-3 w-3" /> Liberada</>
                                ) : free ? (
                                  <>Grátis com login</>
                                ) : (
                                  <><Lock className="mr-1 h-3 w-3" /> Premium</>
                                )}
                              </Badge>
                              <span className="absolute left-3 top-3 rounded-md bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/30">
                                Aula {String(idx + 1).padStart(2, "0")}
                              </span>
                            </div>
                            <div className="p-4">
                              <h3 className="line-clamp-2 text-sm font-medium font-display">{a.t}</h3>
                              <p className="mt-1 text-xs text-muted-foreground">{formatDuration(a.min)}</p>
                            </div>
                          </Card>
                        </CarouselItem>

                      );
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
