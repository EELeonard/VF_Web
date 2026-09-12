import { bookingEmailSummary, sendBookingEmail, type EmailEnvironment, type EmailKind } from "./booking-email";
import { type BookingRecord, ensureBookingsDatabase } from "./bookings-db";
import { recordCommunication } from "./booking-communications-db";

const sentColumn: Record<EmailKind, string> = {
  request: "request_email_sent_at",
  confirmation: "confirmation_email_sent_at",
  reminder: "reminder_email_sent_at",
};

export async function deliverBookingEmail(kind: EmailKind, booking: BookingRecord, database: D1Database, emailEnv?: EmailEnvironment) {
  const db = await ensureBookingsDatabase(database);
  if (booking[sentColumn[kind] as keyof BookingRecord]) return { sent: true as const, alreadySent: true as const };
  const result = await sendBookingEmail(kind, booking, emailEnv);
  const summary = bookingEmailSummary(kind, booking);
  await recordCommunication(db, { booking_id: booking.id, direction: "outbound", kind, subject: summary.subject, body: summary.body, from_email: emailEnv?.BOOKING_EMAIL_FROM ?? "Vienna Flight", to_email: booking.customer_email, delivery_status: result.sent ? "sent" : "failed", provider_id: null, sent_at: result.sent ? result.sentAt : new Date().toISOString() });
  if (result.sent) {
    await db.prepare(`UPDATE bookings SET ${sentColumn[kind]} = ?, email_error = NULL WHERE id = ? AND ${sentColumn[kind]} IS NULL`).bind(result.sentAt, booking.id).run();
  } else {
    await db.prepare("UPDATE bookings SET email_error = ? WHERE id = ?").bind(result.error, booking.id).run();
  }
  return result;
}

export async function processDueReminders(now: Date, database: D1Database, emailEnv?: EmailEnvironment) {
  const db = await ensureBookingsDatabase(database);
  const from = new Date(now.getTime() + 23.75 * 60 * 60 * 1000).toISOString();
  const until = new Date(now.getTime() + 24.25 * 60 * 60 * 1000).toISOString();
  const result = await db.prepare("SELECT * FROM bookings WHERE status = 'confirmed' AND reminder_email_sent_at IS NULL AND flight_start_at >= ? AND flight_start_at < ? ORDER BY flight_start_at ASC").bind(from, until).all<BookingRecord>();
  let sent = 0;
  let failed = 0;
  for (const booking of result.results) {
    const delivery = await deliverBookingEmail("reminder", booking, db, emailEnv);
    if (delivery.sent) sent += 1;
    else failed += 1;
  }
  return { checked: result.results.length, sent, failed, window: { from, until } };
}
