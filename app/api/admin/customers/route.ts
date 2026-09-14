import { env } from "cloudflare:workers";
import { isValidSession } from "../../../lib/admin-auth";
import { ensureBookingsDatabase } from "../../../lib/bookings-db";
import { ensureCustomersDatabase, type CustomerRecord } from "../../../lib/customers-db";

export async function GET(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const db = await ensureBookingsDatabase(env.DB);
  await ensureCustomersDatabase(db);
  const result = await db.prepare("SELECT c.*, (SELECT COUNT(*) FROM bookings b WHERE lower(trim(b.customer_email))=c.email) AS booking_count FROM customers c ORDER BY datetime(c.last_booking_at) DESC, c.name").all<CustomerRecord>();
  return Response.json({ customers: result.results });
}

export async function PATCH(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const id = Number(body.id);
  const notes = String(body.notes ?? "").trim();
  if (!Number.isInteger(id) || notes.length > 8000) return Response.json({ error: "Ungültige Kundennotiz." }, { status: 400 });
  const db = await ensureCustomersDatabase(await ensureBookingsDatabase(env.DB));
  const result = await db.prepare("UPDATE customers SET notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(notes, id).run();
  if (!result.meta.changes) return Response.json({ error: "Kunde nicht gefunden." }, { status: 404 });
  return Response.json({ updated: true });
}
