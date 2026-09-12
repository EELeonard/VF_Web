import type { Metadata } from "next";
import { Reveal } from "../components/Reveal";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = {
  title: "Simulator Screening Vorbereitung | Vienna Flight",
  description: "Professionelle und airlinespezifische Simulator Assessment Vorbereitung im originalen Airbus A320 Cockpit.",
};

const procedures = [
  "An- und Abflugverfahren, SID und STAR",
  "Precision und Non-Precision Approaches",
  "Pitch und Power Configuration",
  "Holding Procedures und Holding Entry",
  "Instrument Cross Check",
  "Airwork, Steep Turns, Climb und Descent",
  "Wind Correction, Go-Around und Missed Approach",
  "Crew Resource Management",
];

export default function ScreeningPage() {
  return <main id="top"><Reveal /><SiteHeader dark />
    <section className="page-hero screening-page-hero"><div className="eyebrow"><span /> Für angehende Piloten</div><h1>Bereit für Ihr<br /><em>Simulator Screening.</em></h1><p>Airlinespezifische Vorbereitung mit erfahrenen Linienpiloten im originalen Airbus A320 Simulator.</p></section>

    <section className="professional-intro">
      <div className="professional-image reveal"><img src="/images/screening.jpg" alt="Simulator Assessment Vorbereitung bei Vienna Flight" /><span>Assessment<br />Preparation</span></div>
      <div className="professional-copy reveal"><div className="eyebrow dark"><span /> Professionell vorbereitet</div><h2>Überlassen Sie Ihre<br />Pilotenkarriere nicht<br />dem Zufall.</h2><p>Unser Netzwerk aus erfahrenen Instruktoren, Fluglehrern und aktiven Berufs- und Linienpiloten unterstützt Sie in Theorie und Praxis. Das Training wird auf die Abläufe und Programme Ihrer Zielairline abgestimmt.</p><p>Nach jeder Session erhalten Sie ein strukturiertes Debriefing mit konkreten Empfehlungen für Ihre weitere Vorbereitung.</p><a className="button primary" href="/kontakt">Training anfragen <span>→</span></a></div>
    </section>

    <section className="screening-content section">
      <div className="section-head reveal"><div><div className="eyebrow dark"><span /> Trainingsinhalte</div><h2>Gezielt trainieren.<br />Sicher auftreten.</h2></div><p>Der Airbus A320 Simulator ist vollständig instrumentiert. Wetterbedingungen, Verfahrensabläufe und unterschiedliche Fehlersituationen können kontrolliert trainiert werden.</p></div>
      <div className="procedure-grid">{procedures.map((procedure, index) => <div className="procedure reveal" key={procedure}><span>{String(index + 1).padStart(2, "0")}</span><p>{procedure}</p></div>)}</div>
      <div className="screening-note reveal"><strong>Wichtiger Hinweis</strong><p>Fun Flight Gutscheine und Rabattaktionen können nicht für Pilotenvorbereitungen oder professionelles Pilotentraining verwendet werden.</p></div>
    </section>

    <section className="booking-teaser"><div><span className="eyebrow light"><i /> Ihr nächster Karriereschritt</span><h2>Individuelles Training planen.</h2></div><a className="button light-button" href="/kontakt">Beratung anfragen <span>→</span></a></section>
    <SiteFooter />
  </main>;
}
