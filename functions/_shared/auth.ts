export interface AuthEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SESSION_SECRET: string;
  ADMIN_EMAILS: string;
}

export interface AdminSession {
  email: string;
  expiresAt: number;
}

export const SESSION_COOKIE = "blueprint_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 8;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
};

const base64UrlToBytes = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const importSigningKey = (secret: string) =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign", "verify"],
  );

const sign = async (payload: string, secret: string) => {
  const key = await importSigningKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  return bytesToBase64Url(new Uint8Array(signature));
};

export const createSessionToken = async (
  email: string,
  secret: string,
): Promise<string> => {
  const session: AdminSession = {
    email: email.trim().toLowerCase(),
    expiresAt: Math.floor(Date.now() / 1_000) + SESSION_MAX_AGE,
  };
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify(session)));
  return `${payload}.${await sign(payload, secret)}`;
};

export const verifySessionToken = async (
  token: string | undefined,
  secret: string | undefined,
): Promise<AdminSession | null> => {
  if (!token || !secret || secret.length < 32) return null;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  try {
    const key = await importSigningKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signature),
      encoder.encode(payload),
    );
    if (!valid) return null;

    const session = JSON.parse(
      decoder.decode(base64UrlToBytes(payload)),
    ) as Partial<AdminSession>;
    if (
      typeof session.email !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Math.floor(Date.now() / 1_000)
    ) {
      return null;
    }

    return {
      email: session.email,
      expiresAt: session.expiresAt,
    };
  } catch {
    return null;
  }
};

export const readCookie = (
  request: Request,
  name: string,
): string | undefined => {
  const cookie = request.headers.get("Cookie");
  if (!cookie) return undefined;

  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
};

export const sessionCookie = (token: string, secure: boolean) =>
  [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    secure ? "Secure" : "",
    "SameSite=Strict",
    `Max-Age=${SESSION_MAX_AGE}`,
  ]
    .filter(Boolean)
    .join("; ");

export const expiredSessionCookie = (secure: boolean) =>
  [
    `${SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    secure ? "Secure" : "",
    "SameSite=Strict",
    "Max-Age=0",
  ]
    .filter(Boolean)
    .join("; ");

export const isAllowedAdmin = (email: string, configuredEmails: string) => {
  const allowed = new Set(
    configuredEmails
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
  return allowed.has(email.trim().toLowerCase());
};

export const isSameOriginRequest = (request: Request) => {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
};

export const getAdminSession = (request: Request, env: AuthEnv) =>
  verifySessionToken(readCookie(request, SESSION_COOKIE), env.SESSION_SECRET);

export const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...Object.fromEntries(new Headers(headers)),
    },
  });
