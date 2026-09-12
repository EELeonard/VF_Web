import type { Metadata } from "next";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = { title: "Kontakt | Vienna Flight", description: "Kontakt und Anfahrt zum Vienna Flight Flugsimulatorzentrum in 1020 Wien." };

export default function ContactPage() {
  return <main id="top"><SiteHeader dark />
    <section className="page-hero contact-page-hero"><div className="eyebrow"><span /> Kontakt und Anfahrt</div><h1>Wir freuen uns<br /><em>auf Sie.</em></h1><p>Fragen, Gruppenbuchungen oder besondere Wünsche? Unser Team hilft gerne persönlich weiter.</p></section>
    <section className="contact-layout">
      <div className="contact-details"><div><span className="micro-label">Adresse</span><h2>Schönngasse 15-17/2/Top 3<br />1020 Wien</h2><p>Gut erreichbar mit öffentlichen Verkehrsmitteln. Bitte planen Sie 15 Minuten vor Ihrem Termin ein.</p></div><div className="contact-columns"><div><span className="micro-label">Telefon</span><a href="tel:+4319072711">+43 1 907 27 11</a></div><div><span className="micro-label">E-Mail</span><a href="mailto:office@viennaflight.at">office@viennaflight.at</a></div><div><span className="micro-label">Büro</span><p>Di bis Sa, 09:00 bis 17:00</p></div><div><span className="micro-label">Simulatoren</span><p>Di bis So, 09:30 bis 20:00</p></div></div></div>
      <form className="contact-form"><span className="micro-label">Nachricht senden</span><label>Name<input type="text" required placeholder="Vor- und Nachname" /></label><label>E-Mail<input type="email" required placeholder="name@beispiel.at" /></label><label>Betreff<select defaultValue="allgemein"><option value="allgemein">Allgemeine Anfrage</option><option value="gruppe">Firmen und Gruppen</option><option value="training">Screening Vorbereitung</option></select></label><label>Nachricht<textarea rows={6} required placeholder="Wie können wir helfen?" /></label><button className="button primary" type="submit">Nachricht vorbereiten <span>→</span></button><small>Das Formular ist für die lokale Vorschau vorbereitet. Beim Launch wird es mit dem finalen Postfach verbunden.</small></form>
    </section>
    <SiteFooter />
  </main>;
}
