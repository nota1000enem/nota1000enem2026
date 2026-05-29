import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { horasDia, diasSemana, fraquezas, meta, diasAteProva } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const systemPrompt = `Você é um mentor especialista em ENEM que monta planos de estudo SEMANAIS extremamente detalhados.
Use técnica Pomodoro (50min foco + 10min pausa), distribua tempo entre Matemática, Linguagens, Ciências Humanas, Ciências da Natureza e Redação.
Inclua: 1 redação por semana, 1 simulado quinzenal, revisões espaçadas, e priorize matérias fracas.
Responda SEMPRE via tool_call estruturado retornando o cronograma semanal.`;

    const userPrompt = `Monte o plano para:
- Horas disponíveis por dia: ${horasDia}h
- Dias disponíveis por semana: ${diasSemana}
- Pontos fracos: ${fraquezas || "não informados"}
- Meta: ${meta || "aprovação"}
- Dias até a prova: ${diasAteProva || "180"}
Crie um cronograma para os 7 dias (segunda a domingo) com blocos detalhados.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "montar_plano",
            description: "Monta um plano de estudo semanal para o ENEM",
            parameters: {
              type: "object",
              properties: {
                resumo: { type: "string", description: "Resumo motivacional do plano (2-3 frases)" },
                dicas_gerais: { type: "array", items: { type: "string" }, description: "5-8 dicas estratégicas" },
                cronograma: {
                  type: "array",
                  description: "Lista com 7 dias (segunda a domingo)",
                  items: {
                    type: "object",
                    properties: {
                      dia: { type: "string", description: "Segunda, Terça, etc." },
                      blocos: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            horario: { type: "string", description: "Ex: 08:00 - 08:50" },
                            materia: { type: "string" },
                            topico: { type: "string" },
                            tipo: { type: "string", description: "teoria | exercicio | redacao | revisao | simulado | descanso" },
                          },
                          required: ["horario", "materia", "topico", "tipo"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["dia", "blocos"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["resumo", "dicas_gerais", "cronograma"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "montar_plano" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Limite atingido. Tente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Créditos esgotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("AI error", resp.status, t);
      return new Response(JSON.stringify({ error: "Erro na IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("Resposta inválida da IA");
    const parsed = JSON.parse(args);
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});