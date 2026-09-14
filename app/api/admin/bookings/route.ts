import { env } from "cloudflare:workers";
import { isValidSession } from "../../../lib/admin-auth";
import { BookingRecord, BookingStatus, ensureBookingsDatabase } from "../../../lib/bookings-db";
import { deliverBookingEmail } from "../../../lib/booking-notifications";
import { bookingWithInstructorSql, ensureInstructorDatabase } from "../../../lib/instructors-db";
import { isBookingTime, isSimulator } from "../../../lib/availability-db";
import { viennaLocalToUtc } from "../../../lib/booking-time";
import { simulators } from "../../../lib/site-data";
import { ensureVouchersDatabase, normalizeCustomerEmail, normalizeVoucherCode, validateVoucher } from "../../../lib/vouchers-db";

const statuses = new Set<BookingStatus>(["pending", "confirmed", "completed", "cancelled"]);

export async function GET(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const db = await ensureInstructorDatabase(env.DB);
  const result = await db.prepare(bookingWithInstructorSql + " ORDER BY b.flight_date ASC, b.flight_time ASC, b.created_at DESC").all<BookingRecord>();
  return Response.json({ bookings: result.results });
}

export async function POST(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const simulator = String(body.simulator ?? ""), duration = Number(body.duration), flightDate = String(body.date ?? ""), flightTime = String(body.time ?? ""), customerName = String(body.name ?? "").trim(), customerEmail = String(body.email ?? "").trim(), customerPhone = String(body.phone ?? "").trim(), remark = String(body.remark ?? "").trim(), internalNotes = String(body.internalNotes ?? "").trim(), voucherCode = normalizeVoucherCode(String(body.voucherCode ?? "")), language = body.language === "en" ? "en" : "de", status = body.status === "confirmed" ? "confirmed" : "pending", gift = body.gift === true ? 1 : 0, instructorMode = body.instructorMode === "none" ? "none" : "auto", requestedInstructorId = body.instructorId ? Number(body.instructorId) : null;
  if (!isSimulator(simulator) || ![30,60,90,120].includes(duration)) return Response.json({ error: "Ungültige Flugauswahl." }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(flightDate) || !isBookingTime(flightTime)) return Response.json({ error: "Ungültiger Termin." }, { status: 400 });
  if (!customerName || !customerEmail.includes("@") || !customerPhone || customerName.length > 160 || customerEmail.length > 254 || customerPhone.length > 80 || remark.length > 2000 || internalNotes.length > 4000) return Response.json({ error: "Bitte prüfen Sie die Kunden- und Buchungsdaten." }, { status: 400 });
  if (requestedInstructorId !== null && !Number.isInteger(requestedInstructorId)) return Response.json({ error: "Ungültiger Instructor." }, { status: 400 });
  const flightStartAt = viennaLocalToUtc(flightDate, flightTime), candidateEndAt = new Date(new Date(flightStartAt).getTime() + duration * 60_000).toISOString();
  if (new Date(flightStartAt).getTime() <= Date.now()) return Response.json({ error: "Bitte wählen Sie einen zukünftigen Termin." }, { status: 400 });
  const db = await ensureInstructorDatabase(env.DB);
  if (await db.prepare("SELECT id FROM bookings WHERE simulator=? AND status!='cancelled' AND flight_start_at<? AND datetime(flight_start_at,'+'||duration||' minutes')>?").bind(simulator,candidateEndAt,flightStartAt).first()) return Response.json({ error: "Der Simulator ist in diesem Zeitraum bereits gebucht." }, { status: 409 });
  const simulatorData = simulators.find(item => item.name === simulator), originalPriceCents = (simulatorData?.prices[duration] ?? 0) * 100;
  if (!originalPriceCents) return Response.json({ error: "Für diese Auswahl konnte kein Preis ermittelt werden." }, { status: 400 });
  const normalizedEmail = normalizeCustomerEmail(customerEmail), voucher = voucherCode ? await validateVoucher(db,voucherCode,normalizedEmail,originalPriceCents) : null;
  if (voucherCode && !voucher) return Response.json({ error: "Dieser Gutscheincode ist für die Buchung nicht gültig." }, { status: 400 });
  let instructorId = requestedInstructorId, assignmentSource: "booking" | "day" | null = requestedInstructorId ? "booking" : null;
  if (instructorId !== null) {
    const instructor = await db.prepare("SELECT i.id,r.available_from,r.available_until FROM instructors i JOIN instructor_capabilities c ON c.instructor_id=i.id AND c.simulator=? JOIN instructor_availability_ranges r ON r.instructor_id=i.id AND r.available_date=? WHERE i.id=? AND i.active=1").bind(simulator,flightDate,instructorId).first<{id:number;available_from:string;available_until:string}>();
    const toMinutes=(value:string)=>{const [hours,minutes]=value.split(":").map(Number);return hours*60+minutes;};
    if (!instructor || toMinutes(flightTime)<toMinutes(instructor.available_from) || toMinutes(flightTime)+duration>toMinutes(instructor.available_until)+1) return Response.json({ error: "Der Instructor ist für diesen Termin nicht verfügbar oder nicht freigeschaltet." }, { status: 409 });
    if (await db.prepare("SELECT id FROM bookings WHERE instructor_id=? AND status!='cancelled' AND flight_start_at<? AND datetime(flight_start_at,'+'||duration||' minutes')>?").bind(instructorId,candidateEndAt,flightStartAt).first()) return Response.json({ error: "Der Instructor ist in diesem Zeitraum bereits eingeplant." }, { status: 409 });
  } else if (instructorMode === "auto") {
    const dayAssignment = await db.prepare("SELECT a.instructor_id,r.available_from,r.available_until FROM instructor_day_assignments a JOIN instructor_availability_ranges r ON r.instructor_id=a.instructor_id AND r.available_date=a.flight_date WHERE a.simulator=? AND a.flight_date=?").bind(simulator,flightDate).first<{instructor_id:number;available_from:string;available_until:string}>();
    if(dayAssignment){const toMinutes=(value:string)=>{const [hours,minutes]=value.split(":").map(Number);return hours*60+minutes;};if(toMinutes(flightTime)>=toMinutes(dayAssignment.available_from)&&toMinutes(flightTime)+duration<=toMinutes(dayAssignment.available_until)+1){const conflict=await db.prepare("SELECT id FROM bookings WHERE instructor_id=? AND status!='cancelled' AND flight_start_at<? AND datetime(flight_start_at,'+'||duration||' minutes')>?").bind(dayAssignment.instructor_id,candidateEndAt,flightStartAt).first();if(!conflict){instructorId=dayAssignment.instructor_id;assignmentSource="day";}}}
  }
  const reference = "VF-" + new Date().getFullYear() + "-" + crypto.randomUUID().slice(0,6).toUpperCase(), discountAmountCents = voucher?.discountAmountCents ?? 0, finalPriceCents = voucher?.finalPriceCents ?? originalPriceCents;
  const insert = await db.prepare("INSERT INTO bookings (reference,simulator,duration,flight_date,flight_time,flight_start_at,gift,customer_name,customer_email,customer_phone,remark,language,status,voucher_code,original_price_cents,discount_amount_cents,final_price_cents,internal_notes,instructor_id,instructor_assignment_source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(reference,simulator,duration,flightDate,flightTime,flightStartAt,gift,customerName,customerEmail,customerPhone,remark,language,status,voucher?.voucher.code??null,originalPriceCents,discountAmountCents,finalPriceCents,internalNotes,instructorId,assignmentSource).run();
  if (voucher) { await ensureVouchersDatabase(db); await db.prepare("INSERT INTO voucher_redemptions (voucher_id,booking_id,customer_email) VALUES (?,?,?)").bind(voucher.voucher.id,insert.meta.last_row_id,normalizedEmail).run(); }
  const booking = await db.prepare("SELECT * FROM bookings WHERE id=?").bind(insert.meta.last_row_id).first<BookingRecord>();
  if (!booking) return Response.json({ error: "Die Buchung konnte nicht geladen werden." }, { status: 500 });
  const delivery = await deliverBookingEmail(status === "confirmed" ? "confirmation" : "request",booking,db,env);
  return Response.json({ created:true,id:booking.id,reference,emailSent:delivery.sent }, { status:201 });
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
