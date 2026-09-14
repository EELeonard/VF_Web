import { bookingOperationalWindow, viennaLocalToUtc } from "./booking-time";
import { ensureBookingsDatabase } from "./bookings-db";

export const BOOKING_TIMES = ["09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"] as const;
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
  const activeBookings = await database.prepare("SELECT flight_start_at, duration FROM bookings WHERE simulator = ? AND status != 'cancelled' AND flight_start_at IS NOT NULL").bind(simulator).all<{ flight_start_at: string; duration: number }>();
  return slots.results.filter((slot) => {
    const candidate = bookingOperationalWindow(viennaLocalToUtc(slot.flight_date, slot.flight_time), duration);
    return !activeBookings.results.some((booking) => {
      const existing = bookingOperationalWindow(booking.flight_start_at, booking.duration);
      return existing.startsAt < candidate.endsAt && existing.endsAt > candidate.startsAt;
    });
  });
}
