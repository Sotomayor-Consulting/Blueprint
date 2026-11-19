import {
  getAdminSession,
  isSameOriginRequest,
  json,
  type AdminSession,
  type AuthEnv,
} from "./auth";
import { SupabaseAdminError } from "./supabase";

export const REPORT_FIELD_NAMES = [
  "clientName",
  "email",
  "businessModel",
  "operationDescription",
  "clientMarkets",
  "confidentialityLevel",
  "formationState",
  "operaciones",
  "primaryOperatingCountry",
  "hasUsSourceIncome",
  "llcTaxTreatment",
  "operationalIndicators",
  "AmericanResident",
  "EstructureClassLevel",
  "singleMemberOwnerType",
  "numberOfMembers",
  "sistemModel",
  "cashModel",
  "primaryEconomicActivity",
] as const;

type ReportFieldName = (typeof REPORT_FIELD_NAMES)[number];
type ReportAnswers = Partial<Record<ReportFieldName, string | string[]>>;

const MULTIPLE_FIELDS = new Set<ReportFieldName>([
  "clientMarkets",
  "operationalIndicators",
]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const MAX_MODEL_BYTES = 250_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const normalizeEmail = (value: unknown) => {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null;
};

export const sanitizeReportAnswers = (
  value: unknown,
): ReportAnswers | null => {
  if (!isRecord(value)) return null;
  const answers: ReportAnswers = {};

  for (const fieldName of REPORT_FIELD_NAMES) {
    const rawValue = value[fieldName];
    if (MULTIPLE_FIELDS.has(fieldName)) {
      if (rawValue === undefined) continue;
      if (!Array.isArray(rawValue)) return null;
      const items = rawValue
        .slice(0, 20)
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, 2_000))
        .filter(Boolean);
      if (items.length > 0) answers[fieldName] = Array.from(new Set(items));
      continue;
    }

    if (rawValue === undefined) continue;
    if (typeof rawValue !== "string") return null;
    const text = rawValue.trim().slice(0, 2_000);
    if (text) answers[fieldName] = text;
  }

  const email = normalizeEmail(answers.email);
  if (!email) return null;
  answers.email = email;
  return answers;
};

export const sanitizeReportModel = (
  value: unknown,
): Record<string, unknown> | null => {
  if (!isRecord(value)) return null;
  const serialized = JSON.stringify(value);
  if (new TextEncoder().encode(serialized).byteLength > MAX_MODEL_BYTES) {
    return null;
  }
  return JSON.parse(serialized) as Record<string, unknown>;
};

export const requireAdmin = async (
  request: Request,
  env: AuthEnv,
): Promise<AdminSession | Response> => {
  const session = await getAdminSession(request, env);
  return session ?? json({ error: "No autorizado." }, 401);
};

export const requireSameOrigin = (request: Request) =>
  isSameOriginRequest(request)
    ? null
    : json({ error: "Solicitud no permitida." }, 403);

export const reportErrorResponse = (error: unknown) => {
  if (error instanceof SupabaseAdminError) {
    return json({ error: error.message }, error.status);
  }
  console.error("Unexpected report API error", error);
  return json({ error: "No se pudo procesar el expediente." }, 500);
};

export const isRecordValue = isRecord;
