import type { Metadata } from "next";
import { Reveal } from "../../components/Reveal";
import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";

export const metadata: Metadata = { title:"Flight Experiences | Vienna Flight", description:"Fun flights, gift vouchers, group events and professional preparation at Vienna Flight." };
const experiences = [
  ["Fun flights","The perfect adventure for aviation enthusiasts, curious minds and anyone who wants to take the controls.","/en/booking","Choose an appointment"],
  ["Gift vouchers","Give anticipation and a real cockpit experience, delivered digitally or as a premium printed voucher.","/en/booking","Configure a voucher"],
  ["Companies and groups","Take team spirit to a new altitude with several simulators and a programme tailored to your group.","/en/contact","Enquire about an event"],
  ["Screening preparation","Prepare for airline selection procedures with experienced pilots and trainers.","/en/contact","Request advice"],
];
export default function EnglishExperiencesPage() {
  return <main id="top"><Reveal /><SiteHeader dark /><section className="page-hero experience-page-hero"><div className="eyebrow"><span /> More than simulation</div><h1>Experiences that<br /><em>lift you higher.</em></h1><p>For yourself, as a gift or with your team. We make your time in the cockpit personal and unforgettable.</p></section><section className="experience-cards section">{experiences.map(([title,text,link,action],index) => <article className="experience-card reveal" key={title}><span>0{index + 1}</span><h2>{title}</h2><p>{text}</p><a className="text-link" href={link}>{action} <b>→</b></a></article>)}</section><section className="process-section"><div className="section-head reveal"><div><div className="eyebrow dark"><span /> Your flight</div><h2>From briefing<br />to landing.</h2></div><p>A clear process creates confidence. Your instructor tailors every detail to your experience and preferences.</p></div><div className="process-grid">{["Arrive and meet your instructor","Discuss the cockpit and route","Take off and fly yourself","Debriefing and certificate"].map((step,index) => <div className="process-step reveal" key={step}><span>0{index + 1}</span><h3>{step}</h3></div>)}</div></section><section className="booking-teaser"><div><span className="eyebrow light"><i /> Your flight experience</span><h2>Which flight suits you?</h2></div><a className="button light-button" href="/en/booking">Check availability <span>→</span></a></section><SiteFooter language="en" /></main>;
}
