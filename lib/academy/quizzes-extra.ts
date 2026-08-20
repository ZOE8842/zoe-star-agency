// Zusatz-Quizze fuer die Kategorien, die bisher keins hatten.
// Fragen stammen aus den Lektionen in data-extra.ts, damit niemand etwas
// beantworten muss, das er vorher nicht lesen konnte.

import type { Quiz } from "./quizzes";

export const EXTRA_QUIZZES: Quiz[] = [
  {
    slug: "community-aufbau-basics",
    category_slug: "community",
    title: "Community Aufbau · Basics",
    intro: "5 Fragen zu Supportern, Bindung und Erreichbarkeit.",
    questions: [
      {
        q: "Ein Zuschauer mit Level 1 kommt rein. Was machst du?",
        options: [
          "Ignorieren, kostet nur Zeit",
          "Genauso begruessen wie alle anderen",
          "Erst reagieren, wenn er etwas schickt",
          "Auf die Stammleute konzentrieren",
        ],
        correct: 1,
        explanation: "Jeder Zuschauer kann Supporter werden. Das Level sagt nichts darueber aus, wie treu jemand wird.",
      },
      {
        q: "Ein Supporter war fuenf Tage nicht mehr da. Was ist die richtige Nachricht?",
        options: [
          "Gar keine, sonst wirkt man aufdringlich",
          "Eine Erinnerung, dass du sein Ziel noch brauchst",
          "Eine kurze, freundliche Nachfrage ohne Forderung",
          "Ein Angebot, was er bekommt, wenn er zurueckkommt",
        ],
        correct: 2,
        explanation: "Interesse zeigen, nicht einfordern. Und niemals eine Gegenleistung versprechen, das waere Gift Baiting.",
      },
      {
        q: "Was ist der Unterschied zwischen TikTok-Gruppe und Schwarzem Brett?",
        options: [
          "Kein Unterschied, nur zwei Namen",
          "Beim Schwarzen Brett melden sich Follower selbst an, in die Gruppe musst du einladen",
          "Das Schwarze Brett ist nur fuer Agenturen",
          "In der Gruppe kann man keine Bilder posten",
        ],
        correct: 1,
        explanation: "Die Gruppe hat eine Teilnehmergrenze und braucht Einladungen. Beim Schwarzen Brett kommen die Follower von allein.",
      },
      {
        q: "Dein groesster Supporter kommt seit zwei Wochen nicht mehr. Wie reagierst du?",
        options: [
          "Weniger streamen, bis er zurueck ist",
          "Weiter LIVE gehen und neue Leute aufbauen",
          "Ihn oeffentlich im Stream ansprechen",
          "Pause machen und abwarten",
        ],
        correct: 1,
        explanation: "Abhaengigkeit von einzelnen Personen bremst dein Wachstum. Wer weiter aufbaut, faengt den Ausfall auf.",
      },
      {
        q: "Wie viel Zeit brauchst du taeglich fuer Kommunikation ausserhalb des LIVEs?",
        options: [
          "Mindestens eine Stunde",
          "Etwa zehn Minuten reichen",
          "Gar keine, das LIVE genuegt",
          "Nur am Wochenende noetig",
        ],
        correct: 1,
        explanation: "Zehn Minuten fuer Antworten und kurze Nachrichten halten die Bindung. Gar nichts zu machen ist der Fehler.",
      },
    ],
  },
  {
    slug: "wachstum-basics",
    category_slug: "reichweite",
    title: "Wachstum · Basics",
    intro: "5 Fragen zu LIVE-Zeiten, Videos, Events und dem Push.",
    questions: [
      {
        q: "Wann postest du dein For-You-Video vor dem LIVE?",
        options: [
          "Direkt nach dem LIVE",
          "Etwa 30 Minuten vorher",
          "Am Tag davor",
          "Waehrend des LIVEs",
        ],
        correct: 1,
        explanation: "Rund 30 Minuten vorher. So laeuft das Video noch, wenn du auf Sendung gehst, und schickt Leute direkt rein.",
      },
      {
        q: "Wie oft solltest du die Bewerben-Funktion nutzen?",
        options: [
          "Jeden Tag",
          "Ein bis zwei Mal pro Woche",
          "Nur einmal im Monat",
          "Nur wenn niemand im LIVE ist",
        ],
        correct: 1,
        explanation: "Taeglich eingesetzt laesst die Wirkung nach. Ein bis zwei Mal pro Woche, am besten direkt zum Start.",
      },
      {
        q: "Wann musst du deine Push-Zeiten spaetestens melden?",
        options: [
          "Montag frueh",
          "Sonntag 18 Uhr",
          "Am Tag des Pushes",
          "Mittwoch vor dem ersten Push",
        ],
        correct: 1,
        explanation: "Sonntag 18 Uhr fuer die kommende Woche, immer privat und im Format Anmeldename plus Datum plus Uhrzeit.",
      },
      {
        q: "Wie viele Minuten vor deiner Push-Zeit gehst du LIVE?",
        options: [
          "Punktgenau zur Push-Zeit",
          "10 bis 15 Minuten vorher",
          "Eine Stunde vorher",
          "Egal, der Push laeuft automatisch",
        ],
        correct: 1,
        explanation: "10 bis 15 Minuten vorher, damit der Stream schon laeuft und die ersten Zuschauer da sind, wenn der Push greift.",
      },
      {
        q: "Warum lohnen sich Events oft mehr als die normale Liga?",
        options: [
          "Weil es dort mehr Diamanten gibt",
          "Weil viele Zuschauer gezielt in die Eventlisten schauen",
          "Weil TikTok Events immer pusht",
          "Weil man dort keine Konkurrenz hat",
        ],
        correct: 1,
        explanation: "Ueber die Eventlisten entdecken dich Leute, die dich sonst nie gesehen haetten.",
      },
    ],
  },
  {
    slug: "technik-basics",
    category_slug: "dein-live",
    title: "Technik · Basics",
    intro: "5 Fragen zu Setup, Bild und Ton.",
    questions: [
      {
        q: "Was ist beim Setup wirklich Pflicht?",
        options: [
          "Profikamera",
          "Fester Handyhalter",
          "Greenscreen",
          "Externes Mischpult",
        ],
        correct: 1,
        explanation: "Licht und Mikro sind Geschmackssache, ein fester Halter ist Pflicht. Ein wackliges Bild vertreibt Zuschauer sofort.",
      },
      {
        q: "Wo steht die Kamera idealerweise?",
        options: [
          "Von unten, wirkt dominanter",
          "Auf Augenhoehe, Oberkoerper und Arme im Bild",
          "So nah wie moeglich am Gesicht",
          "Von oben, das schmeichelt",
        ],
        correct: 1,
        explanation: "Augenhoehe wirkt natuerlich und offen. Zu nah dran verhindert Gestik und wirkt bedraengend.",
      },
      {
        q: "Warum leise Musik im Hintergrund?",
        options: [
          "Damit man Nebengeraeusche uebertoent",
          "Damit keine unangenehme Stille entsteht",
          "Weil TikTok es verlangt",
          "Damit man weniger reden muss",
        ],
        correct: 1,
        explanation: "Stille wirkt tot. Leise Musik traegt den Stream, ersetzt aber nicht das Reden.",
      },
      {
        q: "Dauerfilter im LIVE: erlaubt oder nicht?",
        options: [
          "Erlaubt, wenn er dezent ist",
          "Nicht erlaubt, seit Maerz 2026 gilt Kamera-Pflicht ohne Dauerfilter",
          "Nur abends erlaubt",
          "Nur in Matches erlaubt",
        ],
        correct: 1,
        explanation: "Kamera an, echtes Bild. Dauerfilter und Standbilder werden schlechter ausgespielt und sind bei uns nicht erlaubt.",
      },
      {
        q: "Was pruefst du vor jedem Start?",
        options: [
          "Nur den Akku",
          "Licht, Ton, Bildausschnitt und Hintergrund",
          "Nur die Internetverbindung",
          "Nichts, das merkt man im Stream",
        ],
        correct: 1,
        explanation: "Zwei Minuten Kontrolle vorher sparen dir eine halbe Stunde schlechten Stream.",
      },
    ],
  },
  {
    slug: "agentur-standards-basics",
    category_slug: "start",
    title: "Agentur Standards · Basics",
    intro: "5 Fragen zu Mindestwerten, Ablauf und Zusammenarbeit.",
    questions: [
      {
        q: "Wie viele LIVE-Tage pro Monat sind das Minimum?",
        options: ["4", "8", "15", "20"],
        correct: 1,
        explanation: "Mindestens 8 LIVE-Tage und 20 LIVE-Stunden pro Monat. Das ist die Untergrenze, kein Ziel.",
      },
      {
        q: "Wie viele LIVE-Stunden pro Monat sind das Minimum?",
        options: ["10", "20", "40", "60"],
        correct: 1,
        explanation: "20 Stunden im Monat. Wer deutlich darueber liegt, waechst schneller.",
      },
      {
        q: "Du bekommst eine Kontowarnung. Was machst du zuerst?",
        options: [
          "Sofort selbst Widerspruch einreichen",
          "Im Management melden, bevor du etwas absendest",
          "Warten und nichts tun",
          "Neuen Account anlegen",
        ],
        correct: 1,
        explanation: "Ein falsch eingereichter Widerspruch laesst sich nicht wiederholen. Bei Warnungen und Sperren zuerst im Management melden.",
      },
      {
        q: "Wo kommen offizielle Regeln und Updates?",
        options: [
          "Per Einzelnachricht",
          "Ueber die Gruppen und die Academy",
          "Nur im LIVE",
          "Per E-Mail",
        ],
        correct: 1,
        explanation: "Damit alle denselben Stand haben, laufen offizielle Infos ueber die Gruppen und diese Academy.",
      },
      {
        q: "Du kannst zwei Wochen nicht streamen. Was ist richtig?",
        options: [
          "Einfach offline bleiben",
          "Vorher Bescheid sagen",
          "Den Account jemandem geben",
          "Nach der Pause erklaeren",
        ],
        correct: 1,
        explanation: "Angekuendigte Pausen sind kein Problem. Unangekuendigte Funkstille schon.",
      },
    ],
  },
  {
    slug: "live-psychologie-basics",
    category_slug: "dein-live",
    title: "LIVE Psychologie · Basics",
    intro: "5 Fragen zu Energie, Konstanz und Aufbau.",
    questions: [
      {
        q: "Wie oft sollte ein kleiner Trigger im LIVE kommen?",
        options: [
          "Einmal pro Stunde",
          "Alle drei bis fuenf Minuten",
          "Nur am Anfang",
          "Nur wenn es ruhig wird",
        ],
        correct: 1,
        explanation: "Micro-Loops alle drei bis fuenf Minuten: eine Frage, ein Mini-Ziel, eine kleine Challenge.",
      },
      {
        q: "Wann startest du das erste Match?",
        options: [
          "Sofort beim Start",
          "Nachdem die Community da ist und der Chat laeuft",
          "Erst nach einer Stunde",
          "Nur wenn jemand danach fragt",
        ],
        correct: 1,
        explanation: "Erst Community aufbauen, dann Matches. Direkt zu starten kostet Watchtime und Gespraech.",
      },
      {
        q: "Was passiert, wenn du mehrere Tage nicht LIVE gehst?",
        options: [
          "Nichts, die Community wartet",
          "Support wandert weiter und die Bindung geht verloren",
          "Der Algorithmus pusht dich danach staerker",
          "Deine Follower bekommen eine Erinnerung",
        ],
        correct: 1,
        explanation: "Die Community ist auch ohne dich online. Bindung zurueckzugewinnen dauert deutlich laenger als sie zu halten.",
      },
      {
        q: "Was gehoert am Nachmittag eher in den Stream?",
        options: [
          "Das grosse Match-Programm",
          "Persoenliche Momente, Alltag, Gespraeche",
          "Gar nichts, da lohnt es sich nicht",
          "Nur Ranking-Pushes",
        ],
        correct: 1,
        explanation: "Abends laeuft das geplante Programm. Nachmittags binden persoenliche Momente staerker.",
      },
      {
        q: "Wann siehst du das Ergebnis deiner heutigen Arbeit?",
        options: [
          "Sofort im selben Stream",
          "Oft erst in ein bis zwei Monaten",
          "Nach einer Woche garantiert",
          "Gar nicht, das ist Zufall",
        ],
        correct: 1,
        explanation: "Aufbau wirkt verzoegert. Das gilt in beide Richtungen, deshalb faellt Nachlassen auch erst spaeter auf.",
      },
    ],
  },
  {
    slug: "profil-optimierung-basics",
    category_slug: "reichweite",
    title: "Profil Optimierung · Basics",
    intro: "5 Fragen zu Bild, Bio und Begruessung.",
    questions: [
      {
        q: "Was gehoert auf dein Profilbild?",
        options: [
          "Ein Logo",
          "Du selbst, gut ausgeleuchtet und klar erkennbar",
          "Ein Landschaftsfoto",
          "Ein Text mit deinen LIVE-Zeiten",
        ],
        correct: 1,
        explanation: "Menschen folgen Menschen. Gesicht klar im Vordergrund, gutes Licht, ruhiger Hintergrund.",
      },
      {
        q: "Wie lang sollte die Begruessungsnachricht im LIVE sein?",
        options: [
          "So ausfuehrlich wie moeglich",
          "Zwei Zeilen",
          "Mindestens fuenf Saetze",
          "Gar keine, wirkt automatisiert",
        ],
        correct: 1,
        explanation: "Zwei Zeilen werden gelesen, fuenf nicht. Kurz begruessen und einen klaren naechsten Schritt nennen.",
      },
      {
        q: "Was gehoert in eine gute Bio?",
        options: [
          "Deine Lebensgeschichte",
          "Was du machst, wann du LIVE bist, wofuer du stehst",
          "Nur Emojis",
          "Links zu allen deinen Konten",
        ],
        correct: 1,
        explanation: "Kurz und konkret. Ein Besucher soll in drei Sekunden verstehen, was ihn erwartet.",
      },
      {
        q: "Wie oft solltest du dein Profil pruefen?",
        options: [
          "Einmal beim Start reicht",
          "Etwa einmal im Monat",
          "Taeglich",
          "Nur wenn jemand meckert",
        ],
        correct: 1,
        explanation: "Einmal im Monat mit fremden Augen draufschauen: aktuelle Videos, passende Bio, richtiges Bild.",
      },
      {
        q: "Warum ein Kontaktweg im Profil?",
        options: [
          "Weil TikTok es verlangt",
          "Damit die Community dich auch ausserhalb erreicht",
          "Fuer Werbepartner",
          "Braucht man nicht",
        ],
        correct: 1,
        explanation: "Bindung entsteht auch zwischen den Streams. Wenn dein privates Konto nicht oeffentlich sein soll, leg ein zweites an.",
      },
    ],
  },
  {
    slug: "analyse-verstehen-basics",
    category_slug: "watchtime-zahlen",
    title: "Analyse verstehen · Basics",
    intro: "5 Fragen zu Kennzahlen und dem, was du daraus machst.",
    questions: [
      {
        q: "Welche Kennzahl sagt am meisten ueber die Qualitaet deines Starts?",
        options: [
          "Anzahl der Geschenke",
          "Verweildauer der Zuschauer",
          "Anzahl der Kommentare am Ende",
          "Follower gesamt",
        ],
        correct: 1,
        explanation: "Bleiben die Leute, wirst du ausgespielt. Watchtime ist der Hebel, alles andere folgt daraus.",
      },
      {
        q: "Deine Zuschauerzahl faellt mitten im LIVE. Was machst du?",
        options: [
          "Schneller und lauter reden",
          "Eine Frage stellen und jemanden direkt ansprechen",
          "Stream beenden und neu starten",
          "Ein grosses Match starten",
        ],
        correct: 1,
        explanation: "Interaktion holt die Kurve zurueck. Neu starten wirft dich auf null.",
      },
      {
        q: "Was schaust du dir nach jedem LIVE an?",
        options: [
          "Nur die Diamanten",
          "Zuschauer, Watchtime, neue Follower und Interaktionen",
          "Nur die Followerzahl",
          "Nichts, Zahlen verwirren nur",
        ],
        correct: 1,
        explanation: "Vier Werte reichen. Daraus leitest du eine einzige Sache ab, die du beim naechsten Mal anders machst.",
      },
      {
        q: "Wie findest du deine beste LIVE-Zeit?",
        options: [
          "Die Zeit nehmen, die andere empfehlen",
          "Mehrere Zeitfenster ueber mehrere Tage testen und vergleichen",
          "Immer abends, das ist am besten",
          "Jeden Tag eine andere Zeit ausprobieren",
        ],
        correct: 1,
        explanation: "Jeder Account ist anders. Ein Fenster mehrere Tage testen, Zahlen notieren, dann das naechste.",
      },
      {
        q: "Warum sind feste LIVE-Zeiten wichtig?",
        options: [
          "Damit du dich besser fuehlst",
          "Weil TikTok deine Zeiten lernt und passende Zuschauer schickt",
          "Weil die Agentur es vorschreibt",
          "Sie sind nicht wichtig",
        ],
        correct: 1,
        explanation: "Der Algorithmus lernt dein Muster. Wer staendig wechselt, faengt jedes Mal von vorn an.",
      },
    ],
  },
];
