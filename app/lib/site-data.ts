export type Simulator = {
  slug: string;
  name: string;
  type: string;
  image: string;
  description: string;
  details: string[];
  features: string[];
  highlight: string;
  prices: Record<number, number>;
};

export const simulators: Simulator[] = [
  {
    slug: "airbus-a320",
    name: "Airbus A320",
    type: "Original Cockpit",
    image: "/images/a320.jpg",
    description: "Fliegen Sie in einem Cockpit aus originalen Airbus-Komponenten. Vom Engine Start bis zur Landung erleben Sie den Linienflug hautnah.",
    details: [
      "Der Airbus A320 brachte die vollständig digitale Fly-by-wire-Steuerung in die zivile Luftfahrt. Bei Vienna Flight nehmen Sie in einem originalen A320 Cockpit Platz, dessen Komponenten bereits in einem echten Flugzeug im Einsatz waren.",
      "Rund 95 Prozent Originalteile, eine sieben Meter breite kantenlose 180°-Projektion und eine mehrkanalige Soundkulisse vermitteln den Arbeitsplatz eines Linienpiloten besonders authentisch. Ein erfahrener Instruktor begleitet Sie vom Start der Systeme bis zur Landung.",
      "Route, Wetter, Tageszeit und technische Situationen lassen sich individuell einstellen. Damit eignet sich der Simulator sowohl für den ersten Fun Flight als auch für Verfahrensübungen und professionelle Screeningvorbereitung.",
    ],
    features: ["Originales A320 Cockpit", "Digitale Fly-by-wire-Steuerung", "7 m breite 180°-Projektion", "Individuelle Wetter- und Systemszenarien"],
    highlight: "Originalteile aus einem echten Airbus",
    prices: { 30: 89, 60: 169, 90: 250, 120: 290 },
  },
  {
    slug: "boeing-787",
    name: "Boeing 787",
    type: "Dreamliner",
    image: "/images/boeing.jpg",
    description: "Entdecken Sie das moderne Widebody-Cockpit des Dreamliners und steuern Sie eines der innovativsten Langstreckenflugzeuge der Welt.",
    details: [
      "Der Boeing 787 Dreamliner verbindet die klassische Steuerung über ein Yoke mit moderner Fly-by-wire-Technik. Nehmen Sie am Captain's Seat Platz und erleben Sie einen Langstreckenjet, dessen Leichtbauweise und Aerodynamik neue Maßstäbe gesetzt haben.",
      "Das originalgetreue Cockpit enthält echte Boeing Komponenten. Ein kantenloses 180°-Sichtsystem, realistische Geräusche und spürbare Vibrationen unter den Sitzen schaffen ein intensives Cockpitgefühl.",
      "Ob ruhiger Flug zu einem exotischen Ziel, Instrumentenflug, Cold-and-Dark-Start oder anspruchsvolles Wetter: Ein Instruktor aus der realen Luftfahrt stimmt Route und Schwierigkeitsgrad auf Ihre Wünsche und Erfahrung ab.",
    ],
    features: ["Europas besonderer 787 Fixed Base Simulator", "Yoke und Fly-by-wire", "180°-Sichtsystem", "Sound und spürbare Sitzvibrationen"],
    highlight: "Europas erster 787 Fixed Base Simulator",
    prices: { 30: 89, 60: 169, 90: 250, 120: 290 },
  },
  {
    slug: "bell-206",
    name: "Bell 206",
    type: "Jet Ranger",
    image: "/images/bell.jpg",
    description: "Schweben, drehen, punktgenau landen. Der originale Bell 206 Jet Ranger stellt Koordination und Fingerspitzengefühl auf die Probe.",
    details: [
      "Ein Hubschrauber fliegt völlig anders als ein Flächenflugzeug. Im Bell 206 Jet Ranger koordinieren Sie Steuerknüppel, Collective und Pedale gleichzeitig und erleben unmittelbar, wie fein der Helikopter auf jede Eingabe reagiert.",
      "Der Simulator ist seinem realen Vorbild mit Originalteilen und präzisen Nachbauten nahezu vollständig nachempfunden. Doppelsteuer, Instrumente sowie Funk- und Navigationsgeräte funktionieren wie im echten Hubschrauber. Die kantenlose 220°-Rundleinwand macht Sichtflug besonders eindrucksvoll.",
      "Fliegen Sie über Wien, durch Venedig, entlang der Alpen oder über New York bei Nacht. Echte Helikopterpiloten begleiten Sie beim Turbinenstart, bei Schwebeflügen sowie bei Starts und Landungen unter frei wählbaren Wetterbedingungen.",
    ],
    features: ["Originalteile und präzise Nachbauten", "Kantenlose 220°-Rundleinwand", "Voll funktionsfähige Doppelsteuerung", "Begleitung durch Helikopterpiloten"],
    highlight: "Originaler Hubschrauber in Österreich",
    prices: { 30: 89, 60: 169, 90: 250, 120: 290 },
  },
  {
    slug: "eurofighter",
    name: "Eurofighter",
    type: "Full Motion VR",
    image: "/images/eurofighter.jpg",
    description: "Volle Bewegungsfreiheit, Virtual Reality und Überschallmissionen machen diesen Simulator zum intensivsten Flugerlebnis unserer Flotte.",
    details: [
      "Im Eurofighter Typhoon erleben Sie ein auf Action ausgelegtes Flugerlebnis. Das Cockpit ist dem Original im Maßstab 1:1 nachempfunden und bildet Schalter, Displays, Regler und den Schleudersitz detailreich ab.",
      "Virtual Reality versetzt Sie direkt in Cockpit und Außenwelt. Eine professionelle 6-DOF-Motion-Plattform bewegt sich um sechs Achsen und überträgt Beschleunigung, Kurvenflug und Flugmanöver spürbar auf den Sitz.",
      "Wählen Sie Starts und Landungen, Luftraumüberwachung, Begleitflüge, Abfangmanöver oder Anflüge auf einen Flugzeugträger. Ein Instruktor führt Sie in Steuerung und Systeme ein, bevor Sie Ihr persönliches Einsatzszenario fliegen.",
    ],
    features: ["Cockpit im Maßstab 1:1", "Virtual Reality", "Professionelle 6-DOF-Motion-Plattform", "Individuell wählbare Missionen"],
    highlight: "6-DOF Motion Plattform mit VR",
    prices: { 30: 89, 60: 169 },
  },
];

export const simulatorsEnglish: Simulator[] = [
  {
    ...simulators[0],
    type: "Original cockpit",
    description: "Fly in a cockpit built with original Airbus components. From engine start to landing, experience commercial aviation first-hand.",
    details: [
      "The Airbus A320 introduced fully digital fly-by-wire control to commercial aviation. At Vienna Flight, you take your seat in an original A320 cockpit whose components previously flew in a real aircraft.",
      "Approximately 95 percent original parts, a seven-metre seamless 180° projection and multi-channel sound create an authentic airline flight deck. An experienced instructor accompanies you from system start-up to landing.",
      "Route, weather, time of day and technical situations can be configured individually. The simulator is suitable for a first fun flight, procedural practice and professional screening preparation.",
    ],
    features: ["Original A320 cockpit", "Digital fly-by-wire control", "Seven-metre 180° projection", "Configurable weather and system scenarios"],
    highlight: "Original components from a real Airbus",
  },
  {
    ...simulators[1],
    type: "Dreamliner",
    description: "Discover the Dreamliner's modern wide-body cockpit and take command of one of the world's most innovative long-haul aircraft.",
    details: [
      "The Boeing 787 Dreamliner combines classic yoke control with modern fly-by-wire technology. Take the captain's seat in a long-haul aircraft whose lightweight construction and aerodynamic design set new standards.",
      "The faithful cockpit contains genuine Boeing components. A seamless 180° visual system, realistic sound and tactile seat vibration create an immersive flight deck experience.",
      "Choose a relaxed flight to an exotic destination, instrument flying, a cold-and-dark start or demanding weather. An instructor from real-world aviation adapts the route and difficulty to your goals and experience.",
    ],
    features: ["Distinctive European 787 fixed-base simulator", "Yoke and fly-by-wire", "180° visual system", "Sound and tactile seat vibration"],
    highlight: "Europe's first fixed-base 787 simulator",
  },
  {
    ...simulators[2],
    type: "Jet Ranger",
    description: "Hover, turn and land with precision. The original Bell 206 Jet Ranger challenges your coordination and finesse.",
    details: [
      "A helicopter flies very differently from a fixed-wing aircraft. In the Bell 206 Jet Ranger, you coordinate cyclic, collective and pedals at the same time and experience how precisely the helicopter responds to every input.",
      "Original parts and accurate replicas recreate the real aircraft in exceptional detail. Dual controls, instruments, radio and navigation equipment operate like their real counterparts. A seamless 220° panoramic screen makes visual flying particularly immersive.",
      "Fly over Vienna, through Venice, along the Alps or across New York at night. Real helicopter pilots guide you through turbine start, hovering, takeoffs and landings in configurable weather conditions.",
    ],
    features: ["Original parts and accurate replicas", "Seamless 220° panoramic screen", "Fully functional dual controls", "Guidance from helicopter pilots"],
    highlight: "An original helicopter in Austria",
  },
  {
    ...simulators[3],
    type: "Full Motion VR",
    description: "Full freedom of movement, virtual reality and supersonic missions make this the most intense flight experience in our fleet.",
    details: [
      "The Eurofighter Typhoon delivers Vienna Flight's most action-focused experience. Its cockpit is recreated at 1:1 scale with detailed switches, displays, controls and an ejection seat.",
      "Virtual reality places you directly inside the cockpit and outside world. A professional six-axis motion platform translates acceleration, banking and manoeuvres into physical movement.",
      "Choose takeoffs and landings, airspace surveillance, escort flights, interception manoeuvres or carrier approaches. An instructor introduces the controls and systems before you fly your selected mission.",
    ],
    features: ["1:1 scale cockpit", "Virtual reality", "Professional six-axis motion platform", "Configurable missions"],
    highlight: "6-DOF motion platform with VR",
  },
];
