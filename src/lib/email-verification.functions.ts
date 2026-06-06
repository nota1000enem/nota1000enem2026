import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const EMAIL_SENDER_DOMAIN = "notify.nota1000enem.online";

const LOGO_URL =
  "https://nota1000enem.online/__l5e/assets-v1/57a726f7-1152-4ab2-81de-891e2b61a236/nota1000-logo.png";

function buildHtml(codigo: string) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#fff;font-family:Arial,sans-serif;color:#222">
<div style="max-width:560px;margin:0 auto;padding:24px">
  <div style="text-align:center;padding:8px 0 16px">
    <img src="${LOGO_URL}" alt="Nota 1000 ENEM" width="96" height="96" style="border-radius:20px;display:block;margin:0 auto" />
  </div>
  <h1 style="font-size:22px;color:#0a1d3a;text-align:center;margin:0 0 16px">Seu código de verificação</h1>
  <p style="font-size:14px;line-height:1.6;color:#444;text-align:center;margin:0 0 18px">
    Use o código abaixo para confirmar seu email no <strong>Nota 1000 ENEM</strong>.
  </p>
  <div style="background:#f3f6fb;border-radius:10px;padding:18px;text-align:center;margin:0 0 18px">
    <span style="font-family:'Courier New',monospace;font-size:34px;font-weight:bold;color:#0a1d3a;letter-spacing:10px">${codigo}</span>
  </div>
  <p style="font-size:13px;color:#666;text-align:center;margin:0 0 8px">O código expira em 30 minutos.</p>
  <p style="font-size:12px;color:#999;text-align:center;margin:24px 0 0">
    Se você não solicitou esse código, ignore este email.
  </p>
  <div style="border-top:1px solid #eaeaea;margin-top:32px;padding-top:16px;text-align:center">
    <p style="font-size:12px;color:#888;margin:4px 0">Nota 1000 ENEM — Preparação para o ENEM</p>
    <p style="font-size:12px;color:#888;margin:4px 0"><a href="https://nota1000enem.online" style="color:#1a5fb4">nota1000enem.online</a></p>
  </div>
</div></body></html>`;
}

export const enviarCodigoVerificacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data, error } = await supabase.rpc("gerar_codigo_verificacao_email");
    if (error) throw new Error(error.message);

    const r = data as { ok: boolean; motivo?: string; aguarde_segundos?: number; email?: string; codigo?: string };
    if (!r.ok) return r;

    const messageId = `email-verif-${userId}-${Date.now()}`;
    const unsubscribeToken = crypto.randomUUID();
    await supabaseAdmin.from("email_unsubscribe_tokens").insert({
      token: unsubscribeToken,
      email: r.email!,
    });

    await supabaseAdmin.from("email_send_log").insert({
      message_id: messageId,
      template_name: "verificacao_email",
      recipient_email: r.email!,
      status: "pending",
    });

    const { error: enqErr } = await supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        message_id: messageId,
        to: r.email,
        from: "Nota 1000 ENEM <noreply@nota1000enem.online>",
        sender_domain: EMAIL_SENDER_DOMAIN,
        subject: "Seu código de verificação — Nota 1000 ENEM",
        html: buildHtml(r.codigo!),
        text: `Seu código de verificação Nota 1000 ENEM: ${r.codigo}\nExpira em 30 minutos.`,
        purpose: "transactional",
        unsubscribe_token: unsubscribeToken,
        idempotency_key: messageId,
        label: "verificacao_email",
        queued_at: new Date().toISOString(),
      },
    });
    if (enqErr) {
      await supabaseAdmin.from("email_send_log").insert({
        message_id: messageId,
        template_name: "verificacao_email",
        recipient_email: r.email!,
        status: "failed",
        error_message: enqErr.message,
      });
      throw new Error("Falha ao enviar o email. Tente novamente.");
    }

    return { ok: true as const, email: r.email };
  });

export const verificarCodigoEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ codigo: z.string().trim().regex(/^\d{6}$/) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: r, error } = await supabase.rpc("verificar_codigo_email", { _codigo: data.codigo });
    if (error) throw new Error(error.message);
    return r as { ok: boolean; motivo?: string };
  });
