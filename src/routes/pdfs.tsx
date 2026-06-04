import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertTriangle, FileText, Download, Lock, Crown, Loader2 } from "lucide-react";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { useState } from "react";
import { toast } from "sonner";
import { getPremiumPdfUrl } from "@/lib/pdfs.functions";

export const Route = createFileRoute("/pdfs")({
  head: () => ({
    meta: [
      { title: "PDFs ENEM – 50 questões por área para baixar | Nota 1000 ENEM" },
      { name: "description", content: "Baixe PDFs de questões ENEM para estudar offline: 50 questões por arquivo, cobrindo todas as áreas do exame." },
      { property: "og:title", content: "PDFs ENEM – Estude offline" },
      { property: "og:description", content: "Pacotes de questões ENEM em PDF para download e estudo offline." },
      { property: "og:url", content: "https://nota1000enem.online/pdfs" },
    ],
    links: [{ rel: "canonical", href: "https://nota1000enem.online/pdfs" }],
  }),
  component: PdfsPage,
});

type Pdf = { nome: string; descricao: string; arquivo: string };

const PDFS: Pdf[] = [
  { nome: "PDF 1 — 50 Questões", descricao: "Bloco inicial — questões mistas ENEM.", arquivo: "50-questoes-1.pdf" },
  { nome: "PDF 2 — 50 Questões", descricao: "Segundo bloco — questões mistas ENEM.", arquivo: "50-questoes-2.pdf" },
  { nome: "PDF 3 — 50 Questões", descricao: "Terceiro bloco — questões mistas ENEM.", arquivo: "50-questoes-3.pdf" },
  { nome: "PDF 4 — 50 Questões", descricao: "Quarto bloco — questões mistas ENEM.", arquivo: "50-questoes-4.pdf" },
  { nome: "PDF 5 — 50 Questões", descricao: "Quinto bloco — questões mistas ENEM.", arquivo: "50-questoes-5.pdf" },
  { nome: "PDF 6 — 50 Questões", descricao: "Sexto bloco — questões mistas ENEM.", arquivo: "50-questoes-6.pdf" },
  { nome: "PDF 7 — 50 Questões", descricao: "Sétimo bloco — questões mistas ENEM.", arquivo: "50-questoes-7.pdf" },
  { nome: "PDF 8 — 50 Questões", descricao: "Oitavo bloco — questões mistas ENEM.", arquivo: "50-questoes-8.pdf" },
];

function PdfsPage() {
  const { isPaid: planoPago, loading: planLoading } = usePlanAccess();
  const carregado = !planLoading;
  const fetchUrl = useServerFn(getPremiumPdfUrl);
  const [baixando, setBaixando] = useState<string | null>(null);

  async function baixar(arquivo: string) {
    try {
      setBaixando(arquivo);
      const { url } = await fetchUrl({ data: { file: arquivo } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar link.");
    } finally {
      setBaixando(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-5xl px-4 py-12">
        <Badge variant="outline" className="border-primary/40 text-primary">
          <Sparkles className="mr-1 h-3 w-3" /> Material para download
        </Badge>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">
          <span className="gradient-text">PDFs</span> ENEM
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Baixe os PDFs com questões mistas para estudar offline, imprimir ou revisar no seu ritmo.
        </p>

        <Card className="card-glass mt-8 p-5 border-primary/40 bg-primary/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-primary" />
            <div className="text-sm">
              <p className="font-semibold">Como usar</p>
              <p className="mt-1 text-muted-foreground">
                Clique em <strong>Baixar PDF</strong> para abrir o arquivo no seu navegador. Você
                pode salvar no celular/computador e estudar sem internet.
              </p>
            </div>
          </div>
        </Card>

        {carregado && !planoPago && (
          <Card className="card-glass mt-4 p-5 border-primary/40 bg-primary/5">
            <div className="flex items-start gap-3">
              <Crown className="mt-0.5 h-5 w-5 text-primary" />
              <div className="text-sm flex-1">
                <p className="font-semibold">PDFs são exclusivos para alunos com plano pago</p>
                <p className="mt-1 text-muted-foreground">
                  Assine qualquer plano (Light, Pro, Full ou Vitalício) para liberar todos os PDFs.
                </p>
              </div>
              <Link to="/planos">
                <Button size="sm" className="glow-blue">
                  Ver planos
                </Button>
              </Link>
            </div>
          </Card>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {PDFS.map((p) => (
            <Card key={p.arquivo} className={`card-glass p-6 relative ${!planoPago ? "overflow-hidden" : ""}`}>
              {!planoPago && (
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    <Lock className="mr-1 h-3 w-3" /> Premium
                  </Badge>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" /> Arquivo PDF
              </div>
              <h3 className="mt-2 text-xl font-bold text-primary">{p.nome}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.descricao}</p>
              {planoPago ? (
                <Button
                  onClick={() => baixar(p.arquivo)}
                  disabled={baixando === p.arquivo}
                  className="mt-4 w-full glow-blue"
                >
                  {baixando === p.arquivo ? (
                    <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Gerando link…</>
                  ) : (
                    <><Download className="mr-1 h-4 w-4" /> Baixar PDF</>
                  )}
                </Button>
              ) : (
                <Link to="/planos">
                  <Button className="mt-4 w-full" variant="outline">
                    <Lock className="mr-1 h-4 w-4" /> Desbloquear PDFs
                  </Button>
                </Link>
              )}
            </Card>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
