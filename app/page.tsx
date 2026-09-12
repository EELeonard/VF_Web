import { Reveal } from "./components/Reveal";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { NewsSection } from "./components/NewsSection";
import { simulators } from "./lib/site-data";

export default function Home() {
  return (
    <main>
      <Reveal />
      <SiteHeader />
      <section className="hero" id="top">
        <div className="hero-image" aria-hidden="true" /><div className="hero-shade" />
        <div className="hero-content">
          <div className="eyebrow"><span /> Flugsimulatorzentrum Wien</div>
          <h1>Einsteigen.<br />Abheben.<br /><em>Staunen.</em></h1>
          <p>Vier außergewöhnliche Simulatoren. Echte Cockpits. Ein Erlebnis, das noch lange nach der Landung bleibt.</p>
          <div className="hero-actions"><a className="button primary" href="/buchen">Erlebnis buchen <span>→</span></a><a className="button ghost" href="/simulatoren">Simulatoren entdecken</a></div>
        </div>
        <div className="hero-stats"><div><strong>4</strong><span>Simulatoren</span></div><div><strong>24.000+</strong><span>Flughäfen</span></div><div><strong>100%</strong><span>Fluggefühl</span></div></div>
        <div className="scroll-note">Scroll to explore <span>↓</span></div>
      </section>

      <NewsSection />

      <section className="simulators section" id="simulatoren">
        <div className="section-head reveal">
          <div><div className="eyebrow dark"><span /> Unsere Flotte</div><h2>Welches Cockpit<br />darf es sein?</h2></div>
          <p>Vom Linienflug über Wien bis zum rasanten Einsatz im Eurofighter. Unsere erfahrenen Instruktoren machen jeden Flug zu Ihrem persönlichen AIRLebnis.</p>
        </div>
        <div className="simulator-grid">
          {simulators.map((sim, index) => (
            <a className="sim-card reveal" href={"/simulatoren#" + sim.slug} key={sim.name} style={{ transitionDelay: index * 80 + "ms" }} aria-label={sim.name + ": vollständige Beschreibung ansehen"}>
              <img src={sim.image} alt={sim.name + " Flugsimulator"} /><div className="sim-overlay" /><div className="sim-index">0{index + 1}</div>
              <div className="sim-copy"><span>{sim.type}</span><h3>{sim.name}</h3><p>ab € {sim.prices[30]}</p></div>
              <span className="round-link" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
        <div className="section-action reveal"><a className="text-link" href="/simulatoren">Alle Simulatoren im Detail <span>→</span></a></div>
      </section>

      <section className="experience" id="erlebnis">
        <div className="experience-image reveal"><img src="/images/a320.jpg" alt="Cockpit des Airbus A320 Simulators" /><span className="image-tag">Echtes Cockpit<br />Echte Emotionen</span></div>
        <div className="experience-copy reveal">
          <div className="eyebrow dark"><span /> Das Erlebnis</div>
          <h2>Für einen Moment<br /><em>Pilot sein.</em></h2>
          <p>Nehmen Sie im originalen Cockpit Platz. Ihr persönlicher Instruktor begleitet Sie vom Briefing bis zur perfekten Landung. Vorkenntnisse brauchen Sie keine, nur Lust aufs Fliegen.</p>
          <ul><li><b>01</b><span><strong>Persönliches Briefing</strong>Alles Wichtige kompakt erklärt.</span></li><li><b>02</b><span><strong>Ihre Route, Ihr Wetter</strong>Starten Sie an einem Wunschflughafen.</span></li><li><b>03</b><span><strong>Debriefing und Urkunde</strong>Eine Erinnerung, die bleibt.</span></li></ul>
          <a className="text-link" href="/erlebnisse">So läuft Ihr Flug ab <span>→</span></a>
        </div>
      </section>

      <section className="specialist-section section">
        <div className="section-head reveal"><div><div className="eyebrow dark"><span /> Events und Training</div><h2>Gemeinsam abheben.<br />Gezielt vorbereiten.</h2></div><p>Von maßgeschneiderten Gruppenerlebnissen bis zur professionellen Simulator-Assessment-Vorbereitung.</p></div>
        <div className="specialist-grid">
          <article className="specialist-card reveal"><img src="/images/events.jpg" alt="Gruppen- und Firmenevent bei Vienna Flight" /><div className="specialist-shade" /><span>Events</span><h3>Fly your event.</h3><p>Firmenfeiern, Gruppenflüge und Flugangstseminare in einer außergewöhnlichen Location.</p><a href="/events">Events entdecken <b>→</b></a></article>
          <article className="specialist-card reveal"><img src="/images/screening.jpg" alt="Simulator Screening Vorbereitung bei Vienna Flight" /><div className="specialist-shade" /><span>Professional Training</span><h3>Bereit fürs Screening.</h3><p>Airlinespezifische Assessment-Vorbereitung mit erfahrenen Linienpiloten im Airbus A320.</p><a href="/screening">Training ansehen <b>→</b></a></article>
        </div>
      </section>

      <section className="booking-teaser" id="buchen">
        <div><span className="eyebrow light"><i /> Ready for takeoff?</span><h2>Ihr Cockpit wartet.</h2><p>Im Buchungskalender sehen Sie alle verfügbaren Termine auf einen Blick.</p></div>
        <a className="button light-button" href="/buchen">Kalender öffnen <span>→</span></a>
      </section>

      <section className="testimonials section">
        <div className="eyebrow dark reveal"><span /> Stimmen unserer Gäste</div>
        <div className="quote reveal"><span className="quote-mark">“</span><blockquote>Ein absolut großartiges Erlebnis. Der Instruktor war fantastisch und die Landung in Innsbruck werde ich nie vergessen.</blockquote><div><strong>MAXIMILIAN K.</strong><span>Airbus A320 Fun Flight</span></div></div>
        <div className="rating-row reveal"><div><strong>4,9</strong><span>Google Reviews</span></div><div className="stars">★★★★★</div><p>Von Flugbegeisterten empfohlen</p></div>
      </section>
      <SiteFooter />
    </main>
  );
}
