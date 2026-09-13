import { env } from "cloudflare:workers";
import { isValidSession } from "../../../lib/admin-auth";
import { ensureAdminDatabase, hashPassword, type AdminUser } from "../../../lib/admin-db";
import { ensureInstructorDatabase } from "../../../lib/instructors-db";
import { sendUserInvitation } from "../../../lib/user-invitations";

function validUsername(value: string) { return /^[a-zA-Z0-9._-]{3,40}$/.test(value); }
function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }

export async function GET(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const db = await ensureAdminDatabase(env.DB);
  const defaultUser = process.env.ADMIN_USER ?? "admin";
  const result = await db.prepare("SELECT id, username, display_name, email, active, created_at, updated_at FROM admin_users WHERE username != ? ORDER BY username").bind(defaultUser).all<Omit<AdminUser, "password_hash" | "password_salt">>();
  return Response.json({ users: result.results, defaultUser });
}

export async function POST(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const username = String(body.username ?? "").trim();
  const displayName = String(body.displayName ?? "").trim();
  const password = String(body.password ?? "");
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!validUsername(username) || !displayName || displayName.length > 100 || !validEmail(email) || password.length < 12) return Response.json({ error: "Benutzername, Anzeigename, E-Mail-Adresse oder Passwort ist ungültig. Das Passwort benötigt mindestens 12 Zeichen." }, { status: 400 });
  if (username === (process.env.ADMIN_USER ?? "admin")) return Response.json({ error: "Der Standardbenutzer ist bereits vorhanden." }, { status: 409 });
  const db = await ensureAdminDatabase(env.DB);
  await ensureInstructorDatabase(env.DB);
  if (await db.prepare("SELECT id FROM instructors WHERE lower(username) = lower(?) UNION ALL SELECT id FROM admin_users WHERE lower(username) = lower(?)").bind(username,username).first()) return Response.json({ error: "Dieser Benutzername ist bereits vergeben." }, { status: 409 });
  const credentials = await hashPassword(password);
  try {
    const result = await db.prepare("INSERT INTO admin_users (username, display_name, email, password_hash, password_salt) VALUES (?, ?, ?, ?, ?)").bind(username, displayName, email || null, credentials.hash, credentials.salt).run();
    const invitation=await sendUserInvitation(db,request.url,{username,displayName,email},env);
    return Response.json({ created: true, id: result.meta.last_row_id, invitation }, { status: 201 });
  } catch { return Response.json({ error: "Dieser Benutzername ist bereits vergeben." }, { status: 409 }); }
}

export async function PATCH(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const id = Number(body.id);
  const displayName = String(body.displayName ?? "").trim();
  const active = body.active === true;
  const password = String(body.password ?? "");
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!Number.isInteger(id) || !displayName || displayName.length > 100 || (email && !validEmail(email)) || (password && password.length < 12)) return Response.json({ error: "Ungültige Benutzeränderung." }, { status: 400 });
  const db = await ensureAdminDatabase(env.DB);
  const result = password ? await hashPassword(password) : null;
  const update = result
    ? await db.prepare("UPDATE admin_users SET display_name = ?, email = ?, active = ?, password_hash = ?, password_salt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(displayName, email || null, active ? 1 : 0, result.hash, result.salt, id).run()
    : await db.prepare("UPDATE admin_users SET display_name = ?, email = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(displayName, email || null, active ? 1 : 0, id).run();
  if (!update.meta.changes) return Response.json({ error: "Benutzer nicht gefunden." }, { status: 404 });
  return Response.json({ updated: true });
}

export async function DELETE(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return Response.json({ error: "Ungültiger Benutzer." }, { status: 400 });
  const db = await ensureAdminDatabase(env.DB);
  await db.prepare("DELETE FROM admin_users WHERE id = ?").bind(id).run();
  return Response.json({ deleted: true });
}
