import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flug buchen | Vienna Flight",
  description: "Wählen Sie Simulator, Flugdauer und verfügbaren Termin im Vienna Flight Buchungskalender.",
};

export default function BookingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
