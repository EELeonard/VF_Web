export type CustomerRecord = {
  id: number;
  email: string;
  name: string;
  phone: string;
  notes: string;
  booking_count: number;
  first_booking_at: string;
  last_booking_at: string;
  created_at: string;
  updated_at: string;
};

async function ensureCustomerTable(database: D1Database) {
  await database.batch([
    database.prepare("CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', first_booking_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, last_booking_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email ON customers(email)"),
    database.prepare("CREATE INDEX IF NOT EXISTS idx_customers_last_booking ON customers(last_booking_at)"),
  ]);
  return database;
}

export async function ensureCustomersDatabase(database: D1Database) {
  const db = await ensureCustomerTable(database);
  await db.prepare("INSERT INTO customers (email, name, phone, first_booking_at, last_booking_at) SELECT lower(trim(customer_email)), max(customer_name), max(customer_phone), min(created_at), max(created_at) FROM bookings WHERE trim(customer_email) != '' GROUP BY lower(trim(customer_email)) ON CONFLICT(email) DO UPDATE SET name=excluded.name, phone=excluded.phone, first_booking_at=min(customers.first_booking_at, excluded.first_booking_at), last_booking_at=max(customers.last_booking_at, excluded.last_booking_at), updated_at=CURRENT_TIMESTAMP").run();
  return db;
}

export async function saveCustomerFromBooking(database: D1Database, customer: { email: string; name: string; phone: string; bookedAt?: string }) {
  const db = await ensureCustomerTable(database);
  const email = customer.email.trim().toLowerCase();
  const bookedAt = customer.bookedAt ?? new Date().toISOString();
  await db.prepare("INSERT INTO customers (email, name, phone, first_booking_at, last_booking_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET name=excluded.name, phone=excluded.phone, last_booking_at=excluded.last_booking_at, updated_at=CURRENT_TIMESTAMP").bind(email, customer.name.trim(), customer.phone.trim(), bookedAt, bookedAt).run();
}
