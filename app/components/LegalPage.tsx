import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function LegalPage({ eyebrow, title, intro, language = "de", children }: { eyebrow: string; title: string; intro: string; language?: "de" | "en"; children: ReactNode }) {
  return <main id="top">
    <SiteHeader dark />
    <section className="page-hero legal-hero"><div className="eyebrow"><span /> {eyebrow}</div><h1>{title}</h1><p>{intro}</p></section>
    <article className="legal-content">{children}</article>
    <SiteFooter language={language} />
  </main>;
}
