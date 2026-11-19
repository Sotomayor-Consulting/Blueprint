import { json, type AuthEnv } from "../../../_shared/auth";
import {
  reportErrorResponse,
  requireAdmin,
} from "../../../_shared/reports";
import { supabaseAdminRequest } from "../../../_shared/supabase";

interface ReportListRow {
  id: string;
  client_email: string;
  client_name: string | null;
  pending_client_name: string | null;
  completed_at: string | null;
  pending_updated_at: string | null;
  updated_at: string;
}

export const onRequestGet: PagesFunction<AuthEnv> = async (context) => {
  const admin = await requireAdmin(context.request, context.env);
  if (admin instanceof Response) return admin;

  try {
    const rows = (await supabaseAdminRequest(
      context.env,
      "llc_reports?select=id,client_email,client_name,pending_client_name,completed_at,pending_updated_at,updated_at&order=updated_at.desc&limit=100",
    )) as ReportListRow[];

    return json({
      reports: rows.map((row) => ({
        id: row.id,
        email: row.client_email,
        clientName: row.pending_client_name ?? row.client_name ?? "Sin nombre",
        hasPending: Boolean(row.pending_updated_at),
        pendingUpdatedAt: row.pending_updated_at,
        completedAt: row.completed_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    return reportErrorResponse(error);
  }
};
