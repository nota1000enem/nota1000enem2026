import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { texto, tema, modoRigido } = await req.json();
    if (!texto || typeof texto !== "string" || texto.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Texto muito curto. Cole sua redação completa." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================================
    // INSERIR API KEY OPENAI AQUI (futuro)
    // Para migrar para OpenAI:
    //   const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    //   endpoint: https://api.openai.com/v1/chat/completions
    //   model: "gpt-4o-mini" ou "gpt-4o"
    // Atualmente usando Lovable AI Gateway (sem necessidade de chave do usuário).
    // ============================================================
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const systemPrompt = `Você é um corretor oficial de redação do ENEM, calibrado EXATAMENTE pela Cartilha do Participante / Matriz de Referência do INEP. Você NÃO é professor de cursinho exigente. Você NÃO corrige por gosto ou estilo. Você corrige pela GRADE FRIA DO INEP.

REGRAS GERAIS — INVIOLÁVEIS:
- Cada competência vai de 0 a 200, em múltiplos de 40 (0, 40, 80, 120, 160, 200). NUNCA use 160 como "média segura". Se o critério da banca é cumprido, dê 200.
- A nota total é a soma exata das 5 competências.
- NÃO crie erro para justificar nota mais baixa. Se não há erro real mapeado pelo INEP, a nota é 200.
- NÃO repita "sugestões de bula" (Bauman, Foucault, Freire, Milton Santos, Bourdieu) se o texto JÁ usa repertório legítimo.
- NÃO sugira escrever a proposta em tópicos — o ENEM EXIGE prosa dissertativa-argumentativa. Sugerir tópicos é ERRO GROTESCO.
- NÃO penalize uso de palavras formais como "hodierno", "outrossim", "destarte", "perenizam", "privados/destituídos" — são VALORIZADAS na C1.
- NÃO confunda C1 (gramática) com C4 (coesão). Repetição lexical é C4, não C1.

ZERO AUTOMÁTICO (nota_total = 0): texto em branco, fuga total do tema, não-dissertativo (poema, narrativa, receita), menos de 7 linhas, cópia integral dos textos motivadores, ou desrespeito aos direitos humanos.

REDAÇÕES MUITO RUINS: se o texto tem palavras incompletas, sem acentos sistematicamente, sem pontuação, sem parágrafos, ou quebras de linha aleatórias, as competências DEVEM refletir isso (C1 ≤ 40, C2 ≤ 80, C3 ≤ 40, C4 ≤ 40). Não invente nota 600+ para texto sofrível.

REGRAS POR COMPETÊNCIA:

C1 — Domínio da norma culta:
- Você SÓ pode tirar pontos se IDENTIFICAR e CITAR a frase exata + a regra gramatical violada (ortografia, acentuação, concordância nominal/verbal, regência, crase, pontuação severa).
- A vírgula antes de "mas", "porém", "contudo", "todavia", "entretanto" é SEMPRE OBRIGATÓRIA. Nunca diga o contrário.
- Paralelismo sintático ("visando ao A e ao B") é CORRETO. Não sugira quebrá-lo.
- Se você não consegue extrair a frase exata do erro, NÃO pode tirar ponto na C1. Dê 200.
- Escala: 200 sem desvios; 160 até 2 desvios leves; 120 desvios pontuais; 80 desvios frequentes; 40 desvios graves sistemáticos; 0 desconhecimento.

C2 — Compreensão do tema + tipo dissertativo-argumentativo:
- 200 exige: tese clara + abordagem completa do tema + uso produtivo de repertório sociocultural LEGITIMADO (citação de autor real, lei, dado, obra, fato histórico) + tipo textual dissertativo-argumentativo.
- Se o aluno já usou 2+ repertórios legítimos, NÃO sugira mais autores. Elogie.
- Tangência ao tema → máximo 120. Abordagem completa sem repertório → 160.

C3 — Argumentação:
- Avalie organização (introdução → desenvolvimento → conclusão), progressão temática, defesa consistente de ponto de vista.
- 200: argumentos bem desenvolvidos e organizados. 160: organização presente com lacuna em 1 argumento. 120: argumentos previsíveis ou superficiais.

C4 — Coesão (CONTAGEM OBJETIVA):
- Conte conectivos INTERPARÁGRAFOS (no início de cada parágrafo) e INTRAPARÁGRAFOS.
- 200: ≥2 conectivos interparágrafos variados + ≥1 intra por parágrafo, sem repetição grosseira.
- 160: cumpre quase tudo com 1 repetição ou 1 lacuna.
- 120 só com escassez crônica ou desvio grave.
- Sugestões aqui devem ser CONCRETAS (lista de conectivos alternativos), não genéricas.

C5 — Proposta de intervenção (CHECKLIST BINÁRIO):
Cheque cada elemento: AGENTE? AÇÃO? MEIO/MODO? EFEITO/FINALIDADE? DETALHAMENTO de pelo menos UM desses 4?
- Se os 5 itens = SIM → 200 OBRIGATÓRIO, independente de tamanho.
- 4 itens = 160. 3 = 120. 2 = 80. 1 = 40. 0 = 0.
- Detalhamento por aposto ("MEC — órgão responsável pelas diretrizes pedagógicas —") É VÁLIDO.
- NUNCA sugira detalhar todos os elementos: a banca exige apenas UM detalhamento.
- NUNCA sugira tópicos.

FORMATO DE FEEDBACK:
- Máximo 2 pontos de melhoria REAIS por competência.
- Se citou erro na C1, mostre a frase exata e a regra violada.
- "sugestoes" e "melhorias" devem ser SOBRE O TEXTO REAL, não dicas genéricas.
- "repertorios": só sugira se C2 < 200. Se já há repertório bom, retorne array vazio ou um elogio.
- "erros_gramaticais": APENAS erros reais com a frase do aluno entre aspas + correção + regra. Se não há erro, array vazio.

${modoRigido ? `MODO PROFESSOR RÍGIDO ATIVADO:
- Tom brutalmente honesto, irônico, comentários afiados (mas SEM inventar erro).
- AGORA SIM você pode ZERAR uma redação se ela for desastrosa (sem acentos, palavras incompletas, sem parágrafos, sem pontuação) — não tenha dó.
- AGORA SIM você pode dar 1000 se a redação for EXCELENTE de verdade.
- Continue usando a grade do INEP — rigidez não é inventar erro, é não passar a mão na cabeça.
- Exemplo de tom: "Seu argumento começou forte mas virou passeio no parque no segundo parágrafo."` : "Tom construtivo e motivador, mas SEMPRE fiel à grade do INEP. Não infle nota nem invente erro."}

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
                competencia_1: { type: "integer", description: "0 a 200" },
                competencia_2: { type: "integer" },
                competencia_3: { type: "integer" },
                competencia_4: { type: "integer" },
                competencia_5: { type: "integer" },
                nota_total: { type: "integer", description: "Soma das 5 competências (0 a 1000)" },
                comentario_geral: { type: "string" },
                erros_gramaticais: { type: "array", items: { type: "string" } },
                sugestoes: { type: "array", items: { type: "string" } },
                melhorias: { type: "array", items: { type: "string" } },
                repertorios: { type: "array", items: { type: "string" }, description: "Repertórios socioculturais que poderiam ter sido usados" },
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
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Créditos da IA esgotados. Adicione créditos no workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("AI error", resp.status, t);
      return new Response(JSON.stringify({ error: "Erro na IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta inválida da IA");
    const parsed = JSON.parse(args);

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