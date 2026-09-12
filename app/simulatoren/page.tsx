import type { Metadata } from "next";
import { Reveal } from "../components/Reveal";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";
import { simulators } from "../lib/site-data";

export const metadata: Metadata = { title: "Simulatoren | Vienna Flight", description: "Entdecken Sie alle vier Vienna Flight Simulatoren in Wien." };

export default function SimulatorsPage() {
  return <main id="top"><Reveal /><SiteHeader dark />
    <section className="page-hero fleet-page-hero"><div className="eyebrow"><span /> Unsere Flotte</div><h1>Vier Cockpits.<br /><em>Unendlich viele Ziele.</em></h1><p>Vom entspannten Linienflug bis zum Überschallmanöver. Finden Sie das Flugerlebnis, das zu Ihnen passt.</p></section>
    <section className="fleet-list">
      {simulators.map((sim, index) => <article className="fleet-item reveal" id={sim.slug} key={sim.slug}>
        <div className="fleet-image"><img src={sim.image} alt={sim.name + " Flugsimulator"} /><span>0{index + 1}</span></div>
        <div className="fleet-copy">
          <div className="eyebrow dark"><span /> {sim.type}</div><h2>{sim.name}</h2><p className="fleet-lead">{sim.description}</p>
          <div className="fleet-details">{sim.details.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          <ul className="fleet-features" aria-label={sim.name + " Ausstattungsmerkmale"}>{sim.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <div className="feature-line"><b>Besonderheit</b><span>{sim.highlight}</span></div><div className="price-line"><span>30 Minuten ab</span><strong>€ {sim.prices[30]}</strong></div><a className="button primary" href="/buchen">Diesen Simulator buchen <span>→</span></a>
        </div>
      </article>)}
    </section>
    <SiteFooter />
  </main>;
}
