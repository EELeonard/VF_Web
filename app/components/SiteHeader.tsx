"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

const navigation = [
  ["/simulatoren", "Simulatoren"],
  ["/erlebnisse", "Erlebnisse"],
  ["/events", "Events"],
  ["/screening", "Screening"],
  ["/ueber-uns", "Über uns"],
  ["/kontakt", "Kontakt"],
];

const navigationEnglish = [
  ["/en/simulators", "Simulators"],
  ["/en/experiences", "Experiences"],
  ["/en/events", "Events"],
  ["/en/screening", "Screening"],
  ["/en/about", "About"],
  ["/en/contact", "Contact"],
];

const germanToEnglish: Record<string, string> = {
  "/": "/en",
  "/simulatoren": "/en/simulators",
  "/erlebnisse": "/en/experiences",
  "/events": "/en/events",
  "/screening": "/en/screening",
  "/ueber-uns": "/en/about",
  "/kontakt": "/en/contact",
  "/buchen": "/en/booking",
  "/impressum": "/en/legal-notice",
  "/datenschutz": "/en/privacy",
  "/faq": "/en/faq",
};

const englishToGerman = Object.fromEntries(Object.entries(germanToEnglish).map(([german, english]) => [english, german]));

export function SiteHeader({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const english = pathname === "/en" || pathname.startsWith("/en/");
  const items = english ? navigationEnglish : navigation;
  const languageHref = english ? englishToGerman[pathname] ?? "/" : germanToEnglish[pathname] ?? "/en";
  return (
    <header className={"site-header " + (dark ? "solid-header" : "")}>
      <a className="brand" href={english ? "/en" : "/"} aria-label={english ? "Vienna Flight home" : "Vienna Flight Startseite"}><span className="brand-mark">VF</span><span>VIENNA <b>FLIGHT</b></span></a>
      <nav className={open ? "nav open" : "nav"} aria-label={english ? "Main navigation" : "Hauptnavigation"}>
        {items.map(([href, label]) => <a href={href} key={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>{label}</a>)}
      </nav>
      <a className="language-switch" href={languageHref} aria-label={english ? "Zur deutschen Version" : "Switch to English"}>{english ? "DE" : "EN"}</a>
      <a className="header-cta" href={english ? "/en/booking" : "/buchen"} aria-current={["/buchen", "/en/booking"].includes(pathname)}>{english ? "Book a flight" : "Flug buchen"} <span>↗</span></a>
      <button className="menu-button" aria-label={english ? (open ? "Close menu" : "Open menu") : (open ? "Menü schließen" : "Menü öffnen")} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "×" : "☰"}</button>
    </header>
  );
}
