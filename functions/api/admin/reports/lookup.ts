import {
  json,
  type AuthEnv,
} from "../../../_shared/auth";
import {
  normalizeEmail,
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
  completed_by: string | null;
  pending_client_name: string | null;
  pending_answers: Record<string, unknown> | null;
  pending_report_model: Record<string, unknown> | null;
  pending_token: string | null;
  pending_updated_at: string | null;
  pending_by: string | null;
}

const presentReport = (row: ReportRow) => ({
  id: row.id,
  email: row.client_email,
  official:
    row.answers && row.report_model
      ? {
          clientName: row.client_name,
          answers: row.answers,
          reportModel: row.report_model,
          completedAt: row.completed_at,
          completedBy: row.completed_by,
        }
      : null,
  pending:
    row.pending_answers && row.pending_report_model && row.pending_token
      ? {
          clientName: row.pending_client_name,
          answers: row.pending_answers,
          reportModel: row.pending_report_model,
          updatedAt: row.pending_updated_at,
          updatedBy: row.pending_by,
        }
      : null,
});

export const onRequestGet: PagesFunction<AuthEnv> = async (context) => {
  const admin = await requireAdmin(context.request, context.env);
  if (admin instanceof Response) return admin;

  const email = normalizeEmail(new URL(context.request.url).searchParams.get("email"));
  if (!email) return json({ error: "Ingresa un correo válido." }, 400);

  try {
    const select = [
      "id",
      "client_email",
      "client_name",
      "answers",
      "report_model",
      "completed_at",
      "completed_by",
      "pending_client_name",
      "pending_answers",
      "pending_report_model",
      "pending_token",
      "pending_updated_at",
      "pending_by",
    ].join(",");
    const rows = (await supabaseAdminRequest(
      context.env,
      `llc_reports?client_email=eq.${encodeURIComponent(email)}&select=${select}&limit=1`,
    )) as ReportRow[];
    const report = rows[0];
    return report
      ? json({ found: true, report: presentReport(report) })
      : json({ found: false, report: null });
  } catch (error) {
    return reportErrorResponse(error);
  }
};
