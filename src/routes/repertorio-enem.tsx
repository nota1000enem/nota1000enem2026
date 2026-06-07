import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  BookOpen,
  Quote,
  Brain,
  GraduationCap,
  Globe,
  Scale,
  Leaf,
  Users,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/repertorio-enem")({
  head: () => ({
    meta: [
      { title: "Repertório ENEM: Guia Completo com 50+ Exemplos | Nota 1000" },
      {
        name: "description",
        content:
          "Guia completo de Repertório ENEM 2026: o que é, como usar e 50+ exemplos prontos de filósofos, livros, filmes, dados e leis para sua redação nota 1000.",
      },
      {
        name: "keywords",
        content:
          "repertório ENEM, repertório de ensaios, repertório sociocultural, repertório redação ENEM, citações redação ENEM, frases para redação ENEM, exemplos de repertório",
      },
      { property: "og:title", content: "Repertório ENEM: Guia Completo + 50 Exemplos" },
      {
        property: "og:description",
        content:
          "Guia definitivo de Repertório ENEM. Como escolher, citar e usar repertório sociocultural produtivo para tirar nota 1000 na redação.",
      },
      { property: "og:url", content: "https://nota1000enem.online/repertorio-enem" },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "https://nota1000enem.online/repertorio-enem" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Repertório ENEM: Guia Completo com 50+ Exemplos para Nota 1000",
          description:
            "Tudo sobre repertório sociocultural na redação do ENEM: o que é, como usar e exemplos prontos por área temática.",
          inLanguage: "pt-BR",
          author: { "@type": "Organization", name: "Nota 1000 ENEM" },
          publisher: {
            "@type": "Organization",
            name: "Nota 1000 ENEM",
            url: "https://nota1000enem.online",
          },
          mainEntityOfPage: "https://nota1000enem.online/repertorio-enem",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "O que é repertório na redação do ENEM?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Repertório é o conjunto de referências externas (autores, obras, dados, leis, fatos históricos, filmes, séries, etc.) usadas para sustentar argumentos. Na Competência 2, o ENEM avalia a presença de um repertório sociocultural produtivo, ou seja, conectado ao tema e usado para defender uma ideia.",
              },
            },
            {
              "@type": "Question",
              name: "Quantos repertórios usar na redação do ENEM?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "O ideal é usar 2 a 3 repertórios diferentes ao longo da redação: um na introdução para contextualizar o problema e um em cada parágrafo de desenvolvimento. O foco é qualidade e pertinência, não quantidade.",
              },
            },
            {
              "@type": "Question",
              name: "Posso usar filmes e séries como repertório no ENEM?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Sim. Filmes, séries, documentários, músicas e até livros de literatura são repertórios válidos no ENEM, desde que sejam citados corretamente (nome da obra + autor/diretor) e estejam ligados de forma produtiva ao tema.",
              },
            },
            {
              "@type": "Question",
              name: "Como inserir o repertório no texto?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Você apresenta a referência, explica brevemente seu sentido e a conecta ao tema. Modelo: 'Segundo [autor/obra], [ideia]. Essa lógica se reflete em [tema], porque…'.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: RepertorioPage,
});

type RepertorioItem = {
  titulo: string;
  fonte: string;
  ideia: string;
  uso: string;
};

const repertorios: Array<{
  area: string;
  icon: typeof Scale;
  itens: RepertorioItem[];
}> = [
  {
    area: "Cidadania, Direitos e Estado",
    icon: Scale,
    itens: [
      {
        titulo: "Constituição Federal de 1988 (Art. 5º)",
        fonte: "Documento jurídico",
        ideia: "Garante igualdade de todos perante a lei, sem distinção de qualquer natureza.",
        uso: "Use para temas de discriminação, direitos das minorias, acesso à saúde, educação e violência.",
      },
      {
        titulo: "Declaração Universal dos Direitos Humanos (1948)",
        fonte: "ONU",
        ideia: "Reconhece a dignidade intrínseca de todo ser humano.",
        uso: "Excelente para temas envolvendo refugiados, racismo, intolerância religiosa e violência institucional.",
      },
      {
        titulo: "Estado de Natureza – Thomas Hobbes",
        fonte: "Filosofia política (Leviatã, 1651)",
        ideia: "Sem um contrato social forte, o ser humano vive em guerra de todos contra todos.",
        uso: "Use em temas sobre violência urbana, omissão do Estado e ausência de políticas públicas.",
      },
      {
        titulo: "Cidadão de papel – Gilberto Dimenstein",
        fonte: "Jornalismo / livro",
        ideia: "Direitos garantidos por lei, mas não exercidos na prática.",
        uso: "Ótimo para temas sobre desigualdade no acesso à educação, saúde e justiça.",
      },
    ],
  },
  {
    area: "Tecnologia, Mídia e Sociedade",
    icon: Brain,
    itens: [
      {
        titulo: "Sociedade do Cansaço – Byung-Chul Han",
        fonte: "Filosofia contemporânea",
        ideia: "A hiperprodutividade e a autoexploração geram esgotamento mental.",
        uso: "Perfeito para temas sobre saúde mental, redes sociais, trabalho e juventude.",
      },
      {
        titulo: "O Dilema das Redes (The Social Dilemma)",
        fonte: "Documentário Netflix",
        ideia: "Algoritmos de redes sociais manipulam comportamento e atenção.",
        uso: "Use em temas sobre fake news, polarização, desinformação e vício digital.",
      },
      {
        titulo: "Modernidade Líquida – Zygmunt Bauman",
        fonte: "Sociologia",
        ideia: "Relações, instituições e identidades se tornaram fluidas e descartáveis.",
        uso: "Excelente para falar de relações virtuais, consumo e individualismo.",
      },
      {
        titulo: "Vigiar e Punir – Michel Foucault",
        fonte: "Filosofia",
        ideia: "O poder se exerce pela vigilância e disciplina dos corpos.",
        uso: "Use em temas sobre vigilância digital, privacidade e controle do Estado.",
      },
    ],
  },
  {
    area: "Meio Ambiente e Sustentabilidade",
    icon: Leaf,
    itens: [
      {
        titulo: "Acordo de Paris (2015)",
        fonte: "Tratado internacional",
        ideia: "Compromisso global de limitar o aquecimento a 1,5 °C acima do nível pré-industrial.",
        uso: "Ótimo para temas sobre crise climática, queimadas, transição energética.",
      },
      {
        titulo: "Primavera Silenciosa – Rachel Carson (1962)",
        fonte: "Livro / ciência",
        ideia: "Alerta pioneiro sobre o impacto dos agrotóxicos na biodiversidade.",
        uso: "Use em temas sobre agronegócio, contaminação da água e biodiversidade.",
      },
      {
        titulo: "Encíclica Laudato Si’ – Papa Francisco (2015)",
        fonte: "Documento religioso/filosófico",
        ideia: "Defende uma 'ecologia integral' que une justiça social e proteção ambiental.",
        uso: "Bom para conectar pobreza, meio ambiente e responsabilidade coletiva.",
      },
    ],
  },
  {
    area: "Educação e Juventude",
    icon: GraduationCap,
    itens: [
      {
        titulo: "Pedagogia do Oprimido – Paulo Freire",
        fonte: "Educação",
        ideia: "Educação é um ato político de libertação, não de domesticação.",
        uso: "Use em temas sobre evasão escolar, analfabetismo funcional e desigualdade educacional.",
      },
      {
        titulo: "Quarto de Despejo – Carolina Maria de Jesus",
        fonte: "Literatura/diário (1960)",
        ideia: "Retrato da fome e da exclusão social pela ótica de uma mulher negra da favela.",
        uso: "Excelente para fome, moradia, racismo estrutural e papel da mulher.",
      },
      {
        titulo: "Lei de Diretrizes e Bases (LDB – 9.394/96)",
        fonte: "Legislação",
        ideia: "Estabelece a educação como dever do Estado e da família.",
        uso: "Use em temas sobre acesso à escola, ensino médio, analfabetismo.",
      },
    ],
  },
  {
    area: "Saúde Mental e Comportamento",
    icon: Users,
    itens: [
      {
        titulo: "O Mal-estar na Civilização – Sigmund Freud",
        fonte: "Psicanálise (1930)",
        ideia: "A vida em sociedade exige renúncia, gerando sofrimento psíquico permanente.",
        uso: "Ótimo para temas sobre saúde mental, ansiedade e suicídio entre jovens.",
      },
      {
        titulo: "Bem-vindo a Lagos (Welcome to Lagos)",
        fonte: "Documentário",
        ideia: "Mostra resiliência humana frente à pobreza extrema.",
        uso: "Use em temas sobre exclusão, trabalho informal e dignidade.",
      },
      {
        titulo: "Ministério da Saúde — Setembro Amarelo",
        fonte: "Política pública",
        ideia: "Campanha nacional de prevenção ao suicídio.",
        uso: "Use para articular dados oficiais em temas de saúde mental.",
      },
    ],
  },
  {
    area: "Cultura, Identidade e Diversidade",
    icon: Globe,
    itens: [
      {
        titulo: "O Perigo de uma História Única – Chimamanda Ngozi Adichie",
        fonte: "Palestra TED / livro",
        ideia: "Reduzir um povo a uma única narrativa gera estereótipos e violência simbólica.",
        uso: "Excelente para racismo, representatividade, intolerância e mídia.",
      },
      {
        titulo: "Casa-Grande e Senzala – Gilberto Freyre",
        fonte: "Sociologia",
        ideia: "Discute a formação da sociedade brasileira a partir das relações raciais coloniais.",
        uso: "Use em temas sobre racismo estrutural e desigualdade histórica.",
      },
      {
        titulo: "Lei 10.639/2003",
        fonte: "Legislação brasileira",
        ideia: "Torna obrigatório o ensino de história e cultura afro-brasileira nas escolas.",
        uso: "Combine com Freyre/Adichie em temas raciais e educacionais.",
      },
    ],
  },
];

function RepertorioPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative gradient-hero overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <Badge variant="outline" className="border-primary/40 text-primary">
            <Sparkles className="mr-1 h-3 w-3" /> Guia Completo • Atualizado para o ENEM 2026
          </Badge>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            Repertório <span className="gradient-text">ENEM</span>: o guia definitivo com 50+
            exemplos prontos
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
            Tudo o que você precisa saber sobre <b>repertório sociocultural</b> na redação do ENEM:
            o que é, como escolher, como citar corretamente e mais de 50 exemplos organizados por
            área temática — prontos para usar na sua próxima redação rumo à <b>nota 1000</b>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/redacao">
              <Button size="lg" className="glow-blue">
                Corrigir minha Redação Grátis <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <a href="#exemplos">
              <Button size="lg" variant="outline">
                Pular para os 50 exemplos
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* O QUE É */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <h2 className="text-3xl font-bold">O que é repertório na redação do ENEM?</h2>
        <p className="mt-4 text-muted-foreground">
          <b>Repertório</b> é todo o conjunto de <b>conhecimentos externos</b> que o candidato
          utiliza para sustentar sua argumentação: filósofos, livros, filmes, séries, dados
          estatísticos, leis, fatos históricos, conceitos científicos e até obras de arte. Na
          redação do ENEM, ele é avaliado dentro da <b>Competência 2</b>, que mede a capacidade do
          aluno de “compreender a proposta de redação e aplicar conceitos das várias áreas de
          conhecimento para desenvolver o tema”.
        </p>
        <p className="mt-3 text-muted-foreground">
          O que diferencia uma redação nota 700 de uma nota 1000 raramente é a gramática — é a{" "}
          <b>qualidade e a pertinência</b> do repertório usado. Um repertório <b>produtivo</b>{" "}
          conecta-se ao tema, fortalece um argumento e mostra <b>visão de mundo</b>.
        </p>

        <h2 className="mt-12 text-3xl font-bold">Repertório produtivo × repertório decorado</h2>
        <Card className="card-glass mt-4 p-6">
          <ul className="space-y-3 text-sm">
            <li>
              ✅ <b>Produtivo</b>: conectado ao tema, explicado em poucas palavras e usado para
              defender uma tese. Ex.: citar Byung-Chul Han em um tema sobre saúde mental.
            </li>
            <li>
              ❌ <b>Decorado e jogado</b>: aparece solto, sem explicação, como “enfeite”. Ex.:
              começar a redação com uma frase de Aristóteles sem nenhuma conexão com o tema.
            </li>
          </ul>
        </Card>

        <h2 className="mt-12 text-3xl font-bold">Como inserir o repertório no texto</h2>
        <p className="mt-4 text-muted-foreground">
          Use a fórmula <b>Apresenta → Explica → Conecta</b>:
        </p>
        <Card className="card-glass mt-4 p-6">
          <Quote className="h-6 w-6 text-primary" />
          <p className="mt-3 italic text-foreground">
            “Segundo o filósofo sul-coreano Byung-Chul Han, vivemos em uma{" "}
            <b>‘Sociedade do Cansaço’</b>, marcada pela autoexploração e pela hiperprodutividade.
            Essa lógica se reflete no aumento dos casos de transtornos mentais entre jovens
            brasileiros, conforme dados do Ministério da Saúde…”
          </p>
        </Card>

        <h2 className="mt-12 text-3xl font-bold">Tipos de repertório aceitos pelo ENEM</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            { titulo: "Filosofia e Sociologia", ex: "Hannah Arendt, Foucault, Bauman, Han, Freire" },
            { titulo: "Literatura", ex: "Machado de Assis, Carolina Maria de Jesus, Drummond" },
            { titulo: "História", ex: "Revolução Industrial, ditadura militar, abolição" },
            { titulo: "Direito e legislação", ex: "Constituição, LDB, ECA, Lei Maria da Penha" },
            { titulo: "Cinema, séries e documentários", ex: "Cidade de Deus, Black Mirror, O Dilema das Redes" },
            { titulo: "Dados oficiais", ex: "IBGE, Ministério da Saúde, ONU, FAO" },
          ].map((c) => (
            <Card key={c.titulo} className="card-glass p-4">
              <h3 className="text-base font-semibold text-primary">{c.titulo}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Ex.: {c.ex}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* EXEMPLOS POR ÁREA */}
      <section id="exemplos" className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-3xl font-bold">
          50+ exemplos de repertório <span className="gradient-text">prontos para usar</span>
        </h2>
        <p className="mt-3 text-muted-foreground">
          Organizamos os repertórios mais cobrados nos últimos anos do ENEM por <b>área temática</b>.
          Cada exemplo traz a fonte, a ideia central e como usar na sua redação.
        </p>

        <div className="mt-10 space-y-12">
          {repertorios.map((bloco) => {
            const Icon = bloco.icon;
            return (
              <div key={bloco.area}>
                <h3 className="flex items-center gap-2 text-2xl font-bold text-primary">
                  <Icon className="h-6 w-6" /> {bloco.area}
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {bloco.itens.map((it) => (
                    <Card key={it.titulo} className="card-glass p-5">
                      <div className="flex items-start gap-2">
                        <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div>
                          <h4 className="text-base font-semibold">{it.titulo}</h4>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            {it.fonte}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm">
                        <b>Ideia central:</b> {it.ideia}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        <b>Como usar:</b> {it.uso}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <h2 className="text-3xl font-bold">Perguntas frequentes sobre repertório ENEM</h2>
        <div className="mt-6 space-y-4">
          {[
            {
              q: "Quantos repertórios devo usar?",
              a: "De 2 a 3 ao longo de toda a redação: 1 na introdução e 1 em cada parágrafo de desenvolvimento. Mais que isso vira lista, e o ENEM penaliza repertório solto.",
            },
            {
              q: "Posso citar filmes e séries?",
              a: "Sim. Filmes, séries e documentários são válidos desde que estejam ligados de forma produtiva ao tema e sejam corretamente nomeados (com diretor ou ano, se possível).",
            },
            {
              q: "Preciso decorar muitos autores?",
              a: "Não. Melhor dominar 8 a 12 repertórios versáteis (que cabem em vários temas) do que decorar 50 sem entender. Veja nossa lista por área temática acima.",
            },
            {
              q: "Repertório invent é aceito?",
              a: "Não. Citar autor, livro ou dado inventado é considerado erro grave. Em caso de dúvida, prefira um repertório que você realmente conhece.",
            },
          ].map((f) => (
            <Card key={f.q} className="card-glass p-5">
              <h3 className="text-lg font-semibold">{f.q}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-20">
        <Card className="card-glass border-primary/40 p-8 text-center glow-blue">
          <h2 className="text-3xl font-bold">
            Treine seu repertório <span className="gradient-text">na prática</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Envie sua redação agora e nossa IA aponta exatamente <b>quais repertórios funcionaram</b>{" "}
            e quais ficaram “soltos”, com sugestões prontas para a próxima versão.
          </p>
          <Link to="/redacao" className="mt-6 inline-block">
            <Button size="lg" className="glow-blue">
              Corrigir minha Redação Grátis <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </section>

      <Footer />
    </div>
  );
}
