import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Sparkles, Zap, Brain, FileText, Trophy, Check, Star, ArrowRight, GraduationCap } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import aprovado1 from "@/assets/enem-aprovado-1.jpg";
import aprovado2 from "@/assets/enem-aprovado-2.jpg";
import aprovado3 from "@/assets/enem-aprovado-3.jpg";
import aprovado4 from "@/assets/enem-aprovado-4.jpg";
import printNota840 from "@/assets/print-nota-840.png";
import printNota1000 from "@/assets/print-nota-1000.png";
import { useServerFn } from "@tanstack/react-start";
import { createCheckout, type PlanType } from "@/lib/mercadopago.functions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  const heroAutoplay = useRef(Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const [topSemana, setTopSemana] = useState<Array<{ nome: string; melhor_nota: number }>>([]);
  useEffect(() => {
    supabase.rpc("get_top_semana").then(({ data }) => {
      if (data && Array.isArray(data)) setTopSemana(data.slice(0, 3));
    });
  }, []);
  const heroImgs = [
    { src: aprovado1, alt: "Estudante brasileiro aprovado no ENEM" },
    { src: aprovado2, alt: "Aluno estudando para o ENEM com IA" },
    { src: aprovado3, alt: "Alunos comemorando aprovação no ENEM" },
    { src: aprovado4, alt: "Estudante aprovado em medicina pelo ENEM" },
  ];
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
              Descubra sua nota do ENEM em segundos usando o <span className="gradient-text text-glow">NOTA 1000 ENEM 2026</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              <span className="font-semibold text-foreground">DESCUBRA O FUTURO AGORA MESMO!</span> Corrija redações, treine questões difíceis e estude com metodologia focada em aprovação. Vídeo aulas, corretor de redação, plano de estudos — TUDO focado na sua aprovação. <span className="font-semibold text-primary">TESTE GRÁTIS AGORA MESMO.</span>
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/redacao"><Button size="lg" className="glow-blue">Ver Minha Nota Grátis <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
              <Link to="/planos"><Button size="lg" variant="outline">MAPA da APROVAÇÃO 2026</Button></Link>
            </div>
            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-primary text-primary" /> 4.9/5 alunos</div>
              <div>+ de 78 mil redações corrigidas</div>
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
            <Carousel opts={{ loop: true, align: "center" }} plugins={[heroAutoplay.current]} className="relative">
              <CarouselContent>
                {heroImgs.map((img, i) => (
                  <CarouselItem key={i} className="basis-[80%]">
                    <div className="relative">
                      <img src={img.src} alt={img.alt} width={1024} height={1024}
                        className="aspect-square w-full rounded-2xl border border-primary/30 object-cover glow-blue"
                        loading={i === 0 ? "eager" : "lazy"} />
                      <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2 py-0.5 text-xs font-bold text-primary backdrop-blur">{i+1}/4</span>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-2 md:-left-4" />
              <CarouselNext className="-right-2 md:-right-4" />
            </Carousel>
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
              { icon: FileText, n: "01", title: "Cole sua redação", desc: "Basta colar seu texto no editor e começar a análise imediatamente. Sem precisar enviar arquivos, criar documentos ou perder tempo com etapas complicadas." },
              { icon: Brain, n: "02", title: "Nós avaliamos sua redação em profundidade", desc: "Analisamos gramática, ortografia, coesão, coerência, argumentação, repertório sociocultural e desenvolvimento das ideias, além das 5 competências cobradas oficialmente no ENEM." },
              { icon: Trophy, n: "03", title: "Receba um feedback completo e estratégico", desc: "Veja sua nota estimada, entenda seus erros, descubra pontos fortes e receba sugestões detalhadas de melhoria, exemplos de repertórios e orientações para aumentar seu desempenho na redação." },
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
            {(topSemana.length > 0
              ? topSemana.map((t, i) => ({
                  pos: `${i + 1}º`, nome: t.nome, nota: t.melhor_nota,
                  color: i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : "text-orange-400",
                  ring: i === 0 ? "ring-yellow-400/60" : i === 1 ? "ring-slate-300/60" : "ring-orange-400/60",
                  glow: i === 0 ? "glow-blue" : "",
                }))
              : [
                  { pos: "1º", nome: "—", nota: 0, color: "text-yellow-400", ring: "ring-yellow-400/60", glow: "glow-blue" },
                  { pos: "2º", nome: "—", nota: 0, color: "text-slate-300", ring: "ring-slate-300/60", glow: "" },
                  { pos: "3º", nome: "—", nota: 0, color: "text-orange-400", ring: "ring-orange-400/60", glow: "" },
                ]
            ).map((p) => (
              <Card key={p.pos} className={`card-glass p-6 text-center ring-2 ${p.ring} ${p.glow}`}>
                <Trophy className={`mx-auto h-8 w-8 ${p.color}`} />
                <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{p.pos} lugar</p>
                <p className="mt-2 text-lg font-semibold">{p.nome}</p>
                <p className="mt-2 text-4xl font-bold gradient-text text-glow">{p.nota || "—"}</p>
              </Card>
            ))}
          </div>
          <div className="mt-8">
            <Link to="/ranking"><Button size="lg" className="glow-blue">Entrar no Ranking <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS (antes dos planos) */}
      <section className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline">Provas sociais</Badge>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Resultados de quem usou a <span className="gradient-text">Nota 1000 ENEM</span></h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: "Maria Eduarda Cavalcanti, 18", curso: "Medicina – UFPE", nota: 980, text: "Saí de 720 para 980 na redação em 4 meses. A IA do Nota 1000 ENEM aponta o erro EXATO e cita a regra — coisa que nenhum cursinho meu fazia." },
              { name: "João Vitor Albuquerque, 19", curso: "Engenharia Aeroespacial – ITA", nota: 960, text: "Treinei 1 redação por dia. Em 60 dias dobrei minha nota de C5. O Modo Professor Rígido é cruel mas funciona." },
              { name: "Beatriz Stelzer, 17", curso: "Direito – USP", nota: 970, text: "Os repertórios automáticos me deram repertório real de Bauman, Foucault, Constituição. Passei em primeira chamada." },
            ].map((t) => (
              <Card key={t.name} className="card-glass p-6">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex gap-1">{Array.from({length: 5}).map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}</div>
                  <Badge variant="outline" className="border-primary/40 text-primary">Nota {t.nota}</Badge>
                </div>
                <p className="text-sm">"{t.text}"</p>
                <div className="mt-4 border-t border-border/40 pt-3">
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.curso}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* CARROSSEL DE DEPOIMENTOS REAIS */}
          <div className="mt-12">
            <div className="mb-6 text-center">
              <Badge variant="outline" className="border-primary/40 text-primary">
                <Star className="mr-1 h-3 w-3 fill-primary" /> Mais histórias reais
              </Badge>
              <h3 className="mt-3 text-2xl font-bold md:text-3xl">
                + de 78 mil alunos <span className="gradient-text">evoluíram</span> com a Nota 1000 ENEM
              </h3>
            </div>
            <Carousel opts={{ align: "start", loop: true }} plugins={[autoplay.current]} className="mx-auto max-w-6xl px-12 md:px-16">
              <CarouselContent>
                {[
                  { name: "Isadora Bernardes, 18", curso: "Psicologia – UFRGS", nota: "740 → 940", text: "Antes eu chutava conectivos. Hoje sei contar inter e intraparágrafos e nunca mais tomei menos de 180 na C4." },
                  { name: "Caio Henrique Sampaio, 17", curso: "Medicina – UNIFESP", nota: "820 → 980", text: "A IA mostrou erro de regência que 3 professores meus deixaram passar. Subi 160 pontos só na C1." },
                  { name: "Letícia Marques, 19", curso: "Arquitetura – UFMG", nota: "660 → 900", text: "Sem repertório eu nunca passava de 700. Os repertórios sugeridos pelo Nota 1000 ENEM viraram parte do meu vocabulário." },
                  { name: "Felipe Tavares, 18", curso: "Ciência da Computação – UFRJ", nota: "700 → 960", text: "O Modo Professor Rígido me humilhou na primeira correção. Na quinta eu agradeci. Passei na UFRJ." },
                  { name: "Amanda Sousa, 16", curso: "2º EM – preparando medicina", nota: "540 → 860", text: "Em 5 meses comecei a entender O QUE é uma proposta de intervenção completa. A IA é didática como cursinho caro." },
                  { name: "Rodrigo Pacheco, 19", curso: "Direito – PUC-RS", nota: "820 → 960", text: "Usei o ranking pra me motivar. Brigar pelo top 10 me fez treinar todo dia. Passei com folga." },
                  { name: "Helena Quintanilha, 18", curso: "Veterinária – UFV", nota: "680 → 940", text: "A IA não inventa erro. Quando tira ponto, ela CITA a frase e a regra. Confio 100% no feedback." },
                  { name: "Murilo Andrade, 17", curso: "Engenharia Civil – UFSC", nota: "600 → 880", text: "Plano de estudo com IA foi divisor de águas. Pomodoro real, com matérias que EU precisava, não plano genérico." },
                  { name: "Sofia Vasconcelos, 18", curso: "Jornalismo – UFBA", nota: "740 → 960", text: "Tirei 200 na C2 pela primeira vez depois que entendi como fugir do tema. A IA me corrigiu sem dó até eu acertar." },
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

      {/* PLANOS */}
      <section id="planos" className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline">Planos</Badge>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Escolha seu caminho para a <span className="gradient-text">aprovação</span></h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "ENEM Light", price: "19,90", periodo: "/mês", cta: "Começar Agora", popular: false, items: ["30 redações por mês — 1 por dia","Matemática","Português","Redação","1.000 questões","PDF metodologia de estudos","Cronograma de 30 dias","Templates de redação nota 1000","Acesso básico IA"] },
              { name: "ENEM Pro", price: "29,90", periodo: "/mês", cta: "Quero o Pro", popular: true, items: ["60 redações por mês — 2 por dia","Matemática","Português","História","Geografia","Ciências da Natureza","Redação","20 vídeo aulas","1.000 questões para passar","Simulados","Correção IA avançada","IA Professor Rígido","Plano de Estudo com IA","Repertórios automáticos","Cronograma inteligente"] },
              { name: "Full Acess ENEM", price: "49,90", periodo: "/mês", cta: "Quero Acesso Total", popular: false, items: ["120 redações por mês — 4 por dia","Matemática","Linguagens e Códigos","Ciências Humanas","Ciências da Natureza","Redação completa","Correção IA ilimitada","1.000 questões avançadas","Vídeo aulas completas","Simulados ilimitados","Templates premium","Ranking de alunos","IA Professor Rígido","Plano de Estudo com IA","Repertórios automáticos","Estratégias de aprovação","Atualizações futuras"] },
              { name: "Full Acess ENEM Vitalício", price: "499", periodo: "uma vez", cta: "Quero Vitalício", popular: false, items: ["Acesso ETERNO — sem mensalidade","120 redações por mês — 4 por dia","Tudo do Full Acess","IA Professor Rígido vitalício","Plano de Estudo com IA vitalício","Atualizações futuras incluídas","Sem renovação, sem cobrança recorrente"] },
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
