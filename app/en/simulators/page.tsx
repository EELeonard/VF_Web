import type { Metadata } from "next";
import { Reveal } from "../../components/Reveal";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { simulatorsEnglish } from "../../lib/site-data";

export const metadata: Metadata = { title: "Simulators | Vienna Flight", description: "Explore all four Vienna Flight simulators in Vienna." };

export default function EnglishSimulatorsPage() {
  return <main id="top"><Reveal /><SiteHeader dark />
    <section className="page-hero fleet-page-hero"><div className="eyebrow"><span /> Our fleet</div><h1>Four cockpits.<br /><em>Endless destinations.</em></h1><p>From a relaxed commercial flight to a supersonic manoeuvre. Find the flight experience that fits you.</p></section>
    <section className="fleet-list">
      {simulatorsEnglish.map((sim, index) => <article className="fleet-item reveal" id={sim.slug} key={sim.slug}>
        <div className="fleet-image"><img src={sim.image} alt={`${sim.name} flight simulator`} /><span>0{index + 1}</span></div>
        <div className="fleet-copy">
          <div className="eyebrow dark"><span /> {sim.type}</div><h2>{sim.name}</h2><p className="fleet-lead">{sim.description}</p>
          <div className="fleet-details">{sim.details.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          <ul className="fleet-features" aria-label={`${sim.name} features`}>{sim.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <div className="feature-line"><b>Highlight</b><span>{sim.highlight}</span></div><div className="price-line"><span>30 minutes from</span><strong>€ {sim.prices[30]}</strong></div><a className="button primary" href="/en/booking">Book this simulator <span>→</span></a>
        </div>
      </article>)}
    </section>
    <SiteFooter language="en" />
  </main>;
}
