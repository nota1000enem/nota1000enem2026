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
      { rel: "preload", as: "image", href: "/__l5e/assets-v1/7eb64ae9-b057-4f66-ac2b-9a5994658a39/hero-1000enem.png", fetchPriority: "high" },
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
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div className="space-y-6">
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 text-primary backdrop-blur"
            >
              <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <Sparkles className="mr-1 h-3 w-3" /> IA treinada nas competências do ENEM
            </Badge>
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Seja aprovado no ENEM, estudando menos de 30 dias com{" "}
              <span className="gradient-text text-glow">Inteligência Artificial</span>
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              <span className="block text-xl font-semibold text-foreground">
                Corrija sua redação com IA e descubra onde melhorar.
              </span>
              <span className="mt-3 block">
                Palavras-chave, redações prontas, vídeo aulas, corretor de redação por competência
                e plano de estudos personalizado — tudo focado na sua aprovação.
              </span>
              <span className="mt-3 block">
                <span className="font-semibold text-primary">TESTE GRÁTIS AGORA.</span>{" "}
                <span className="font-semibold text-foreground">Sem cartão de crédito.</span>
              </span>
            </p>
            <div className="flex flex-wrap gap-3">
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
            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" /> 4.9/5 alunos
              </div>
              <div>+ de 78 mil redações corrigidas</div>
            </div>
          </div>
          <div className="relative animate-float">
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

        {/* Faixa de áreas */}
        <div className="mx-auto max-w-5xl px-4 pb-16">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-primary/80">
            Trilhas do ENEM
          </p>
          <ul className="mt-6 mx-auto max-w-2xl divide-y divide-transparent">
            {[
              "Matemática e suas Tecnologias",
              "Linguagens, Códigos e suas Tecnologias",
              "Ciências Humanas e suas Tecnologias",
              "Ciências da Natureza e suas Tecnologias",
              "Redação",
              "+ 1.000 questões em VÍDEO",
            ].map((t, i, arr) => (
              <li key={t} data-reveal>
                <div className="py-4 text-center text-base font-medium text-foreground md:text-lg">
                  {t}
                </div>
                {i < arr.length - 1 && <div className="divider-gradient" />}
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center" data-reveal>
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary ring-1 ring-primary/30">
              ✦ Aula nova toda semana
            </span>
            <p className="mx-auto mt-4 max-w-3xl text-sm text-muted-foreground md:text-base">
              Estude todas as áreas do ENEM com correções inteligentes, trilhas
              personalizadas e foco na <span className="gradient-text font-semibold">nota 1.000</span>.
              Tudo em um só lugar — <span className="font-semibold text-foreground">AQUI e AGORA</span>.
            </p>
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
