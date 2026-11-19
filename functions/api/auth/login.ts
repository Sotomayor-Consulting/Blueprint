import {
  createSessionToken,
  isAllowedAdmin,
  isSameOriginRequest,
  json,
  sessionCookie,
  type AuthEnv,
} from "../../_shared/auth";

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

interface SupabaseLoginResponse {
  user?: {
    email?: string;
  };
}

export const onRequestPost: PagesFunction<AuthEnv> = async (context) => {
  if (!isSameOriginRequest(context.request)) {
    return json({ error: "Solicitud no permitida." }, 403);
  }

  const supabaseKey =
    context.env.SUPABASE_PUBLISHABLE_KEY ?? context.env.SUPABASE_ANON_KEY;
  if (
    !context.env.SUPABASE_URL ||
    !supabaseKey ||
    !context.env.SESSION_SECRET ||
    context.env.SESSION_SECRET.length < 32 ||
    !context.env.ADMIN_EMAILS
  ) {
    return json({ error: "El acceso administrativo no está configurado." }, 503);
  }

  let body: LoginBody;
  try {
    body = (await context.request.json()) as LoginBody;
  } catch {
    return json({ error: "Solicitud inválida." }, 400);
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (
    !email ||
    email.length > 254 ||
    !password ||
    password.length > 1_024
  ) {
    return json({ error: "Ingresa un correo y una contraseña válidos." }, 400);
  }

  const authUrl = `${context.env.SUPABASE_URL.replace(/\/+$/u, "")}/auth/v1/token?grant_type=password`;
  const authResponse = await fetch(authUrl, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!authResponse.ok) {
    return json({ error: "Correo o contraseña incorrectos." }, 401);
  }

  const auth = (await authResponse.json()) as SupabaseLoginResponse;
  const authenticatedEmail = auth.user?.email?.trim().toLowerCase();
  if (
    !authenticatedEmail ||
    !isAllowedAdmin(authenticatedEmail, context.env.ADMIN_EMAILS)
  ) {
    return json({ error: "Esta cuenta no tiene acceso al panel." }, 403);
  }

  const token = await createSessionToken(
    authenticatedEmail,
    context.env.SESSION_SECRET,
  );
  const secure = new URL(context.request.url).protocol === "https:";

  return json(
    { ok: true },
    200,
    { "Set-Cookie": sessionCookie(token, secure) },
  );
};
