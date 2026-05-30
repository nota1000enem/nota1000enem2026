import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertTriangle, BookOpen, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/questoes")({
  head: () => ({ meta: [{ title: "1.000 Questões ENEM – Nota 1000 ENEM" }] }),
  component: QuestoesPage,
});

type Sim = { id: string; nome: string; descricao: string | null; total_questoes: number; ordem: number };

function QuestoesPage() {
  const [sims, setSims] = useState<Sim[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("simulados").select("*").eq("ativo", true).order("ordem");
      setSims((data as Sim[]) ?? []);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-5xl px-4 py-12">
        <Badge variant="outline" className="border-primary/40 text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> Simulado completo
        </Badge>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">1.000 Questões <span className="gradient-text">ENEM</span></h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Provas mistas cobrindo Linguagens, Humanas, Natureza e Matemática. Nota calculada na escala ENEM (0–1000).
        </p>

        <Card className="card-glass mt-8 p-5 border-yellow-500/40 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-500" />
            <div className="text-sm">
              <p className="font-semibold">Como funciona</p>
              <p className="mt-1 text-muted-foreground">
                Uma pergunta por vez (A–E). Use a seta para avançar. No fim, sua nota é calculada na escala 0–1000 e fica salva no seu dashboard, na seção <strong>Classificação SEM</strong>.
              </p>
            </div>
          </div>
        </Card>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {sims.map((s) => (
            <Card key={s.id} className="card-glass p-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="h-3 w-3" /> {s.total_questoes} questões mistas
              </div>
              <h3 className="mt-2 text-xl font-bold">{s.nome}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.descricao}</p>
              <Link to="/simulado/$id" params={{ id: s.id }}>
                <Button className="mt-4 w-full glow-blue"><Play className="mr-1 h-4 w-4" /> Iniciar prova</Button>
              </Link>
            </Card>
          ))}
          {Array.from({ length: Math.max(0, 18 - sims.length) }).map((_, idx) => {
            const n = sims.length + idx + 1;
            return (
              <Card key={`extra-${n}`} className="card-glass p-6 opacity-60">
                <h3 className="text-xl font-bold">Prova {n}</h3>
                <p className="mt-2 text-sm text-muted-foreground">Em breve.</p>
                <Button disabled className="mt-4 w-full">Em breve</Button>
              </Card>
            );
          })}
        </div>
      </section>
      <Footer />
    </div>
  );
}
