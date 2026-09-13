const COOKIE_NAME = "viennaflight_preview";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function settings() {
  return {
    username: process.env.PREVIEW_USER ?? "admin",
    password: process.env.PREVIEW_PASSWORD ?? "Viennaflight",
    secret:
      process.env.PREVIEW_SESSION_SECRET ??
      process.env.ADMIN_SESSION_SECRET ??
      "vienna-flight-preview-secret-change-before-deployment",
  };
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function key(usage: KeyUsage[]) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(settings().secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usage,
  );
}

async function sign(payload: string) {
  const signingKey = await key(["sign"]);
  const result = await crypto.subtle.sign(
    "HMAC",
    signingKey,
    new TextEncoder().encode(payload),
  );
  return toBase64Url(new Uint8Array(result));
}

export function validPreviewCredentials(username: string, password: string) {
  const expected = settings();
  return username === expected.username && password === expected.password;
}

export async function createPreviewToken() {
  const payload = toBase64Url(
    new TextEncoder().encode(
      JSON.stringify({ expires: Math.floor(Date.now() / 1000) + SESSION_SECONDS }),
    ),
  );
  return `${payload}.${await sign(payload)}`;
}

export async function validPreviewToken(token?: string) {
  if (!token) return false;
  const [payload, suppliedSignature, remainder] = token.split(".");
  if (!payload || !suppliedSignature || remainder) return false;
  try {
    const verificationKey = await key(["verify"]);
    const signatureValid = await crypto.subtle.verify(
      "HMAC",
      verificationKey,
      fromBase64Url(suppliedSignature),
      new TextEncoder().encode(payload),
    );
    if (!signatureValid) return false;
    const data = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payload)),
    ) as { expires?: number };
    return typeof data.expires === "number" && data.expires >= Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function previewCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`;
}

export function previewCookieName() {
  return COOKIE_NAME;
}
