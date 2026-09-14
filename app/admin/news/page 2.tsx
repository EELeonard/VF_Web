"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNavigation } from "../../components/AdminNavigation";
import type { AdminIdentity } from "../../lib/admin-auth";
import type { NewsPost, NewsStatus } from "../../lib/admin-db";

type Editor = {
  id?: number; titleDe: string; titleEn: string; excerptDe: string; excerptEn: string;
  linkUrl: string; linkLabelDe: string; linkLabelEn: string; status: NewsStatus; startsAt: string; endsAt: string;
};

const emptyEditor: Editor = { titleDe: "", titleEn: "", excerptDe: "", excerptEn: "", linkUrl: "/buchen", linkLabelDe: "Mehr erfahren", linkLabelEn: "Learn more", status: "draft", startsAt: "", endsAt: "" };

function toInputDate(value: string | null) { return value ? value.slice(0, 16) : ""; }

export default function NewsAdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [editor, setEditor] = useState<Editor>(emptyEditor);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    const response = await fetch("/api/admin/news", { credentials: "same-origin" });
    if (response.status === 401) { router.replace("/admin"); return; }
    const data = await response.json();
    if (response.ok) setPosts(data.posts); else setError(data.error ?? "Beiträge konnten nicht geladen werden.");
  }, [router]);

  useEffect(() => {
    fetch("/api/admin/session", { credentials: "same-origin" }).then((response) => response.json()).then((data) => {
      if (!data.authenticated) { router.replace("/admin"); return; }
      setIdentity(data.user);
      void loadPosts();
    }).catch(() => setError("Die Sitzung konnte nicht geprüft werden.")).finally(() => setChecking(false));
  }, [loadPosts, router]);

  function edit(post: NewsPost) {
    setEditor({ id: post.id, titleDe: post.title_de, titleEn: post.title_en, excerptDe: post.excerpt_de, excerptEn: post.excerpt_en, linkUrl: post.link_url, linkLabelDe: post.link_label_de, linkLabelEn: post.link_label_en, status: post.status, startsAt: toInputDate(post.starts_at), endsAt: toInputDate(post.ends_at) });
    setNotice(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setNotice(""); setError("");
    const response = await fetch("/api/admin/news", { method: editor.id ? "PATCH" : "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(editor) });
    const data = await response.json();
    if (response.ok) { setEditor(emptyEditor); setNotice(editor.id ? "Beitrag wurde aktualisiert." : "Beitrag wurde angelegt."); await loadPosts(); }
    else setError(data.error ?? "Beitrag konnte nicht gespeichert werden.");
    setSaving(false);
  }

  async function remove(post: NewsPost) {
    if (!window.confirm(`„${post.title_de}“ endgültig löschen?`)) return;
    const response = await fetch(`/api/admin/news?id=${post.id}`, { method: "DELETE", credentials: "same-origin" });
    if (response.ok) { if (editor.id === post.id) setEditor(emptyEditor); await loadPosts(); }
    else setError("Beitrag konnte nicht gelöscht werden.");
  }

  if (checking) return <main className="admin-loading"><span className="admin-spinner" /><p>Sitzung wird geprüft</p></main>;
  if (!identity) return <main className="admin-loading"><p>Weiterleitung zur Anmeldung</p></main>;

  return <main className="admin-shell"><AdminNavigation active="news" /><section className="admin-content management-content">
    <header className="admin-topbar"><div><span className="micro-label">Content Center</span><h1>News und Aktionen</h1></div><div className="admin-user"><span>{identity.displayName.slice(0, 1).toUpperCase()}</span><div><b>{identity.displayName}</b><small>{identity.username}</small></div></div></header>
    <div className="management-layout">
      <form className="management-form" onSubmit={save}>
        <header><div><span className="micro-label">{editor.id ? "Bearbeiten" : "Neuer Beitrag"}</span><h2>{editor.id ? "Inhalt aktualisieren" : "Aktion veröffentlichen"}</h2></div>{editor.id && <button className="quiet-button" type="button" onClick={() => setEditor(emptyEditor)}>Abbrechen</button>}</header>
        <div className="language-fields"><fieldset><legend>Deutsch</legend><label>Titel<input required maxLength={140} value={editor.titleDe} onChange={(event) => setEditor({ ...editor, titleDe: event.target.value })} /></label><label>Kurzbeschreibung<textarea required maxLength={600} rows={5} value={editor.excerptDe} onChange={(event) => setEditor({ ...editor, excerptDe: event.target.value })} /></label><label>Linktext<input required value={editor.linkLabelDe} onChange={(event) => setEditor({ ...editor, linkLabelDe: event.target.value })} /></label></fieldset><fieldset><legend>English</legend><label>Title<input required maxLength={140} value={editor.titleEn} onChange={(event) => setEditor({ ...editor, titleEn: event.target.value })} /></label><label>Short description<textarea required maxLength={600} rows={5} value={editor.excerptEn} onChange={(event) => setEditor({ ...editor, excerptEn: event.target.value })} /></label><label>Link label<input required value={editor.linkLabelEn} onChange={(event) => setEditor({ ...editor, linkLabelEn: event.target.value })} /></label></fieldset></div>
        <div className="management-row"><label>Zielseite<input required pattern="/.*" title="Interner Pfad, zum Beispiel /buchen" value={editor.linkUrl} onChange={(event) => setEditor({ ...editor, linkUrl: event.target.value })} /></label><label>Status<select value={editor.status} onChange={(event) => setEditor({ ...editor, status: event.target.value as NewsStatus })}><option value="draft">Entwurf</option><option value="published">Veröffentlicht</option></select></label></div>
        <div className="management-row"><label>Sichtbar ab, optional<input type="datetime-local" value={editor.startsAt} onChange={(event) => setEditor({ ...editor, startsAt: event.target.value })} /></label><label>Sichtbar bis, optional<input type="datetime-local" value={editor.endsAt} onChange={(event) => setEditor({ ...editor, endsAt: event.target.value })} /></label></div>
        <p className="form-hint">Entwürfe bleiben unsichtbar. Veröffentlichte Beiträge erscheinen nur innerhalb der optionalen Laufzeit auf beiden Landingpages.</p>
        {error && <div className="admin-error" role="alert">{error}</div>}{notice && <div className="admin-notice" role="status">{notice}</div>}
        <button className="button primary" disabled={saving} type="submit">{saving ? "Speichert ..." : editor.id ? "Änderungen speichern" : "Beitrag anlegen"}</button>
      </form>
      <section className="management-list"><header><div><span className="micro-label">Übersicht</span><h2>Alle Beiträge</h2></div><span>{posts.length} Einträge</span></header>
        {posts.length === 0 ? <div className="management-empty"><span>◉</span><h3>Noch keine News</h3><p>Legen Sie links den ersten Beitrag an.</p></div> : posts.map((post) => <article className="content-list-card" key={post.id}><div className="content-card-top"><span className={`publication-state ${post.status}`}>{post.status === "published" ? "Veröffentlicht" : "Entwurf"}</span><time>{new Date(post.updated_at).toLocaleDateString("de-AT")}</time></div><h3>{post.title_de}</h3><p>{post.excerpt_de}</p><small>{post.starts_at ? `Ab ${new Date(post.starts_at).toLocaleString("de-AT")}` : "Sofort"}{post.ends_at ? ` bis ${new Date(post.ends_at).toLocaleString("de-AT")}` : ", ohne Enddatum"}</small><div><button type="button" onClick={() => edit(post)}>Bearbeiten</button><button className="danger-button" type="button" onClick={() => void remove(post)}>Löschen</button></div></article>)}
      </section>
    </div>
  </section></main>;
}
