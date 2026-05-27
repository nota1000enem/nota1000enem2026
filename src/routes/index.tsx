import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Sparkles, Zap, Brain, FileText, Trophy, Target, Check, Star, ArrowRight, BookOpen, GraduationCap } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import heroMockup from "@/assets/hero-mockup.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nota 1000 ENEM – Corretor de Redação ENEM com Inteligência Artificial" },
      { name: "description", content: "Descubra sua nota do ENEM em segundos. Corrija redações com IA, treine questões e estude com metodologia focada em nota 1000." },
      { property: "og:title", content: "Nota 1000 ENEM – Sua aprovação no ENEM começa aqui" },
      { property: "og:description", content: "Correção de redação ENEM com IA, simulados, vídeo aulas e metodologia comprovada." },
    ],
  }),
  component: Index,
});

function Index() {
  const autoplay = useRef(Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true }));
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* HERO */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div className="space-y-6">
            <Badge variant="outline" className="border-primary/40 text-primary">
              <Sparkles className="mr-1 h-3 w-3" /> IA treinada nas competências do ENEM
            </Badge>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Descubra sua nota do <span className="gradient-text">ENEM</span> em segundos usando <span className="gradient-text text-glow">Inteligência Artificial</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Corrija redações, treine questões difíceis e estude com metodologia focada em aprovação.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/redacao"><Button size="lg" className="glow-blue">Testar Redação Grátis <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
              <Link to="/planos"><Button size="lg" variant="outline">Ver Planos</Button></Link>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-primary text-primary" /> 4.9/5 alunos</div>
              <div>+12 mil redações corrigidas</div>
              <div>Garantia 7 dias</div>
            </div>
          </div>
          <div className="relative">
            <div className="mb-4 flex flex-wrap gap-2">
              {["Matemática","Linguagens e Códigos","Ciências Humanas","Ciências da Natureza","Redação","+ 1.000 questões em VÍDEO"].map((t) => (
                <Badge key={t} variant="outline" className="border-primary/40 text-primary">{t}</Badge>
              ))}
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              <span className="font-semibold text-primary">AULA NOVA TODA SEMANA</span> — Estude todas as áreas do ENEM com correções inteligentes, trilhas personalizadas e foco na nota 1000. Tudo em um só lugar. Chega de gastar dinheiro à toa com vários cursos ou questões sem sentido. Tenha acesso a tudo <span className="font-semibold text-foreground">AQUI e AGORA</span>! O sonho da <span className="gradient-text font-semibold">NOTA 1.000</span> e da Universidade está mais próximo.
            </p>
            <div className="absolute inset-0 -z-10 blur-3xl opacity-50 bg-primary/30 rounded-full" />
            <img src={heroMockup} alt="IA Nota 1000 ENEM corrigindo redação do ENEM" width={1280} height={960} className="animate-float rounded-2xl border border-primary/20 glow-blue" />
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline">Como funciona</Badge>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">3 passos para sua <span className="gradient-text">nota 1000</span></h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: FileText, n: "01", title: "Cole sua redação", desc: "Cole o texto direto no editor. Sem upload, sem complicação." },
              { icon: Brain, n: "02", title: "A IA analisa tudo", desc: "Gramática, coerência, argumentação e as 5 competências do ENEM." },
              { icon: Trophy, n: "03", title: "Receba o resultado", desc: "Nota estimada, erros, sugestões, repertórios e melhorias detalhadas." },
            ].map(({ icon: Icon, n, title, desc }) => (
              <Card key={n} className="card-glass p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="grid h-12 w-12 place-content-center rounded-xl bg-primary/10 ring-1 ring-primary/30">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-3xl font-bold text-muted-foreground/30">{n}</span>
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* APROVADOS / CHECKLIST DE BENEFÍCIOS */}
      <section className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <Badge variant="outline" className="border-primary/40 text-primary">
            <Trophy className="mr-1 h-3 w-3" /> Resultados
          </Badge>
          <h2 className="mt-3 text-3xl font-bold md:text-5xl">
            <span className="gradient-text">1.890 alunos aprovados</span> em 2025
          </h2>
          <p className="mt-3 text-muted-foreground">Seja você o próximo.</p>
          <ul className="mx-auto mt-8 grid max-w-3xl gap-3 text-left text-sm md:text-base">
            {[
              "1.000 questões em VÍDEO. Te ensino a como resolver do Zero!",
              "Correção inteligente de redações baseada nos critérios oficiais do ENEM",
              "Plano de estudos personalizado com IA treinada 100% no ENEM",
              "Questões comentadas de Matemática, Linguagens e Códigos, Ciências da Natureza e Humanas",
              "Feedback instantâneo para identificar erros e acelerar sua evolução",
              "Simulados completos com análise detalhada de desempenho",
              "Trilhas de estudo focadas nas competências que mais caem no ENEM",
              "Relatórios inteligentes para acompanhar sua evolução em tempo real",
              "Estratégias e repertórios prontos para tirar nota alta na redação",
              "Ranking de desempenho para acompanhar seu progresso e motivação",
              "Videoaulas, exercícios e revisões organizadas em uma única plataforma",
            ].map((b) => (
              <li key={b} className="flex items-start gap-3 rounded-lg border border-border/40 bg-card/40 p-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link to="/planos"><Button size="lg" className="glow-blue">Quero ser o próximo aprovado <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      {/* MODO PROFESSOR RIGIDO */}
      <section className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <Card className="card-glass overflow-hidden p-8 md:p-12">
            <Badge className="bg-destructive/20 text-destructive border border-destructive/40">🔥 Novo</Badge>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Modo <span className="gradient-text">Professor Rígido</span></h2>
            <p className="mt-3 text-muted-foreground">Ative e receba comentários brutalmente honestos (e engraçados) que vão te fazer escrever melhor por orgulho.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-background/60 p-4 text-sm italic text-muted-foreground">
                "Seu argumento começou forte mas virou passeio no parque no segundo parágrafo."
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-4 text-sm italic text-muted-foreground">
                "Essa conclusão ficou mais perdida que aluno sem repertório sociocultural."
              </div>
            </div>
            <div className="mt-6">
              <Link to="/redacao"><Button className="glow-blue">Ativar e testar <Zap className="ml-1 h-4 w-4" /></Button></Link>
            </div>
          </Card>
        </div>
      </section>

      {/* TOP NOTAS DA SEMANA */}
      <section className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <Badge variant="outline" className="border-primary/40 text-primary">
            <Trophy className="mr-1 h-3 w-3" /> Top Notas da Semana
          </Badge>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Veja quem está <span className="gradient-text">no topo</span> esta semana
          </h2>
          <p className="mt-3 text-muted-foreground">Ranking ao vivo dos alunos com as melhores notas dos últimos 7 dias.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { pos: "1º", nome: "Lucas", nota: 960, color: "text-yellow-400", ring: "ring-yellow-400/60", glow: "glow-blue" },
              { pos: "2º", nome: "Ana", nota: 940, color: "text-slate-300", ring: "ring-slate-300/60", glow: "" },
              { pos: "3º", nome: "Pedro", nota: 920, color: "text-orange-400", ring: "ring-orange-400/60", glow: "" },
            ].map((p) => (
              <Card key={p.pos} className={`card-glass p-6 text-center ring-2 ${p.ring} ${p.glow}`}>
                <Trophy className={`mx-auto h-8 w-8 ${p.color}`} />
                <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{p.pos} lugar</p>
                <p className="mt-2 text-lg font-semibold">{p.nome}</p>
                <p className="mt-2 text-4xl font-bold gradient-text text-glow">{p.nota}</p>
              </Card>
            ))}
          </div>
          <div className="mt-8">
            <Link to="/ranking"><Button size="lg" className="glow-blue">Entrar no Ranking <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline">Planos</Badge>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Escolha seu caminho para a <span className="gradient-text">aprovação</span></h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "ENEM Light", price: "19,90", periodo: "/mês", cta: "Começar Agora", popular: false, items: ["Até 25 redações corrigidas por mês","Matemática","Português","Redação","1000 questões","PDF metodologia de estudos","Cronograma de 30 dias","Templates de redação nota 1000","Acesso básico IA"] },
              { name: "ENEM Pro", price: "29,90", periodo: "/mês", cta: "Quero o Pro", popular: true, items: ["Até 50 redações corrigidas por mês","Matemática","Português","História","Geografia","Ciências da Natureza","Redação","20 vídeo aulas","1000 questões para passar","Simulados","Correção IA avançada","IA Professor Rígido","Repertórios automáticos","Cronograma inteligente"] },
              { name: "Full Acess ENEM", price: "49,90", periodo: "/mês", cta: "Quero Acesso Total", popular: false, items: ["Até 100 redações corrigidas por mês","Matemática","Linguagens e Códigos","Ciências Humanas","Ciências da Natureza","Redação completa","Correção IA ilimitada","1000 questões avançadas","Vídeo aulas completas","Simulados ilimitados","Templates premium","Ranking de alunos","IA Professor Rígido","Repertórios automáticos","Estratégias de aprovação","Atualizações futuras"] },
              { name: "Full Acess ENEM Vitalício", price: "499", periodo: "uma vez", cta: "Quero Vitalício", popular: false, items: ["Acesso ETERNO — sem mensalidade","Até 100 redações corrigidas por mês","Tudo do Full Acess","IA Professor Rígido vitalício","Atualizações futuras incluídas","Sem renovação, sem cobrança recorrente"] },
            ].map((p) => (
              <Card key={p.name} className={`relative p-6 ${p.popular ? "card-glass border-primary/50 glow-blue" : "card-glass"}`}>
                {p.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">MAIS VENDIDO</Badge>}
                <h3 className="text-xl font-bold">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.periodo}</span>
                </div>
                <ul className="mt-6 space-y-2 text-sm">
                  {p.items.map((it) => (
                    <li key={it} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {it}</li>
                  ))}
                </ul>
                <Link to="/planos" className="mt-6 block">
                  <Button className={`w-full ${p.popular ? "glow-blue" : ""}`} variant={p.popular ? "default" : "outline"}>{p.cta}</Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline">Provas sociais</Badge>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Resultados de quem usou a <span className="gradient-text">Nota 1000 ENEM</span></h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: "Júlia, 18", text: "Saí de 640 para 920 na redação. A IA me mostrou exatamente o que eu errava." },
              { name: "Lucas, 17", text: "A IA encontrou erros que meus professores nunca mostraram. Mudou meu jogo." },
              { name: "Marina, 19", text: "Os repertórios automáticos me salvaram. Passei em medicina!" },
            ].map((t) => (
              <Card key={t.name} className="card-glass p-6">
                <div className="mb-3 flex gap-1">{Array.from({length: 5}).map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}</div>
                <p className="text-sm">"{t.text}"</p>
                <p className="mt-4 text-xs text-muted-foreground">— {t.name}</p>
              </Card>
            ))}
          </div>

          {/* CARROSSEL DE MAIS PROVAS SOCIAIS */}
          <div className="mt-12">
            <div className="mb-6 text-center">
              <Badge variant="outline" className="border-primary/40 text-primary">
                <Star className="mr-1 h-3 w-3 fill-primary" /> Mais histórias reais
              </Badge>
              <h3 className="mt-3 text-2xl font-bold md:text-3xl">
                +12 mil alunos <span className="gradient-text">evoluíram</span> com a Nota 1000 ENEM
              </h3>
            </div>
            <Carousel opts={{ align: "start", loop: true }} plugins={[autoplay.current]} className="mx-auto max-w-6xl px-12 md:px-16">
              <CarouselContent>
                {[
                  { name: "Beatriz, 17", curso: "Quer Direito", nota: "780 → 940", text: "Em 3 semanas usando o Modo Professor Rígido, minha nota subiu quase 200 pontos. A IA é honesta como meu cursinho não é." },
                  { name: "Rafael, 18", curso: "Engenharia", nota: "620 → 880", text: "Eu não tinha repertório nenhum. Os repertórios automáticos me deram um banco de exemplos que uso em qualquer tema." },
                  { name: "Camila, 19", curso: "Medicina USP", nota: "900 → 980", text: "Achei que já estava bom, mas a IA mostrou erros sutis de coesão. Passei em primeira chamada na USP." },
                  { name: "Thiago, 16", curso: "2º ano EM", nota: "540 → 820", text: "Comecei cedo e em 6 meses dobrei minha nota. O cronograma de estudo me organizou de verdade." },
                  { name: "Larissa, 18", curso: "Psicologia", nota: "700 → 920", text: "O que mais me ajudou foi ver onde eu perdia ponto em cada competência. Antes era um chute, agora é estratégia." },
                  { name: "Pedro, 17", curso: "Ciência da Computação", nota: "660 → 900", text: "Treinei 1 redação por dia por 2 meses. A IA me corrige na mesma hora, em segundos. Mudou tudo." },
                  { name: "Sofia, 19", curso: "Arquitetura", nota: "740 → 940", text: "A proposta de intervenção sempre foi meu calcanhar de Aquiles. Aprendi a estrutura certa e nunca mais perdi nota nessa." },
                  { name: "Gabriel, 18", curso: "Direito UFMG", nota: "820 → 960", text: "Usei o ranking semanal pra me motivar. Brigar pelo top 3 vira vício saudável." },
                  { name: "Helena, 17", curso: "Quer Veterinária", nota: "580 → 860", text: "Eu chorava ao ver minhas redações antigas. Hoje escrevo com confiança e sei exatamente onde melhorar." },
                ].map((t, i) => (
                  <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                    <Card className="card-glass h-full p-6">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex gap-1">
                          {Array.from({length: 5}).map((_, k) => <Star key={k} className="h-3.5 w-3.5 fill-primary text-primary" />)}
                        </div>
                        <Badge variant="outline" className="border-primary/40 text-xs text-primary">{t.nota}</Badge>
                      </div>
                      <p className="text-sm leading-relaxed">"{t.text}"</p>
                      <div className="mt-4 flex items-center gap-3 border-t border-border/40 pt-3">
                        <div className="grid h-10 w-10 place-content-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/30">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.curso}</p>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-0" />
              <CarouselNext className="right-0" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-4 text-3xl font-bold md:text-5xl">Sua nota 1000 começa <span className="gradient-text">hoje</span>.</h2>
          <p className="mt-3 text-muted-foreground">Teste grátis. Sem cartão. Sem enrolação.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/redacao"><Button size="lg" className="glow-blue">Corrigir minha redação agora <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
