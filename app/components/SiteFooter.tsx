export function SiteFooter({ language = "de" }: { language?: "de" | "en" }) {
  const english = language === "en";
  return (
    <footer id="kontakt">
      <div className="footer-top">
        <div><a className="brand footer-brand" href={english ? "/en" : "/"}><span className="brand-mark">VF</span><span>VIENNA <b>FLIGHT</b></span></a><p>Flightsimulation & Flighttraining OG<br />Schönngasse 15-17/2/Top 3, 1020 {english ? "Vienna" : "Wien"}</p></div>
        <div><span className="footer-label">{english ? "Contact" : "Kontakt"}</span><a href="tel:+4319072711">+43 1 907 27 11</a><a href="mailto:office@viennaflight.at">office@viennaflight.at</a></div>
        <div><span className="footer-label">{english ? "Simulator hours" : "Simulatorzeiten"}</span><p>{english ? "Tue to Sun, 9:30 am to 8:00 pm" : "Di bis So, 09:30 bis 20:00"}<br />{english ? "Closed on Mondays" : "Montag geschlossen"}</p></div>
        <a className="footer-arrow" href="#top" aria-label={english ? "Back to top" : "Nach oben"}>↑</a>
      </div>
      <div className="footer-bottom"><span>© 2026 Vienna Flight</span><div><a href={english ? "/en/legal-notice" : "/impressum"}>{english ? "Legal notice" : "Impressum"}</a><a href={english ? "/en/privacy" : "/datenschutz"}>{english ? "Privacy" : "Datenschutz"}</a><a href={english ? "/en/faq" : "/faq"}>FAQ</a><a href="/admin">Login</a></div><span>Made for people who dream of flying.</span></div>
    </footer>
  );
}
