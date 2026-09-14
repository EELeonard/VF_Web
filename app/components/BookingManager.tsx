"use client";

import { FormEvent, useEffect, useState } from "react";
import type { BookingCommunication } from "../lib/booking-communications-db";
import type { BookingRecord } from "../lib/bookings-db";

export function BookingManager({ booking, onClose, onUpdated }: { booking: BookingRecord; onClose: () => void; onUpdated: () => Promise<void> }) {
  const [current, setCurrent] = useState(booking);
  const [communications, setCommunications] = useState<BookingCommunication[]>([]);
  const [note, setNote] = useState(booking.internal_notes ?? "");
  const [mode, setMode] = useState<"overview" | "proposal" | "email">("overview");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [instructors, setInstructors] = useState<Array<{id:number;name:string;active:number;capabilities?:string[];availability?:Array<{available_date:string;available_time:string}>}>>([]);

  async function load() {
    const response = await fetch(`/api/admin/booking-management?bookingId=${booking.id}`, { credentials: "same-origin" });
    const data = await response.json();
    if (response.ok) { setCurrent(data.booking); setNote(data.booking.internal_notes ?? ""); setCommunications(data.communications); }
    else setError(data.error ?? "Buchungsdetails konnten nicht geladen werden.");
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/booking-management?bookingId=${booking.id}`, { credentials: "same-origin", signal: controller.signal })
      .then(async (response) => ({ response, data: await response.json() }))
      .then(({ response, data }) => {
        if (response.ok) { setCurrent(data.booking); setNote(data.booking.internal_notes ?? ""); setCommunications(data.communications); }
        else setError(data.error ?? "Buchungsdetails konnten nicht geladen werden.");
      })
      .catch((loadError: unknown) => { if (!(loadError instanceof Error && loadError.name === "AbortError")) setError("Buchungsdetails konnten nicht geladen werden."); });
    return () => controller.abort();
  }, [booking.id]);

  useEffect(() => { fetch("/api/admin/instructors").then((response) => response.json()).then((data) => setInstructors(data.instructors ?? [])).catch(() => undefined); }, []);

  async function action(payload: Record<string, unknown>) {
    setSaving(true); setError(""); setNotice("");
    const response = await fetch("/api/admin/booking-management", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ bookingId: booking.id, ...payload }) });
    const data = await response.json();
    if (response.ok) { setNotice("Änderung gespeichert."); setMode("overview"); await load(); await onUpdated(); }
    else setError(data.error ?? "Aktion konnte nicht ausgeführt werden.");
    setSaving(false);
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>, actionName: "proposal" | "email") {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await action({ action: actionName, date: form.get("date"), time: form.get("time"), subject: form.get("subject"), message: form.get("message") });
  }

  async function acceptInquiry() {
    setSaving(true); setError(""); setNotice("");
    const response = await fetch("/api/admin/bookings", { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: current.id, status: "confirmed" }) });
    const data = await response.json();
    if (response.ok) { setNotice(data.emailSent ? "Anfrage angenommen und Bestätigung versendet." : "Anfrage angenommen."); await load(); await onUpdated(); }
    else setError(data.error ?? "Anfrage konnte nicht angenommen werden.");
    setSaving(false);
  }

  return <div className="booking-drawer-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><aside className="booking-drawer" role="dialog" aria-modal="true" aria-labelledby="booking-manager-title">
    <header><div><span className="micro-label">{current.reference}</span><h2 id="booking-manager-title">{current.simulator} · {current.customer_name}</h2><p>{current.customer_email} · {current.customer_phone}</p></div><button type="button" onClick={onClose} aria-label="Buchungsverwaltung schließen">×</button></header>
    <div className="drawer-status"><span className={`publication-state ${current.status === "confirmed" ? "published" : "draft"}`}>{current.status === "pending" ? "Offene Anfrage" : current.status === "confirmed" ? "Bestätigt" : current.status === "cancelled" ? "Storniert" : "Abgeschlossen"}</span><b>{current.simulator}, {current.flight_date}, {current.flight_time} Uhr</b></div>
    <section className={`instructor-assignment ${current.instructor_id ? "assigned" : "missing"}`}><div><span className="micro-label">Instructor</span><h3>{current.instructor_name ?? "Noch nicht zugeordnet"}</h3><p>{current.instructor_assignment_source === "day" ? "Über Tagesplanung zugeordnet" : current.instructor_assignment_source === "booking" ? "Direkt für diesen Termin zugeordnet" : "Dieser Termin benötigt noch einen Instructor."}</p></div><select aria-label="Instructor für diese Buchung" value={current.instructor_id ?? ""} onChange={(event)=>void action({action:"instructor",instructorId:event.target.value||null})}><option value="">Nicht zugeordnet</option>{instructors.filter(i=>i.active&&(i.capabilities??[]).includes(current.simulator)&&(i.availability??[]).some(slot=>slot.available_date===current.flight_date&&slot.available_time===current.flight_time)).map(i=><option value={i.id} key={i.id}>{i.name}</option>)}</select></section>
    <nav className="drawer-actions" aria-label="Buchungsaktionen">
      {current.status === "confirmed" ? <button className="danger-button" type="button" disabled={saving} onClick={() => { if (window.confirm("Buchung stornieren und den Kunden per E-Mail informieren?")) void action({ action: "cancel" }); }}>Termin stornieren</button> : <button className="primary-action" type="button" disabled={current.status !== "pending" || saving} onClick={() => void acceptInquiry()}>{current.status === "pending" ? "Anfrage annehmen" : current.status === "cancelled" ? "Termin storniert" : "Termin abgeschlossen"}</button>}
      <button type="button" onClick={() => setMode("proposal")}>Neuer Terminvorschlag</button>
      <button type="button" onClick={() => setMode("email")}>E-Mail schreiben</button>
    </nav>
    {mode === "proposal" && <form className="drawer-form" onSubmit={(event) => void submitMessage(event, "proposal")}><h3>Neuen Termin vorschlagen</h3><div><label>Datum<input name="date" type="date" required /></label><label>Uhrzeit<select name="time" required>{["09:30","11:00","12:30","14:00","15:30","17:00","18:30"].map((time) => <option key={time}>{time}</option>)}</select></label></div><label>Zusätzliche Nachricht <span>optional</span><textarea name="message" rows={4} /></label><button className="button primary" disabled={saving} type="submit">Vorschlag senden</button></form>}
    {mode === "email" && <form className="drawer-form" onSubmit={(event) => void submitMessage(event, "email")}><h3>E-Mail an {current.customer_email}</h3><label>Betreff<input name="subject" required maxLength={200} /></label><label>Nachricht<textarea name="message" required maxLength={8000} rows={6} /></label><button className="button primary" disabled={saving} type="submit">E-Mail senden</button></form>}
    {error && <div className="admin-error" role="alert">{error}</div>}{notice && <div className="admin-notice" role="status">{notice}</div>}
    <section className="internal-note"><div><span className="micro-label">Nur intern sichtbar</span><h3>Interne Anmerkungen</h3></div><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={4000} rows={4} placeholder="Übergaben, Kundenwünsche oder operative Hinweise" /><button type="button" disabled={saving} onClick={() => void action({ action: "note", note })}>Notiz speichern</button></section>
    <section className="communication-history"><header><div><span className="micro-label">Kommunikationsakte</span><h3>E-Mail-Verlauf</h3></div><span>{communications.length} Einträge</span></header>{communications.length === 0 ? <p className="communication-empty">Noch keine protokollierten Nachrichten. Frühere Status-E-Mails bleiben oben in der Buchungsübersicht erkennbar.</p> : communications.map((item) => <article className={item.direction} key={item.id}><div><span>{item.direction === "outbound" ? "Gesendet" : "Empfangen"}</span><time>{new Date(item.sent_at).toLocaleString("de-AT")}</time></div><h4>{item.subject}</h4><p>{item.body}</p><small>{item.from_email} → {item.to_email} · {item.delivery_status === "failed" ? "Zustellung fehlgeschlagen" : item.delivery_status === "received" ? "Erfasst" : "Versendet"}</small></article>)}</section>
  </aside></div>;
}
