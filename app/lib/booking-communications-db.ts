import { ensureBookingsDatabase } from "./bookings-db";

export type BookingCommunication = {
  id: number; booking_id: number; direction: "inbound" | "outbound"; kind: string;
  subject: string; body: string; from_email: string; to_email: string;
  delivery_status: "sent" | "failed" | "received"; provider_id: string | null; sent_at: string; created_at: string;
};

export async function ensureCommunicationsDatabase(database: D1Database) {
  await ensureBookingsDatabase(database);
  await database.batch([
    database.prepare("CREATE TABLE IF NOT EXISTS booking_communications (id INTEGER PRIMARY KEY AUTOINCREMENT, booking_id INTEGER NOT NULL, direction TEXT NOT NULL, kind TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, from_email TEXT NOT NULL, to_email TEXT NOT NULL, delivery_status TEXT NOT NULL, provider_id TEXT, sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (booking_id) REFERENCES bookings(id))"),
    database.prepare("CREATE INDEX IF NOT EXISTS idx_booking_communications_booking_sent ON booking_communications(booking_id, sent_at)"),
  ]);
  await database.batch([
    database.prepare("INSERT INTO booking_communications (booking_id, direction, kind, subject, body, from_email, to_email, delivery_status, sent_at) SELECT id, 'outbound', 'request', 'Buchungsanfrage ' || reference, 'Historischer Versandstatus der Buchungsanfrage.', 'Vienna Flight', customer_email, 'sent', request_email_sent_at FROM bookings b WHERE request_email_sent_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM booking_communications c WHERE c.booking_id = b.id AND c.kind = 'request' AND c.sent_at = b.request_email_sent_at)"),
    database.prepare("INSERT INTO booking_communications (booking_id, direction, kind, subject, body, from_email, to_email, delivery_status, sent_at) SELECT id, 'outbound', 'confirmation', 'Buchungsbestätigung ' || reference, 'Historischer Versandstatus der Buchungsbestätigung.', 'Vienna Flight', customer_email, 'sent', confirmation_email_sent_at FROM bookings b WHERE confirmation_email_sent_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM booking_communications c WHERE c.booking_id = b.id AND c.kind = 'confirmation' AND c.sent_at = b.confirmation_email_sent_at)"),
    database.prepare("INSERT INTO booking_communications (booking_id, direction, kind, subject, body, from_email, to_email, delivery_status, sent_at) SELECT id, 'outbound', 'reminder', 'Terminerinnerung ' || reference, 'Historischer Versandstatus der Terminerinnerung.', 'Vienna Flight', customer_email, 'sent', reminder_email_sent_at FROM bookings b WHERE reminder_email_sent_at IS NOT NULL AND NOT EXISTS (SELECT 1 FROM booking_communications c WHERE c.booking_id = b.id AND c.kind = 'reminder' AND c.sent_at = b.reminder_email_sent_at)"),
  ]);
  await database.prepare("PRAGMA optimize").run();
  return database;
}

export async function recordCommunication(database: D1Database, entry: Omit<BookingCommunication, "id" | "created_at">) {
  const db = await ensureCommunicationsDatabase(database);
  await db.prepare("INSERT INTO booking_communications (booking_id, direction, kind, subject, body, from_email, to_email, delivery_status, provider_id, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(entry.booking_id, entry.direction, entry.kind, entry.subject, entry.body, entry.from_email, entry.to_email, entry.delivery_status, entry.provider_id, entry.sent_at).run();
}
