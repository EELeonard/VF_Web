import { env } from "cloudflare:workers";
import { isValidSession } from "../../../lib/admin-auth";
import { BOOKING_TIMES, ensureAvailabilityDatabase, isBookingTime, isSimulator, type AppointmentSlot } from "../../../lib/availability-db";

export async function GET(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const url = new URL(request.url);
  const simulator = url.searchParams.get("simulator") ?? "";
  const month = url.searchParams.get("month") ?? "";
  if (!isSimulator(simulator) || !/^\d{4}-\d{2}$/.test(month)) return Response.json({ error: "Ungültige Auswahl." }, { status: 400 });
  const db = await ensureAvailabilityDatabase(env.DB);
  const result = await db.prepare("SELECT id, simulator, flight_date, flight_time, enabled, updated_at FROM appointment_slots WHERE simulator = ? AND substr(flight_date, 1, 7) = ? ORDER BY flight_date, flight_time").bind(simulator, month).all<AppointmentSlot>();
  return Response.json({ slots: result.results });
}

export async function PUT(request: Request) {
  if (!(await isValidSession(request, env.DB))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const body = await request.json() as { simulator?: string; date?: string; time?: string; enabled?: boolean; all?: boolean };
  const simulator = String(body.simulator ?? "");
  const flightDate = String(body.date ?? "");
  const flightTime = String(body.time ?? "");
  if (!isSimulator(simulator) || !/^\d{4}-\d{2}-\d{2}$/.test(flightDate) || typeof body.enabled !== "boolean" || (body.all !== true && !isBookingTime(flightTime))) {
    return Response.json({ error: "Ungültige Terminfreigabe." }, { status: 400 });
  }
  const db = await ensureAvailabilityDatabase(env.DB);
  if (body.all === true) {
    await db.batch(BOOKING_TIMES.map((time) => db.prepare("INSERT INTO appointment_slots (simulator, flight_date, flight_time, enabled, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(simulator, flight_date, flight_time) DO UPDATE SET enabled = excluded.enabled, updated_at = CURRENT_TIMESTAMP").bind(simulator, flightDate, time, body.enabled ? 1 : 0)));
    return Response.json({ updated: true, enabled: body.enabled, count: BOOKING_TIMES.length });
  }
  await db.prepare("INSERT INTO appointment_slots (simulator, flight_date, flight_time, enabled, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(simulator, flight_date, flight_time) DO UPDATE SET enabled = excluded.enabled, updated_at = CURRENT_TIMESTAMP").bind(simulator, flightDate, flightTime, body.enabled ? 1 : 0).run();
  return Response.json({ updated: true, enabled: body.enabled });
}
