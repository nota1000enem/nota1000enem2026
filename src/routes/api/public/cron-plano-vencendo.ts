import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Cron diário chamado por pg_cron. Faz 2 coisas:
 *
 * 1) DOWNGRADE de planos expirados: qualquer profile com plan pago
 *    (não vitalício) cujo plan_expires_at já passou volta a 'free'.
 *    Também atualiza subscriptions para status='EXPIRED'.
 *
 * 2) LEMBRETE 3 dias antes do vencimento: identifica profiles cujo
 *    plan_expires_at cai entre agora e agora+3 dias e ainda não
 *    receberam lembrete no ciclo atual. Dispara email "plano-vencendo"
 *    e marca plan_expiration_reminder_sent_at = plan_expires_at.
 */
export const Route = createFileRoute("/api/public/cron-plano-vencendo")({
  server: {
    handlers: {
      POST: async () => {
        try {
          // ================== 1) DOWNGRADE ==================
          const nowIso = new Date().toISOString();

          const { data: expirados } = await supabaseAdmin
            .from("profiles")
            .select("id, email, full_name, plan")
            .neq("plan", "free")
            .eq("plan_vitalicio", false)
            .not("plan_expires_at", "is", null)
            .lt("plan_expires_at", nowIso);

          if (expirados && expirados.length > 0) {
            const ids = expirados.map((p: any) => p.id);
            await supabaseAdmin
              .from("profiles")
              .update({ plan: "free", plan_expires_at: null })
              .in("id", ids);
            await supabaseAdmin
              .from("subscriptions")
              .update({ status: "EXPIRED", credits_remaining: 0, updated_at: nowIso })
              .in("user_id", ids);
            console.log(`[cron-plano-vencendo] ${expirados.length} planos expirados removidos`);
          }

          // ================== 2) LEMBRETE 3 DIAS ==================
          const emTresDias = new Date();
          emTresDias.setDate(emTresDias.getDate() + 3);
          const emTresDiasIso = emTresDias.toISOString();

          const { data: prestesAvencer } = await supabaseAdmin
            .from("profiles")
            .select("id, email, full_name, plan, plan_expires_at, plan_expiration_reminder_sent_at")
            .neq("plan", "free")
            .eq("plan_vitalicio", false)
            .not("plan_expires_at", "is", null)
            .gte("plan_expires_at", nowIso)
            .lte("plan_expires_at", emTresDiasIso);

          const baseUrl = process.env.APP_URL || "https://nota1000enem.online";
          let enviados = 0;

          for (const p of (prestesAvencer ?? []) as any[]) {
            // Já avisamos nesse mesmo ciclo? Compara reminder_sent_at com plan_expires_at
            if (
              p.plan_expiration_reminder_sent_at &&
              new Date(p.plan_expiration_reminder_sent_at).getTime() ===
                new Date(p.plan_expires_at).getTime()
            ) {
              continue;
            }
            if (!p.email) continue;

            const dias = Math.max(
              1,
              Math.ceil(
                (new Date(p.plan_expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
              ),
            );

            try {
              await fetch(`${baseUrl}/lovable/email/transactional/send`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${process.env.LOVABLE_API_KEY ?? ""}`,
                },
                body: JSON.stringify({
                  templateName: "plano-vencendo",
                  recipientEmail: p.email,
                  idempotencyKey: `plano-vencendo-${p.id}-${p.plan_expires_at}`,
                  templateData: {
                    nome: (p.full_name ?? "Aluno(a)").split(" ")[0],
                    plano: (p.plan ?? "").toString(),
                    diasRestantes: dias,
                    renovarUrl: `${baseUrl}/planos`,
                  },
                }),
              });
              await supabaseAdmin
                .from("profiles")
                .update({ plan_expiration_reminder_sent_at: p.plan_expires_at } as any)
                .eq("id", p.id);
              enviados++;
            } catch (e) {
              console.error("[cron-plano-vencendo] envio falhou:", p.id, e);
            }
          }

          return new Response(
            JSON.stringify({ ok: true, downgraded: expirados?.length ?? 0, reminders: enviados }),
            { headers: { "Content-Type": "application/json" } },
          );
        } catch (e) {
          console.error("[cron-plano-vencendo] erro:", e);
          return new Response(JSON.stringify({ ok: false }), { status: 500 });
        }
      },
      GET: async () => new Response("ok", { status: 200 }),
    },
  },
});
