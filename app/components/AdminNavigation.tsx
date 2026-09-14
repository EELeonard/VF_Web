"use client";

import { useState } from "react";

export function AdminNavigation({ active }: { active: "bookings" | "news" | "vouchers" | "users" }) {
  const [open, setOpen] = useState(false);
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    window.location.replace("/admin");
  }

  return <aside className="admin-nav">
    <a className="brand" href="/"><span className="brand-mark">VF</span><span>VIENNA <b>FLIGHT</b></span></a>
    <button className="admin-menu-button" type="button" aria-expanded={open} aria-controls="admin-navigation" aria-label={open ? "Dashboard-Menü schließen" : "Dashboard-Menü öffnen"} onClick={() => setOpen(current => !current)}><span>{open ? "×" : "☰"}</span><b>Menü</b></button>
    <nav id="admin-navigation" className={open ? "open" : ""}>
      <a className={active === "bookings" ? "active" : ""} href="/admin"><span>▦</span>Buchungen</a>
      <a className={active === "news" ? "active" : ""} href="/admin/news"><span>◉</span>News und Aktionen</a>
      <a className={active === "vouchers" ? "active" : ""} href="/admin/vouchers"><span>◇</span>Gutscheincodes</a>
      <a className={active === "users" ? "active" : ""} href="/admin/users"><span>♙</span>Benutzer</a>
      <a href="/admin/bookings/new"><span>＋</span>Neue Buchung</a>
      <a href="/"><span>↗</span>Website ansehen</a>
    </nav>
    <button type="button" onClick={() => void logout()}><span>↪</span>Abmelden</button>
  </aside>;
}
