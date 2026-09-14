import type { BookingRecord } from "./bookings-db";
import { formatDateNumeric } from "./date-format";

export type EmailEnvironment = {
  RESEND_API_KEY?: string;
  BOOKING_EMAIL_FROM?: string;
  BOOKING_REPLY_TO?: string;
};

export type EmailKind = "request" | "confirmation" | "reminder";

export type EmailResult = { sent: true; sentAt: string } | { sent: false; error: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function formatDate(date: string, language: "de" | "en") {
  void language;
  return formatDateNumeric(date);
}

function contentFor(kind: EmailKind, booking: BookingRecord) {
  const language = booking.language === "en" ? "en" : "de";
  if (booking.gift) {
    if (language === "en") return kind === "confirmation"
      ? { subject: `Gift voucher confirmed: ${booking.reference}`, heading: "Your gift voucher is confirmed", intro: "We are pleased to confirm your gift voucher order." }
      : { subject: `Your gift voucher request: ${booking.reference}`, heading: "We have received your gift voucher request", intro: "We have received your gift voucher request and will process it shortly." };
    return kind === "confirmation"
      ? { subject: `Geschenkgutschein bestätigt: ${booking.reference}`, heading: "Ihr Geschenkgutschein ist bestätigt", intro: "Wir freuen uns, Ihre Geschenkgutschein-Bestellung zu bestätigen." }
      : { subject: `Ihre Gutscheinanfrage: ${booking.reference}`, heading: "Ihre Gutscheinanfrage ist eingegangen", intro: "Wir haben Ihre Geschenkgutschein-Anfrage erhalten und bearbeiten sie in Kürze." };
  }
  const date = formatDate(booking.flight_date, language);
  if (language === "en") {
    if (kind === "confirmation") return {
      subject: `Booking confirmed: ${booking.reference}`,
      heading: "Your flight appointment is confirmed",
      intro: `We are pleased to confirm your appointment on ${date} at ${booking.flight_time}. Please arrive no more than 15 minutes before your appointment. Please only attend if you have no symptoms of a cold or any other illness.`,
    };
    if (kind === "reminder") return {
      subject: `Your flight is tomorrow: ${booking.reference}`,
      heading: "Tomorrow you take off",
      intro: `Your flight experience starts in approximately 24 hours, on ${date} at ${booking.flight_time}.`,
    };
    return {
      subject: `Your booking request: ${booking.reference}`,
      heading: "We have received your request",
      intro: `We have received your preferred appointment for ${date} at ${booking.flight_time} and will review it. Your request is not yet binding.`,
    };
  }
  if (kind === "confirmation") return {
    subject: `Buchung bestätigt: ${booking.reference}`,
    heading: "Ihr Flugtermin ist bestätigt",
    intro: `Wir freuen uns, Ihren Termin am ${date} um ${booking.flight_time} Uhr verbindlich zu bestätigen. Bitte kommen Sie maximal 15 Minuten vor Ihrem Termin zu uns. Bitte nehmen Sie den Termin nur wahr, wenn Sie keine Symptome einer Erkältung oder einer anderen Krankheit haben.`,
  };
  if (kind === "reminder") return {
    subject: `Erinnerung an Ihren Flug morgen: ${booking.reference}`,
    heading: "Morgen heben Sie ab",
    intro: `In rund 24 Stunden beginnt Ihr Flugerlebnis am ${date} um ${booking.flight_time} Uhr.`,
  };
  return {
    subject: `Ihre Buchungsanfrage: ${booking.reference}`,
    heading: "Ihre Anfrage ist bei uns eingegangen",
    intro: `Wir haben Ihren Terminwunsch für ${date} um ${booking.flight_time} Uhr erhalten und prüfen die Verfügbarkeit. Die Anfrage ist noch nicht verbindlich.`,
  };
}

export function bookingEmailSummary(kind: EmailKind, booking: BookingRecord) {
  const content = contentFor(kind, booking);
  const english = booking.language === "en";
  const details = [
    `${english ? "Reference" : "Referenz"}: ${booking.reference}`,
    `Simulator: ${booking.simulator}`,
    ...(booking.gift ? [] : [`${english ? "Appointment" : "Termin"}: ${formatDate(booking.flight_date, english ? "en" : "de")}, ${booking.flight_time}${english ? "" : " Uhr"}`]),
    `${english ? "Flight duration" : "Flugdauer"}: ${booking.duration} ${english ? "minutes" : "Minuten"}`,
    ...(booking.voucher_code ? [`${english ? "Voucher code" : "Gutscheincode"}: ${booking.voucher_code}`] : []),
    ...(booking.remark ? [`${english ? "Booking note" : "Anmerkung"}: ${booking.remark}`] : []),
  ];
  return { subject: content.subject, intro: content.intro, body: `${content.intro}\n\n${details.join("\n")}` };
}

export async function sendCustomBookingEmail(booking: BookingRecord, subject: string, body: string, runtimeEnv?: EmailEnvironment): Promise<EmailResult> {
  const configuration = runtimeEnv ?? process.env as EmailEnvironment;
  const apiKey = configuration.RESEND_API_KEY?.trim();
  const from = configuration.BOOKING_EMAIL_FROM?.trim();
  if (!apiKey || !from) return { sent: false, error: "E-Mail-Dienst ist nicht vollständig konfiguriert." };
  try {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "Idempotency-Key": `vienna-flight-manual-${booking.reference}-${crypto.randomUUID()}` }, body: JSON.stringify({ from, to: [booking.customer_email], ...(configuration.BOOKING_REPLY_TO ? { reply_to: configuration.BOOKING_REPLY_TO } : {}), subject, text: body, html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:620px;margin:auto;padding:32px;color:#122733"><b>VIENNA FLIGHT</b><h1 style="font-size:28px">${escapeHtml(subject)}</h1><p style="white-space:pre-wrap;line-height:1.7;color:#586a75">${escapeHtml(body)}</p><p>Referenz: ${escapeHtml(booking.reference)}</p></div>` }) });
    if (!response.ok) return { sent: false, error: `E-Mail-Anbieter antwortete mit ${response.status}: ${(await response.text()).slice(0, 300)}` };
    return { sent: true, sentAt: new Date().toISOString() };
  } catch (error) { return { sent: false, error: error instanceof Error ? error.message : "E-Mail konnte nicht versendet werden." }; }
}

function formatEuro(cents: number, language: "de" | "en") {
  return new Intl.NumberFormat(language === "en" ? "en-IE" : "de-AT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export async function sendBookingEmail(kind: EmailKind, booking: BookingRecord, runtimeEnv?: EmailEnvironment): Promise<EmailResult> {
  const configuration = runtimeEnv ?? process.env as EmailEnvironment;
  const apiKey = configuration.RESEND_API_KEY?.trim();
  const from = configuration.BOOKING_EMAIL_FROM?.trim();
  if (!apiKey || !from) return { sent: false, error: "E-Mail-Dienst ist nicht vollständig konfiguriert." };

  const content = contentFor(kind, booking);
  const english = booking.language === "en";
  const remark = booking.remark?.trim();
  const detailRows: string[][] = [
    [english ? "Reference" : "Referenz", booking.reference],
    [english ? "Simulator" : "Simulator", booking.simulator],
    ...(booking.gift ? [] : [[english ? "Appointment" : "Termin", `${formatDate(booking.flight_date, english ? "en" : "de")}, ${booking.flight_time}${english ? "" : " Uhr"}`]]),
    [english ? "Flight duration" : "Flugdauer", `${booking.duration} ${english ? "minutes" : "Minuten"}`],
    ...(booking.voucher_code ? [[english ? "Voucher code" : "Gutscheincode", booking.voucher_code]] : []),
    ...(booking.discount_amount_cents > 0 ? [[english ? "Discount" : "Rabatt", formatEuro(booking.discount_amount_cents, english ? "en" : "de")]] : []),
    ...(booking.final_price_cents !== null ? [[english ? "Total price" : "Gesamtpreis", formatEuro(booking.final_price_cents, english ? "en" : "de")]] : []),
    ...(remark ? [[english ? "Booking note" : "Anmerkung", remark]] : []),
  ];
  const rows = detailRows.map(([label, value]) => `<tr><td style="padding:8px 14px;color:#77838b;font-size:12px;border-bottom:1px solid #e6e8e9">${escapeHtml(label)}</td><td style="padding:8px 14px;color:#122733;font-size:13px;font-weight:600;border-bottom:1px solid #e6e8e9">${escapeHtml(value)}</td></tr>`).join("");
  const greeting = english ? `Hello ${booking.customer_name},` : `Guten Tag ${booking.customer_name},`;
  const reply = english ? "If you have any questions, simply reply to this email." : "Bei Rückfragen antworten Sie einfach auf diese E-Mail.";
  const signoff = english ? "Your Vienna Flight Team" : "Ihr Vienna Flight Team";
  const html = `<!doctype html><html lang="${english ? "en" : "de"}"><body style="margin:0;background:#f3f1ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#122733"><div style="max-width:620px;margin:0 auto;padding:36px 18px"><div style="background:#102b3a;color:#fff;padding:22px 26px;font-size:16px;letter-spacing:.08em">VIENNA <b>FLIGHT</b></div><div style="background:#fff;padding:34px 26px"><p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#bf4b3f;margin:0 0 12px">${escapeHtml(booking.reference)}</p><h1 style="font-size:32px;line-height:1.15;margin:0 0 18px;color:#122733">${escapeHtml(content.heading)}</h1><p style="font-size:15px;line-height:1.7;color:#586a75">${escapeHtml(greeting)}</p><p style="font-size:15px;line-height:1.7;color:#586a75">${escapeHtml(content.intro)}</p><table role="presentation" style="width:100%;border-collapse:collapse;margin:24px 0">${rows}</table><p style="font-size:14px;line-height:1.7;color:#586a75">${escapeHtml(reply)}</p><p style="font-size:14px;color:#122733;margin-top:28px">${escapeHtml(signoff)}</p></div></div></body></html>`;
  const text = `${content.heading}\n\n${greeting}\n\n${content.intro}\n\n${detailRows.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\n${reply}\n\n${signoff}`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "Idempotency-Key": `vienna-flight-${kind}-${booking.reference}`,
      },
      body: JSON.stringify({
        from,
        to: [booking.customer_email],
        ...(configuration.BOOKING_REPLY_TO ? { reply_to: configuration.BOOKING_REPLY_TO } : {}),
        subject: content.subject,
        html,
        text,
      }),
    });
    if (!response.ok) {
      const payload = await response.text();
      return { sent: false, error: `E-Mail-Anbieter antwortete mit ${response.status}: ${payload.slice(0, 300)}` };
    }
    return { sent: true, sentAt: new Date().toISOString() };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : "E-Mail konnte nicht versendet werden." };
  }
}
