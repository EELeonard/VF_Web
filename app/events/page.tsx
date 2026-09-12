import type { Metadata } from "next";
import { Reveal } from "../components/Reveal";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Events und Flugangstseminare | Vienna Flight",
  description: "Firmenevents, Gruppenveranstaltungen und Flugangstseminare im Vienna Flight Flugsimulatorzentrum.",
};

const eventFacts = [
  ["220 m²", "Gesamtfläche für Ihr Event"],
  ["Mehrere Cockpits", "Airbus, Boeing und Bell im Team erleben"],
  ["Aktive Piloten", "Persönliche Betreuung und Fragerunden"],
  ["Zentrale Lage", "Rund drei Gehminuten von der U2"],
];

export default function EventsPage() {
  return <main id="top"><Reveal /><SiteHeader dark />
    <section className="page-hero events-page-hero"><div className="eyebrow"><span /> Fly your event</div><h1>Gemeinsam<br /><em>höher hinaus.</em></h1><p>Außergewöhnliche Firmen- und Gruppenevents sowie ein besonderer Zugang zum Thema Flugangst.</p></section>

    <section className="event-feature">
      <div className="event-feature-copy reveal"><div className="eyebrow dark"><span /> Gruppen und Firmen</div><h2>Ein Event, das<br />wirklich abhebt.</h2><p>Ob Betriebsfeier, Mitarbeitermotivation, Jubiläum oder private Feier: Ihre Gäste übernehmen selbst das Steuer und werden von aktiven Piloten durch ihr Cockpit-Erlebnis begleitet.</p><p>Ablauf, Dauer, Verpflegung und Inhalte werden individuell auf Ihre Gruppe abgestimmt. Gerne organisieren wir auch Welcome Drink, Catering und eine persönliche Erinnerungsurkunde.</p><a className="button primary" href="/kontakt">Event anfragen <span>→</span></a></div>
      <div className="event-feature-image reveal"><img src="/images/events.jpg" alt="Gruppen- und Firmenevent bei Vienna Flight" /><span>Welcome<br />on board</span></div>
    </section>

    <section className="event-facts section"><div className="eyebrow dark reveal"><span /> Facts und Möglichkeiten</div><div className="event-fact-grid">{eventFacts.map(([value, label], index) => <article className="reveal" key={value}><span>0{index + 1}</span><h3>{value}</h3><p>{label}</p></article>)}</div></section>

    <section className="anxiety-section">
      <div className="anxiety-image reveal"><img src="/images/flight-anxiety.jpg" alt="Flugangstseminar im Airbus A320 Simulator" /></div>
      <div className="anxiety-copy reveal"><div className="eyebrow"><span /> Flugangst Seminar</div><h2>Kontrolle übernehmen.<br /><em>Vertrauen gewinnen.</em></h2><p>Im dreitägigen Seminar erarbeiten die Teilnehmenden individuelle Lösungswege für entspannteres Fliegen. Das Konzept orientiert sich an der systemisch lösungsorientierten Kurzzeittherapie und stärkt persönliche Ressourcen.</p><p>Der entscheidende Unterschied: Sie übernehmen selbst die Kontrolle über unseren Airbus A320 Simulator und erleben Cockpitabläufe, Zusammenarbeit und Sicherheit aus einer neuen Perspektive.</p><a className="button light-button" href="/kontakt">Seminar anfragen <span>→</span></a></div>
    </section>

    <section className="booking-teaser"><div><span className="eyebrow light"><i /> Individuell geplant</span><h2>Erzählen Sie uns von Ihrem Event.</h2></div><a className="button light-button" href="/kontakt">Gespräch vereinbaren <span>→</span></a></section>
    <SiteFooter />
  </main>;
}
