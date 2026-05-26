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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const systemPrompt = `Você é um corretor especialista em redações do ENEM. Avalie a redação seguindo rigorosamente as 5 competências do ENEM (cada uma de 0 a 200, total 0 a 1000):
1. Domínio da norma culta da língua portuguesa
2. Compreensão do tema e tipo textual dissertativo-argumentativo
3. Seleção, organização e interpretação de argumentos
4. Conhecimento dos mecanismos linguísticos (coesão)
5. Proposta de intervenção respeitando os direitos humanos

${modoRigido ? "MODO PROFESSOR RÍGIDO ATIVADO: seja brutalmente honesto, irônico e use comentários engraçados e críticos no campo 'comentario_geral' e 'sugestoes'. Exemplo de tom: 'Seu argumento começou forte mas virou passeio no parque no segundo parágrafo.'" : "Seja construtivo e motivador."}

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