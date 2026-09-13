"use client";

import { FormEvent, useState } from "react";

function safeReturnTo() {
  const value = new URLSearchParams(window.location.search).get("returnTo");
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";
}

export default function PreviewLoginPage() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/preview-login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Anmeldung fehlgeschlagen.");
        return;
      }
      window.location.replace(safeReturnTo());
    } catch {
      setError("Die Anmeldung konnte nicht abgeschlossen werden.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="preview-gate">
      <section className="preview-gate-card" aria-labelledby="preview-title">
        <div className="preview-gate-brand" aria-hidden="true">VF</div>
        <p className="eyebrow">Geschützte Vorschau</p>
        <h1 id="preview-title">Vienna Flight</h1>
        <p className="preview-gate-copy">
          Melden Sie sich an, um die Entwicklungsseite aufzurufen.
        </p>
        <form onSubmit={submit} className="preview-gate-form">
          <label>
            Benutzername
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            Passwort
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error ? <p className="preview-gate-error" role="alert">{error}</p> : null}
          <button type="submit" disabled={submitting}>
            {submitting ? "Anmeldung läuft..." : "Anmelden"}
          </button>
        </form>
      </section>
    </main>
  );
}
