import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://viennaflight.at"),
  title: "Vienna Flight | Flugsimulatorzentrum Wien",
  description: "Fliegen Sie Airbus A320, Boeing 787, Bell 206 oder Eurofighter im modernsten Flugsimulatorzentrum Wiens.",
  alternates: {
    canonical: "/",
    languages: { "de-AT": "/", "en": "/en" },
  },
  openGraph: {
    title: "Vienna Flight | Einsteigen. Abheben. Staunen.",
    description: "Vier außergewöhnliche Flugsimulatoren im Herzen von Wien.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Vienna Flight Flugsimulatorzentrum Wien" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vienna Flight | Einsteigen. Abheben. Staunen.",
    description: "Vier außergewöhnliche Flugsimulatoren im Herzen von Wien.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
