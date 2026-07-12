import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { lazy } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Sparkles, Star, ArrowRight } from "lucide-react";
import heroAsset from "@/assets/hero-vecel.webp.asset.json";
import mecAsset from "@/assets/mec-certificado.png.asset.json";
import { LazyOnVisible } from "@/components/lazy-on-visible";
import { HeroFX } from "@/components/hero-fx";
import { InstallAppButton } from "@/components/install-app-button";

const HomeBelowFold = lazy(() => import("@/components/home/below-fold"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ENEM 2026: Corretor de Redação com IA | Nota 1000 ENEM" },
      {
        name: "description",
        content:
          "Plataforma de preparação para o ENEM: correção de Redação por IA, 1.000+ questões, simulados e plano de estudo personalizado. Treine para a nota 1000.",
      },
      { name: "keywords", content: "ENEM 2026, redação ENEM, corretor de redação IA, nota 1000, simulado ENEM, questões ENEM, vídeo aulas ENEM" },
      { property: "og:title", content: "Nota 1000 ENEM – Redação por IA + Simulados" },
      {
        property: "og:description",
        content:
          "Corrija sua Redação do ENEM por IA em segundos, treine com simulados e vídeo aulas.",
      },
      { property: "og:url", content: "https://nota1000enem.online/" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "https://nota1000enem.online/" },
      { rel: "preload", as: "image", href: "/__l5e/assets-v1/b53a904c-0cfd-4dfe-b23f-d5e9a1bf9f5c/hero-vecel.webp", fetchPriority: "high" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="home-app min-h-screen bg-background">
      <Navbar />
      {/* HERO */}
      <section className="relative gradient-hero overflow-hidden">
        <HeroFX />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 md:grid-cols-2 md:py-16">
          <div className="space-y-6">
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 text-primary backdrop-blur"
            >
              <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <Sparkles className="mr-1 h-3 w-3" /> IA treinada nas competências do ENEM
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Seja aprovado no ENEM, estudando menos de 67 dias com{" "}
              <span className="gradient-text text-glow">Inteligência Artificial</span>
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              <span className="block text-base font-semibold text-foreground md:text-lg">
                Corrija sua redação com IA e descubra onde melhorar.
              </span>
              <span className="mt-3 block">
                Sua redação pode evoluir muito mais rápido quando você sabe onde está errando.
              </span>
              <span className="mt-2 block">
                Aqui, você corrige sua redação com IA no padrão ENEM 2026 e ainda recebe redações modelo, videoaulas com professores reais, plano de estudos com IA e + de <span className="font-semibold text-foreground">500 PDFs</span> para estudar melhor.
              </span>
              <span className="mt-2 block">
                Prepare-se com estratégia e aumente suas chances de aprovação.
              </span>
              <span className="mt-3 block">
                <span className="font-semibold text-primary">TESTE GRÁTIS AGORA.</span>{" "}
                <span className="font-semibold text-foreground">Sem cartão de crédito.</span>
              </span>
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/redacao">
                <Button size="lg" className="glow-blue animate-pulse-glow">
                  Corrigir minha redação grátis <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/planos">
                <Button size="lg" variant="outline" className="border-primary/40 backdrop-blur hover:bg-primary/10">
                  MAPA da APROVAÇÃO 2026
                </Button>
              </Link>
              <InstallAppButton className="h-11 px-6 text-base" />
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" /> 4.9/5 alunos
              </div>
              <div>+ de 78 mil redações corrigidas</div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <img
                src={mecAsset.url}
                alt="Certificado reconhecido pelo MEC"
                width={96}
                height={120}
                loading="eager"
                decoding="async"
                className="h-20 w-auto md:h-24 drop-shadow-[0_0_18px_rgba(255,200,80,0.35)]"
              />
              <div className="text-xs md:text-sm">
                <p className="font-semibold text-foreground">Certificado reconhecido pelo MEC</p>
                <p className="text-muted-foreground">Validade nacional após conclusão</p>
              </div>
            </div>
          </div>
          <div className="relative animate-float md:mt-8">
            <div className="mockup-frame">
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={heroAsset.url}
                  alt="Nota 1000 ENEM — Redação corrigida por IA com plano de estudos personalizado"
                  width={1536}
                  height={1024}
                  className="aspect-[3/2] w-full rounded-2xl object-cover"
                  loading="eager"
                  fetchPriority="high"
                  decoding="sync"
                />
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
              </div>
            </div>
          </div>
        </div>


      </section>

      {/* Tudo abaixo da dobra é lazy-loaded via IntersectionObserver */}
      <LazyOnVisible rootMargin="800px" minHeight={1200}>
        <HomeBelowFold />
      </LazyOnVisible>

      <Footer />
    </div>
  );
}
