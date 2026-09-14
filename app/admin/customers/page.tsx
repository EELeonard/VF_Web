"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNavigation } from "../../components/AdminNavigation";
import type { BookingRecord } from "../../lib/bookings-db";
import type { CustomerRecord } from "../../lib/customers-db";
import { formatDateNumeric } from "../../lib/date-format";

const statusLabels: Record<BookingRecord["status"], string> = { pending: "Offene Anfrage", confirmed: "Bestätigt", completed: "Abgeschlossen", cancelled: "Storniert" };

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [selected, setSelected] = useState<CustomerRecord | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/customers", { credentials: "same-origin", cache: "no-store" });
    const data = await response.json();
    if (response.status === 401) { router.replace("/admin"); return; }
    if (response.ok) setCustomers(data.customers ?? []); else setError(data.error ?? "Kunden konnten nicht geladen werden.");
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    return value ? customers.filter(customer => [customer.name, customer.email, customer.phone].some(field => field.toLowerCase().includes(value))) : customers;
  }, [customers, query]);

  async function openCustomer(customer: CustomerRecord) {
    setSelected(customer); setBookings([]); setDetailsLoading(true); setError("");
    const response = await fetch(`/api/admin/customers?customerId=${customer.id}`, { credentials: "same-origin", cache: "no-store" });
    const data = await response.json();
    if (response.ok) { setSelected(data.customer); setBookings(data.bookings ?? []); } else setError(data.error ?? "Kundenakte konnte nicht geladen werden.");
    setDetailsLoading(false);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true); setError(""); setNotice("");
    const notes = String(new FormData(event.currentTarget).get("notes") ?? "");
    const response = await fetch("/api/admin/customers", { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: selected.id, notes }) });
    const data = await response.json();
    if (response.ok) { setSelected(current => current ? { ...current, notes } : current); setNotice("Kundennotiz wurde gespeichert."); await load(); } else setError(data.error ?? "Notiz konnte nicht gespeichert werden.");
    setSaving(false);
  }

  return <main className="admin-shell"><AdminNavigation active="customers"/><section className="admin-content management-content">
    <header className="admin-topbar"><div><span className="micro-label">Kundenakte</span><h1>Kunden</h1><p>Kontaktdaten, Buchungen und interne Notizen an einem Ort.</p></div></header>
    {error&&<div className="admin-error" role="alert">{error}</div>}{notice&&<div className="admin-notice" role="status">{notice}</div>}
    <div className="admin-toolbar"><label><span>⌕</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Name, E-Mail oder Telefon suchen"/></label></div>
    {loading?<div className="management-empty"><p>Kunden werden geladen ...</p></div>:<section className="customer-directory"><header><div><span className="micro-label">Kundenstamm</span><h2>{visible.length} Kunden</h2></div></header>
      {visible.map(customer=><button className="customer-row" type="button" key={customer.id} onClick={()=>void openCustomer(customer)}><span className="user-avatar">{customer.name[0]?.toUpperCase()||"K"}</span><span className="customer-identity"><strong>{customer.name}</strong><span>{customer.email} · {customer.phone}</span><small>{customer.booking_count} Buchung(en) · zuletzt {formatDateNumeric(customer.last_booking_at)}</small></span><span className="customer-note-preview"><b>Interne Notiz</b><span>{customer.notes||"Keine Notiz hinterlegt"}</span></span><span className="customer-open">›</span></button>)}
      {visible.length===0&&<div className="management-empty"><p>Keine Kunden gefunden.</p></div>}
    </section>}
    {selected&&<div className="member-modal-backdrop"><form className="member-modal customer-detail-modal" onSubmit={save}><header><div><span className="micro-label">Kundenakte</span><h2>{selected.name}</h2></div><button type="button" onClick={()=>setSelected(null)} aria-label="Schließen">×</button></header>
      <section className="customer-contact-overview"><div><span>E-Mail</span><a href={`mailto:${selected.email}`}>{selected.email}</a></div><div><span>Telefon</span><a href={`tel:${selected.phone}`}>{selected.phone}</a></div><div><span>Erste Buchung</span><strong>{formatDateNumeric(selected.first_booking_at)}</strong></div><div><span>Letzte Buchung</span><strong>{formatDateNumeric(selected.last_booking_at)}</strong></div></section>
      <section className="customer-booking-history"><header><div><span className="micro-label">Buchungshistorie</span><h3>{selected.booking_count} Buchung(en)</h3></div></header>{detailsLoading?<p>Buchungen werden geladen ...</p>:bookings.map(booking=><article key={booking.id}><div><strong>{booking.simulator}</strong><span className={`publication-state ${booking.status==="confirmed"?"published":"draft"}`}>{statusLabels[booking.status]}</span></div><p>{booking.gift?`${booking.duration} Minuten Geschenkgutschein`:`${formatDateNumeric(booking.flight_date)} · ${booking.flight_time} Uhr · ${booking.duration} Minuten`}</p><small>{booking.reference}{booking.remark?` · ${booking.remark}`:""}</small></article>)}{!detailsLoading&&bookings.length===0&&<p>Keine Buchungen vorhanden.</p>}</section>
      <label>Interne Notiz<textarea name="notes" defaultValue={selected.notes} rows={6} maxLength={8000} placeholder="Präferenzen, Rückfragen oder wichtige Hinweise"/></label><p>Diese Notiz ist nur im internen Dashboard sichtbar.</p><button className="button primary" disabled={saving}>{saving?"Wird gespeichert ...":"Notiz speichern"}</button>
    </form></div>}
  </section></main>;
}
