import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/questoes")({
  head: () => ({ meta: [{ title: "100 Questões ENEM – Nota 1000 ENEM" }] }),
  component: QuestoesPage,
});

function QuestoesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-5xl px-4 py-12">
        <Badge variant="outline" className="border-primary/40 text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> Simulado completo
        </Badge>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">100 Questões <span className="gradient-text">ENEM</span></h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">2 provas de 50 questões cobrindo todas as áreas. Notas calculadas em escala ENEM (0-1000).</p>

        <Card className="card-glass mt-8 p-6 border-yellow-500/40 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-500" />
            <div>
              <p className="font-semibold">A última folha contém as respostas — NÃO olhe antes de terminar.</p>
              <p className="mt-1 text-sm text-muted-foreground">As perguntas e o gabarito serão liberados em breve. Estamos finalizando a importação das 100 questões.</p>
            </div>
          </div>
        </Card>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[1, 2].map((n) => (
            <Card key={n} className="card-glass p-6 opacity-60">
              <h3 className="text-xl font-bold">Prova {n} — 50 questões</h3>
              <p className="mt-2 text-sm text-muted-foreground">Linguagens, Humanas, Natureza e Matemática (mistas).</p>
              <Button disabled className="mt-4 w-full">Em breve</Button>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Enquanto isso, <Link to="/redacao" className="text-primary underline">treine sua redação</Link>.
        </p>
      </section>
      <Footer />
    </div>
  );
}