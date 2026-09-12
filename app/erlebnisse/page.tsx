import type { Metadata } from "next";
import { Reveal } from "../components/Reveal";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = { title: "Flugerlebnisse | Vienna Flight", description: "Fun Flights, Gutscheine, Firmenevents und professionelle Vorbereitung bei Vienna Flight." };

const experiences = [
  { number: "01", title: "Fun Flights", text: "Das perfekte Abenteuer für Flugbegeisterte, Neugierige und alle, die einmal selbst am Steuer sitzen möchten.", link: "/buchen", action: "Termin wählen" },
  { number: "02", title: "Geschenkgutscheine", text: "Verschenken Sie Vorfreude und ein echtes Cockpit-Erlebnis. Digital oder hochwertig per Post erhältlich.", link: "/buchen", action: "Gutschein konfigurieren" },
  { number: "03", title: "Firmen und Gruppen", text: "Teamgeist auf einer neuen Flughöhe. Individuelle Events mit mehreren Simulatoren und persönlichem Ablauf.", link: "/kontakt", action: "Event anfragen" },
  { number: "04", title: "Screening Vorbereitung", text: "Gezielte Vorbereitung auf Airline-Auswahlverfahren, begleitet von erfahrenen Piloten und Trainern.", link: "/kontakt", action: "Beratung anfragen" },
];

export default function ExperiencesPage() {
  return <main id="top"><Reveal /><SiteHeader dark />
    <section className="page-hero experience-page-hero"><div className="eyebrow"><span /> Mehr als Simulation</div><h1>Erlebnisse, die<br /><em>Auftrieb geben.</em></h1><p>Privat, als Geschenk oder im Team. Wir machen Ihre Zeit im Cockpit persönlich und unvergesslich.</p></section>
    <section className="experience-cards section">{experiences.map((item) => <article className="experience-card reveal" key={item.number}><span>{item.number}</span><h2>{item.title}</h2><p>{item.text}</p><a className="text-link" href={item.link}>{item.action} <b>→</b></a></article>)}</section>
    <section className="process-section"><div className="section-head reveal"><div><div className="eyebrow dark"><span /> Ihr Flug</div><h2>Vom Briefing<br />bis zur Landung.</h2></div><p>Ein klarer Ablauf gibt Sicherheit. Ihr Instruktor stimmt jedes Detail auf Ihre Erfahrung und Wünsche ab.</p></div><div className="process-grid">{["Ankommen und kennenlernen","Cockpit und Route besprechen","Selbst starten und fliegen","Debriefing und Erinnerungsurkunde"].map((step, index) => <div className="process-step reveal" key={step}><span>0{index + 1}</span><h3>{step}</h3></div>)}</div></section>
    <section className="booking-teaser"><div><span className="eyebrow light"><i /> Ihr AIRLebnis</span><h2>Welcher Flug passt zu Ihnen?</h2></div><a className="button light-button" href="/buchen">Verfügbarkeit prüfen <span>→</span></a></section>
    <SiteFooter />
  </main>;
}
