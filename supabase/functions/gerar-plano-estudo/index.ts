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
      // Política: 1 plano grátis por aluno (igual à correção de redação).
      const { count: planosCount } = await admin
        .from("planos_estudo")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if ((planosCount ?? 0) >= 1) {
        return new Response(JSON.stringify({ error: "Você já usou seu plano de estudo grátis. Assine qualquer plano pago para gerar planos ilimitados." }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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

    // Pré-gera slots de DURAÇÃO VARIÁVEL (20 / 30 / 40 min) + 10 min de pausa entre blocos.
    // Padrão: alterna intensidade para variar fadiga. Slots "alta" (40min) recebem fraquezas.
    const PAUSE = 10;
    const padroes = [40, 30, 20, 30, 40, 20, 30, 40];
    const totalMin = horasDia * 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    type Slot = { horario: string; duracaoMin: number; intensidade: "alta" | "media" | "baixa" };
    const slots: Slot[] = [];
    let cursor = horaInicio * 60;
    const fimDia = (horaInicio + horasDia) * 60;
    let acumulado = 0;
    let i = 0;
    while (cursor < fimDia) {
      const dur = padroes[i % padroes.length];
      if (acumulado + dur > totalMin) break;
      if (cursor + dur > fimDia) break;
      const ini = cursor;
      const fim = cursor + dur;
      const intensidade: Slot["intensidade"] = dur >= 40 ? "alta" : dur >= 30 ? "media" : "baixa";
      slots.push({
        horario: `${pad(Math.floor(ini / 60))}:${pad(ini % 60)} às ${pad(Math.floor(fim / 60))}:${pad(fim % 60)}`,
        duracaoMin: dur,
        intensidade,
      });
      cursor = fim + PAUSE;
      acumulado += dur;
      i++;
    }
    if (slots.length === 0) {
      slots.push({ horario: `${pad(horaInicio)}:00 às ${pad(horaInicio)}:30`, duracaoMin: 30, intensidade: "media" });
    }
    const slotsResumo = slots
      .map((s, idx) => `#${idx + 1} ${s.horario} (${s.duracaoMin}min, intensidade ${s.intensidade})`)
      .join(" | ");
    const slotsHorarios = slots.map(s => s.horario);

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não configurada");

    const distribuicoes: Record<number, string[]> = {
      4: ["Segunda-feira","Quarta-feira","Sexta-feira","Sábado"],
      5: ["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sábado"],
      6: ["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"],
    };
    const diasAtivos = distribuicoes[diasSemana] ?? distribuicoes[5];
    const diasDescanso = DIAS_SEMANA.filter(d => !diasAtivos.includes(d));

    const systemPrompt = `Você é um sistema especialista em planejamento de estudos para o ENEM. Cria planos SEMANAIS personalizados e otimizados com base no tempo disponível, no nível de dificuldade do aluno em cada matéria e no objetivo de desempenho.

REGRAS ABSOLUTAS:
1. CADA SESSÃO TEM DURAÇÃO ENTRE 20 E 40 MINUTOS. NUNCA crie um bloco com mais de 40 min. NUNCA agrupe "2h direto na mesma matéria". É proibido um bloco do tipo "20:00 às 22:00".
2. LÓGICA DE DECISÃO POR DIFICULDADE:
   • ALTA dificuldade (fraqueza declarada / prioridade da meta) → 40 min
   • MÉDIA dificuldade → 30 min
   • BAIXA dificuldade ou REVISÃO → 20 min
3. Cada dia ativo terá EXATAMENTE ${slots.length} blocos, usando NA ORDEM estes slots já calculados (horário + duração + intensidade sugerida):
${slotsResumo}
   Use EXATAMENTE esses horários — não invente outros, não junte blocos, não pule nenhum, não estenda além do horário declarado.
4. Slots de intensidade "alta" (40min) recebem matérias mais críticas (fraquezas + prioridade da meta). "media" (30min) recebem carga regular. "baixa" (20min) recebem revisão espaçada, leitura leve, exercícios curtos ou Inglês.
5. Cobertura semanal das 4 áreas + redação: Matemática • Linguagens (Português/Literatura/Inglês) • Ciências da Natureza (Fis/Quim/Bio) • Ciências Humanas (Hist/Geo/Filo/Socio) • Redação 1x/semana (sábado ideal).
6. Sequência pedagógica por matéria: TEORIA → EXEMPLOS RESOLVIDOS → EXERCÍCIOS → REVISÃO ESPAÇADA (em dias diferentes).
7. Encadeamento real: equação 2º grau antes de função 2º grau, cinemática antes de dinâmica, sintaxe antes de coesão.
8. Variação anti-fadiga: alterne áreas dentro do dia. NUNCA "Mat → Mat → Mat" seguidos.
9. Peso por fraqueza: matérias citadas como fracas recebem PESO DOBRADO no tempo semanal.
10. Cronograma de ${diasSemana} dias ativos. Dias ATIVOS: ${diasAtivos.join(", ")}. Dias de DESCANSO: ${diasDescanso.join(", ")} — devolva esses dias com 1 bloco apenas, horario "—", tipo "descanso".
11. Comece sempre em ${String(horaInicio).padStart(2,"0")}:00.
12. Atividades possíveis (campo "topico"): teoria + resumo ativo, resolução de questões ENEM, correção de erros, revisão espaçada, simulado curto, treino de redação.
13. TÓPICOS REAIS DO ENEM (use estes nomes, não invente vagos):
   - Matemática: Razão/proporção, Porcentagem, Função afim, Função quadrática, Função exponencial, Função logarítmica, PA/PG, Geometria plana, Geometria espacial, Trigonometria, Estatística, Probabilidade, Análise combinatória.
   - Física: Cinemática, Leis de Newton, Trabalho e energia, Hidrostática, Termologia, Ondas, Óptica, Eletrostática, Circuitos, Eletromagnetismo.
   - Química: Atomística, Tabela periódica, Ligações, Funções inorgânicas, Estequiometria, Soluções, Termoquímica, Equilíbrio, Eletroquímica, Orgânica.
   - Biologia: Citologia, Genética, Evolução, Ecologia, Fisiologia humana, Botânica, Biotecnologia.
   - História: Brasil Colônia/Império/República/Vargas/Ditadura, Revolução Industrial, Guerras Mundiais, Guerra Fria.
   - Geografia: Cartografia, Climatologia, Geografia agrária, Urbanização, Geopolítica, Meio ambiente.
   - Filosofia: Pré-socráticos, Sócrates/Platão/Aristóteles, Modernos, Hegel/Marx, Existencialismo.
   - Sociologia: Durkheim, Weber, Marx, Movimentos sociais, Indústria cultural.
   - Português: Interpretação, Funções da linguagem, Figuras, Gêneros textuais, Coesão, Sintaxe, Concordância, Crase.
   - Literatura: Quinhentismo até Modernismo 3ª fase.
   - Inglês: Reading, Cognatos, Tempos verbais.
   - Redação: Estrutura dissertativo-argumentativa, Tese, Repertório sociocultural, Proposta de intervenção.
14. Dicas (5-7): específicas e humanas — técnica de Feynman, flashcards Anki, simulado quinzenal, correção da redação na segunda após escrever no sábado, banco TRI ENEM.
15. Resumo (2-3 frases) menciona META e FRAQUEZAS do aluno.
16. FOCO NA META "${meta}": medicina/biologia → peso extra Bio/Quím. Engenharia → Mat/Física. Direito/humanidades → Port/Redação/Hist/Filo.

Retorne SEMPRE via tool_call.`;

    const userPrompt = `Monte o plano semanal:
- Tempo: ${horasDia}h/dia em ${diasSemana} dias, começando às ${String(horaInicio).padStart(2,"0")}:00
- Slots obrigatórios (use TODOS, na ordem, respeitando 20/30/40 min): ${slotsResumo}
- Dias ativos: ${diasAtivos.join(", ")}
- Dias de descanso: ${diasDescanso.join(", ")}
- Fraquezas declaradas (ALTA dificuldade — slots de 40min): ${fraquezas || "não informadas — distribua equilibrado"}
- Meta: ${meta}
- Dias até a prova: ${diasAteProva}

Cada dia ativo: EXATAMENTE ${slots.length} blocos seguindo os slots acima. Nenhum bloco com mais de 40 min. Cumpra sequência pedagógica e foco na meta.`;

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

    // 🔒 PÓS-PROCESSAMENTO: força slots hora a hora e respeito a diasSemana
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
        // Garante exatamente `horasDia` blocos com os horários corretos.
        const blocosIA = Array.isArray(d.blocos) ? d.blocos : [];
        const blocosFinal = slotsHorarios.map((horario, idx) => {
          const orig = blocosIA[idx];
          return {
            horario,
            materia: orig?.materia || "Estudo geral",
            topico: orig?.topico || "Sessão de estudo focada",
            tipo: orig?.tipo || "teoria",
          };
        });
        return { dia: d.dia, blocos: blocosFinal };
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
