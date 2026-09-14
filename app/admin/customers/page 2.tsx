"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNavigation } from "../../components/AdminNavigation";
import type { CustomerRecord } from "../../lib/customers-db";
import { formatDateNumeric } from "../../lib/date-format";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [selected, setSelected] = useState<CustomerRecord | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
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
  const visible = useMemo(() => { const value = query.trim().toLowerCase(); return value ? customers.filter(customer => [customer.name, customer.email, customer.phone].some(field => field.toLowerCase().includes(value))) : customers; }, [customers, query]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true); setError(""); setNotice("");
    const notes = String(new FormData(event.currentTarget).get("notes") ?? "");
    const response = await fetch("/api/admin/customers", { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: selected.id, notes }) });
    const data = await response.json();
    if (response.ok) { setSelected(null); setNotice("Kundennotiz wurde gespeichert."); await load(); } else setError(data.error ?? "Notiz konnte nicht gespeichert werden.");
    setSaving(false);
  }
  return <main className="admin-shell"><AdminNavigation active="customers"/><section className="admin-content management-content"><header className="admin-topbar"><div><span className="micro-label">Kundenakte</span><h1>Kunden</h1><p>Automatisch aus Buchungen übernommen und zentral dokumentiert.</p></div></header>{error&&<div className="admin-error" role="alert">{error}</div>}{notice&&<div className="admin-notice" role="status">{notice}</div>}<div className="admin-toolbar"><label><span>⌕</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Name, E-Mail oder Telefon suchen"/></label></div>{loading?<div className="management-empty"><p>Kunden werden geladen ...</p></div>:<section className="customer-directory"><header><div><span className="micro-label">Kundenstamm</span><h2>{visible.length} Kunden</h2></div></header>{visible.map(customer=><article className="customer-row" key={customer.id}><div className="user-avatar">{customer.name[0]?.toUpperCase()||"K"}</div><div><h3>{customer.name}</h3><p>{customer.email} · {customer.phone}</p><small>{customer.booking_count} Buchung(en) · zuletzt {formatDateNumeric(customer.last_booking_at)}</small></div><div className="customer-note-preview"><span>Interne Notiz</span><p>{customer.notes||"Keine Notiz hinterlegt"}</p></div><button className="booking-more" type="button" onClick={()=>setSelected(customer)} aria-label={`Notiz für ${customer.name} bearbeiten`}>•••</button></article>)}{visible.length===0&&<div className="management-empty"><p>Keine Kunden gefunden.</p></div>}</section>}{selected&&<div className="member-modal-backdrop"><form className="member-modal customer-note-modal" onSubmit={save}><header><div><span className="micro-label">Kundennotiz</span><h2>{selected.name}</h2><p>{selected.email}</p></div><button type="button" onClick={()=>setSelected(null)} aria-label="Schließen">×</button></header><label>Interne Notiz<textarea name="notes" defaultValue={selected.notes} rows={8} maxLength={8000} placeholder="Präferenzen, Rückfragen oder wichtige Hinweise"/></label><p>Diese Notiz ist nur im internen Dashboard sichtbar.</p><button className="button primary" disabled={saving}>{saving?"Wird gespeichert ...":"Notiz speichern"}</button></form></div>}</section></main>;
}
