import { json, type AuthEnv } from "../../../_shared/auth";
import {
  reportErrorResponse,
  requireAdmin,
} from "../../../_shared/reports";
import { supabaseAdminRequest } from "../../../_shared/supabase";

interface ReportRow {
  id: string;
  client_email: string;
  client_name: string | null;
  answers: Record<string, unknown> | null;
  report_model: Record<string, unknown> | null;
  completed_at: string | null;
  pending_client_name: string | null;
  pending_answers: Record<string, unknown> | null;
  pending_report_model: Record<string, unknown> | null;
  pending_token: string | null;
  pending_updated_at: string | null;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export const onRequestGet: PagesFunction<AuthEnv> = async (context) => {
  const admin = await requireAdmin(context.request, context.env);
  if (admin instanceof Response) return admin;

  const id = String(context.params.id ?? "");
  if (!UUID_PATTERN.test(id)) return json({ error: "Expediente inválido." }, 400);

  try {
    const select = [
      "id",
      "client_email",
      "client_name",
      "answers",
      "report_model",
      "completed_at",
      "pending_client_name",
      "pending_answers",
      "pending_report_model",
      "pending_token",
      "pending_updated_at",
    ].join(",");
    const rows = (await supabaseAdminRequest(
      context.env,
      `llc_reports?id=eq.${encodeURIComponent(id)}&select=${select}&limit=1`,
    )) as ReportRow[];
    const row = rows[0];
    if (!row) return json({ error: "Expediente no encontrado." }, 404);

    return json({
      report: {
        id: row.id,
        email: row.client_email,
        official:
          row.answers && row.report_model
            ? {
                clientName: row.client_name,
                answers: row.answers,
                reportModel: row.report_model,
                completedAt: row.completed_at,
              }
            : null,
        pending:
          row.pending_answers && row.pending_report_model && row.pending_token
            ? {
                clientName: row.pending_client_name,
                answers: row.pending_answers,
                reportModel: row.pending_report_model,
                draftToken: row.pending_token,
                updatedAt: row.pending_updated_at,
              }
            : null,
      },
    });
  } catch (error) {
    return reportErrorResponse(error);
  }
};
