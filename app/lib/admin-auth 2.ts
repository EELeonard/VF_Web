const COOKIE_NAME = "viennaflight_admin";
const SESSION_SECONDS = 60 * 60 * 8;

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

async function signature(payload: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(credentials().secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))));
}

export async function createSessionToken() {
  const payload = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return payload + "." + await signature(payload);
}

export async function isValidSession(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(COOKIE_NAME + "="))?.slice(COOKIE_NAME.length + 1);
  if (!token) return false;
  const [expires, suppliedSignature] = token.split(".");
  if (!expires || !suppliedSignature || Number(expires) < Math.floor(Date.now() / 1000)) return false;
  return suppliedSignature === await signature(expires);
}

export function validCredentials(username: string, password: string) {
  const expected = credentials();
  return username === expected.username && password === expected.password;
}

export async function authenticateAdmin(username: string, password: string, database: D1Database) {
  if (validCredentials(username, password)) return { username, displayName: "Administrator" };
  const db = await ensureAdminDatabase(database);
  const user = await db.prepare("SELECT username, display_name, password_hash, password_salt FROM admin_users WHERE username = ? AND active = 1").bind(username.trim()).first<{ username: string; display_name: string; password_hash: string; password_salt: string }>();
  if (!user || !(await verifyPassword(password, user.password_hash, user.password_salt))) return null;
  return { username: user.username, displayName: user.display_name };
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return COOKIE_NAME + "=" + token + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + SESSION_SECONDS + secure;
}

export function expiredSessionCookie() {
  return COOKIE_NAME + "=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0";
}
import { ensureAdminDatabase, verifyPassword } from "./admin-db";
