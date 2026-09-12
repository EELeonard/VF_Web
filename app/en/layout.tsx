import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vienna Flight | Flight Simulator Centre Vienna",
  description: "Fly the Airbus A320, Boeing 787, Bell 206 or Eurofighter at Vienna's flight simulator centre.",
  alternates: {
    canonical: "/en",
    languages: { "de-AT": "/", "en": "/en" },
  },
};

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <div lang="en">{children}</div>;
}
