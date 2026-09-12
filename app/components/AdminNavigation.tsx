"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminNavigation({ active }: { active: "bookings" | "news" | "vouchers" | "users" }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    router.replace("/admin");
    router.refresh();
  }

  return <aside className="admin-nav">
    <Link className="brand" href="/"><span className="brand-mark">VF</span><span>VIENNA <b>FLIGHT</b></span></Link>
    <nav>
      <Link className={active === "bookings" ? "active" : ""} href="/admin"><span>▦</span>Buchungen</Link>
      <Link className={active === "news" ? "active" : ""} href="/admin/news"><span>◉</span>News und Aktionen</Link>
      <Link className={active === "vouchers" ? "active" : ""} href="/admin/vouchers"><span>◇</span>Gutscheincodes</Link>
      <Link className={active === "users" ? "active" : ""} href="/admin/users"><span>♙</span>Benutzer</Link>
      <Link href="/buchen"><span>＋</span>Neue Buchung</Link>
      <Link href="/"><span>↗</span>Website ansehen</Link>
    </nav>
    <button type="button" onClick={() => void logout()}><span>↪</span>Abmelden</button>
  </aside>;
}
