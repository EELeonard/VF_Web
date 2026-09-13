import { env } from "cloudflare:workers";
import { ensureBookingsDatabase } from "../../lib/bookings-db";
import type { BookingRecord } from "../../lib/bookings-db";
import { deliverBookingEmail } from "../../lib/booking-notifications";
import { viennaLocalToUtc } from "../../lib/booking-time";
import { ensureAvailabilityDatabase, isBookingTime, isSimulator } from "../../lib/availability-db";
import { simulators } from "../../lib/site-data";
import { ensureInstructorDatabase } from "../../lib/instructors-db";
import { ensureVouchersDatabase, normalizeCustomerEmail, normalizeVoucherCode, validateVoucher } from "../../lib/vouchers-db";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const simulator = String(body.simulator ?? "");
    const duration = Number(body.duration);
    const flightDate = String(body.date ?? "");
    const flightTime = String(body.time ?? "");
    const customerName = String(body.name ?? "").trim();
    const customerEmail = String(body.email ?? "").trim();
    const customerPhone = String(body.phone ?? "").trim();
    const remark = String(body.remark ?? "").trim();
    const voucherCode = normalizeVoucherCode(String(body.voucherCode ?? ""));
    const language = body.language === "en" ? "en" : "de";
    const gift = body.gift === true ? 1 : 0;
    const errorText = language === "en" ? {
      selection: "Invalid flight selection.",
      appointment: "Invalid appointment.",
      contact: "Please complete all contact details.",
      length: "One of the entries exceeds the permitted length.",
      future: "Please select a future appointment.",
      unavailable: "This appointment is no longer available. Please select another released appointment.",
      saved: "The saved booking could not be loaded.",
      generic: "The booking could not be saved.",
      voucher: "This voucher is invalid, expired or has reached its usage limit.",
    } : {
      selection: "Ungültige Flugauswahl.",
      appointment: "Ungültiger Termin.",
      contact: "Bitte füllen Sie alle Kontaktdaten aus.",
      length: "Eine Eingabe überschreitet die zulässige Länge.",
      future: "Bitte wählen Sie einen zukünftigen Termin.",
      unavailable: "Dieser Termin ist nicht mehr verfügbar. Bitte wählen Sie einen anderen freigegebenen Termin.",
      saved: "Die gespeicherte Buchung konnte nicht geladen werden.",
      generic: "Die Buchung konnte nicht gespeichert werden.",
      voucher: "Dieser Gutscheincode ist ungültig, abgelaufen oder hat sein Nutzungslimit erreicht.",
    };

    if (!isSimulator(simulator) || ![30, 60, 90, 120].includes(duration)) {
      return Response.json({ error: errorText.selection }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(flightDate) || !isBookingTime(flightTime)) {
      return Response.json({ error: errorText.appointment }, { status: 400 });
    }
    if (!customerName || !customerEmail.includes("@") || !customerPhone) {
      return Response.json({ error: errorText.contact }, { status: 400 });
    }
    if (customerName.length > 160 || customerEmail.length > 254 || customerPhone.length > 80 || remark.length > 2000) {
      return Response.json({ error: errorText.length }, { status: 400 });
    }

    const reference = "VF-" + new Date().getFullYear() + "-" + crypto.randomUUID().slice(0, 6).toUpperCase();
    const flightStartAt = viennaLocalToUtc(flightDate, flightTime);
    if (new Date(flightStartAt).getTime() <= Date.now()) return Response.json({ error: errorText.future }, { status: 400 });
    const db = await ensureAvailabilityDatabase(env.DB);
    await ensureBookingsDatabase(db);
    await ensureInstructorDatabase(db);
    const simulatorData = simulators.find((item) => item.name === simulator);
    const originalPriceCents = (simulatorData?.prices[duration] ?? 0) * 100;
    if (!originalPriceCents) return Response.json({ error: errorText.selection }, { status: 400 });
    const normalizedEmail = normalizeCustomerEmail(customerEmail);
    const voucher = voucherCode ? await validateVoucher(db, voucherCode, normalizedEmail, originalPriceCents) : null;
    if (voucherCode && !voucher) return Response.json({ error: errorText.voucher }, { status: 400 });
    if (voucher) await ensureVouchersDatabase(db);
    const candidateEndAt = new Date(new Date(flightStartAt).getTime() + duration * 60_000).toISOString();
    const bookingSql = "INSERT INTO bookings (reference, simulator, duration, flight_date, flight_time, flight_start_at, gift, customer_name, customer_email, customer_phone, remark, language, status, voucher_code, original_price_cents, discount_amount_cents, final_price_cents) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM appointment_slots WHERE simulator = ? AND flight_date = ? AND flight_time = ? AND enabled = 1) AND NOT EXISTS (SELECT 1 FROM bookings WHERE simulator = ? AND status != 'cancelled' AND flight_start_at < ? AND datetime(flight_start_at, '+' || duration || ' minutes') > datetime(?))";
    let insert;
    if (voucher) {
      const guardedSql = bookingSql + " AND EXISTS (SELECT 1 FROM vouchers v WHERE v.id = ? AND v.updated_at = ? AND v.active = 1 AND (v.starts_at IS NULL OR datetime(v.starts_at) <= datetime('now')) AND (v.ends_at IS NULL OR datetime(v.ends_at) >= datetime('now')) AND (v.allowed_email IS NULL OR lower(v.allowed_email) = ?) AND (v.max_uses IS NULL OR (SELECT COUNT(*) FROM voucher_redemptions WHERE voucher_id = v.id) < v.max_uses) AND (v.max_uses_per_email IS NULL OR (SELECT COUNT(*) FROM voucher_redemptions WHERE voucher_id = v.id AND customer_email = ?) < v.max_uses_per_email))";
      const results = await db.batch([
        db.prepare(guardedSql).bind(reference, simulator, duration, flightDate, flightTime, flightStartAt, gift, customerName, customerEmail, customerPhone, remark, language, voucher.voucher.code, originalPriceCents, voucher.discountAmountCents, voucher.finalPriceCents, simulator, flightDate, flightTime, simulator, candidateEndAt, flightStartAt, voucher.voucher.id, voucher.voucher.updated_at, normalizedEmail, normalizedEmail),
        db.prepare("INSERT INTO voucher_redemptions (voucher_id, booking_id, customer_email) SELECT ?, id, ? FROM bookings WHERE reference = ?").bind(voucher.voucher.id, normalizedEmail, reference),
      ]);
      insert = results[0];
    } else {
      insert = await db.prepare(bookingSql).bind(reference, simulator, duration, flightDate, flightTime, flightStartAt, gift, customerName, customerEmail, customerPhone, remark, language, null, originalPriceCents, 0, originalPriceCents, simulator, flightDate, flightTime, simulator, candidateEndAt, flightStartAt).run();
    }
    if (!insert.meta.changes) return Response.json({ error: errorText.unavailable }, { status: 409 });
    await db.prepare("UPDATE bookings SET instructor_id = (SELECT instructor_id FROM instructor_day_assignments WHERE simulator = ? AND flight_date = ?), instructor_assignment_source = CASE WHEN EXISTS (SELECT 1 FROM instructor_day_assignments WHERE simulator = ? AND flight_date = ?) THEN 'day' ELSE NULL END WHERE id = ?").bind(simulator, flightDate, simulator, flightDate, insert.meta.last_row_id).run();
    const booking = await db.prepare("SELECT * FROM bookings WHERE id = ?").bind(insert.meta.last_row_id).first<BookingRecord>();
    if (!booking) throw new Error(errorText.saved);
    const delivery = await deliverBookingEmail("request", booking, db, env);
    return Response.json({ reference, emailSent: delivery.sent, voucherCode: voucher?.voucher.code ?? null, discountAmountCents: voucher?.discountAmountCents ?? 0, finalPriceCents: voucher?.finalPriceCents ?? originalPriceCents }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Die Buchung konnte nicht gespeichert werden.";
    return Response.json({ error: message }, { status: 500 });
  }
}
