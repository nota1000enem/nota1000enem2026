import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Sparkles, Zap, Brain, FileText, Trophy, Target, Check, Star, ArrowRight, BookOpen, GraduationCap } from "lucide-react";
import heroMockup from "@/assets/hero-mockup.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nota900 AI – Corretor de Redação ENEM com Inteligência Artificial" },
      { name: "description", content: "Descubra sua nota do ENEM em segundos. Corrija redações com IA, treine questões e estude com metodologia focada em nota 900+." },
      { property: "og:title", content: "Nota900 AI – Sua aprovação no ENEM começa aqui" },
      { property: "og:description", content: "Correção de redação ENEM com IA, simulados, vídeo aulas e metodologia comprovada." },
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
            <div className="absolute inset-0 -z-10 blur-3xl opacity-50 bg-primary/30 rounded-full" />
            <img src={heroMockup} alt="IA Nota900 corrigindo redação do ENEM" width={1280} height={960} className="animate-float rounded-2xl border border-primary/20 glow-blue" />
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline">Como funciona</Badge>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">3 passos para sua <span className="gradient-text">nota 900+</span></h2>
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

      {/* PLANOS */}
      <section id="planos" className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <Badge variant="outline">Planos</Badge>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Escolha seu caminho para a <span className="gradient-text">aprovação</span></h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: "ENEM Light", price: "19,90", cta: "Começar Agora", popular: false, items: ["Matemática", "Português", "Redação", "1000 questões", "PDF metodologia de estudos", "Cronograma de 30 dias", "Templates de redação nota 900+", "Acesso básico IA"] },
              { name: "ENEM Pro", price: "29,90", cta: "Quero o Pro", popular: true, items: ["Matemática", "Português", "História", "Geografia", "Ciências da Natureza", "Redação", "20 vídeo aulas", "1000 questões para passar", "Simulados", "Correção IA avançada", "Repertórios automáticos", "Cronograma inteligente"] },
              { name: "Full Acesso", price: "49,90", cta: "Quero Acesso Total", popular: false, items: ["Matemática", "Linguagens e Códigos", "Ciências Humanas", "Ciências da Natureza", "Redação completa", "Correção IA ilimitada", "1000 questões avançadas", "Vídeo aulas completas", "Simulados ilimitados", "Templates premium", "Ranking de alunos", "IA Professor Rígido", "Repertórios automáticos", "Estratégias de aprovação", "Atualizações futuras"] },
            ].map((p) => (
              <Card key={p.name} className={`relative p-6 ${p.popular ? "card-glass border-primary/50 glow-blue" : "card-glass"}`}>
                {p.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">MAIS VENDIDO</Badge>}
                <h3 className="text-xl font-bold">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
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
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Resultados de quem usou a <span className="gradient-text">Nota900 AI</span></h2>
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
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-4 text-3xl font-bold md:text-5xl">Sua nota 900 começa <span className="gradient-text">hoje</span>.</h2>
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
