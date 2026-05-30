# Plano de execução

A lista é grande demais pra um único turno sem quebrar coisa. Vou dividir em **5 lotes**. Começo pelo **Lote 1** assim que você aprovar, e os outros saem em sequência (cada lote = 1 mensagem minha).

---

## ⚠️ Antes de começar — preciso de você

1. **Link do grupo do Telegram** "NOTA 1000 ENEM 2026" (`https://t.me/...`) → pro botão flutuante.
2. **Confirmar Mercado Pago**: vou salvar `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_PUBLIC_KEY` como secrets (você cola os valores no formulário seguro — não me mande aqui no chat de novo, já apareceu uma vez, idealmente **rotacione** essas chaves no painel do MP por segurança).
3. **Como te dar plano pago de teste**: depois do Lote 1 te mando o SQL exato (1 linha por plano) pra você rodar e desbloquear tudo na sua conta.

---

## 🟢 Lote 1 — Correções rápidas + segurança (faço primeiro)

- **3 erros do scanner de segurança** → rodar scan, corrigir RLS/views expostas.
- **Login**: mensagens em vermelho — "Email ou senha incorretos" / "Conta não existe, cadastre-se primeiro".
- **Esqueci minha senha** no `/auth` + página `/reset-password` (pública, fora do middleware).
- **Cadeado visual no `/plano-estudo`** pra usuário Free (com CTA "Fazer upgrade").
- **`maxLength={2500}`** no textarea da redação + contador visual + toast quando colar texto maior.
- **Cards de planos**: trocar "Matemática/Português/etc" pelas nomenclaturas oficiais ENEM:
  - Linguagens, Códigos e suas Tecnologias
  - Ciências Humanas e suas Tecnologias
  - Ciências da Natureza e suas Tecnologias
  - Matemática e suas Tecnologias
- **Home → "TOP NOTAS DA SEMANA"** consumindo `get_ranking_global()` filtrado pelos últimos 7 dias.
- **Logout visível no mobile** (item no menu hambúrguer).
- **Destaque visual de erros gramaticais**: renderizar as palavras erradas em vermelho/negrito dentro do feedback no dashboard.
- **Prompt da IA**: adicionar regra "se não tem certeza, não invente erro" (anti-alucinação reforçada).

## 🟡 Lote 2 — Página `/perfil` completa

- Seção A: Dados pessoais (nome + email read-only do Supabase Auth).
- Seção B: Alterar senha (senha atual obrigatória → reautenticar antes de `updateUser`).
- Seção C: Plano atual + badge + botão "Fazer Upgrade" → `/planos`.
- Link "Esqueceu sua senha?" → `resetPasswordForEmail`.
- **Botão flutuante Telegram** global (precisa do link).

## 🔴 Lote 3 — Mercado Pago + sistema de créditos (PESADO)

- Migração: ajustar `assinaturas` pra suportar `credits_remaining`, `current_period_end`, `plan_type` (LIGHT/PRO/FULL/VITALICIO), `mp_customer_id` em profiles.
- Edge function `criar-checkout-mp` (Preferência Pix + cartão, metadata com user_id+plan).
- Edge function `webhook-mp` (idempotente, valida `approved`, soma 30 dias, zera/injeta créditos: 15/30/60/70).
- RPC `consumir_credito_redacao()` → decrementa só quando modo rígido OU correção normal.
- Hierarquia de vídeos: `access_tier` em `video_lessons` (PRO_BASIC / FULL_PREMIUM / FULL_ACESS).
- Realtime no checkout (modal fecha sozinho quando webhook aprovar).
- Gating `/aulas` por tier + cadeado de upgrade.
- Cron job interno: marcar `EXPIRED` quando `current_period_end < now()`.
- Te entrego no final a **URL pública do webhook** pra colar no painel MP.

## 🟣 Lote 4 — Simulado 100 questões

- Parser do PDF que você forneceu antes → seed em `questoes_simulado`.
- Página `/simulado/:id` com 1 questão por vez + setas + correção final + nota TRI aproximada.
- Dashboard secundário no `/dashboard` só pra notas de simulado.

## ⚪ Lote 5 — Polimento final

- IA "auto-aprender" — na prática: salvar redações + correções e usar como few-shot examples no prompt (não é RLHF de verdade, é refinamento contínuo de prompt baseado em feedback).
- Revisão geral, testes manuais.

---

## ❓ Confirme só 3 coisas e eu começo o Lote 1:

1. **Aprova essa ordem?** (1 → 2 → 3 → 4 → 5)
2. **Manda o link do Telegram** (pode ser depois, só atrasa o botão).
3. **Pode salvar os secrets do Mercado Pago** quando eu pedir no Lote 3?

Responde "vai" que eu emendo o Lote 1 agora.
