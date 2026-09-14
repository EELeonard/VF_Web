"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNavigation } from "../../components/AdminNavigation";
import type { AdminIdentity } from "../../lib/admin-auth";
import type { NewsPost } from "../../lib/admin-db";
import { formatDateTime24, formatDateTimeInput, parseDateTimeInput } from "../../lib/date-format";
type Editor = {
  id?: number;
  titleDe: string;
  titleEn: string;
  excerptDe: string;
  excerptEn: string;
  linkUrl: string;
  linkLabelDe: string;
  linkLabelEn: string;
  startsAt: string;
  endsAt: string;
};
const emptyEditor: Editor = {
  titleDe: "",
  titleEn: "",
  excerptDe: "",
  excerptEn: "",
  linkUrl: "/buchen",
  linkLabelDe: "Mehr erfahren",
  linkLabelEn: "Learn more",
  startsAt: "",
  endsAt: "",
};

export default function NewsAdminPage() {
  const router = useRouter(),
    [checking, setChecking] = useState(true),
    [identity, setIdentity] = useState<AdminIdentity | null>(null),
    [posts, setPosts] = useState<NewsPost[]>([]),
    [editor, setEditor] = useState<Editor>(emptyEditor),
    [modalOpen, setModalOpen] = useState(false),
    [saving, setSaving] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const loadPosts = useCallback(async () => {
    const response = await fetch("/api/admin/news", {
      credentials: "same-origin",
    });
    if (response.status === 401) {
      router.replace("/admin");
      return;
    }
    const data = await response.json();
    if (response.ok) setPosts(data.posts);
    else setError(data.error ?? "Beiträge konnten nicht geladen werden.");
  }, [router]);
  useEffect(() => {
    fetch("/api/admin/session", { credentials: "same-origin" })
      .then((response) => response.json())
      .then((data) => {
        if (!data.authenticated) {
          router.replace("/admin");
          return;
        }
        setIdentity(data.user);
        void loadPosts();
      })
      .catch(() => setError("Die Sitzung konnte nicht geprüft werden."))
      .finally(() => setChecking(false));
  }, [loadPosts, router]);
  function edit(post: NewsPost) {
    setEditor({
      id: post.id,
      titleDe: post.title_de,
      titleEn: post.title_en,
      excerptDe: post.excerpt_de,
      excerptEn: post.excerpt_en,
      linkUrl: post.link_url,
      linkLabelDe: post.link_label_de,
      linkLabelEn: post.link_label_en,
      startsAt: formatDateTimeInput(post.starts_at),
      endsAt: formatDateTimeInput(post.ends_at),
    });
    setModalOpen(true);
    setNotice("");
    setError("");
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");
    const response = await fetch("/api/admin/news", {
        method: editor.id ? "PATCH" : "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...editor, startsAt: parseDateTimeInput(editor.startsAt), endsAt: parseDateTimeInput(editor.endsAt), status: "published" }),
      }),
      data = await response.json();
    if (response.ok) {
      setEditor(emptyEditor);
      setModalOpen(false);
      setNotice(
        editor.id
          ? "Beitrag wurde aktualisiert."
          : "Beitrag wurde veröffentlicht.",
      );
      await loadPosts();
    } else setError(data.error ?? "Beitrag konnte nicht gespeichert werden.");
    setSaving(false);
  }
  async function remove(post: NewsPost) {
    if (!window.confirm(`„${post.title_de}“ endgültig löschen?`)) return;
    const response = await fetch(`/api/admin/news?id=${post.id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (response.ok) {
      setNotice("Beitrag wurde gelöscht.");
      await loadPosts();
    } else setError("Beitrag konnte nicht gelöscht werden.");
  }
  function create() {
    setEditor(emptyEditor);
    setModalOpen(true);
    setNotice("");
    setError("");
  }
  if (checking)
    return (
      <main className="admin-loading">
        <span className="admin-spinner" />
        <p>Sitzung wird geprüft</p>
      </main>
    );
  if (!identity)
    return (
      <main className="admin-loading">
        <p>Weiterleitung zur Anmeldung</p>
      </main>
    );
  return (
    <main className="admin-shell">
      <AdminNavigation active="news" />
      <section className="admin-content management-content">
        <header className="admin-topbar users-topbar">
          <div>
            <span className="micro-label">Content Center</span>
            <h1>News und Aktionen</h1>
            <p>Aktuell sichtbare Inhalte auf der Landingpage.</p>
          </div>
          <button
            className="add-member-button"
            type="button"
            onClick={create}
            aria-label="News veröffentlichen"
          >
            +
          </button>
        </header>
        {error && (
          <div className="admin-error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="admin-notice" role="status">
            {notice}
          </div>
        )}
        <section className="active-news-directory">
          <header>
            <div>
              <span className="micro-label">Aktiv</span>
              <h2>{posts.length} veröffentlichte Beiträge</h2>
            </div>
          </header>
          {posts.length === 0 ? (
            <div className="management-empty">
              <span>◉</span>
              <h3>Keine aktive Aktion</h3>
              <p>
                Mit dem Plus oben rechts können Sie einen Beitrag
                veröffentlichen.
              </p>
            </div>
          ) : (
            <div className="active-news-grid">
              {posts.map((post) => (
                <article className="content-list-card" key={post.id}>
                  <div className="content-card-top">
                    <span className="publication-state published">Aktiv</span>
                    <time>
                      {formatDateTime24(post.updated_at).split(",")[0]}
                    </time>
                  </div>
                  <h3>{post.title_de}</h3>
                  <p>{post.excerpt_de}</p>
                  <small>
                    {post.starts_at
                      ? `Ab ${formatDateTime24(post.starts_at)}`
                      : "Sofort"}
                    {post.ends_at
                      ? ` bis ${formatDateTime24(post.ends_at)}`
                      : ", ohne Enddatum"}
                  </small>
                  <div>
                    <button type="button" onClick={() => edit(post)}>
                      Bearbeiten
                    </button>
                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => void remove(post)}
                    >
                      Löschen
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        {modalOpen && (
          <div className="member-modal-backdrop">
            <form className="member-modal news-publisher-modal" onSubmit={save}>
              <header>
                <div>
                  <span className="micro-label">
                    {editor.id ? "Beitrag bearbeiten" : "Neue Veröffentlichung"}
                  </span>
                  <h2>
                    {editor.id
                      ? "Inhalt aktualisieren"
                      : "News veröffentlichen"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Schließen"
                >
                  ×
                </button>
              </header>
              <div className="language-fields">
                <fieldset>
                  <legend>Deutsch</legend>
                  <label>
                    Titel
                    <input
                      required
                      maxLength={140}
                      value={editor.titleDe}
                      onChange={(event) =>
                        setEditor({ ...editor, titleDe: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Kurzbeschreibung
                    <textarea
                      required
                      maxLength={600}
                      rows={5}
                      value={editor.excerptDe}
                      onChange={(event) =>
                        setEditor({ ...editor, excerptDe: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Linktext
                    <input
                      required
                      value={editor.linkLabelDe}
                      onChange={(event) =>
                        setEditor({
                          ...editor,
                          linkLabelDe: event.target.value,
                        })
                      }
                    />
                  </label>
                </fieldset>
                <fieldset>
                  <legend>English</legend>
                  <label>
                    Title
                    <input
                      required
                      maxLength={140}
                      value={editor.titleEn}
                      onChange={(event) =>
                        setEditor({ ...editor, titleEn: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Short description
                    <textarea
                      required
                      maxLength={600}
                      rows={5}
                      value={editor.excerptEn}
                      onChange={(event) =>
                        setEditor({ ...editor, excerptEn: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Link label
                    <input
                      required
                      value={editor.linkLabelEn}
                      onChange={(event) =>
                        setEditor({
                          ...editor,
                          linkLabelEn: event.target.value,
                        })
                      }
                    />
                  </label>
                </fieldset>
              </div>
              <label>
                Zielseite
                <input
                  required
                  pattern="/.*"
                  title="Interner Pfad, zum Beispiel /buchen"
                  value={editor.linkUrl}
                  onChange={(event) =>
                    setEditor({ ...editor, linkUrl: event.target.value })
                  }
                />
              </label>
              <div className="management-row">
                <label>
                  Sichtbar ab, optional
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{2}\.\d{2}\.\d{4} (?:[01]\d|2[0-3]):[0-5]\d"
                    placeholder="TT.MM.JJJJ HH:MM"
                    value={editor.startsAt}
                    onChange={(event) =>
                      setEditor({ ...editor, startsAt: event.target.value })
                    }
                  />
                </label>
                <label>
                  Sichtbar bis, optional
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{2}\.\d{2}\.\d{4} (?:[01]\d|2[0-3]):[0-5]\d"
                    placeholder="TT.MM.JJJJ HH:MM"
                    value={editor.endsAt}
                    onChange={(event) =>
                      setEditor({ ...editor, endsAt: event.target.value })
                    }
                  />
                </label>
              </div>
              <p>
                Der Beitrag wird direkt veröffentlicht und erscheint innerhalb
                der optionalen Laufzeit auf beiden Landingpages.
              </p>
              <button
                className="button primary"
                disabled={saving}
                type="submit"
              >
                {saving
                  ? "Veröffentlicht ..."
                  : editor.id
                    ? "Änderungen speichern"
                    : "Jetzt veröffentlichen"}
              </button>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
