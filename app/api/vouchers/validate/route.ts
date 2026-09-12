import { env } from "cloudflare:workers";
import { simulators } from "../../../lib/site-data";
import { validateVoucher } from "../../../lib/vouchers-db";

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const code = String(body.code ?? "");
  const email = String(body.email ?? "");
  const simulatorName = String(body.simulator ?? "");
  const duration = Number(body.duration);
  const language = body.language === "en" ? "en" : "de";
  const simulator = simulators.find((item) => item.name === simulatorName);
  const price = simulator?.prices[duration];
  if (!code.trim() || !email.includes("@") || !price) return Response.json({ error: language === "en" ? "Enter a valid code and email address." : "Bitte geben Sie einen gültigen Code und eine E-Mail-Adresse ein." }, { status: 400 });
  const validation = await validateVoucher(env.DB, code, email, price * 100);
  if (!validation) return Response.json({ error: language === "en" ? "This voucher is invalid, expired or has reached its usage limit." : "Dieser Gutscheincode ist ungültig, abgelaufen oder hat sein Nutzungslimit erreicht." }, { status: 404 });
  return Response.json({ valid: true, code: validation.voucher.code, description: validation.voucher.description, discountAmountCents: validation.discountAmountCents, finalPriceCents: validation.finalPriceCents });
}
