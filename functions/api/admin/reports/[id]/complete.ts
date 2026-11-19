import { json, type AuthEnv } from "../../../../_shared/auth";
import {
  isRecordValue,
  reportErrorResponse,
  requireAdmin,
  requireSameOrigin,
} from "../../../../_shared/reports";
import { supabaseAdminRequest } from "../../../../_shared/supabase";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

interface CompleteRpcRow {
  id: string;
  client_email: string;
  completed_at: string;
}

export const onRequestPost: PagesFunction<AuthEnv> = async (context) => {
  const originError = requireSameOrigin(context.request);
  if (originError) return originError;
  const admin = await requireAdmin(context.request, context.env);
  if (admin instanceof Response) return admin;

  const id = String(context.params.id ?? "");
  if (!UUID_PATTERN.test(id)) return json({ error: "Expediente inválido." }, 400);

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Solicitud inválida." }, 400);
  }
  const draftToken =
    isRecordValue(body) && typeof body.draftToken === "string"
      ? body.draftToken
      : "";
  if (!UUID_PATTERN.test(draftToken)) {
    return json({ error: "La versión del borrador no es válida." }, 400);
  }

  try {
    const rows = (await supabaseAdminRequest(
      context.env,
      "rpc/complete_llc_report",
      {
        method: "POST",
        body: JSON.stringify({
          p_report_id: id,
          p_pending_token: draftToken,
          p_admin_email: admin.email,
        }),
      },
    )) as CompleteRpcRow[];
    const completed = rows[0];
    if (!completed) {
      return json(
        {
          error:
            "El borrador cambió o ya fue completado. Recarga el informe antes de continuar.",
        },
        409,
      );
    }

    return json({
      ok: true,
      report: {
        id: completed.id,
        email: completed.client_email,
        completedAt: completed.completed_at,
      },
    });
  } catch (error) {
    return reportErrorResponse(error);
  }
};
