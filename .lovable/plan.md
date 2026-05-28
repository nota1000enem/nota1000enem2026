
# Plano de execução

Vou dividir em 4 lotes (entregas) — cada lote é um commit funcional. Você pode aprovar tudo de uma vez ou pedir para cortar/reordenar.

---

## LOTE 1 — Correções rápidas e críticas (landing + segurança + cadastro + limites)

### 1.1 Textos da landing (`src/routes/index.tsx`)
- "Testar Redação Grátis" → **"Ver Minha Nota Grátis"**
- Subtítulo do H1 → novo texto longo com "DESCRUBRA O FUTURO AGORA MESMO!..."
- "+12 mil redações corrigidas" → **"+ de 78 mil redações corrigidas"**
- Reescrever os 3 cards "01/02/03" com os textos novos completos que você passou

### 1.2 Segurança RLS — tabela `profiles`
Hoje qualquer pessoa lê emails e planos. Migration:
- Drop policy `"anyone can view profile names"`
- Criar policy SELECT só para o próprio dono: `auth.uid() = id`
- Para o ranking global (lote 3) criar uma **view pública** `ranking_global` que expõe SÓ `nome_publico` (primeiro nome) + `melhor_nota`, sem email/plano

### 1.3 Cadastro por email não funciona
Investigar: provavelmente trigger `handle_new_user` está falhando silenciosamente OU validação de senha forte está bloqueando sem feedback. Fix:
- Trocar trigger para `SECURITY DEFINER` com `EXCEPTION WHEN OTHERS` que não bloqueia o signup
- Melhorar mensagens de erro no `auth.tsx`
- Garantir `auto_confirm_email` ligado (já está)

### 1.4 Limite de 3 redações grátis + avisos visíveis (`src/routes/redacao.tsx`)
- Atualizar RPC `pode_corrigir_redacao`: free agora = **3 totais** (não 1)
- Quando bloqueado, ao clicar "Corrigir agora" → modal/toast forte: "Você usou suas 3 correções grátis. Compre um plano." com botão "Ver Planos"
- Toggle "Modo Professor Rígido" para free → ao tentar ativar mostra modal: "Disponível só nos planos pagos"

---

## LOTE 2 — Plano de Estudo IA dedicada

### 2.1 Nova edge function `gerar-plano-estudo`
Hoje `/plano-estudo` chama `corrigir-redacao` (por isso responde como se fosse redação). Criar função separada com prompt específico:
- Input: horas/dia disponíveis, dias até prova, matérias fracas, meta de nota
- Output JSON: cronograma semanal detalhado (segunda a domingo), com matéria, tópico, duração, tipo (teoria/exercício/redação/revisão)

### 2.2 Reescrever `src/routes/plano-estudo.tsx`
- Form melhor: horas/dia, dias/semana, data do ENEM, pontos fracos (checkboxes), meta
- Render bonito do cronograma em grid semanal
- Salvar último plano em nova tabela `planos_estudo`

---

## LOTE 3 — Sistema de Assinaturas + Ranking Global

### 3.1 Banco de assinaturas (nova tabela `assinaturas`)
Campos:
- `user_id`, `plano` (light/pro/full/vitalicio), `valor_centavos`, `status` (ativa/pendente/expirada/cancelada)
- `iniciou_em`, `vence_em`, `proxima_cobranca_em`, `cancelou_em`
- `gateway` (manual/stripe/mercadopago), `gateway_id`, `metodo_pagamento`
- `created_at`, `updated_at`

Tabela `cobrancas`:
- `assinatura_id`, `valor_centavos`, `status` (paga/pendente/falhou), `vencimento`, `pago_em`, `tentativa` (1,2,3...)

### 3.2 Lógica de expiração com 2h de carência
Função `is_assinatura_ativa(user_id)`:
- Vitalício → sempre true
- Else → `now() < vence_em + interval '2 hours'`

Cron job (pg_cron) diário marca como `expirada` quando passa da carência.

### 3.3 Página `/minha-assinatura` (visível pelo usuário)
- Plano atual, valor, próximo vencimento, dias restantes
- Histórico de cobranças
- Botão "Renovar" / "Cancelar"

### 3.4 Ranking Global (`src/routes/ranking.tsx`)
- Substituir view atual `ranking_semanal` por `ranking_global` (top 100 GERAL, qualquer redação, inclui free)
- Top 3 → mesmos cards bonitos atuais
- Posições 4-100 → lista compacta numerada
- Público (RLS permite anon) mas só expõe primeiro nome + nota
- Realtime: ao inserir redação, ranking atualiza

---

## LOTE 4 — Simulado 100 Questões (PDF → app)

### 4.1 Parsing do PDF
Extrair as questões do `Simulado-ENEM-2020-2025.pdf` (rodar `document--parse_document`) e gerar **2 provas de 50 questões** cada, misturando as 4 áreas (Matemática, Linguagens, Humanas, Natureza) — metade em cada prova. Última folha do PDF tem gabarito → uso para popular respostas corretas.

### 4.2 Banco
- `simulados` (id, nome, descricao, total_questoes)
- `questoes` (simulado_id, numero, area, enunciado, alt_a..alt_e, resposta_correta, peso)
- `tentativas_simulado` (user_id, simulado_id, started_at, finished_at, nota_total, acertos)
- `respostas_aluno` (tentativa_id, questao_id, resposta_marcada, correta boolean)

Peso por questão: usar TRI simplificado — pesquisar valores reais ENEM (cada área vai de ~300 a ~900). Implementar fórmula: nota = (acertos / total) * 900 + bonus por dificuldade. (Real ENEM usa TRI completo, vou aproximar de forma justa).

### 4.3 Página `/questoes` (nova entrada no menu, ao lado de "Vídeo Aulas")
- Lista as 2 provas
- Ao clicar: aviso "A última folha contém respostas — NÃO olhe antes de terminar"
- Interface: 1 questão por vez, A-E clicáveis, seta direita para próxima, barra de progresso
- Ao final: tela de resultado com nota, gabarito comentado
- Salva tudo no banco

### 4.4 Dashboard
- Adicionar nova seção abaixo de "Redações" → "Minhas Provas" (lista de tentativas com nota, data, % acerto por área). **Sem ranking.**

### 4.5 Menu
`src/components/navbar.tsx` → adicionar link "100 Questões" ao lado de "Vídeo Aulas"

---

## Detalhes técnicos importantes

- **Pagamento real**: não estou ativando Stripe agora — só montando a estrutura do banco. Quando você quiser, ativamos Stripe e plugamos. Por enquanto status muda manualmente.
- **PDF parse**: rodo `document--parse_document` para extrair texto, depois um script Python local separa questões+gabarito e gera SQL de seed.
- **Auto-confirm email** já está ligado; o problema do cadastro deve ser o trigger ou validação client.
- **TRI ENEM real** é complexo; vou usar aproximação documentada (cada questão pesa 18 pontos numa escala 0-900, com bônus por dificuldade simulada).

---

## Pergunta de bloqueio

São ~4-6 horas de trabalho condensadas. Quer que eu execute **todos os 4 lotes em sequência sem parar**, ou prefere que eu entregue lote por lote para você revisar entre cada um? Recomendo lote por lote — é mais seguro e você não fica com um commit gigante difícil de reverter se algo quebrar.
