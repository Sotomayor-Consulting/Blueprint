import {
  expiredSessionCookie,
  isSameOriginRequest,
  json,
} from "../../_shared/auth";

export const onRequestPost: PagesFunction = async (context) => {
  if (!isSameOriginRequest(context.request)) {
    return json({ error: "Solicitud no permitida." }, 403);
  }

  const secure = new URL(context.request.url).protocol === "https:";
  return json(
    { ok: true },
    200,
    { "Set-Cookie": expiredSessionCookie(secure) },
  );
};
