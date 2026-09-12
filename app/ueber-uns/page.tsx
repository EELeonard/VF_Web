import type { Metadata } from "next";
import { Reveal } from "../components/Reveal";
import { SiteFooter } from "../components/SiteFooter";
import { SiteHeader } from "../components/SiteHeader";

export const metadata: Metadata = { title: "Über uns | Vienna Flight", description: "Lernen Sie das Team und die Geschichte des Wiener Flugsimulatorzentrums kennen." };

export default function AboutPage() {
  return <main id="top"><Reveal /><SiteHeader dark />
    <section className="page-hero about-page-hero"><div className="eyebrow"><span /> Vienna Flight</div><h1>Aus Leidenschaft<br /><em>fürs Fliegen.</em></h1><p>Professionelle Begleitung, echte Cockpits und die Begeisterung, Menschen sicher in die Luft zu bringen.</p></section>
    <section className="story-section"><div className="story-copy reveal"><div className="eyebrow dark"><span /> Unsere Geschichte</div><h2>Fliegen soll man<br />nicht nur träumen.</h2><p>Vienna Flight entstand aus einer einfachen Idee: Die Faszination eines echten Cockpits sollte für alle zugänglich sein. Heute begleiten unsere flugerfahrenen Instruktoren Gäste vom ersten Start bis zur anspruchsvollen Trainingssession.</p><p>Was uns antreibt, ist der Moment, in dem aus Konzentration ein Lächeln wird. Darum verbinden wir Technik, Gastfreundschaft und fundierte Anleitung zu einem Erlebnis auf höchstem Niveau.</p></div><div className="story-image reveal"><img src="/images/cockpit-hero.jpg" alt="Airbus Cockpit bei Vienna Flight" /></div></section>
    <section className="values section"><div className="section-head reveal"><div><div className="eyebrow dark"><span /> Wofür wir stehen</div><h2>Präzision trifft<br />Begeisterung.</h2></div></div><div className="value-grid"><article><span>01</span><h3>Authentizität</h3><p>Originale Komponenten und realistische Abläufe machen den Unterschied.</p></article><article><span>02</span><h3>Persönlichkeit</h3><p>Jeder Flug wird auf Erfahrung, Wünsche und Tempo des Gastes abgestimmt.</p></article><article><span>03</span><h3>Professionalität</h3><p>Erfahrene Instruktoren sorgen für klare Anleitung und ein sicheres Erlebnis.</p></article></div></section>
    <SiteFooter />
  </main>;
}
