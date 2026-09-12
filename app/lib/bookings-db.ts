import { viennaLocalToUtc } from "./booking-time";

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type BookingRecord = {
  id: number;
  reference: string;
  simulator: string;
  duration: number;
  flight_date: string;
  flight_time: string;
  flight_start_at: string | null;
  gift: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  remark: string;
  language: "de" | "en";
  status: BookingStatus;
  request_email_sent_at: string | null;
  confirmation_email_sent_at: string | null;
  reminder_email_sent_at: string | null;
  email_error: string | null;
  voucher_code: string | null;
  original_price_cents: number | null;
  discount_amount_cents: number;
  final_price_cents: number | null;
  internal_notes: string;
  proposed_date: string | null;
  proposed_time: string | null;
  created_at: string;
};

const addedColumns: Array<[string, string]> = [
  ["flight_start_at", "TEXT"],
  ["remark", "TEXT NOT NULL DEFAULT ''"],
  ["language", "TEXT NOT NULL DEFAULT 'de'"],
  ["request_email_sent_at", "TEXT"],
  ["confirmation_email_sent_at", "TEXT"],
  ["reminder_email_sent_at", "TEXT"],
  ["email_error", "TEXT"],
  ["voucher_code", "TEXT"],
  ["original_price_cents", "INTEGER"],
  ["discount_amount_cents", "INTEGER NOT NULL DEFAULT 0"],
  ["final_price_cents", "INTEGER"],
  ["internal_notes", "TEXT NOT NULL DEFAULT ''"],
  ["proposed_date", "TEXT"],
  ["proposed_time", "TEXT"],
];

export async function ensureBookingsDatabase(database: D1Database) {
  const db = database;
  if (!db) throw new Error("Booking database is unavailable.");
  await db.prepare("CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, reference TEXT NOT NULL UNIQUE, simulator TEXT NOT NULL, duration INTEGER NOT NULL, flight_date TEXT NOT NULL, flight_time TEXT NOT NULL, flight_start_at TEXT, gift INTEGER NOT NULL DEFAULT 0, customer_name TEXT NOT NULL, customer_email TEXT NOT NULL, customer_phone TEXT NOT NULL, remark TEXT NOT NULL DEFAULT '', language TEXT NOT NULL DEFAULT 'de', status TEXT NOT NULL DEFAULT 'pending', request_email_sent_at TEXT, confirmation_email_sent_at TEXT, reminder_email_sent_at TEXT, email_error TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();
  const columns = await db.prepare("PRAGMA table_info(bookings)").all<{ name: string }>();
  const names = new Set(columns.results.map((column) => column.name));
  for (const [name, definition] of addedColumns) {
    if (!names.has(name)) await db.prepare(`ALTER TABLE bookings ADD COLUMN ${name} ${definition}`).run();
  }
  const legacyBookings = await db.prepare("SELECT id, flight_date, flight_time FROM bookings WHERE flight_start_at IS NULL").all<{ id: number; flight_date: string; flight_time: string }>();
  for (const booking of legacyBookings.results) {
    const flightStartAt = viennaLocalToUtc(booking.flight_date, booking.flight_time);
    await db.prepare("UPDATE bookings SET flight_start_at = ? WHERE id = ? AND flight_start_at IS NULL").bind(flightStartAt, booking.id).run();
  }
  await db.batch([
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(reference)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_bookings_flight_date ON bookings(flight_date)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_bookings_reminder_due ON bookings(status, flight_start_at)"),
  ]);
  return db;
}
