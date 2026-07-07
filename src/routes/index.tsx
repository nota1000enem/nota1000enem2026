import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { lazy } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Sparkles, Star, ArrowRight } from "lucide-react";
import heroAsset from "@/assets/hero-vecel.webp.asset.json";
import { LazyOnVisible } from "@/components/lazy-on-visible";
import { HeroFX } from "@/components/hero-fx";

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
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* HERO */}
      <section className="relative gradient-hero overflow-hidden">
        <HeroFX />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 py-24 md:grid-cols-2 md:py-36">
          <div className="space-y-8">
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
            <p className="text-lg leading-relaxed text-muted-foreground">
              <span className="block text-xl font-semibold text-foreground">
                Corrija sua redação com IA e descubra onde melhorar.
              </span>
              <span className="mt-3 block">
                Corrija sua redação com <span className="font-semibold text-foreground">99% de assertividade na nota</span>, baseada no ENEM 2026. De brinde você recebe uma plataforma completa com redações prontas para aprender, vídeo aulas, plano de estudos personalizado e mais de <span className="font-semibold text-foreground">500 PDFs para o ENEM 2026</span> — tudo focado na sua aprovação.
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
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" /> 4.9/5 alunos
              </div>
              <div>+ de 78 mil redações corrigidas</div>
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
