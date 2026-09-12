import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buchungsverwaltung | Vienna Flight",
  description: "Geschützter Verwaltungsbereich für Vienna Flight Buchungen.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
