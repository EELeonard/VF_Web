"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNavigation } from "../../components/AdminNavigation";
import type { AdminIdentity } from "../../lib/admin-auth";

type UserRecord = { id: number; username: string; display_name: string; active: number; created_at: string; updated_at: string };

export default function UsersAdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [defaultUser, setDefaultUser] = useState("admin");
  const [editing, setEditing] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadUsers = useCallback(async () => {
    const response = await fetch("/api/admin/users", { credentials: "same-origin" });
    if (response.status === 401) { router.replace("/admin"); return; }
    const data = await response.json();
    if (response.ok) { setUsers(data.users); setDefaultUser(data.defaultUser); }
    else setError(data.error ?? "Benutzer konnten nicht geladen werden.");
  }, [router]);

  useEffect(() => {
    fetch("/api/admin/session", { credentials: "same-origin" }).then((response) => response.json()).then((data) => {
      if (!data.authenticated) { router.replace("/admin"); return; }
      setIdentity(data.user); void loadUsers();
    }).catch(() => setError("Die Sitzung konnte nicht geprüft werden.")).finally(() => setChecking(false));
  }, [loadUsers, router]);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/users", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: form.get("username"), displayName: form.get("displayName"), password: form.get("password") }) });
    const data = await response.json();
    if (response.ok) { formElement.reset(); setNotice("Benutzer wurde sicher angelegt."); await loadUsers(); }
    else setError(data.error ?? "Benutzer konnte nicht angelegt werden.");
    setSaving(false);
  }

  function startEdit(user: UserRecord) { setEditing(user.id); setDisplayName(user.display_name); setPassword(""); setError(""); setNotice(""); }

  async function updateUser(user: UserRecord, active = user.active === 1) {
    setSaving(true); setError(""); setNotice("");
    const response = await fetch("/api/admin/users", { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: user.id, displayName: editing === user.id ? displayName : user.display_name, active, password: editing === user.id ? password : "" }) });
    const data = await response.json();
    if (response.ok) { setEditing(null); setPassword(""); setNotice(active ? "Benutzer wurde aktualisiert." : "Benutzer wurde deaktiviert und aktive Sitzungen wurden widerrufen."); await loadUsers(); }
    else setError(data.error ?? "Benutzer konnte nicht aktualisiert werden.");
    setSaving(false);
  }

  async function removeUser(user: UserRecord) {
    if (!window.confirm(`Benutzer „${user.username}“ endgültig löschen?`)) return;
    const response = await fetch(`/api/admin/users?id=${user.id}`, { method: "DELETE", credentials: "same-origin" });
    if (response.ok) { setNotice("Benutzer wurde gelöscht. Bestehende Sitzungen sind ungültig."); await loadUsers(); }
    else setError("Benutzer konnte nicht gelöscht werden.");
  }

  if (checking) return <main className="admin-loading"><span className="admin-spinner" /><p>Sitzung wird geprüft</p></main>;
  if (!identity) return <main className="admin-loading"><p>Weiterleitung zur Anmeldung</p></main>;

  return <main className="admin-shell"><AdminNavigation active="users" /><section className="admin-content management-content">
    <header className="admin-topbar"><div><span className="micro-label">Access Control</span><h1>Benutzer</h1></div><div className="admin-user"><span>{identity.displayName.slice(0, 1).toUpperCase()}</span><div><b>{identity.displayName}</b><small>{identity.username}</small></div></div></header>
    <div className="user-summary"><article><span>Administratoren</span><strong>{users.filter((user) => user.active === 1).length + 1}</strong><small>inklusive Standardzugang</small></article><article><span>Deaktiviert</span><strong>{users.filter((user) => user.active === 0).length}</strong><small>keine Dashboard-Berechtigung</small></article></div>
    <div className="management-layout users-layout">
      <form className="management-form compact-form" onSubmit={createUser}><header><div><span className="micro-label">Neuer Zugang</span><h2>Benutzer anlegen</h2></div></header><label>Anzeigename<input name="displayName" required maxLength={100} placeholder="Vorname Nachname" /></label><label>Benutzername<input name="username" required minLength={3} maxLength={40} pattern="[a-zA-Z0-9._-]+" autoComplete="off" placeholder="vorname.nachname" /></label><label>Initiales Passwort<input name="password" type="password" required minLength={12} autoComplete="new-password" /></label><p className="form-hint">Mindestens 12 Zeichen. Benutzer erhalten Zugriff auf Buchungen, News und Benutzerverwaltung.</p>{error && <div className="admin-error" role="alert">{error}</div>}{notice && <div className="admin-notice" role="status">{notice}</div>}<button className="button primary" disabled={saving} type="submit">{saving ? "Speichert ..." : "Benutzer anlegen"}</button></form>
      <section className="management-list user-list"><header><div><span className="micro-label">Berechtigungen</span><h2>Dashboard-Zugänge</h2></div><span>{users.length + 1} Konten</span></header>
        <article className="user-card owner"><div className="user-avatar">A</div><div><h3>Administrator <span>Eigentümer</span></h3><p>@{defaultUser}</p><small>Konfigurierter Standardzugang, immer aktiv</small></div><span className="user-state active">Aktiv</span></article>
        {users.map((user) => <article className={`user-card${user.active ? "" : " inactive"}`} key={user.id}><div className="user-avatar">{user.display_name.slice(0, 1).toUpperCase()}</div>{editing === user.id ? <div className="user-editor"><label>Anzeigename<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label><label>Neues Passwort, optional<input type="password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Unverändert lassen" /></label><div><button type="button" disabled={saving} onClick={() => void updateUser(user)}>Speichern</button><button className="quiet-button" type="button" onClick={() => setEditing(null)}>Abbrechen</button></div></div> : <div><h3>{user.display_name}</h3><p>@{user.username}</p><small>Angelegt am {new Date(user.created_at).toLocaleDateString("de-AT")}</small></div>}<div className="user-actions"><span className={`user-state ${user.active ? "active" : "disabled"}`}>{user.active ? "Aktiv" : "Deaktiviert"}</span>{editing !== user.id && <><button type="button" onClick={() => startEdit(user)}>Bearbeiten</button><button type="button" onClick={() => void updateUser(user, user.active !== 1)}>{user.active ? "Deaktivieren" : "Aktivieren"}</button><button className="danger-button" type="button" onClick={() => void removeUser(user)}>Löschen</button></>}</div></article>)}
      </section>
    </div>
  </section></main>;
}
