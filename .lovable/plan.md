# Integração Mercado Pago — Pagamento único de 30 dias

## 1. Banco de dados (migration única)

**`profiles`**
- Adicionar `mp_customer_id TEXT UNIQUE` (opcional, preenchido após primeiro pagamento)

**`subscriptions` (nova)** — gerenciador interno de ciclos
- `id`, `user_id` (UNIQUE FK profiles), `status` (`ACTIVE`/`EXPIRED`/`PENDING`),
- `plan_type` (`LIGHT`/`PRO`/`FULL`/`VITALICIO`),
- `current_period_end TIMESTAMPTZ`, `credits_remaining INT`, `updated_at`.
- RLS: aluno vê só a sua; só `service_role` insere/atualiza (webhook).

**`video_lessons` (nova)**
- `id`, `title`, `subject`, `video_url`, `access_tier` (`PRO_BASIC`/`FULL_PREMIUM`/`FULL_ACESS`).
- RLS: leitura para `authenticated`; admin via service_role.

**`payment_transactions` (nova)** — log de cada pagamento aprovado (idempotência do webhook)
- `id`, `user_id`, `mp_payment_id TEXT UNIQUE`, `plan_type`, `valor_centavos`, `status`, `raw JSONB`, `created_at`.

**Função `pode_corrigir_redacao` atualizada**
- Lê `subscriptions` (não mais `profiles.plan`).
- Free continua com 3 vitalícias (sem subscription) usando `redacoes` total.
- Pagos: `credits_remaining > 0` E `status='ACTIVE'` E `current_period_end > now()`.
- Se `modo_rigido=true`, consome crédito normalmente (mesmo bucket).

**Trigger** no INSERT em `redacoes`: decrementa `credits_remaining` em 1 (somente quando há subscription ativa).

**`handle_new_user`** continua criando profile Free (sem subscription).

## 2. Mapa de planos

| Plano | Preço | Créditos | Vídeos | Period end |
|---|---|---|---|---|
| LIGHT | 19,90 | 15 | `PRO_BASIC` | +30 dias |
| PRO | 29,90 | 30 | `FULL_PREMIUM` | +30 dias |
| FULL | 49,90 | 60 | `FULL_ACESS` | +30 dias |
| VITALICIO | 499,00 | 70 | `FULL_ACESS` | `2099-12-31` (créditos resetam a cada 30 dias) |

Todos os pagos têm acesso aos 20 simulados e ao Plano de Estudos.

## 3. Backend (TanStack server, NÃO Edge Function nova)

Conforme o stack, uso `createServerFn` + rota pública para webhook.

**`src/lib/mercadopago.functions.ts`** — `createCheckout({ planType })`:
- Auth via `requireSupabaseAuth`.
- Chama `POST https://api.mercadopago.com/checkout/preferences` com:
  - `items: [{ title, quantity:1, unit_price }]`
  - `payer.email` (do user)
  - `metadata: { user_id, plan_type }`
  - `external_reference: "<user_id>:<plan_type>:<uuid>"`
  - `payment_methods.excluded_payment_types: []` (PIX + cartão habilitados)
  - `back_urls` → `/planos?status=success|failure|pending`
  - `notification_url` → URL pública do webhook abaixo
- Retorna `init_point` (URL do checkout MP).

**`src/routes/api/public/mp-webhook.ts`** — rota pública POST:
- Responde HTTP 200 imediatamente.
- Lê `?type=payment&data.id=...`, busca `GET /v1/payments/{id}` com `MERCADO_PAGO_ACCESS_TOKEN`.
- Idempotência: `INSERT … ON CONFLICT (mp_payment_id) DO NOTHING`.
- Se `status='approved'`:
  - Lê `metadata.user_id` e `metadata.plan_type`.
  - Calcula `new_period_end`:
    - Se subscription atual `ACTIVE` e `period_end>now()` → `period_end + 30 days` (renovação antecipada).
    - Caso contrário → `now() + 30 days`.
    - VITALICIO → `2099-12-31`.
  - `UPSERT subscriptions`: `status=ACTIVE`, `plan_type`, `period_end`, `credits_remaining = mapa[planType]`.
  - Atualiza `profiles.plan` (manter compatibilidade) e `mp_customer_id` (do `payer.id` se vier).

**Segurança do webhook**: Mercado Pago não assina por padrão de forma simples; validação será por **fetch obrigatório do pagamento na API MP** (não confio no body). Adiciono também checagem do `x-signature` header do MP se vier (HMAC do `data.id` + `ts`).

## 4. Frontend

**`/planos`**: cada card chama `createCheckout({ planType })` → `window.location.href = init_point`.
Loading state, toasts claros em todos os erros (token inválido, plano inválido, MP fora do ar etc.).

**`/redacao`** e demais páginas: já leem da RPC, então passam a ler de `subscriptions` automaticamente.

**`/perfil`**: mostra plano atual, `credits_remaining`, `period_end` formatado, botão "Renovar antecipado".

## 5. Secret

Vou adicionar **apenas** `MERCADO_PAGO_ACCESS_TOKEN` via tool segura (a public key é pública e fica no código se precisar do frontend, mas Checkout Pro só usa access token no backend).

⚠️ Você colou o access token de produção no chat. Recomendo **regenerar** no painel do MP depois (Suas integrações → Credenciais) porque ficou exposto. Vou usar o que você passou agora e te avisar.

## 6. URLs que você vai precisar copiar pro painel do Mercado Pago

Depois que eu publicar:

- **Notification URL (Webhook)**:
  `https://project--5fa4b0e1-26e9-498d-ab41-24b8f417f90a.lovable.app/api/public/mp-webhook`
- **Eventos a marcar**: `payment` (Pagamentos).
- **Back URLs**: já configuradas dentro da preference, não precisa mexer.

## 7. Ordem de execução

1. Migration (tabelas + RPC + trigger).
2. Adicionar secret `MERCADO_PAGO_ACCESS_TOKEN`.
3. `mercadopago.functions.ts` + rota webhook + ajuste `/planos`.
4. Pequeno ajuste no `/perfil` para mostrar créditos.
5. Te entrego os links e o passo a passo para colar no painel MP.

Posso prosseguir?
