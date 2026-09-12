import { viennaLocalToUtc } from "./booking-time";
import { ensureBookingsDatabase } from "./bookings-db";

export const BOOKING_TIMES = ["09:30", "11:00", "12:30", "14:00", "15:30", "17:00", "18:30"] as const;
export const SIMULATOR_NAMES = ["Airbus A320", "Boeing 787", "Bell 206", "Eurofighter"] as const;

export type AppointmentSlot = {
  id: number;
  simulator: string;
  flight_date: string;
  flight_time: string;
  enabled: number;
  updated_at: string;
};

export function isSimulator(value: string) {
  return (SIMULATOR_NAMES as readonly string[]).includes(value);
}

export function isBookingTime(value: string) {
  return (BOOKING_TIMES as readonly string[]).includes(value);
}

export async function ensureAvailabilityDatabase(database: D1Database) {
  await ensureBookingsDatabase(database);
  await database.prepare("CREATE TABLE IF NOT EXISTS appointment_slots (id INTEGER PRIMARY KEY AUTOINCREMENT, simulator TEXT NOT NULL, flight_date TEXT NOT NULL, flight_time TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  await database.batch([
    database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_appointment_slots_unique ON appointment_slots(simulator, flight_date, flight_time)"),
    database.prepare("CREATE INDEX IF NOT EXISTS idx_appointment_slots_month ON appointment_slots(simulator, flight_date, enabled)"),
  ]);
  await database.prepare("PRAGMA optimize").run();
  return database;
}

export async function availableSlotsForMonth(database: D1Database, simulator: string, month: string, duration: number) {
  const slots = await database.prepare("SELECT id, simulator, flight_date, flight_time, enabled, updated_at FROM appointment_slots WHERE simulator = ? AND enabled = 1 AND substr(flight_date, 1, 7) = ? ORDER BY flight_date, flight_time").bind(simulator, month).all<AppointmentSlot>();
  const activeBookings = await database.prepare("SELECT flight_start_at, duration FROM bookings WHERE simulator = ? AND status != 'cancelled' AND substr(flight_date, 1, 7) IN (?, ?) AND flight_start_at IS NOT NULL").bind(simulator, month, nextMonth(month)).all<{ flight_start_at: string; duration: number }>();
  return slots.results.filter((slot) => {
    const start = new Date(viennaLocalToUtc(slot.flight_date, slot.flight_time)).getTime();
    const end = start + duration * 60_000;
    return !activeBookings.results.some((booking) => {
      const bookedStart = new Date(booking.flight_start_at).getTime();
      const bookedEnd = bookedStart + booking.duration * 60_000;
      return bookedStart < end && bookedEnd > start;
    });
  });
}

function nextMonth(month: string) {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, number, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
