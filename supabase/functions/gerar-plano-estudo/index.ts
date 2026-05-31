import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Ordem dos dias da semana (PT-BR canônico)
const DIAS_SEMANA = ["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado","Domingo"];

function normalizarPlano(plano?: string | null) {
  const s = (plano ?? "free").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s_-]+/g, "").trim();
  if (s.includes("vitalicio")) return "vitalicio";
  if (s.includes("full")) return "full";
  if (s.includes("pro")) return "pro";
  if (s.includes("light") || s.includes("basic")) return "light";
  return "free";
}

function statusAtivo(status?: string | null) {
  return ["active", "ativa", "approved", "aprovado"].includes((status ?? "").toLowerCase().trim());
}

function futuro(data?: string | null) {
  return !!data && new Date(data).getTime() > Date.now();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user }, error: uerr } = await admin.auth.getUser(authHeader);
    if (uerr || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const [{ data: prof }, { data: sub }, { data: assinatura }] = await Promise.all([
      admin.from("profiles").select("plan, plan_vitalicio, plan_expires_at").eq("id", user.id).maybeSingle(),
      admin.from("subscriptions").select("plan_type, status, current_period_end").eq("user_id", user.id).maybeSingle(),
      admin.from("assinaturas").select("plano, status, vence_em").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const planoPerfil = normalizarPlano(prof?.plan);
    const planoSub = normalizarPlano(sub?.plan_type);
    const planoAssinatura = normalizarPlano(assinatura?.plano);
    const liberado =
      prof?.plan_vitalicio === true ||
      planoPerfil === "vitalicio" ||
      planoSub === "vitalicio" ||
      planoAssinatura === "vitalicio" ||
      (planoPerfil !== "free" && (!prof?.plan_expires_at || futuro(prof?.plan_expires_at))) ||
      (planoSub !== "free" && statusAtivo(sub?.status) && futuro(sub?.current_period_end)) ||
      (planoAssinatura !== "free" && statusAtivo(assinatura?.status) && futuro(assinatura?.vence_em));
    if (!liberado) {
      return new Response(JSON.stringify({ error: "Plano de Estudo com IA disponível apenas para assinaturas pagas e Vitalício." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    let horasDia = Number(body.horasDia ?? 2);
    let diasSemana = Number(body.diasSemana ?? 4);
    let horaInicio = Number(body.horaInicio ?? 19);
    const fraquezas = String(body.fraquezas ?? "").slice(0, 500);
    const meta = String(body.meta ?? "aprovação").slice(0, 200);
    const diasAteProva = Number(body.diasAteProva ?? 180);

    // ❗ CLAMP — respeita regras
    if (!Number.isFinite(horasDia) || horasDia < 2) horasDia = 2;
    if (horasDia > 8) horasDia = 8;
    if (!Number.isFinite(diasSemana) || diasSemana < 4) diasSemana = 4;
    if (diasSemana > 6) diasSemana = 6;
    if (!Number.isFinite(horaInicio) || horaInicio < 5) horaInicio = 19;
    if (horaInicio > 22) horaInicio = 22;
    if (horaInicio + horasDia > 24) horaInicio = 24 - horasDia;

    // Pré-gera os slots HORA A HORA (ex.: 13h às 14h, 14h às 15h, …)
    const slotsHorarios: string[] = [];
    for (let i = 0; i < horasDia; i++) {
      const ini = horaInicio + i;
      const fim = ini + 1;
      const pad = (n: number) => String(n).padStart(2, "0");
      slotsHorarios.push(`${pad(ini)}:00 às ${pad(fim)}:00`);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    // Escolhe quais dias serão de estudo (distribuição equilibrada)
    // 4 dias: Seg, Qua, Sex, Sáb
    // 5 dias: Seg, Ter, Qua, Qui, Sáb
    // 6 dias: Seg-Sex + Sáb
    const distribuicoes: Record<number, string[]> = {
      4: ["Segunda-feira","Quarta-feira","Sexta-feira","Sábado"],
      5: ["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sábado"],
      6: ["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"],
    };
    const diasAtivos = distribuicoes[diasSemana];
    const diasDescanso = DIAS_SEMANA.filter(d => !diasAtivos.includes(d));

    const systemPrompt = `Você é um mentor sênior de ENEM que monta planos SEMANAIS pedagogicamente coerentes. Seu plano será reavaliado e refeito a cada semana pelo aluno.

REGRAS ABSOLUTAS:
1. O cronograma terá EXATAMENTE ${diasSemana} dias de estudo. NÃO inclua mais dias. Os dias ATIVOS são: ${diasAtivos.join(", ")}. Os dias ${diasDescanso.join(", ")} devem aparecer no cronograma como dias de "Descanso ativo / leitura leve" com 1 bloco curto opcional OU apenas com a label "Descanso — sem estudo formal hoje". NUNCA gere blocos de estudo cheios nos dias de descanso.
2. CARGA DIÁRIA: exatamente ${horasDia}h de estudo nos dias ativos. Distribua em blocos curtos de 15, 20, 25 ou 30 minutos (técnica de microaprendizagem ENEM) + pausas curtas de 5-10min entre blocos. NUNCA blocos de 50min — eles desconcentram.
3. SEQUÊNCIA PEDAGÓGICA: cada matéria que aparece deve seguir TEORIA → EXEMPLOS RESOLVIDOS → EXERCÍCIOS → REVISÃO ESPAÇADA. Ex.: se Segunda tem "Função do 2º grau (teoria)", Quarta deve ter "Exercícios de função do 2º grau" e no domingo ou sábado "Revisão de funções".
4. ENCADEAMENTO: não pule pré-requisitos. Equação do 2º grau ANTES de função do 2º grau. Cinemática ANTES de dinâmica. Sintaxe ANTES de coesão. Pré-modernismo ANTES de modernismo.
5. COBERTURA OBRIGATÓRIA (todas as 4 áreas presentes na semana, mínimo 40-50min cada):
   - Matemática e suas Tecnologias
   - Linguagens, Códigos e suas Tecnologias (Português + Literatura + Inglês/Espanhol + Artes)
   - Ciências da Natureza e suas Tecnologias (Física, Química, Biologia)
   - Ciências Humanas e suas Tecnologias (História, Geografia, Filosofia, Sociologia)
   + Redação 1x/semana (sábado ideal, 50-60min)
   + Simulado quinzenal (avise nas dicas)
6. PESO POR FRAQUEZA: as matérias citadas como pontos fracos recebem PESO DOBRADO no tempo total semanal. Outras matérias aparecem 1-2x/semana com pelo menos 40-50min cada.
7. FOCO NA META: o tópico escolhido para cada bloco deve ser PRIORITARIO PARA "${meta}". Se a meta menciona medicina/biologia, dê peso extra a Biologia/Química. Se engenharia, Matemática/Física. Se direito/humanidades, Português/Redação/História/Filosofia. Continue cobrindo TUDO, mas com peso direcionado.
8. NUNCA "1h matemática, descansa, mais 1h matemática". Alterne matérias dentro do dia (ex.: Mat 25min → pausa → Bio 25min → pausa → Mat exercícios 20min → pausa → Redação leitura 20min).
9. TÓPICOS REAIS DO ENEM (use estes, não invente nomes vagos):
   - Matemática: Razão/proporção, Porcentagem, Função afim, Função quadrática, Função exponencial, Função logarítmica, PA/PG, Geometria plana (áreas), Geometria espacial (volumes), Trigonometria no triângulo, Estatística (média/mediana/moda), Probabilidade básica, Análise combinatória, Matrizes/sistemas.
   - Física: Cinemática (MRU/MRUV), Leis de Newton, Trabalho e energia, Hidrostática, Termologia, Calorimetria, Ondas, Óptica geométrica, Eletrostática, Circuitos elétricos, Eletromagnetismo.
   - Química: Atomística, Tabela periódica, Ligações químicas, Funções inorgânicas, Estequiometria, Soluções, Termoquímica, Cinética, Equilíbrio, Eletroquímica, Química orgânica (funções, isomeria, reações), Química ambiental.
   - Biologia: Citologia, Bioquímica celular, Histologia, Genética (1ª/2ª lei, grupos sanguíneos), Evolução, Ecologia (cadeias, biomas, ciclos), Fisiologia humana (sistemas), Botânica, Zoologia, Biotecnologia.
   - História: Brasil Colônia, Brasil Império, República Velha, Era Vargas, Ditadura Militar, Redemocratização, Revolução Industrial, Guerras Mundiais, Guerra Fria, Descolonização Africana, Globalização.
   - Geografia: Cartografia, Geomorfologia, Climatologia, Hidrografia, Geografia agrária, Industrialização, Urbanização, Geopolítica mundial, Meio ambiente, Globalização econômica.
   - Filosofia: Pré-socráticos, Sócrates/Platão/Aristóteles, Idade Média (Agostinho/Tomás), Modernos (Descartes/Hobbes/Locke/Rousseau/Kant), Hegel/Marx, Existencialismo, Escola de Frankfurt.
   - Sociologia: Durkheim (fato social), Weber (ação social), Marx (classes), Movimentos sociais, Cidadania, Indústria cultural.
   - Linguagens (Português): Interpretação de texto, Funções da linguagem, Variação linguística, Figuras de linguagem, Gêneros textuais, Coesão e coerência, Sintaxe (período composto), Concordância, Regência, Crase.
   - Literatura: Quinhentismo, Barroco, Arcadismo, Romantismo, Realismo/Naturalismo, Parnasianismo/Simbolismo, Pré-Modernismo, Modernismo (1ª/2ª/3ª fase), Contemporânea.
   - Inglês: Reading comprehension, Cognatos/falsos cognatos, Tempos verbais, Phrasal verbs.
   - Redação: Estrutura dissertativa-argumentativa, Tese, Repertório sociocultural, Coesão, Proposta de intervenção (5 elementos).
10. HORÁRIO: comece em 19:00 (estudante padrão pós-escola). Em fins de semana, sugira 14:00. Ajuste se a meta sugerir outro padrão.
11. DICAS: 5-7 dicas ESPECÍFICAS, com tom humano, evitando frases genéricas tipo "estude todos os dias". Boas dicas mencionam: técnica de Feynman, flashcards Anki, simulado quinzenal, revisão por mapa mental nos domingos, banco TRI ENEM, correção da redação na segunda após escrever no sábado, etc.
12. RESUMO: 2-3 frases motivacionais que MENCIONEM A META do aluno e as fraquezas declaradas (personalize).

Retorne SEMPRE via tool_call.`;

    const userPrompt = `Monte o plano semanal para este aluno:
- Carga: ${horasDia}h/dia em ${diasSemana} dias da semana
- Dias ativos: ${diasAtivos.join(", ")}
- Dias de descanso: ${diasDescanso.join(", ")}
- Pontos fracos declarados: ${fraquezas || "não informados (cobertura equilibrada)"}
- Meta: ${meta}
- Dias até a prova: ${diasAteProva}

O cronograma deve trazer os 7 dias da semana, mas só os ${diasSemana} dias ativos terão blocos de estudo cheios. Os outros aparecem como descanso. Cumpra a sequência pedagógica e o foco na meta.`;

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
                resumo: { type: "string" },
                dicas_gerais: { type: "array", items: { type: "string" } },
                cronograma: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      dia: { type: "string" },
                      blocos: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            horario: { type: "string" },
                            materia: { type: "string" },
                            topico: { type: "string" },
                            tipo: { type: "string", description: "teoria | exemplos | exercicio | redacao | revisao | simulado | descanso | leitura" },
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

    // 🔒 PÓS-PROCESSAMENTO: garante respeito a diasSemana
    if (Array.isArray(parsed.cronograma)) {
      parsed.cronograma = parsed.cronograma.map((d: { dia: string; blocos: Array<{ horario: string; materia: string; topico: string; tipo: string }> }) => {
        const ativo = diasAtivos.includes(d.dia);
        if (!ativo) {
          return {
            dia: d.dia,
            blocos: [{
              horario: "—",
              materia: "Descanso",
              topico: "Sem estudo formal hoje. Caminhada, sono, lazer ou leitura leve.",
              tipo: "descanso",
            }],
          };
        }
        return d;
      });
    }

    const { data: planoSalvo, error: salvarErro } = await admin.from("planos_estudo").insert({
      user_id: user.id,
      horas_dia: horasDia,
      dias_semana: diasSemana,
      pontos_fracos: fraquezas,
      meta,
      cronograma: parsed,
    }).select("*").single();
    if (salvarErro) console.error("Erro ao salvar plano", salvarErro);

    return new Response(JSON.stringify({ ...parsed, plano_salvo: planoSalvo ?? null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
