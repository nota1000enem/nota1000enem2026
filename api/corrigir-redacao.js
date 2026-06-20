// Edge Function para corrigir redações ENEM
// Deploy em Vercel como Edge Function
// Usa Hugging Face Inference API (tier gratuito)

export default async function handler(req) {
  // Apenas POST permitido
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido. Use POST.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { texto } = await req.json();

    // Validar texto
    if (!texto || typeof texto !== 'string' || texto.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: 'Redação deve ter no mínimo 50 caracteres.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validar API key
    if (!process.env.HF_API_KEY) {
      console.error('HF_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Serviço de IA não configurado. Entre em contato com o administrador.' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Prompt estruturado para correção ENEM em português
    const prompt = `Você é um especialista em correção de redações ENEM. Avalie a redação abaixo segundo as 5 competências ENEM e retorne APENAS um JSON válido (sem markdown, sem código, sem explicações).

Retorne exatamente neste formato:
{
  "competencias": {
    "1": {"nota": <número 0-200>, "descricao": "<até 30 caracteres>"},
    "2": {"nota": <número 0-200>, "descricao": "<até 30 caracteres>"},
    "3": {"nota": <número 0-200>, "descricao": "<até 30 caracteres>"},
    "4": {"nota": <número 0-200>, "descricao": "<até 30 caracteres>"},
    "5": {"nota": <número 0-200>, "descricao": "<até 30 caracteres>"}
  },
  "nota_total": <número 0-1000>,
  "pontos_fortes": ["<ponto 1>", "<ponto 2>"],
  "pontos_fracos": ["<ponto 1>", "<ponto 2>"],
  "feedback": "<feedback geral até 100 caracteres>"
}

REDAÇÃO:
${texto}

Retorne APENAS o JSON, nada mais.`;

    // Chamar Hugging Face Inference API
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 800,
            temperature: 0.5,
            top_p: 0.95
          }
        })
      }
    );

    // Tratamento de erros da Hugging Face
    if (!hfResponse.ok) {
      const errorBody = await hfResponse.text();
      console.error('HF API erro:', hfResponse.status, errorBody);
      
      if (hfResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Muitas requisições. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({
          error: 'Erro ao processar redação',
          status: hfResponse.status
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await hfResponse.json();
    const generatedText = Array.isArray(result)
      ? result[0]?.generated_text || ''
      : result.generated_text || '';

    // Extrair JSON da resposta
    let correcao = { raw: generatedText };
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      try {
        correcao = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        console.error('Erro ao parsear JSON:', parseErr);
        correcao = { raw: generatedText, parse_error: true };
      }
    }

    return new Response(JSON.stringify(correcao), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    console.error('Erro na Edge Function:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', message: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
