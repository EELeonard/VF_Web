import { ensureBookingsDatabase } from "./bookings-db";

export type DiscountType = "percentage" | "fixed";

export type VoucherRecord = {
  id: number;
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: number;
  active: number;
  allowed_email: string | null;
  max_uses: number | null;
  max_uses_per_email: number | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  redemption_count?: number;
  redemption_emails?: string | null;
};

export type VoucherValidation = {
  voucher: VoucherRecord;
  discountAmountCents: number;
  finalPriceCents: number;
};

export function normalizeVoucherCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function normalizeCustomerEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function ensureVouchersDatabase(database: D1Database) {
  if (!database) throw new Error("Voucher database is unavailable.");
  await ensureBookingsDatabase(database);
  await database.batch([
    database.prepare("CREATE TABLE IF NOT EXISTS vouchers (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', discount_type TEXT NOT NULL DEFAULT 'percentage', discount_value INTEGER NOT NULL, active INTEGER NOT NULL DEFAULT 1, allowed_email TEXT, max_uses INTEGER, max_uses_per_email INTEGER, starts_at TEXT, ends_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code)"),
    database.prepare("CREATE INDEX IF NOT EXISTS idx_vouchers_active_period ON vouchers(active, starts_at, ends_at)"),
    database.prepare("CREATE TABLE IF NOT EXISTS voucher_redemptions (id INTEGER PRIMARY KEY AUTOINCREMENT, voucher_id INTEGER NOT NULL, booking_id INTEGER NOT NULL, customer_email TEXT NOT NULL, redeemed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (voucher_id) REFERENCES vouchers(id), FOREIGN KEY (booking_id) REFERENCES bookings(id))"),
    database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_voucher_redemptions_booking ON voucher_redemptions(booking_id)"),
    database.prepare("CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_voucher_email ON voucher_redemptions(voucher_id, customer_email)"),
  ]);
  await database.prepare("PRAGMA optimize").run();
  return database;
}

export async function validateVoucher(database: D1Database, rawCode: string, rawEmail: string, originalPriceCents: number): Promise<VoucherValidation | null> {
  const code = normalizeVoucherCode(rawCode);
  const email = normalizeCustomerEmail(rawEmail);
  if (!code || !email) return null;
  const db = await ensureVouchersDatabase(database);
  const voucher = await db.prepare("SELECT * FROM vouchers WHERE code = ? AND active = 1 AND (starts_at IS NULL OR datetime(starts_at) <= datetime('now')) AND (ends_at IS NULL OR datetime(ends_at) >= datetime('now')) AND (allowed_email IS NULL OR lower(allowed_email) = ?) AND (max_uses IS NULL OR (SELECT COUNT(*) FROM voucher_redemptions WHERE voucher_id = vouchers.id) < max_uses) AND (max_uses_per_email IS NULL OR (SELECT COUNT(*) FROM voucher_redemptions WHERE voucher_id = vouchers.id AND customer_email = ?) < max_uses_per_email)")
    .bind(code, email, email).first<VoucherRecord>();
  if (!voucher) return null;
  const discountAmountCents = Math.min(originalPriceCents, voucher.discount_type === "percentage" ? Math.round(originalPriceCents * voucher.discount_value / 100) : voucher.discount_value);
  return { voucher, discountAmountCents, finalPriceCents: originalPriceCents - discountAmountCents };
}
