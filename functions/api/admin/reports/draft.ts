import { json, type AuthEnv } from "../../../_shared/auth";
import {
  isRecordValue,
  normalizeEmail,
  reportErrorResponse,
  requireAdmin,
  requireSameOrigin,
  sanitizeReportAnswers,
  sanitizeReportModel,
} from "../../../_shared/reports";
import { supabaseAdminRequest } from "../../../_shared/supabase";

interface DraftRpcRow {
  id: string;
  client_email: string;
  pending_token: string;
  pending_updated_at: string;
}

export const onRequestPost: PagesFunction<AuthEnv> = async (context) => {
  const originError = requireSameOrigin(context.request);
  if (originError) return originError;
  const admin = await requireAdmin(context.request, context.env);
  if (admin instanceof Response) return admin;

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Solicitud inválida." }, 400);
  }
  if (!isRecordValue(body)) return json({ error: "Solicitud inválida." }, 400);

  const answers = sanitizeReportAnswers(body.answers);
  const reportModel = sanitizeReportModel(body.reportModel);
  const email = normalizeEmail(answers?.email);
  const clientName =
    typeof answers?.clientName === "string" ? answers.clientName.trim() : "";
  if (!answers || !reportModel || !email || !clientName) {
    return json({ error: "Los datos del informe no son válidos." }, 400);
  }

  try {
    const rows = (await supabaseAdminRequest(
      context.env,
      "rpc/save_llc_report_draft",
      {
        method: "POST",
        body: JSON.stringify({
          p_client_email: email,
          p_client_name: clientName,
          p_answers: answers,
          p_report_model: reportModel,
          p_admin_email: admin.email,
        }),
      },
    )) as DraftRpcRow[];
    const saved = rows[0];
    if (!saved) throw new Error("Draft RPC returned no report");

    return json({
      ok: true,
      report: {
        id: saved.id,
        email: saved.client_email,
        draftToken: saved.pending_token,
        updatedAt: saved.pending_updated_at,
      },
    });
  } catch (error) {
    return reportErrorResponse(error);
  }
};
