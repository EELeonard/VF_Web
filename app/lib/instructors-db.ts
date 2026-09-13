import { ensureBookingsDatabase } from "./bookings-db";

export type Instructor = { id:number; name:string; email:string; username:string|null; active:number; created_at:string; updated_at:string; capabilities?:string[]; availability?:Array<{instructor_id:number;available_date:string;available_time:string}> };
export type InstructorDayAssignment = { id:number; instructor_id:number; instructor_name:string; simulator:string; flight_date:string; created_at:string };

export async function ensureInstructorDatabase(database: D1Database) {
  const db = await ensureBookingsDatabase(database);
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS instructors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_instructors_email ON instructors(email)"),
    db.prepare("CREATE TABLE IF NOT EXISTS instructor_day_assignments (id INTEGER PRIMARY KEY AUTOINCREMENT, instructor_id INTEGER NOT NULL REFERENCES instructors(id), simulator TEXT NOT NULL, flight_date TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_instructor_day_simulator_date ON instructor_day_assignments(simulator, flight_date)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_instructor_day_instructor_date ON instructor_day_assignments(instructor_id, flight_date)"),
    db.prepare("CREATE TABLE IF NOT EXISTS instructor_capabilities (instructor_id INTEGER NOT NULL REFERENCES instructors(id), simulator TEXT NOT NULL)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_instructor_capability_unique ON instructor_capabilities(instructor_id, simulator)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_instructor_capability_simulator ON instructor_capabilities(simulator)"),
    db.prepare("CREATE TABLE IF NOT EXISTS instructor_availability (id INTEGER PRIMARY KEY AUTOINCREMENT, instructor_id INTEGER NOT NULL REFERENCES instructors(id), available_date TEXT NOT NULL, available_time TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_instructor_availability_unique ON instructor_availability(instructor_id, available_date, available_time)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_instructor_availability_month ON instructor_availability(instructor_id, available_date)"),
    db.prepare("CREATE TABLE IF NOT EXISTS instructor_availability_ranges (id INTEGER PRIMARY KEY AUTOINCREMENT, instructor_id INTEGER NOT NULL REFERENCES instructors(id), available_date TEXT NOT NULL, available_from TEXT NOT NULL, available_until TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_instructor_availability_range_unique ON instructor_availability_ranges(instructor_id, available_date)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_instructor_availability_range_date ON instructor_availability_ranges(available_date)"),
  ]);
  const columns=await db.prepare("PRAGMA table_info(instructors)").all<{name:string}>(),names=new Set(columns.results.map(column=>column.name));
  if(!names.has("username"))await db.prepare("ALTER TABLE instructors ADD COLUMN username TEXT").run();
  if(!names.has("password_hash"))await db.prepare("ALTER TABLE instructors ADD COLUMN password_hash TEXT").run();
  if(!names.has("password_salt"))await db.prepare("ALTER TABLE instructors ADD COLUMN password_salt TEXT").run();
  await db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_instructors_username ON instructors(username) WHERE username IS NOT NULL").run();
  await db.prepare("PRAGMA optimize").run();
  return db;
}

export const bookingWithInstructorSql = "SELECT b.*, i.name AS instructor_name FROM bookings b LEFT JOIN instructors i ON i.id = b.instructor_id";
