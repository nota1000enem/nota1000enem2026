import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pool grande de repertórios — a IA escolhe 1-2 SE a redação não usou, com rotação aleatória
// para evitar o vício de Bauman/Foucault. Rotacionado por seed no momento da chamada.
const POOL_REPERTORIOS = [
  "Documentário 'O Dilema das Redes' (Netflix, 2020) — manipulação algorítmica",
  "Artigo 5º da Constituição Federal de 1988 — igualdade e direitos fundamentais",
  "Artigo 6º da Constituição Federal — direitos sociais (saúde, educação, moradia)",
  "Dados do IBGE (PNAD Contínua) sobre desigualdade e mercado de trabalho",
  "Relatório da UNESCO sobre educação básica no Brasil",
  "Lei Maria da Penha (Lei 11.340/2006) e seus avanços",
  "ECA — Estatuto da Criança e do Adolescente (Lei 8.069/1990)",
  "Declaração Universal dos Direitos Humanos (ONU, 1948)",
  "Pesquisa do DataSenado sobre violência contra a mulher",
  "Livro '1984' de George Orwell — vigilância e controle",
  "Livro 'O Cortiço' de Aluísio Azevedo — desigualdade urbana brasileira",
  "Filme 'Que Horas Ela Volta?' de Anna Muylaert — classe e trabalho doméstico",
  "Série 'Black Mirror' — episódio 'Nosedive' sobre redes sociais",
  "Filósofo Jürgen Habermas — esfera pública e debate democrático",
  "Antônio Cândido — texto 'O Direito à Literatura'",
  "Milton Santos — 'Por uma outra globalização'",
  "Caso real: Marielle Franco — debate sobre violência política",
  "Caso real: Tragédia de Mariana/Brumadinho — responsabilidade socioambiental",
  "Conceito de 'capital cultural' de Pierre Bourdieu",
  "Hannah Arendt — 'A Banalidade do Mal' (debate sobre alienação)",
  "Dados do IPEA sobre evasão escolar",
  "Convenção da ONU sobre os Direitos das Pessoas com Deficiência",
  "Lei Brasileira de Inclusão (Lei 13.146/2015)",
  "Pacto pela Saúde / SUS — universalidade do atendimento",
  "Mapa da Violência (Flacso) sobre juventude negra",
  "Paulo Freire — 'Pedagogia do Oprimido' (apenas se for sobre educação)",
  "Marco Civil da Internet (Lei 12.965/2014)",
  "LGPD — Lei Geral de Proteção de Dados (Lei 13.709/2018)",
  "Caso real: queimadas na Amazônia e cobertura internacional",
  "Filme 'Cidade de Deus' — desigualdade e violência urbana",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const supaService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supaUrl, supaService);
    const { data: { user }, error: uerr } = await admin.auth.getUser(authHeader);
    if (uerr || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida. Faça login novamente." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: pode } = await admin.rpc("pode_corrigir_redacao", { _user_id: user.id });
    const podeObj = pode as { pode?: boolean; motivo?: string } | null;
    if (!podeObj?.pode) {
      return new Response(JSON.stringify({ error: "Limite atingido ou assinatura expirada.", motivo: podeObj?.motivo }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: prof } = await admin.from("profiles").select("plan, plan_vitalicio").eq("id", user.id).maybeSingle();
    const planoUsuario = (prof?.plan as string) ?? "free";
    const modoRigidoLiberado = prof?.plan_vitalicio === true || ["pro", "full", "vitalicio"].includes(planoUsuario);

    const { texto, tema, modoRigido } = await req.json();
    if (!texto || typeof texto !== "string" || texto.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Texto muito curto. Cole sua redação completa." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (texto.length > 2500) {
      return new Response(JSON.stringify({ error: "Texto excede 2500 caracteres (limite ENEM ~30 linhas)." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const modoRigidoFinal = Boolean(modoRigido) && modoRigidoLiberado;

    // Rotaciona 8 repertórios aleatórios do pool para evitar vício em Bauman/Foucault
    const shuffled = [...POOL_REPERTORIOS].sort(() => Math.random() - 0.5).slice(0, 8);
    const repertoriosSugeridos = shuffled.map(r => `- ${r}`).join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const systemPrompt = `Você é um corretor oficial de redação do ENEM, calibrado pela Cartilha do Participante / Matriz de Referência do INEP. Você corrige pela GRADE FRIA DO INEP, não por gosto pessoal.

==== CALIBRAGEM POR FAIXA (USE COMO ÂNCORA) ====
Antes de pontuar, classifique o texto MENTALMENTE em UMA destas faixas e ancore as competências:
- Fuga total do tema: 0–200 (nota_total)
- Texto muito curto (<10 linhas) ou desestruturado grave: 0–400
- Tema correto mas superficial, sem repertório legítimo, intervenção vaga: 400–600
- Boa redação com poucos repertórios, intervenção com 2-3 elementos: 600–800
- Boa redação com repertório legítimo + intervenção com 4 elementos: 800–920
- Excelente: tese forte + 2+ repertórios produtivos + intervenção completa (5 elementos) + coesão impecável: 920–1000

==== REGRA ANTI-NOTA-EQUILIBRADA ====
Corretores humanos NÃO dão 80/80/80/80/80. Eles desequilibram. Se a redação tem ótima gramática mas argumentação fraca, a diferença entre C1 e C3 deve aparecer (ex.: C1=200, C3=120). Se tem boas ideias mas escrita ruim, idem invertido. Evite o padrão "todas iguais" — só seja uniforme se o texto realmente for uniforme.

==== REGRA ANTI-ALUCINAÇÃO ====
- Se NÃO TEM CERTEZA ABSOLUTA de um erro, NÃO o aponte. Silêncio > invenção.
- NUNCA invente erro gramatical para preencher lista. Texto correto → erros_gramaticais = [].
- Em "erros_gramaticais", cite a frase EXATA do aluno entre aspas, com a palavra/trecho errado entre **asteriscos duplos** (vira vermelho no frontend). Ex.: "Na frase 'aonde as pessoas **rim** dos nordestinos', o correto é **riem** (3ª pessoa do plural do verbo rir)."
- Se não consegue extrair a frase exata, NÃO inclua o erro.

==== REGRAS GERAIS — INVIOLÁVEIS ====
- Cada competência: 0 a 200, múltiplos de 40 (0, 40, 80, 120, 160, 200). NUNCA use 160 como "média segura".
- nota_total = soma exata das 5 competências.
- NÃO penalize "hodierno", "outrossim", "destarte", "perenizam" — são valorizadas em C1.
- NÃO sugira proposta em tópicos — ENEM exige prosa dissertativa-argumentativa.
- NÃO confunda C1 (gramática) com C4 (coesão). Repetição lexical é C4.
- Vírgula antes de "mas/porém/contudo/todavia/entretanto" é SEMPRE obrigatória.

==== ZERO AUTOMÁTICO ====
nota_total = 0: branco, fuga total, não-dissertativo (poema/narrativa/receita), < 7 linhas, cópia integral dos motivadores, desrespeito aos DH.

==== REDAÇÕES MUITO RUINS ====
Palavras incompletas, sem acentos sistematicamente, sem pontuação, sem parágrafos → C1 ≤ 40, C2 ≤ 80, C3 ≤ 40, C4 ≤ 40. NÃO infle para 600+.

==== POR COMPETÊNCIA ====

C1 — Norma culta:
- Só tira ponto com frase exata + regra violada.
- Sem frase extraível → 200.
- Escala: 200 (sem desvios) / 160 (até 2 leves) / 120 (pontuais) / 80 (frequentes) / 40 (graves sistemáticos).

C2 — Tema + tipo dissertativo:
- 200: tese clara + abordagem completa + ≥1 repertório legitimado (autor, lei, dado, obra, fato) + dissertativo-argumentativo.
- Se já tem 2+ repertórios bons, NÃO sugira mais — elogie.
- Tangência → máx 120. Completa sem repertório → 160.

C3 — Argumentação:
- 200: argumentos bem desenvolvidos + organização lógica + progressão clara.
- Se for sugerir "aprofundar argumento", CITE QUAL e EXPLIQUE COMO. Ex.: "O argumento sobre fake news poderia mostrar como a desinformação influencia eleições, saúde pública (vacinas) e polarização." NUNCA frases genéricas tipo "desenvolver mais profundamente".
- 160: organização ok com 1 argumento raso. 120: previsíveis/superficiais.

C4 — Coesão (CONTAGEM OBJETIVA):
- Conte conectivos interparágrafos + intraparágrafos.
- 200: ≥2 inter variados + ≥1 intra/parágrafo, sem repetição grosseira.
- 160: quase tudo com 1 repetição. 120 só com escassez crônica.
- Sugestões CONCRETAS: liste conectivos alternativos específicos.

C5 — Proposta (CHECKLIST BINÁRIO):
AGENTE? AÇÃO? MEIO/MODO? EFEITO? DETALHAMENTO de ≥1?
- 5 itens = 200 OBRIGATÓRIO. 4 = 160. 3 = 120. 2 = 80. 1 = 40. 0 = 0.
- Detalhamento por aposto é válido. Apenas 1 detalhamento é exigido — NÃO sugira detalhar todos.

==== REPERTÓRIO ====
Se C2 < 200 e for sugerir repertório, ESCOLHA 1-2 desta lista variada (NÃO use Bauman, Foucault, Freire ou Milton Santos a menos que esteja na lista abaixo):
${repertoriosSugeridos}

Cite o repertório com aplicação CONCRETA ao tema, não genérica. Ex.: "Para reforçar a tese sobre desigualdade digital, dados do IBGE (PNAD 2023) mostram que 28% dos domicílios rurais ainda não têm acesso à internet — isso conecta diretamente ao seu argumento sobre exclusão escolar."

==== FEEDBACK ====
- Máx 2 melhorias REAIS por competência.
- "sugestoes" e "melhorias": SEMPRE sobre o texto real, citando trechos. NUNCA genérico tipo "melhorar coesão".
- "repertorios": só se C2 < 200; vazio ou elogio se já tem repertório bom.
- "erros_gramaticais": só erros reais com frase + correção + regra. Vazio se não há.

${modoRigidoFinal ? `==== MODO PROFESSOR RÍGIDO ====
- Tom brutalmente honesto, irônico mas NUNCA inventando erro.
- Pode ZERAR redação desastrosa sem dó.
- Pode dar 1000 se for excelente de verdade.
- Continue na grade INEP — rigidez = não passar a mão na cabeça.
- Ex.: "Seu argumento começou forte mas virou passeio no parque no segundo parágrafo — desenvolva o impacto, não apenas mencione."` : `Tom construtivo e MOTIVADOR, mas FIEL à grade INEP. Não infle, não invente. Comentários específicos ao texto, com tom humano (sem "como modelo de IA"), curtos e diretos.`}

Retorne SEMPRE via tool_call estruturado.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Tema: ${tema || "Tema livre do ENEM"}\n\nRedação:\n${texto}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "avaliar_redacao",
            description: "Avalia uma redação do ENEM",
            parameters: {
              type: "object",
              properties: {
                competencia_1: { type: "integer" },
                competencia_2: { type: "integer" },
                competencia_3: { type: "integer" },
                competencia_4: { type: "integer" },
                competencia_5: { type: "integer" },
                nota_total: { type: "integer" },
                comentario_geral: { type: "string" },
                erros_gramaticais: { type: "array", items: { type: "string" } },
                sugestoes: { type: "array", items: { type: "string" } },
                melhorias: { type: "array", items: { type: "string" } },
                repertorios: { type: "array", items: { type: "string" } },
              },
              required: ["competencia_1","competencia_2","competencia_3","competencia_4","competencia_5","nota_total","comentario_geral","erros_gramaticais","sugestoes","melhorias","repertorios"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "avaliar_redacao" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Créditos da IA esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("AI error", resp.status, t);
      return new Response(JSON.stringify({ error: "Erro na IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta inválida da IA");
    const parsed = JSON.parse(args);

    // Garante soma correta
    const soma = (parsed.competencia_1|0)+(parsed.competencia_2|0)+(parsed.competencia_3|0)+(parsed.competencia_4|0)+(parsed.competencia_5|0);
    parsed.nota_total = soma;

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
