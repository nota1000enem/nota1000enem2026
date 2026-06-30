import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const FREE_FOR_LOGGED_IN = new Set<string>([
  "50-questoes-1.pdf",
  "50-questoes-2.pdf",
]);

const ALLOWED = new Set<string>([
  "50-questoes-1.pdf",
  "50-questoes-2.pdf",
  "50-questoes-3.pdf",
  "50-questoes-4.pdf",
  "50-questoes-5.pdf",
  "50-questoes-6.pdf",
  "50-questoes-7.pdf",
  "50-questoes-8.pdf",
  "enem-2022-dia-1.pdf",
  "enem-2022-dia-2.pdf",
  "enem-2023-dia-1.pdf",
  "enem-2023-dia-2.pdf",
  "enem-2024-dia-1.pdf",
  "enem-2024-dia-2.pdf",
  "enem-2025-dia-1.pdf",
  "enem-2025-dia-2.pdf",
  "gabarito-enem-2022-dia-1.pdf",
  "gabarito-enem-2022-dia-2.pdf",
  "gabarito-enem-2023-dia-1.pdf",
  "gabarito-enem-2023-dia-2.pdf",
  "gabarito-enem-2024-dia-1.pdf",
  "gabarito-enem-2024-dia-2.pdf",
  "gabarito-enem-2025-dia-1.pdf",
  "gabarito-enem-2025-dia-2.pdf",
]);

export const getPremiumPdfUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        file: z
          .string()
          .min(1)
          .max(80)
          .regex(/^[a-z0-9-]+\.pdf$/),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!ALLOWED.has(data.file)) {
      throw new Error("Arquivo não disponível.");
    }
    const { supabase, userId } = context;

    // Confirma plano pago consultando profiles + subscriptions com o cliente do usuário (RLS)
    const [{ data: prof }, { data: sub }] = await Promise.all([
      supabase
        .from("profiles")
        .select("plan, plan_vitalicio, plan_expires_at")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("plan_type, status, current_period_end")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const now = Date.now();
    const profPaid =
      !!prof &&
      (prof.plan ?? "free").toLowerCase() !== "free" &&
      (prof.plan_vitalicio === true ||
        (prof.plan_expires_at ? new Date(prof.plan_expires_at).getTime() > now : false));
    const subPaid =
      !!sub &&
      (sub.status ?? "").toUpperCase() === "ACTIVE" &&
      (sub.current_period_end ? new Date(sub.current_period_end).getTime() > now : false);

    if (!profPaid && !subPaid && !FREE_FOR_LOGGED_IN.has(data.file)) {
      throw new Error("Disponível apenas para alunos com plano pago.");
    }

    const { data: signed, error } = await supabaseAdmin.storage
      .from("premium-pdfs")
      .createSignedUrl(data.file, 60 * 10, { download: data.file });

    if (error || !signed?.signedUrl) {
      throw new Error(error?.message ?? "Não foi possível gerar o link.");
    }
    return { url: signed.signedUrl };
  });
