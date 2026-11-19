import type { AuthEnv } from "./auth";

export class SupabaseAdminError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export const supabaseAdminRequest = async (
  env: AuthEnv,
  path: string,
  init: RequestInit = {},
) => {
  const adminKey =
    env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.SUPABASE_URL || !adminKey) {
    throw new SupabaseAdminError(
      "La persistencia administrativa no está configurada.",
      503,
    );
  }

  const headers = new Headers(init.headers);
  headers.set("apikey", adminKey);
  if (adminKey.startsWith("eyJ")) {
    headers.set("Authorization", `Bearer ${adminKey}`);
  }
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");

  const response = await fetch(
    `${env.SUPABASE_URL.replace(/\/+$/u, "")}/rest/v1/${path.replace(/^\/+/u, "")}`,
    { ...init, headers },
  );

  if (!response.ok) {
    const details = await response.text();
    console.error("Supabase admin request failed", response.status, details);
    throw new SupabaseAdminError(
      response.status >= 500
        ? "Supabase no pudo procesar la solicitud."
        : "No se pudo procesar el expediente.",
      response.status,
    );
  }

  if (response.status === 204) return null;
  return response.json() as Promise<unknown>;
};
