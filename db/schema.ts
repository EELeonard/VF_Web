import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: text("reference").notNull(),
  simulator: text("simulator").notNull(),
  duration: integer("duration").notNull(),
  flightDate: text("flight_date").notNull(),
  flightTime: text("flight_time").notNull(),
  flightStartAt: text("flight_start_at"),
  gift: integer("gift", { mode: "boolean" }).notNull().default(false),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  remark: text("remark").notNull().default(""),
  language: text("language", { enum: ["de", "en"] }).notNull().default("de"),
  status: text("status", { enum: ["pending", "confirmed", "completed", "cancelled"] }).notNull().default("pending"),
  requestEmailSentAt: text("request_email_sent_at"),
  confirmationEmailSentAt: text("confirmation_email_sent_at"),
  reminderEmailSentAt: text("reminder_email_sent_at"),
  emailError: text("email_error"),
  voucherCode: text("voucher_code"),
  originalPriceCents: integer("original_price_cents"),
  discountAmountCents: integer("discount_amount_cents").notNull().default(0),
  finalPriceCents: integer("final_price_cents"),
  internalNotes: text("internal_notes").notNull().default(""),
  proposedDate: text("proposed_date"),
  proposedTime: text("proposed_time"),
  createdAt: text("created_at").notNull().default(sql.raw("CURRENT_TIMESTAMP")),
}, (table) => [
  uniqueIndex("idx_bookings_reference").on(table.reference),
  index("idx_bookings_flight_date").on(table.flightDate),
  index("idx_bookings_status").on(table.status),
  index("idx_bookings_reminder_due").on(table.status, table.flightStartAt),
]);

export const appointmentSlots = sqliteTable("appointment_slots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  simulator: text("simulator").notNull(),
  flightDate: text("flight_date").notNull(),
  flightTime: text("flight_time").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  updatedAt: text("updated_at").notNull().default(sql.raw("CURRENT_TIMESTAMP")),
}, (table) => [
  uniqueIndex("idx_appointment_slots_unique").on(table.simulator, table.flightDate, table.flightTime),
  index("idx_appointment_slots_month").on(table.simulator, table.flightDate, table.enabled),
]);

export const newsPosts = sqliteTable("news_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  titleDe: text("title_de").notNull(),
  titleEn: text("title_en").notNull(),
  excerptDe: text("excerpt_de").notNull(),
  excerptEn: text("excerpt_en").notNull(),
  linkUrl: text("link_url").notNull().default("/buchen"),
  linkLabelDe: text("link_label_de").notNull().default("Mehr erfahren"),
  linkLabelEn: text("link_label_en").notNull().default("Learn more"),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  createdAt: text("created_at").notNull().default(sql.raw("CURRENT_TIMESTAMP")),
  updatedAt: text("updated_at").notNull().default(sql.raw("CURRENT_TIMESTAMP")),
}, (table) => [
  index("idx_news_posts_publication").on(table.status, table.startsAt, table.endsAt),
]);

export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql.raw("CURRENT_TIMESTAMP")),
  updatedAt: text("updated_at").notNull().default(sql.raw("CURRENT_TIMESTAMP")),
}, (table) => [
  uniqueIndex("idx_admin_users_username").on(table.username),
]);

export const vouchers = sqliteTable("vouchers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  description: text("description").notNull().default(""),
  discountType: text("discount_type", { enum: ["percentage", "fixed"] }).notNull().default("percentage"),
  discountValue: integer("discount_value").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  allowedEmail: text("allowed_email"),
  maxUses: integer("max_uses"),
  maxUsesPerEmail: integer("max_uses_per_email"),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  createdAt: text("created_at").notNull().default(sql.raw("CURRENT_TIMESTAMP")),
  updatedAt: text("updated_at").notNull().default(sql.raw("CURRENT_TIMESTAMP")),
}, (table) => [
  uniqueIndex("idx_vouchers_code").on(table.code),
  index("idx_vouchers_active_period").on(table.active, table.startsAt, table.endsAt),
]);

export const voucherRedemptions = sqliteTable("voucher_redemptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  voucherId: integer("voucher_id").notNull().references(() => vouchers.id),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  customerEmail: text("customer_email").notNull(),
  redeemedAt: text("redeemed_at").notNull().default(sql.raw("CURRENT_TIMESTAMP")),
}, (table) => [
  uniqueIndex("idx_voucher_redemptions_booking").on(table.bookingId),
  index("idx_voucher_redemptions_voucher_email").on(table.voucherId, table.customerEmail),
]);

export const bookingCommunications = sqliteTable("booking_communications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  bookingId: integer("booking_id").notNull().references(() => bookings.id),
  direction: text("direction", { enum: ["inbound", "outbound"] }).notNull(),
  kind: text("kind").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  fromEmail: text("from_email").notNull(),
  toEmail: text("to_email").notNull(),
  deliveryStatus: text("delivery_status", { enum: ["sent", "failed", "received"] }).notNull(),
  providerId: text("provider_id"),
  sentAt: text("sent_at").notNull().default(sql.raw("CURRENT_TIMESTAMP")),
  createdAt: text("created_at").notNull().default(sql.raw("CURRENT_TIMESTAMP")),
}, (table) => [
  index("idx_booking_communications_booking_sent").on(table.bookingId, table.sentAt),
]);
