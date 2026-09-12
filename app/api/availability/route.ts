import { env } from "cloudflare:workers";
import { availableSlotsForMonth, ensureAvailabilityDatabase, isSimulator } from "../../lib/availability-db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const simulator = url.searchParams.get("simulator") ?? "";
  const month = url.searchParams.get("month") ?? "";
  const duration = Number(url.searchParams.get("duration"));
  if (!isSimulator(simulator) || !/^\d{4}-\d{2}$/.test(month) || ![30, 60, 90, 120].includes(duration)) {
    return Response.json({ error: "Ungültige Verfügbarkeitsabfrage." }, { status: 400 });
  }
  const db = await ensureAvailabilityDatabase(env.DB);
  const slots = await availableSlotsForMonth(db, simulator, month, duration);
  return Response.json({ slots: slots.map((slot) => ({ date: slot.flight_date, time: slot.flight_time })) });
}
