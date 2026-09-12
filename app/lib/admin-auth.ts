import { ensureAdminDatabase, verifyPassword } from "./admin-db";

const COOKIE_NAME = "viennaflight_admin";
const SESSION_SECONDS = 60 * 60 * 8;

export type AdminIdentity = {
  username: string;
  displayName: string;
  source: "default" | "database";
};

type SessionPayload = AdminIdentity & { expires: number };

function credentials() {
  return {
    username: process.env.ADMIN_USER ?? "admin",
    password: process.env.ADMIN_PASSWORD ?? "Vienna flight",
    secret: process.env.ADMIN_SESSION_SECRET ?? "vienna-flight-local-preview-secret-change-before-production",
  };
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function hmacKey(usage: KeyUsage[]) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(credentials().secret), { name: "HMAC", hash: "SHA-256" }, false, usage);
}

async function signature(payload: string) {
  const key = await hmacKey(["sign"]);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))));
}

export async function createSessionToken(identity: AdminIdentity) {
  const payload: SessionPayload = { ...identity, expires: Math.floor(Date.now() / 1000) + SESSION_SECONDS };
  const encoded = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  return encoded + "." + await signature(encoded);
}

function cookieToken(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  return cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(COOKIE_NAME + "="))?.slice(COOKIE_NAME.length + 1);
}

export async function getAdminSession(request: Request, database?: D1Database): Promise<AdminIdentity | null> {
  const token = cookieToken(request);
  if (!token) return null;
  const [encoded, suppliedSignature, remainder] = token.split(".");
  if (!encoded || !suppliedSignature || remainder) return null;
  try {
    const key = await hmacKey(["verify"]);
    const validSignature = await crypto.subtle.verify("HMAC", key, fromBase64Url(suppliedSignature), new TextEncoder().encode(encoded));
    if (!validSignature) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as SessionPayload;
    if (!payload.username || !payload.displayName || !["default", "database"].includes(payload.source) || payload.expires < Math.floor(Date.now() / 1000)) return null;
    if (payload.source === "database") {
      if (!database) return null;
      const db = await ensureAdminDatabase(database);
      const active = await db.prepare("SELECT id FROM admin_users WHERE username = ? AND active = 1").bind(payload.username).first<{ id: number }>();
      if (!active) return null;
    }
    return { username: payload.username, displayName: payload.displayName, source: payload.source };
  } catch {
    return null;
  }
}

export async function isValidSession(request: Request, database?: D1Database) {
  return Boolean(await getAdminSession(request, database));
}

export function validCredentials(username: string, password: string) {
  const expected = credentials();
  return username === expected.username && password === expected.password;
}

export async function authenticateAdmin(username: string, password: string, database: D1Database): Promise<AdminIdentity | null> {
  const normalizedUsername = username.trim();
  if (validCredentials(normalizedUsername, password)) return { username: normalizedUsername, displayName: "Administrator", source: "default" };
  const db = await ensureAdminDatabase(database);
  const user = await db.prepare("SELECT username, display_name, password_hash, password_salt FROM admin_users WHERE username = ? AND active = 1").bind(normalizedUsername).first<{ username: string; display_name: string; password_hash: string; password_salt: string }>();
  if (!user || !(await verifyPassword(password, user.password_hash, user.password_salt))) return null;
  return { username: user.username, displayName: user.display_name, source: "database" };
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return COOKIE_NAME + "=" + token + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + SESSION_SECONDS + secure;
}

export function expiredSessionCookie() {
  return COOKIE_NAME + "=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0";
}
