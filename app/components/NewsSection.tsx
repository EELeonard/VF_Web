"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { NewsPost } from "../lib/admin-db";
import { formatDateNumeric } from "../lib/date-format";

export function NewsSection() {
  const pathname = usePathname();
  const english = pathname.startsWith("/en");
  const [posts, setPosts] = useState<NewsPost[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/news", { signal: controller.signal, cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("News unavailable")))
      .then((data: { posts?: NewsPost[] }) => setPosts(data.posts ?? []))
      .catch((error: unknown) => {
        if (!(error instanceof Error && error.name === "AbortError")) setPosts([]);
      });
    return () => controller.abort();
  }, []);

  if (posts.length === 0) return null;

  return <section className="news-section section" aria-labelledby="news-heading">
    <div className="section-head reveal">
      <div><div className="eyebrow dark"><span /> {english ? "News and offers" : "News und Aktionen"}</div><h2 id="news-heading">{english ? <>Currently at<br />Vienna Flight.</> : <>Aktuell bei<br />Vienna Flight.</>}</h2></div>
      <p>{english ? "Special offers, new experiences and important updates from our simulator centre." : "Aktionen, neue Erlebnisse und wichtige Neuigkeiten aus unserem Simulatorzentrum."}</p>
    </div>
    <div className="news-grid">
      {posts.map((post, index) => <article className={`news-card reveal${index === 0 ? " featured" : ""}`} key={post.id} style={{ transitionDelay: `${index * 70}ms` }}>
        <div><span className="news-kicker">{english ? "Update" : "Aktuell"}</span>{post.ends_at && <time>{english ? "Valid until" : "Gültig bis"} {formatDateNumeric(post.ends_at)}</time>}</div>
        <h3>{english ? post.title_en : post.title_de}</h3>
        <p>{english ? post.excerpt_en : post.excerpt_de}</p>
        <a className="text-link" href={english && post.link_url === "/buchen" ? "/en/booking" : post.link_url}>{english ? post.link_label_en : post.link_label_de} <span>→</span></a>
      </article>)}
    </div>
  </section>;
}
