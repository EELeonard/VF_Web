"use client";

import { useRouter } from "next/navigation";

export function AdminNavigation({ active }: { active: "bookings" | "news" | "vouchers" | "users" }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    router.replace("/admin");
    router.refresh();
  }

  return <aside className="admin-nav">
    <a className="brand" href="/"><span className="brand-mark">VF</span><span>VIENNA <b>FLIGHT</b></span></a>
    <nav>
      <a className={active === "bookings" ? "active" : ""} href="/admin"><span>▦</span>Buchungen</a>
      <a className={active === "news" ? "active" : ""} href="/admin/news"><span>◉</span>News und Aktionen</a>
      <a className={active === "vouchers" ? "active" : ""} href="/admin/vouchers"><span>◇</span>Gutscheincodes</a>
      <a className={active === "users" ? "active" : ""} href="/admin/users"><span>♙</span>Benutzer</a>
      <a href="/buchen"><span>＋</span>Neue Buchung</a>
      <a href="/"><span>↗</span>Website ansehen</a>
    </nav>
    <button type="button" onClick={() => void logout()}><span>↪</span>Abmelden</button>
  </aside>;
}
