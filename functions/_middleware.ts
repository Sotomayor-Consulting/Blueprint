import {
  readCookie,
  SESSION_COOKIE,
  verifySessionToken,
  type AuthEnv,
} from "./_shared/auth";

const isPanelRoute = (pathname: string) =>
  pathname === "/panel" || pathname.startsWith("/panel/");

const isFormRoute = (pathname: string) =>
  pathname === "/" ||
  pathname === "/index.html" ||
  pathname === "/informe" ||
  pathname.startsWith("/informe/");

const isAdminApiRoute = (pathname: string) =>
  pathname === "/api/admin" || pathname.startsWith("/api/admin/");

export const onRequest: PagesFunction<AuthEnv> = async (context) => {
  const url = new URL(context.request.url);
  const protectedPage =
    isFormRoute(url.pathname) || isPanelRoute(url.pathname);
  const protectedApi = isAdminApiRoute(url.pathname);
  const loginPage =
    url.pathname === "/login" || url.pathname.startsWith("/login/");

  if (!protectedPage && !protectedApi && !loginPage) {
    return context.next();
  }

  const session = await verifySessionToken(
    readCookie(context.request, SESSION_COOKIE),
    context.env.SESSION_SECRET,
  );

  if (!session && protectedApi) {
    return Response.json(
      { error: "No autorizado." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!session && protectedPage) {
    const requestedRoute = `${url.pathname}${url.search}`;
    const loginUrl = new URL("/login/", url.origin);
    loginUrl.searchParams.set("next", requestedRoute);
    return Response.redirect(loginUrl.toString(), 302);
  }

  if (session && loginPage) {
    return Response.redirect(`${url.origin}/panel/`, 302);
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "same-origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
