"use client";

import { useEffect } from "react";

export function Reveal() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const tracked = new WeakSet<Element>();

    function show(element: Element) {
      element.classList.remove("reveal-pending");
      element.classList.add("visible");
    }

    function isInViewport(element: Element) {
      const bounds = element.getBoundingClientRect();
      return bounds.top <= window.innerHeight * 1.02 && bounds.bottom >= -24;
    }

    if (reducedMotion.matches || typeof IntersectionObserver === "undefined") {
      document.querySelectorAll(".reveal").forEach(show);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        observer.unobserve(entry.target);
      }),
      { rootMargin: "0px 0px -6% 0px", threshold: 0.01 },
    );

    function track(element: Element) {
      if (tracked.has(element)) return;
      tracked.add(element);
      if (isInViewport(element)) show(element);
      else {
        element.classList.add("reveal-pending");
        observer.observe(element);
      }
    }

    function trackTree(root: ParentNode) {
      if (root instanceof Element && root.matches(".reveal")) track(root);
      root.querySelectorAll(".reveal").forEach(track);
    }

    function revealVisibleContent() {
      document.querySelectorAll(".reveal-pending").forEach((element) => {
        if (isInViewport(element)) {
          show(element);
          observer.unobserve(element);
        }
      });
    }

    trackTree(document);
    const mutations = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node instanceof Element) trackTree(node);
    })));
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", revealVisibleContent, { passive: true });
    window.addEventListener("resize", revealVisibleContent, { passive: true });
    window.addEventListener("pageshow", revealVisibleContent);
    document.addEventListener("visibilitychange", revealVisibleContent);

    return () => {
      document.querySelectorAll(".reveal-pending").forEach(show);
      mutations.disconnect();
      observer.disconnect();
      window.removeEventListener("scroll", revealVisibleContent);
      window.removeEventListener("resize", revealVisibleContent);
      window.removeEventListener("pageshow", revealVisibleContent);
      document.removeEventListener("visibilitychange", revealVisibleContent);
    };
  }, []);
  return null;
}
