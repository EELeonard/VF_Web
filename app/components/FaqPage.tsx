import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

const questions = [
  {
    de: ["Brauche ich einen Termin?", "Ja. Bitte reservieren Sie Ihren Simulatorflug vorab. Am einfachsten wählen Sie einen verfügbaren Termin direkt in unserem Online-Buchungskalender."],
    en: ["Do I need an appointment?", "Yes. Please reserve your simulator flight in advance. The easiest option is to select an available appointment in our online booking calendar."],
  },
  {
    de: ["Benötige ich Vorkenntnisse?", "Nein. Ihr Instructor erklärt Ihnen im Briefing die Steuerelemente, Systeme und Abläufe. Während des gesamten Erlebnisses begleitet er Sie als Copilot und unterstützt Sie bei Bedarf."],
    en: ["Do I need previous experience?", "No. Your instructor explains the controls, systems and procedures during the briefing. They accompany you as your copilot throughout the experience and provide assistance whenever needed."],
  },
  {
    de: ["Welche körperlichen Voraussetzungen gelten?", "Für Airbus A320 und Boeing 787 empfehlen wir maximal 110 kg Körpergewicht. Beim Bell 206 gelten etwa 2 m Körpergröße und 100 kg als Obergrenze. Für den Eurofighter empfehlen wir 1,60 bis 1,90 m und maximal 95 kg. Eine Mindestgröße von etwa 130 cm hilft dabei, alle Bedienelemente sicher zu erreichen. Der Eurofighter nutzt VR und eine Full-Motion-Plattform und ist bei Epilepsie, schweren Herz-Kreislauf-Erkrankungen oder ernsten Rückenleiden nicht geeignet. Kontaktieren Sie uns bei Abweichungen oder körperlichen Einschränkungen bitte vorab."],
    en: ["What physical requirements apply?", "For the Airbus A320 and Boeing 787, we recommend a maximum body weight of 110 kg. For the Bell 206, the recommended limits are approximately 2 m in height and 100 kg. For the Eurofighter, we recommend a height between 1.60 and 1.90 m and a maximum weight of 95 kg. A minimum height of about 130 cm helps with safely reaching all controls. The Eurofighter uses VR and a full-motion platform and is not suitable for people with epilepsy, serious cardiovascular conditions or severe back problems. Please contact us in advance regarding exceptions or physical accessibility requirements."],
  },
  {
    de: ["Gibt es ein Mindestalter?", "Der Airbus A320 ist grundsätzlich ab 9 Jahren geeignet, bei besonderer Begeisterung teilweise ab 8 Jahren. Für den Bell 206 empfehlen wir 10 bis 11 Jahre, für den Eurofighter mindestens 12 Jahre. Wir beraten Sie gerne individuell."],
    en: ["Is there a minimum age?", "The Airbus A320 is generally suitable from age 9, and in some cases from age 8. We recommend age 10 to 11 for the Bell 206 and at least age 12 for the Eurofighter. We are happy to advise you individually."],
  },
  {
    de: ["Gehört die gebuchte Flugzeit nur mir?", "Ja. Ihr gebuchtes Flugerlebnis gehört ausschließlich Ihnen. Sie müssen den Pilotenplatz nicht mit anderen Gästen teilen."],
    en: ["Is the booked flight time exclusively mine?", "Yes. Your booked flight experience is exclusively yours. You do not share the pilot seat with other guests."],
  },
  {
    de: ["Kann ich Gäste mitbringen?", "Bis zu drei Begleitpersonen können in der Regel kostenlos im Cockpit Platz nehmen und Ihren Flug verfolgen. Weitere Personen sind nach Absprache möglich. Da kein separater Wartebereich vorhanden ist, bringen Sie bitte nur Gäste mit, die den Simulatorraum betreten möchten."],
    en: ["Can I bring guests?", "Up to three accompanying guests can generally join you in the cockpit free of charge and watch your flight. Additional guests may be possible by arrangement. As there is no separate waiting area, please bring only guests who intend to enter the simulator room."],
  },
  {
    de: ["Kann ich Route, Wetter und Bedingungen wählen?", "Ja. Sie bestimmen unter anderem Route, Zielflughafen, Tageszeit und Wetter. Auch ein Start im Cold-and-Dark-Zustand oder ein bereits startbereites Cockpit sind möglich. Teilen Sie besondere Wünsche möglichst einige Tage vor dem Termin mit, damit wir alles vorbereiten können."],
    en: ["Can I choose the route, weather and conditions?", "Yes. You can choose the route, destination airport, time of day and weather, among other options. A cold-and-dark start or a cockpit ready for departure are also possible. Please tell us about special requests a few days before your appointment so we can prepare them."],
  },
  {
    de: ["Bewegen sich die Simulatoren?", "Airbus A320, Boeing 787 und Bell 206 sind fest installierte Fixed-Base-Simulatoren. Die großflächige Projektion und realistische Darstellung vermitteln dennoch ein starkes Bewegungsgefühl. Der Eurofighter verfügt zusätzlich über eine Full-Motion-Plattform."],
    en: ["Do the simulators move?", "The Airbus A320, Boeing 787 and Bell 206 are fixed-base simulators. Their large projection systems and realistic visuals still create a strong sensation of movement. The Eurofighter additionally uses a full-motion platform."],
  },
  {
    de: ["Was kostet ein Flug?", "Der Preis hängt vom Simulator und der gewählten Flugdauer ab. Alle aktuellen Preise sehen Sie direkt bei der Auswahl im Buchungskalender."],
    en: ["How much does a flight cost?", "The price depends on the simulator and selected flight duration. All current prices are shown directly when you make a selection in the booking calendar."],
  },
  {
    de: ["Kann ich das Erlebnis verschenken?", "Ja. Sie können das Flugerlebnis als Geschenkgutschein bestellen. Der Gutschein kann auf Wunsch mit dem Namen der beschenkten Person ausgestellt werden."],
    en: ["Can I give the experience as a gift?", "Yes. You can order the flight experience as a gift voucher. If requested, the voucher can be issued with the recipient's name."],
  },
  {
    de: ["Sind professionelles Training und Screening-Vorbereitung möglich?", "Ja. In unseren Simulatoren können IFR-Verfahren, Checklisten, Notverfahren sowie unterschiedliche Wetter-, Tages- und Jahreszeiten trainiert werden. Eine Instructor-Station unterstützt die individuelle Steuerung der Szenarien. Briefing und Debriefing ergänzen das Training."],
    en: ["Do you offer professional training and screening preparation?", "Yes. Our simulators support IFR procedures, checklists, emergency procedures and a wide range of weather, daylight and seasonal scenarios. An instructor station allows individual control of each scenario. Briefing and debriefing complete the training."],
  },
  {
    de: ["Kann ich meinen eigenen Instructor mitbringen?", "Ja, nach vorheriger Absprache können Sie für ein professionelles Training Ihren eigenen Instructor mitbringen. Kontaktieren Sie uns bitte vor der Buchung."],
    en: ["Can I bring my own instructor?", "Yes. By prior arrangement, you may bring your own instructor for professional training. Please contact us before booking."],
  },
  {
    de: ["Was geschieht bei einer technischen Störung?", "Kann eine Störung nicht kurzfristig behoben werden, erhalten Sie einen Ersatztermin für die noch nicht erbrachte Leistung. Bei einer raschen Behebung wird die benötigte Unterbrechung an Ihre gebuchte Zeit angehängt. Reise- oder Übernachtungsfolgekosten können nicht übernommen werden."],
    en: ["What happens in the event of a technical fault?", "If a fault cannot be resolved promptly, we offer a replacement appointment for the outstanding service. If it can be corrected quickly, the interruption is added to your booked time. Consequential travel or accommodation costs cannot be covered."],
  },
];

export function FaqPage({ language }: { language: "de" | "en" }) {
  const english = language === "en";
  return <main>
    <SiteHeader dark />
    <section className="page-hero faq-hero">
      <span className="eyebrow light"><i /> {english ? "Good to know" : "Gut zu wissen"}</span>
      <h1>{english ? "Frequently asked questions." : "Häufig gestellte Fragen."}</h1>
      <p>{english ? "Everything you need to know before your flight experience." : "Alles Wichtige vor Ihrem Flugerlebnis kompakt beantwortet."}</p>
    </section>
    <section className="faq-section">
      <div className="faq-intro"><span className="micro-label">FAQ</span><h2>{english ? "Ready for takeoff." : "Bereit zum Abheben."}</h2><p>{english ? "Open a question to see the answer. If anything remains unclear, our team will be happy to help." : "Öffnen Sie eine Frage, um die Antwort zu lesen. Für alles Weitere ist unser Team gerne persönlich für Sie da."}</p></div>
      <div className="faq-list">
        {questions.map((question, index) => { const [title, answer] = question[language]; return <details key={title} open={index === 0}><summary><span>{String(index + 1).padStart(2, "0")}</span><b>{title}</b><i aria-hidden="true">+</i></summary><p>{answer}</p></details>; })}
      </div>
      <div className="faq-contact"><div><span className="micro-label">{english ? "Any questions left?" : "Noch Fragen?"}</span><h2>{english ? "Talk to our team." : "Sprechen Sie mit uns."}</h2></div><div><a href="tel:+4319072711">+43 1 907 27 11</a><a href="mailto:office@viennaflight.at">office@viennaflight.at</a></div></div>
    </section>
    <SiteFooter language={language} />
  </main>;
}
