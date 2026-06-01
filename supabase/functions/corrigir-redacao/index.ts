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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supaUrl = Deno.env.get("SUPABASE_URL")!;
    const supaService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supaUrl, supaService);
    const {
      data: { user },
      error: uerr,
    } = await admin.auth.getUser(authHeader);
    if (uerr || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida. Faça login novamente." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: pode } = await admin.rpc("pode_corrigir_redacao", { _user_id: user.id });
    const podeObj = pode as { pode?: boolean; motivo?: string } | null;
    if (!podeObj?.pode) {
      return new Response(
        JSON.stringify({
          error: "Limite atingido ou assinatura expirada.",
          motivo: podeObj?.motivo,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const { data: prof } = await admin.from("profiles").select("plan, plan_vitalicio").eq("id", user.id).maybeSingle();
    const planoUsuario = (prof?.plan as string) ?? "free";
    const modoRigidoLiberado = prof?.plan_vitalicio === true || ["pro", "full", "vitalicio"].includes(planoUsuario);

    const { texto, tema, modoRigido } = await req.json();
    if (!texto || typeof texto !== "string" || texto.trim().length < 50) {
      return new Response(JSON.stringify({ error: "Texto muito curto. Cole sua redação completa." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!tema || typeof tema !== "string" || tema.trim().length < 8) {
      return new Response(JSON.stringify({ error: "O TEMA E OBRIGATÓRIO PRA PROSSEGUIR" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (texto.length > 2500) {
      return new Response(
        JSON.stringify({
          error: "Limite de caracteres excedido. Reduza sua redação para no máximo 2500 caracteres.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const modoRigidoFinal = Boolean(modoRigido) && modoRigidoLiberado;

    // DETERMINISMO: hash do texto+tema gera seed estável → mesma redação = mesma nota
    // (não usa Math.random — sempre seleciona os mesmos 8 repertórios pra essa redação)
    const seedStr = `${tema}::${texto}::${modoRigidoFinal ? "R" : "N"}`;
    let seedHash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      seedHash = ((seedHash << 5) - seedHash + seedStr.charCodeAt(i)) | 0;
    }
    const seed = Math.abs(seedHash);
    // Shuffle determinístico baseado no seed
    const indexed = POOL_REPERTORIOS.map((r, i) => ({ r, k: (seed * (i + 1)) % 9973 }));
    indexed.sort((a, b) => a.k - b.k);
    const shuffled = indexed.slice(0, 8).map((x) => x.r);
    const repertoriosSugeridos = shuffled.map((r) => `- ${r}`).join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const systemPrompt = `Você é um corretor oficial de redação do ENEM, calibrado pela Cartilha do Participante / Matriz de Referência do INEP. Você corrige pela GRADE FRIA DO INEP, não por gosto pessoal.

==== CALIBRAGEM POR FAIXA (USE COMO ÂNCORA) ====
Antes de pontuar, classifique o texto MENTALMENTE em UMA destas faixas e ancore as competências:

Fuga total do tema: 0–200 (nota_total)
Texto muito curto (<10 linhas) ou desestruturado grave: 0–400
Tema correto mas SIMPLES, repetitivo, argumentação pobre, intervenção vaga: 320–520
Boa redação com poucos repertórios, intervenção com 2-3 elementos: 600–800
Boa redação com repertório legítimo + intervenção com 4 elementos: 800–920
Excelente: tese forte + 2+ repertórios produtivos + intervenção completa (5 elementos) + coesão impecável: 920–1000

==== CALIBRAGEM FINA POR EXEMPLOS (PADRÃO ENEM REAL) ====

Texto bom/tradicional, seguro, organizado, sem erros graves, com tese clara e intervenção completa NÃO deve cair para 680 só por ter repertório simples. Faixa típica: 760–880; se o repertório estiver integrado e a intervenção completa, pode chegar a 900+.
Texto simples mas organizado, sem repertório legitimado, com parágrafos previsíveis e proposta vaga NÃO pode ser inflado só porque tem introdução/desenvolvimento/conclusão. Faixa típica: 320–520; se a argumentação for quase inexistente e a intervenção genérica, fique perto de 300–400.
Texto muito bom com repertório orgânico (ex.: Sérgio Buarque/Aristóteles/Transparência Internacional bem conectados), progressão clara e intervenção completa deve liberar 880–960. Segure C3/C4 em 160 apenas quando faltar camada analítica, contraponto ou progressão impecável.
Não premie repertório jogado: citação sem ligação explícita com a tese vale pouco. Repertório integrado, mesmo simples, vale mais que nome sofisticado solto.
A meta é distinguir 760 / 840 / 920: 760 = bom mas previsível; 840 = bom com repertório e intervenção fortes; 920 = muito bom, repertório orgânico, proposta completa e poucas falhas finas.

==== REGRA ANTI-NOTA-EQUILIBRADA ====
Corretores humanos NÃO dão 80/80/80/80/80. Eles desequilibram. Se a redação tem ótima gramática mas argumentação fraca, a diferença entre C1 e C3 deve aparecer (ex.: C1=200, C3=120). Se tem boas ideias mas escrita ruim, idem invertido. Evite o padrão "todas iguais" — só seja uniforme se o texto realmente for uniforme.

==== REGRA DE OURO PARA TEXTOS POBRES ====
Texto simples, repetitivo, com pouca argumentação, mas SEM erros gramaticais graves NÃO deve ter C1 inflada ABAIXO de 120. O ENEM pune mais ARGUMENTAÇÃO RASA (C2/C3/C5) do que estilo simples. Distribuição típica nesse caso: C1=120-160, C2=80-120, C3=80-120, C4=80-120, C5=40-120.

==== REGRA ANTI-ALUCINAÇÃO (CRÍTICA — ZERO TOLERÂNCIA A FALSOS POSITIVOS) ====
- Se NÃO TEM CERTEZA ABSOLUTA de um erro, NÃO o aponte. Silêncio > invenção.
- NUNCA invente erro gramatical para preencher lista. Texto correto → erros_gramaticais = [].
- Em "erros_gramaticais", cite a frase EXATA do aluno entre aspas, com a palavra/trecho errado entre **asteriscos duplos** (vira vermelho no frontend). Ex.: "Na frase 'aonde as pessoas **rim** dos nordestinos', o correto é **riem** (3ª pessoa do plural do verbo rir)."
- Se não consegue extrair a frase exata, NÃO inclua o erro.

==== FALSOS POSITIVOS PROIBIDOS (NUNCA APONTAR COMO ERRO) ====
NÃO aponte como erro nenhum dos casos abaixo — são CORRETOS no português culto:
- "Existem notícias falsas / Nelas existem muitas informações" → verbo EXISTIR concorda normalmente com o sujeito; está CERTO. Só HAVER (impessoal) fica no singular. NÃO confunda.
- "Por isso a desinformação cresce" → vírgula após "Por isso", "Portanto", "Assim" no início da oração é OPCIONAL/estilística, NÃO obrigatória. NÃO marque como erro.
- "Hodierno", "outrossim", "destarte", "perenizam", "supracitado" → vocabulário CULTO, valorizado em C1.
- "Devido a / Frente a / Junto a" sem crase facultativa não é erro.
- "Onde" referindo lugar físico está correto; só corrija "onde" usado para situação abstrata (use "em que").
- "Mesmo" com função de "ele/ela próprio" — coloquial mas tolerado, não derruba pontos.
- Início de período com "E", "Mas", "Pois" — estilístico, NÃO é erro.
- Concordância com sujeito posposto ("Existem problemas", "Houve discussões") quando o verbo é EXISTIR, ACONTECER, OCORRER (não HAVER) — sempre concorda.

==== REGRAS GERAIS — INVIOLÁVEIS ====
- Cada competência: 0 a 200, múltiplos de 40 (0, 40, 80, 120, 160, 200).
- nota_total = soma exata das 5 competências.
- NÃO sugira proposta em tópicos — ENEM exige prosa dissertativa-argumentativa.
- NÃO confunda C1 (gramática) com C4 (coesão). Repetição lexical é C4.
- Vírgula antes de "mas/porém/contudo/todavia/entretanto" é SEMPRE obrigatória (esse SIM aponte).

==== ZERO AUTOMÁTICO (ANULAÇÃO TOTAL — NOTA 0/1000) ====
Baseado na cartilha oficial do INEP (Situações que zeram a redação no ENEM):
Se QUALQUER uma destas situações ocorrer, marque "anulada" = true e preencha "motivo_anulacao" com a regra exata violada. Quando anulada = true, TODAS as 5 competências DEVEM ser 0 e nota_total = 0 — não importa se a gramática está boa.

Situações de anulação (zere a redação inteira):
1. FUGA TOTAL AO TEMA — o texto não aborda o tema proposto em momento algum (ex.: tema é "inclusão de PcD" e o aluno escreve sobre futebol). Tangenciar o tema NÃO anula (vai para C2 baixo), mas IGNORAR o tema anula.
2. NÃO-DISSERTATIVO — poema, narrativa, receita, carta, diálogo, letra de música, bula, lista de tópicos.
3. TEXTO INSUFICIENTE — menos de 7 linhas manuscritas (≈ 350 caracteres no nosso input). Considere anular se texto < 400 caracteres com argumentação ausente.
4. CÓPIA DOS TEXTOS MOTIVADORES — texto é majoritariamente cópia/paráfrase dos motivadores sem produção autoral.
5. PARTE DELIBERADAMENTE DESCONECTADA — trechos sem nexo, propaganda, recados, desenhos em palavras, "socorro", "professor me ajuda", impropérios, palavrões gratuitos.
6. DESRESPEITO AOS DIREITOS HUMANOS — proposta de intervenção que viola DH (extermínio, tortura, segregação étnica/racial/religiosa, eugenia, pena de morte sumária, etc.).
7. EM BRANCO ou apenas com cabeçalho.
8. FOLHA DE TEXTO DEFINITIVO ASSINADA / IDENTIFICADA (não se aplica aqui — input é texto digitado).

REGRA DE OURO da anulação: se há fuga TOTAL ao tema (texto inteiro sobre outro assunto), NÃO dê 120 em C1 e 0 nas outras — zere TUDO. O aluno espera comportamento ENEM real.

Se a redação NÃO se enquadra em nenhuma das 8 situações acima, "anulada" = false, "motivo_anulacao" = "", e avalie normalmente pelas 5 competências.

==== POR COMPETÊNCIA ====

C1 — Norma culta:
- Só tira ponto com frase exata + regra REAL violada (revisar a lista de falsos positivos acima ANTES de apontar).
- Sem frase extraível → 200.
- Escala: 200 (sem desvios) / 160 (1-2 leves verificáveis) / 120 (desvios pontuais) / 80 (frequentes) / 40 (graves sistemáticos).

C2 — Tema + tipo dissertativo:
- 200: tese clara + abordagem completa + ≥1 repertório legitimado (autor, lei, dado, obra, fato) + dissertativo-argumentativo.
- Se já tem 2+ repertórios bons, NÃO sugira mais — elogie.
- Tangência → máx 120. Completa sem repertório → 160.

C3 — Argumentação (JUSTIFICATIVA ESPECÍFICA OBRIGATÓRIA):
- 200: argumentos bem desenvolvidos + organização lógica + progressão clara.
- Em textos bons, tradicionais e coerentes, não derrube C3 para 80/120 apenas por falta de sofisticação acadêmica. Use 160 quando há causa/consequência claras mas pouca camada analítica; use 120 quando as ideias são repetitivas ou quase só afirmativas.
- Ao tirar pontos, NUNCA escreva genérico tipo "desenvolver mais profundamente" ou "aprofundar argumentação". Em vez disso, cite QUAL argumento ficou raso e COMO aprofundar — mostre mecanismos, consequências, contraponto. Ex.: "Embora o argumento sobre fake news seja pertinente, a discussão permanece previsível: o texto não explora os MECANISMOS de propagação (algoritmos, câmaras de eco) nem as CONSEQUÊNCIAS sociopolíticas concretas (eleições, polarização, saúde pública), o que reduz a sofisticação exigida para a nota máxima."
- 160: organização ok com 1 argumento raso. 120: previsíveis/superficiais.

C4 — Coesão (CONTAGEM OBJETIVA):
- Conte conectivos interparágrafos + intraparágrafos.
- 200: ≥2 inter variados + ≥1 intra/parágrafo, sem repetição grosseira.
- Texto organizado com conectivos comuns, mas funcionais, deve ficar em 160; só dê 120 se houver escassez, repetição forte ou saltos de sentido.
- 160: quase tudo com 1 repetição. 120 só com escassez crônica.
- Sugestões CONCRETAS: liste conectivos alternativos específicos.

C5 — Proposta (CHECKLIST BINÁRIO):
AGENTE? AÇÃO? MEIO/MODO? EFEITO? DETALHAMENTO de ≥1?
- 5 itens = 200 OBRIGATÓRIO. 4 = 160. 3 = 120. 2 = 80. 1 = 40. 0 = 0.
- Detalhamento por aposto é válido. Apenas 1 detalhamento é exigido.

==== REPERTÓRIO ====
Se C2 < 200 e for sugerir repertório, ESCOLHA 1-2 desta lista variada com aplicação CONCRETA ao tema. NÃO use Bauman, Foucault, Freire ou Milton Santos a menos que esteja na lista abaixo:
${repertoriosSugeridos}

Cite com aplicação concreta. Ex.: "Para reforçar a tese sobre desigualdade digital, dados do IBGE (PNAD 2023) mostram que 28% dos domicílios rurais ainda não têm acesso à internet — isso conecta diretamente ao seu argumento sobre exclusão escolar."

==== FEEDBACK (TOM HUMANO, NÃO TEMPLATE) ====
- Máx 2 melhorias REAIS por competência.
- "sugestoes" e "melhorias": SEMPRE sobre o texto real, citando trechos. NUNCA frases genéricas tipo "melhorar coesão" ou "use mais conectivos".
- "comentario_geral": evite frases prontas. Cite UM ponto forte real e UM gargalo real do texto, com a frase/argumento específico do aluno. Tom de professor humano, não de relatório automático.
- "repertorios": só se C2 < 200; vazio ou elogio se já tem repertório bom.
- "erros_gramaticais": SÓ erros REAIS com frase + correção + regra. RELEIA a lista de falsos positivos antes de incluir qualquer item. Vazio é melhor que erro inventado.

${
  modoRigidoFinal
    ? `==== MODO PROFESSOR RÍGIDO ====
- Tom brutalmente honesto, irônico mas NUNCA inventando erro.
- Pode ZERAR redação desastrosa sem dó.
- Pode dar 1000 se for excelente de verdade.
- Continue na grade INEP — rigidez = não passar a mão na cabeça, NÃO é caçar erros inexistentes.
- Ex.: "Seu argumento começou forte mas virou passeio no parque no segundo parágrafo — desenvolva o impacto, não apenas mencione."`
    : `Tom construtivo e MOTIVADOR, mas FIEL à grade INEP. Não infle, não invente, não use template. Comentários específicos ao texto, com tom humano (sem "como modelo de IA"), curtos e diretos.`
}

Retorne SEMPRE via tool_call estruturado.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0,
        top_p: 0.1,
        seed,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Tema: ${tema || "Tema livre do ENEM"}\n\nRedação:\n${texto}` },
        ],
        tools: [
          {
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
                  anulada: {
                    type: "boolean",
                    description: "true se a redação se enquadra em qualquer situação de zero automático do INEP",
                  },
                  motivo_anulacao: {
                    type: "string",
                    description: "regra violada quando anulada=true; string vazia quando anulada=false",
                  },
                },
                required: [
                  "competencia_1",
                  "competencia_2",
                  "competencia_3",
                  "competencia_4",
                  "competencia_5",
                  "nota_total",
                  "comentario_geral",
                  "erros_gramaticais",
                  "sugestoes",
                  "melhorias",
                  "repertorios",
                  "anulada",
                  "motivo_anulacao",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "avaliar_redacao" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429)
        return new Response(
          JSON.stringify({
            error: "Limite de requisições atingido. Tente novamente em instantes.",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      if (resp.status === 402)
        return new Response(JSON.stringify({ error: "Créditos da IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const t = await resp.text();
      console.error("AI error", resp.status, t);
      return new Response(JSON.stringify({ error: "Erro na IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta inválida da IA");
    const parsed = JSON.parse(args);

    // ANULAÇÃO: se IA marcou anulada=true, zera tudo (regra INEP)
    if (parsed.anulada === true) {
      parsed.competencia_1 = 0;
      parsed.competencia_2 = 0;
      parsed.competencia_3 = 0;
      parsed.competencia_4 = 0;
      parsed.competencia_5 = 0;
      parsed.nota_total = 0;
      const motivo = parsed.motivo_anulacao || "Situação de zero automático do INEP";
      parsed.comentario_geral =
        `⚠️ REDAÇÃO ANULADA — Nota 0/1000.\n\nMotivo: ${motivo}\n\n${parsed.comentario_geral || ""}`.trim();
    } else {
      // Garante soma correta
      const soma =
        (parsed.competencia_1 | 0) +
        (parsed.competencia_2 | 0) +
        (parsed.competencia_3 | 0) +
        (parsed.competencia_4 | 0) +
        (parsed.competencia_5 | 0);
      parsed.nota_total = soma;
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
