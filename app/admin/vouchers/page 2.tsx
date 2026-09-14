"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNavigation } from "../../components/AdminNavigation";
import type { AdminIdentity } from "../../lib/admin-auth";
import type { DiscountType, VoucherRecord } from "../../lib/vouchers-db";

type Editor = {
  id?: number; code: string; description: string; discountType: DiscountType; discountValue: string;
  active: boolean; allowedEmail: string; maxUses: string; maxUsesPerEmail: string; startsAt: string; endsAt: string;
};

const emptyEditor: Editor = { code: "", description: "", discountType: "percentage", discountValue: "", active: true, allowedEmail: "", maxUses: "", maxUsesPerEmail: "", startsAt: "", endsAt: "" };
function inputDate(value: string | null) { return value ? value.slice(0, 16) : ""; }

export default function VouchersAdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [vouchers, setVouchers] = useState<VoucherRecord[]>([]);
  const [editor, setEditor] = useState<Editor>(emptyEditor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [emailFilter, setEmailFilter] = useState("");

  const visibleVouchers = useMemo(() => {
    const query = emailFilter.trim().toLowerCase();
    if (!query) return vouchers;
    return vouchers.filter((voucher) => (voucher.allowed_email ?? "").toLowerCase().includes(query) || (voucher.redemption_emails ?? "").toLowerCase().split(",").some((email) => email.includes(query)));
  }, [emailFilter, vouchers]);

  const loadVouchers = useCallback(async () => {
    const response = await fetch("/api/admin/vouchers", { credentials: "same-origin" });
    if (response.status === 401) { router.replace("/admin"); return; }
    const data = await response.json();
    if (response.ok) setVouchers(data.vouchers); else setError(data.error ?? "Gutscheine konnten nicht geladen werden.");
  }, [router]);

  useEffect(() => {
    fetch("/api/admin/session", { credentials: "same-origin" }).then((response) => response.json()).then((data) => {
      if (!data.authenticated) { router.replace("/admin"); return; }
      setIdentity(data.user); void loadVouchers();
    }).catch(() => setError("Die Sitzung konnte nicht geprüft werden.")).finally(() => setChecking(false));
  }, [loadVouchers, router]);

  function edit(voucher: VoucherRecord) {
    setEditor({ id: voucher.id, code: voucher.code, description: voucher.description, discountType: voucher.discount_type, discountValue: String(voucher.discount_type === "fixed" ? voucher.discount_value / 100 : voucher.discount_value), active: voucher.active === 1, allowedEmail: voucher.allowed_email ?? "", maxUses: voucher.max_uses?.toString() ?? "", maxUsesPerEmail: voucher.max_uses_per_email?.toString() ?? "", startsAt: inputDate(voucher.starts_at), endsAt: inputDate(voucher.ends_at) });
    setError(""); setNotice(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    const response = await fetch("/api/admin/vouchers", { method: editor.id ? "PATCH" : "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(editor) });
    const data = await response.json();
    if (response.ok) { setEditor(emptyEditor); setNotice(editor.id ? "Gutscheincode wurde aktualisiert." : "Gutscheincode wurde angelegt."); await loadVouchers(); }
    else setError(data.error ?? "Gutscheincode konnte nicht gespeichert werden.");
    setSaving(false);
  }

  async function toggle(voucher: VoucherRecord) {
    const response = await fetch("/api/admin/vouchers", { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: voucher.id, code: voucher.code, description: voucher.description, discountType: voucher.discount_type, discountValue: voucher.discount_type === "fixed" ? voucher.discount_value / 100 : voucher.discount_value, active: voucher.active !== 1, allowedEmail: voucher.allowed_email, maxUses: voucher.max_uses, maxUsesPerEmail: voucher.max_uses_per_email, startsAt: voucher.starts_at, endsAt: voucher.ends_at }) });
    const data = await response.json();
    if (response.ok) { setNotice(voucher.active ? "Gutscheincode wurde deaktiviert." : "Gutscheincode wurde aktiviert."); await loadVouchers(); }
    else setError(data.error ?? "Status konnte nicht geändert werden.");
  }

  async function remove(voucher: VoucherRecord) {
    if (!window.confirm(`Gutscheincode „${voucher.code}“ endgültig löschen?`)) return;
    const response = await fetch(`/api/admin/vouchers?id=${voucher.id}`, { method: "DELETE", credentials: "same-origin" });
    const data = await response.json();
    if (response.ok) { setNotice("Gutscheincode wurde gelöscht."); await loadVouchers(); }
    else setError(data.error ?? "Gutscheincode konnte nicht gelöscht werden.");
  }

  if (checking) return <main className="admin-loading"><span className="admin-spinner" /><p>Sitzung wird geprüft</p></main>;
  if (!identity) return <main className="admin-loading"><p>Weiterleitung zur Anmeldung</p></main>;

  return <main className="admin-shell"><AdminNavigation active="vouchers" /><section className="admin-content management-content">
    <header className="admin-topbar"><div><span className="micro-label">Voucher Control</span><h1>Gutscheincodes</h1></div><div className="admin-user"><span>{identity.displayName.slice(0, 1).toUpperCase()}</span><div><b>{identity.displayName}</b><small>{identity.username}</small></div></div></header>
    <div className="voucher-metrics"><article><span>Codes gesamt</span><strong>{vouchers.length}</strong></article><article><span>Aktiv</span><strong>{vouchers.filter((voucher) => voucher.active === 1).length}</strong></article><article><span>Einlösungen</span><strong>{vouchers.reduce((sum, voucher) => sum + Number(voucher.redemption_count ?? 0), 0)}</strong></article></div>
    <div className="management-layout voucher-layout">
      <form className="management-form" onSubmit={save}><header><div><span className="micro-label">{editor.id ? "Bearbeiten" : "Neuer Code"}</span><h2>{editor.id ? "Gutschein aktualisieren" : "Gutschein anlegen"}</h2></div>{editor.id && <button className="quiet-button" type="button" onClick={() => setEditor(emptyEditor)}>Abbrechen</button>}</header>
        <div className="management-row"><label>Gutscheincode<input required minLength={3} maxLength={40} pattern="[A-Za-z0-9_-]+" value={editor.code} onChange={(event) => setEditor({ ...editor, code: event.target.value.toUpperCase() })} placeholder="VIENNA20" /></label><label>Status<select value={editor.active ? "active" : "inactive"} onChange={(event) => setEditor({ ...editor, active: event.target.value === "active" })}><option value="active">Aktiv</option><option value="inactive">Deaktiviert</option></select></label></div>
        <label>Interne Beschreibung <span className="field-optional">optional</span><input maxLength={240} value={editor.description} onChange={(event) => setEditor({ ...editor, description: event.target.value })} placeholder="Zum Beispiel Sommeraktion 2026" /></label>
        <div className="management-row"><label>Rabattart<select value={editor.discountType} onChange={(event) => setEditor({ ...editor, discountType: event.target.value as DiscountType })}><option value="percentage">Prozent</option><option value="fixed">Fixbetrag in Euro</option></select></label><label>Rabattwert<input required min="0.01" max={editor.discountType === "percentage" ? 100 : undefined} step={editor.discountType === "percentage" ? 1 : ".01"} type="number" value={editor.discountValue} onChange={(event) => setEditor({ ...editor, discountValue: event.target.value })} /></label></div>
        <label>Nur für diese E-Mail-Adresse <span className="field-optional">optional</span><input type="email" value={editor.allowedEmail} onChange={(event) => setEditor({ ...editor, allowedEmail: event.target.value })} placeholder="Leer lassen für alle Kunden" /></label>
        <div className="management-row"><label>Maximale Einlösungen gesamt <span className="field-optional">optional</span><input type="number" min="1" step="1" value={editor.maxUses} onChange={(event) => setEditor({ ...editor, maxUses: event.target.value })} placeholder="Unbegrenzt" /></label><label>Maximal je E-Mail-Adresse <span className="field-optional">optional</span><input type="number" min="1" step="1" value={editor.maxUsesPerEmail} onChange={(event) => setEditor({ ...editor, maxUsesPerEmail: event.target.value })} placeholder="Unbegrenzt" /></label></div>
        <div className="management-row"><label>Gültig ab <span className="field-optional">optional</span><input type="datetime-local" value={editor.startsAt} onChange={(event) => setEditor({ ...editor, startsAt: event.target.value })} /></label><label>Gültig bis <span className="field-optional">optional</span><input type="datetime-local" value={editor.endsAt} onChange={(event) => setEditor({ ...editor, endsAt: event.target.value })} /></label></div>
        <p className="form-hint">Ein Code wird nur akzeptiert, wenn Status, Laufzeit, E-Mail-Bindung und beide Nutzungslimits gleichzeitig erfüllt sind.</p>{error && <div className="admin-error" role="alert">{error}</div>}{notice && <div className="admin-notice" role="status">{notice}</div>}<button className="button primary" disabled={saving} type="submit">{saving ? "Speichert ..." : editor.id ? "Änderungen speichern" : "Gutscheincode anlegen"}</button>
      </form>
      <section className="management-list voucher-list"><header><div><span className="micro-label">Übersicht</span><h2>Alle Gutscheincodes</h2></div><span>{visibleVouchers.length} von {vouchers.length}</span></header>
        <label className="voucher-email-filter"><span>⌕</span><input type="search" value={emailFilter} onChange={(event) => setEmailFilter(event.target.value)} placeholder="Nach E-Mail-Adresse filtern" aria-label="Gutscheincodes nach E-Mail-Adresse filtern" />{emailFilter && <button type="button" onClick={() => setEmailFilter("")} aria-label="Filter löschen">×</button>}</label>
        {vouchers.length === 0 ? <div className="management-empty"><span>◇</span><h3>Noch keine Gutscheincodes</h3><p>Legen Sie links den ersten Code an.</p></div> : visibleVouchers.length === 0 ? <div className="management-empty"><span>⌕</span><h3>Keine Treffer</h3><p>Zu dieser E-Mail-Adresse wurde kein Gutscheincode gefunden.</p></div> : visibleVouchers.map((voucher) => <article className={`voucher-card${voucher.active ? "" : " inactive"}`} key={voucher.id}><div className="voucher-card-main"><div><code>{voucher.code}</code><span className={`user-state ${voucher.active ? "active" : "disabled"}`}>{voucher.active ? "Aktiv" : "Deaktiviert"}</span></div><h3>{voucher.discount_type === "percentage" ? `${voucher.discount_value}% Rabatt` : `€ ${(voucher.discount_value / 100).toFixed(2)} Rabatt`}</h3><p>{voucher.description || "Keine interne Beschreibung"}</p></div><dl><div><dt>Verwendet</dt><dd>{voucher.redemption_count ?? 0}{voucher.max_uses ? ` / ${voucher.max_uses}` : " / ∞"}</dd></div><div><dt>Je E-Mail</dt><dd>{voucher.max_uses_per_email ?? "∞"}</dd></div><div><dt>E-Mail-Bindung</dt><dd>{voucher.allowed_email ?? "Alle"}</dd></div><div><dt>Laufzeit</dt><dd>{voucher.starts_at ? new Date(voucher.starts_at).toLocaleDateString("de-AT") : "Sofort"} bis {voucher.ends_at ? new Date(voucher.ends_at).toLocaleDateString("de-AT") : "offen"}</dd></div></dl>{voucher.redemption_emails && <div className="voucher-used-by"><span>Eingelöst von</span><p>{voucher.redemption_emails.split(",").join(", ")}</p></div>}<div className="voucher-actions"><button type="button" onClick={() => edit(voucher)}>Bearbeiten</button><button type="button" onClick={() => void toggle(voucher)}>{voucher.active ? "Deaktivieren" : "Aktivieren"}</button><button className="danger-button" type="button" onClick={() => void remove(voucher)}>Löschen</button></div></article>)}
      </section>
    </div>
  </section></main>;
}
