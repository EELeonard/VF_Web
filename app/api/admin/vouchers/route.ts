import { env } from "cloudflare:workers";
import { isValidSession } from "../../../lib/admin-auth";
import { ensureVouchersDatabase, normalizeCustomerEmail, normalizeVoucherCode, type DiscountType, type VoucherRecord } from "../../../lib/vouchers-db";

function optionalPositiveInteger(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : Number.NaN;
}

function clean(body: Record<string, unknown>) {
  const discountType = body.discountType === "fixed" ? "fixed" : "percentage" as DiscountType;
  const rawValue = Number(body.discountValue);
  return {
    code: normalizeVoucherCode(String(body.code ?? "")),
    description: String(body.description ?? "").trim(),
    discountType,
    discountValue: discountType === "fixed" ? Math.round(rawValue * 100) : Math.round(rawValue),
    active: body.active === true,
    allowedEmail: body.allowedEmail ? normalizeCustomerEmail(String(body.allowedEmail)) : null,
    maxUses: optionalPositiveInteger(body.maxUses),
    maxUsesPerEmail: optionalPositiveInteger(body.maxUsesPerEmail),
    startsAt: body.startsAt ? String(body.startsAt) : null,
    endsAt: body.endsAt ? String(body.endsAt) : null,
  };
}

function invalid(voucher: ReturnType<typeof clean>) {
  return !/^[A-Z0-9_-]{3,40}$/.test(voucher.code) || voucher.description.length > 240 || !Number.isInteger(voucher.discountValue) || voucher.discountValue <= 0 || (voucher.discountType === "percentage" && voucher.discountValue > 100) || Number.isNaN(voucher.maxUses) || Number.isNaN(voucher.maxUsesPerEmail) || (voucher.allowedEmail !== null && !voucher.allowedEmail.includes("@")) || (voucher.startsAt && voucher.endsAt && voucher.startsAt >= voucher.endsAt);
}

async function authorized(request: Request) { return isValidSession(request, env.DB); }

export async function GET(request: Request) {
  if (!(await authorized(request))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const db = await ensureVouchersDatabase(env.DB);
  const result = await db.prepare("SELECT vouchers.*, COUNT(voucher_redemptions.id) AS redemption_count, GROUP_CONCAT(DISTINCT voucher_redemptions.customer_email) AS redemption_emails FROM vouchers LEFT JOIN voucher_redemptions ON voucher_redemptions.voucher_id = vouchers.id GROUP BY vouchers.id ORDER BY vouchers.created_at DESC, vouchers.id DESC").all<VoucherRecord>();
  return Response.json({ vouchers: result.results });
}

export async function POST(request: Request) {
  if (!(await authorized(request))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const voucher = clean(await request.json() as Record<string, unknown>);
  if (invalid(voucher)) return Response.json({ error: "Bitte prüfen Sie Code, Rabatt, E-Mail, Limits und Laufzeit." }, { status: 400 });
  const db = await ensureVouchersDatabase(env.DB);
  try {
    const result = await db.prepare("INSERT INTO vouchers (code, description, discount_type, discount_value, active, allowed_email, max_uses, max_uses_per_email, starts_at, ends_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(voucher.code, voucher.description, voucher.discountType, voucher.discountValue, voucher.active ? 1 : 0, voucher.allowedEmail, voucher.maxUses, voucher.maxUsesPerEmail, voucher.startsAt, voucher.endsAt).run();
    return Response.json({ created: true, id: result.meta.last_row_id }, { status: 201 });
  } catch { return Response.json({ error: "Dieser Gutscheincode ist bereits vorhanden." }, { status: 409 }); }
}

export async function PATCH(request: Request) {
  if (!(await authorized(request))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const id = Number(body.id);
  const voucher = clean(body);
  if (!Number.isInteger(id) || invalid(voucher)) return Response.json({ error: "Ungültige Gutscheinänderung." }, { status: 400 });
  const db = await ensureVouchersDatabase(env.DB);
  try {
    const result = await db.prepare("UPDATE vouchers SET code = ?, description = ?, discount_type = ?, discount_value = ?, active = ?, allowed_email = ?, max_uses = ?, max_uses_per_email = ?, starts_at = ?, ends_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(voucher.code, voucher.description, voucher.discountType, voucher.discountValue, voucher.active ? 1 : 0, voucher.allowedEmail, voucher.maxUses, voucher.maxUsesPerEmail, voucher.startsAt, voucher.endsAt, id).run();
    if (!result.meta.changes) return Response.json({ error: "Gutschein nicht gefunden." }, { status: 404 });
    return Response.json({ updated: true });
  } catch { return Response.json({ error: "Dieser Gutscheincode ist bereits vorhanden." }, { status: 409 }); }
}

export async function DELETE(request: Request) {
  if (!(await authorized(request))) return Response.json({ error: "Nicht autorisiert." }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return Response.json({ error: "Ungültiger Gutschein." }, { status: 400 });
  const db = await ensureVouchersDatabase(env.DB);
  const usage = await db.prepare("SELECT COUNT(*) AS count FROM voucher_redemptions WHERE voucher_id = ?").bind(id).first<{ count: number }>();
  if ((usage?.count ?? 0) > 0) return Response.json({ error: "Verwendete Gutscheine bleiben für die Nachvollziehbarkeit erhalten. Bitte deaktivieren Sie den Code." }, { status: 409 });
  await db.prepare("DELETE FROM vouchers WHERE id = ?").bind(id).run();
  return Response.json({ deleted: true });
}
