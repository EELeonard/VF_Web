import { env } from "cloudflare:workers";
import { isValidSession } from "../../../lib/admin-auth";
import { sendCustomBookingEmail } from "../../../lib/booking-email";
import { ensureCommunicationsDatabase, recordCommunication, type BookingCommunication } from "../../../lib/booking-communications-db";
import { type BookingRecord } from "../../../lib/bookings-db";
import { isBookingTime } from "../../../lib/availability-db";
import { bookingWithInstructorSql, ensureInstructorDatabase } from "../../../lib/instructors-db";

async function bookingFor(db: D1Database, id: number) {
  return db.prepare(bookingWithInstructorSql + " WHERE b.id = ?").bind(id).first<BookingRecord>();
}

export async function GET(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("bookingId"));
  if (!Number.isInteger(id)) return Response.json({ error: "Ungültige Buchung." }, { status: 400 });
  const db = await ensureCommunicationsDatabase(await ensureInstructorDatabase(env.DB));
  const booking = await bookingFor(db, id);
  if (!booking) return Response.json({ error: "Buchung nicht gefunden." }, { status: 404 });
  const result = await db.prepare("SELECT * FROM booking_communications WHERE booking_id = ? ORDER BY datetime(sent_at) DESC, id DESC").bind(id).all<BookingCommunication>();
  return Response.json({ booking, communications: result.results });
}

export async function POST(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const id = Number(body.bookingId);
  const action = String(body.action ?? "");
  if (!Number.isInteger(id)) return Response.json({ error: "Ungültige Buchung." }, { status: 400 });
  const db = await ensureCommunicationsDatabase(await ensureInstructorDatabase(env.DB));
  const booking = await bookingFor(db, id);
  if (!booking) return Response.json({ error: "Buchung nicht gefunden." }, { status: 404 });

  if (action === "note") {
    const note = String(body.note ?? "").trim();
    if (note.length > 4000) return Response.json({ error: "Die interne Notiz ist zu lang." }, { status: 400 });
    await db.prepare("UPDATE bookings SET internal_notes = ? WHERE id = ?").bind(note, id).run();
    return Response.json({ updated: true });
  }

  if (action === "instructor") {
    const instructorId = body.instructorId === null || body.instructorId === "" ? null : Number(body.instructorId);
    if (instructorId !== null && !Number.isInteger(instructorId)) return Response.json({ error: "Ungültiger Instructor." }, { status: 400 });
    if (instructorId !== null && !(await db.prepare("SELECT id FROM instructors i WHERE id = ? AND active = 1 AND EXISTS (SELECT 1 FROM instructor_capabilities c WHERE c.instructor_id=i.id AND c.simulator=?)").bind(instructorId, booking.simulator).first())) return Response.json({ error: "Instructor ist für diesen Simulator nicht freigegeben." }, { status: 400 });
    if (instructorId !== null) {
      if (!(await db.prepare("SELECT id FROM instructor_availability WHERE instructor_id=? AND available_date=? AND available_time=?").bind(instructorId,booking.flight_date,booking.flight_time).first())) return Response.json({ error: "Instructor ist für diesen Termin nicht als verfügbar eingetragen." }, { status: 409 });
      const endAt = booking.flight_start_at ? new Date(new Date(booking.flight_start_at).getTime() + booking.duration * 60_000).toISOString() : null;
      const conflict = booking.flight_start_at && endAt ? await db.prepare("SELECT reference FROM bookings WHERE instructor_id=? AND id!=? AND status!='cancelled' AND flight_start_at<? AND datetime(flight_start_at,'+'||duration||' minutes')>datetime(?) LIMIT 1").bind(instructorId,id,endAt,booking.flight_start_at).first<{reference:string}>() : null;
      if (conflict) return Response.json({ error: `Instructor ist in diesem Zeitraum bereits für ${conflict.reference} eingeplant.` }, { status: 409 });
    }
    await db.prepare("UPDATE bookings SET instructor_id = ?, instructor_assignment_source = ? WHERE id = ?").bind(instructorId, instructorId === null ? null : "booking", id).run();
    return Response.json({ updated: true });
  }

  if (action === "inbound") {
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();
    if (!subject || !message || subject.length > 200 || message.length > 8000) return Response.json({ error: "Betreff oder Nachricht ist ungültig." }, { status: 400 });
    await recordCommunication(db, { booking_id: id, direction: "inbound", kind: "reply", subject, body: message, from_email: booking.customer_email, to_email: env.BOOKING_EMAIL_FROM ?? "Vienna Flight", delivery_status: "received", provider_id: null, sent_at: new Date().toISOString() });
    return Response.json({ recorded: true });
  }

  let subject = String(body.subject ?? "").trim();
  let message = String(body.message ?? "").trim();
  let kind = "manual";
  if (action === "proposal") {
    const date = String(body.date ?? ""); const time = String(body.time ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isBookingTime(time) || new Date(`${date}T${time}:00`).getTime() <= Date.now()) return Response.json({ error: "Der Terminvorschlag ist ungültig." }, { status: 400 });
    subject = booking.language === "en" ? `New appointment proposal: ${booking.reference}` : `Neuer Terminvorschlag: ${booking.reference}`;
    const proposalText = booking.language === "en" ? `We would like to propose ${date} at ${time} for your flight experience. Please reply to confirm whether this appointment works for you.` : `Wir möchten Ihnen den ${date} um ${time} Uhr als neuen Termin für Ihr Flugerlebnis vorschlagen. Bitte antworten Sie uns, ob dieser Termin für Sie passt.`;
    message = proposalText + (message ? `\n\n${message}` : "");
    kind = "proposal";
    await db.prepare("UPDATE bookings SET proposed_date = ?, proposed_time = ? WHERE id = ?").bind(date, time, id).run();
  } else if (action === "cancel") {
    subject = booking.language === "en" ? `Booking cancelled: ${booking.reference}` : `Buchung storniert: ${booking.reference}`;
    message = message || (booking.language === "en" ? "Your booking has been cancelled. Please contact us if you have any questions." : "Ihre Buchung wurde storniert. Bei Fragen können Sie uns jederzeit kontaktieren.");
    kind = "cancellation";
    await db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").bind(id).run();
  }
  if (!["proposal", "cancel", "email"].includes(action) || !subject || !message || subject.length > 200 || message.length > 8000) return Response.json({ error: "Ungültige Aktion oder Nachricht." }, { status: 400 });
  const delivery = await sendCustomBookingEmail(booking, subject, message, env);
  await recordCommunication(db, { booking_id: id, direction: "outbound", kind, subject, body: message, from_email: env.BOOKING_EMAIL_FROM ?? "Vienna Flight", to_email: booking.customer_email, delivery_status: delivery.sent ? "sent" : "failed", provider_id: null, sent_at: delivery.sent ? delivery.sentAt : new Date().toISOString() });
  if (!delivery.sent) return Response.json({ error: `Änderung gespeichert, E-Mail nicht versendet: ${delivery.error}`, updated: true }, { status: 502 });
  return Response.json({ updated: true, emailSent: true });
}
