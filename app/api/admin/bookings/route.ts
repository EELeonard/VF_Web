import { env } from "cloudflare:workers";
import { isValidSession } from "../../../lib/admin-auth";
import { BookingRecord, BookingStatus, ensureBookingsDatabase } from "../../../lib/bookings-db";
import { deliverBookingEmail } from "../../../lib/booking-notifications";

const statuses = new Set<BookingStatus>(["pending", "confirmed", "completed", "cancelled"]);

export async function GET(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const db = await ensureBookingsDatabase(env.DB);
  const result = await db.prepare("SELECT * FROM bookings ORDER BY flight_date ASC, flight_time ASC, created_at DESC").all<BookingRecord>();
  return Response.json({ bookings: result.results });
}

export async function PATCH(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const body = await request.json() as { id?: number; status?: BookingStatus };
  if (!Number.isInteger(body.id) || !body.status || !statuses.has(body.status)) {
    return Response.json({ error: "Ungültige Änderung." }, { status: 400 });
  }
  const db = await ensureBookingsDatabase(env.DB);
  const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").bind(body.id).first<BookingRecord>();
  if (!booking) return Response.json({ error: "Buchung nicht gefunden." }, { status: 404 });
  await db.prepare("UPDATE bookings SET status = ? WHERE id = ?").bind(body.status, body.id).run();
  if (body.status === "confirmed" && booking.status !== "confirmed") {
    const delivery = await deliverBookingEmail("confirmation", { ...booking, status: "confirmed" }, db, env);
    return Response.json({ updated: true, emailSent: delivery.sent });
  }
  return Response.json({ updated: true, emailSent: null });
}

export async function DELETE(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isInteger(id)) return Response.json({ error: "Ungültige Buchung." }, { status: 400 });
  const db = await ensureBookingsDatabase(env.DB);
  const booking = await db.prepare("SELECT voucher_code FROM bookings WHERE id = ?").bind(id).first<{ voucher_code: string | null }>();
  if (booking?.voucher_code) return Response.json({ error: "Buchungen mit Gutscheincode müssen storniert und für die Nachvollziehbarkeit aufbewahrt werden." }, { status: 409 });
  await db.prepare("DELETE FROM bookings WHERE id = ?").bind(id).run();
  return Response.json({ deleted: true });
}
