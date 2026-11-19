import {
  json,
  readCookie,
  SESSION_COOKIE,
  verifySessionToken,
  type AuthEnv,
} from "../../_shared/auth";

export const onRequestGet: PagesFunction<AuthEnv> = async (context) => {
  const session = await verifySessionToken(
    readCookie(context.request, SESSION_COOKIE),
    context.env.SESSION_SECRET,
  );

  if (!session) {
    return json({ error: "Sesión no válida." }, 401);
  }

  return json({
    authenticated: true,
    email: session.email,
    expiresAt: session.expiresAt,
  });
};
