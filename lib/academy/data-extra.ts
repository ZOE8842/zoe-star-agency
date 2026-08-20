// ZOE Academy — Inhalte aus dem Agentur-Material (Handouts, Gruppen-Infos,
// Schulungs-Grafiken). Ergaenzt die Basis-Lektionen aus data.ts, damit die
// Kategorien nicht bei einer einzigen Lektion stehenbleiben.
//
// Aufbau: pro Kategorie-Slug eine Liste zusaetzlicher Lektionen. data.ts
// haengt sie automatisch an die passende Kategorie an. Neue Lektion also
// einfach hier eintragen, sonst nichts.
//
// Quelle: ZOE-Agentur-Material, Stand Februar 2026.

import type { Lesson } from "./types";

export const EXTRA_LESSONS: Record<string, Lesson[]> = {
  // ==========================================================
  "live-grundlagen": [
    {
      slug: "erste-15-minuten",
      title: "Die ersten 15 Minuten",
      summary:
        "Der Algorithmus-Check. Watchtime und Interaktion entscheiden hier, ob dein LIVE Reichweite bekommt.",
      reading_minutes: 6,
      source_label: "ZOE-Schulung",
      blocks: [
        { type: "lead", text: "Die ersten 15 Minuten sind kein Warmlaufen. TikTok testet in dieser Zeit, ob Leute bleiben und ob sie reagieren. Passt beides, wirst du ausgespielt. Passt es nicht, bleibt dein LIVE klein." },
        { type: "h2", text: "Dein Ziel in diesen 15 Minuten" },
        { type: "ul", items: [
          "Zuschauer bleiben mindestens 30 bis 60 Sekunden",
          "Im Chat wird geschrieben, geliked, reagiert",
          "Die Bewegung reisst nicht ab",
        ] },
        { type: "h2", text: "Der 15-Minuten-Plan" },
        { type: "h3", text: "0 bis 3 Minuten: ankommen und Energie" },
        { type: "p", text: "Sofort sprechen. Nicht warten, bis jemand schreibt. Leute begruessen, die erste Reaktion abholen. Ziel ist, dass jemand stoppt statt weiterzuwischen." },
        { type: "h3", text: "3 bis 7 Minuten: Interaktion aufbauen" },
        { type: "p", text: "Fragen stellen, Namen vorlesen, direkt reagieren. Jeder Name, den du sagst, bringt Verweildauer. Wer sich gesehen fuehlt, bleibt." },
        { type: "h3", text: "7 bis 12 Minuten: Bindung aufbauen" },
        { type: "p", text: "Jetzt Gespraeche fuehren statt nur begruessen. Themen setzen, Persoenlichkeit zeigen. Hier entscheidet sich, ob aus Zuschauern Stammleute werden." },
        { type: "h3", text: "12 bis 15 Minuten: Push vorbereiten" },
        { type: "p", text: "Likes ansprechen, ein kleines Ziel setzen, Energie halten. Die Aktivitaet soll nicht abflachen." },
        { type: "h3", text: "Ab 15 Minuten: skalieren" },
        { type: "p", text: "Community halten, Inhalte liefern, weiter interagieren. Erst jetzt sind Matches sinnvoll." },
        { type: "h2", text: "Das killt deinen Start" },
        { type: "ul", items: [
          "Still sein",
          "Auf das Handy schauen oder in anderen Streams haengen",
          "Direkt ins Match springen",
          "Keine Begruessung",
          "Kommentare ignorieren",
        ] },
        { type: "callout", text: "Teste es selbst: ein LIVE mit starkem Start gegen eines, in dem du die ersten Minuten nur chillst. Vergleiche danach Zuschauerzahl und Verweildauer. Der Unterschied ist deutlich." },
        { type: "h2", text: "Woran du merkst, dass es laeuft" },
        { type: "ul", items: [
          "Die Zuschauerzahl steigt langsam an",
          "Leute bleiben laenger drin",
          "Der Chat laeuft von allein weiter",
          "Likes kommen, ohne dass du dauernd danach fragst",
        ] },
        { type: "quote", text: "Die meisten scheitern nicht am Inhalt. Sie verlieren die Leute in den ersten Minuten.", source: "ZOE Standard" },
      ],
    },
    {
      slug: "auftreten-im-stream",
      title: "Auftreten und Bild",
      summary:
        "Kamera statt Filter, fester Halter, gutes Licht, richtiger Abstand. Der erste Eindruck entscheidet, ob jemand bleibt.",
      reading_minutes: 5,
      source_label: "ZOE-Regeln 2026",
      blocks: [
        { type: "lead", text: "Bevor du ueber Inhalte nachdenkst: dein Bild muss sitzen. Ein unruhiges, dunkles oder halb verdecktes LIVE verliert Leute in Sekunden." },
        { type: "h2", text: "Pflicht" },
        { type: "ul", items: [
          "Kamera an, echtes Bild. Keine Dauerfilter, kein Standbild",
          "Fester Handyhalter. Kein Wackeln, nicht in der Hand halten",
          "Gutes Licht, Gesicht klar erkennbar",
          "Ruhiger, aufgeraeumter Hintergrund",
          "Deutlich sprechen, Ton vorher pruefen",
        ] },
        { type: "h2", text: "Haltung und Abstand" },
        { type: "p", text: "Kamera auf Augenhoehe, Oberkoerper und Arme im Bild. Nicht zu nah rangehen. Aufrecht sitzen oder stehen, nicht liegen und nicht aus dem Bett streamen. Blick in die Kamera." },
        { type: "h2", text: "Warum ohne Filter" },
        { type: "p", text: "Echte Mimik baut schneller Vertrauen auf als ein gefiltertes Gesicht. Dauerfilter und Wechsel zwischen Bild und Kamera werden schlechter ausgespielt, und Zuschauer fragen sich, was dahinter steckt. Seit Maerz 2026 ist die Kamera bei uns Pflicht." },
        { type: "h2", text: "Kleinigkeiten mit grosser Wirkung" },
        { type: "ul", items: [
          "Leise Musik im Hintergrund, damit keine Stille entsteht",
          "Ringlicht auf mittlerer Helligkeit statt hartem Frontlicht",
          "Gepflegtes Auftreten. Man sieht, wenn du dich wohlfuehlst",
        ] },
        { type: "callout", text: "Rauchen, Vapen und Alkohol gehoeren nicht ins Bild. Details stehen in der Kategorie Account-Sicherheit." },
      ],
    },
    {
      slug: "live-dauer-und-neustart",
      title: "LIVE-Dauer und Neustart",
      summary:
        "Wie lange du drin bleiben musst, wann ein Neustart hilft und wann er dir schadet.",
      reading_minutes: 4,
      source_label: "ZOE-Schulung",
      blocks: [
        { type: "lead", text: "Kurze LIVEs kosten dich doppelt: Reichweite und Auszahlung. Der Algorithmus braucht Zeit, um dich auszuspielen." },
        { type: "kpi", label: "Zielmarke pro LIVE", value: "61 Minuten" },
        { type: "p", text: "Unter 61 Minuten zaehlt der Tag nicht als vollwertiger LIVE-Tag. Wer regelmaessig nach 20 Minuten aufhoert, macht sich die eigene Arbeit kaputt." },
        { type: "h2", text: "Sinnvoller Ablauf" },
        { type: "ol", items: [
          "Mindestens 25 bis 30 Minuten durchziehen, bevor du ueberhaupt ueber einen Neustart nachdenkst",
          "Ziel-Session sind 60 bis 90 Minuten am Stueck",
          "Wenn du neu startest, dann fruehestens nach 30 Minuten",
          "Zwischen 1:05 und 1:30 Stunden kann ein Neustart den Algorithmus neu anlaufen lassen. Teste es und vergleiche deine Zahlen",
        ] },
        { type: "h2", text: "Was ein zu frueher Neustart kostet" },
        { type: "ul", items: [
          "Die aufgebaute Zuschauerzahl faellt auf null",
          "Die Missionen fuer die Auszahlung fangen von vorn an",
          "Deine Community muss dich neu suchen",
        ] },
        { type: "callout", text: "Auch ein ruhiges LIVE ist wertvoll. Durchhalten schlaegt neu starten." },
      ],
    },
  ],

  // ==========================================================
  watchtime: [
    {
      slug: "blockieren-kostet-reichweite",
      title: "Blockieren kostet dich Reichweite",
      summary:
        "Warum wahlloses Blocken deine Watchtime senkt und was du stattdessen machst.",
      reading_minutes: 3,
      source_label: "ZOE-Schulung",
      blocks: [
        { type: "lead", text: "Viele blocken im LIVE zu schnell. Das fuehlt sich nach Kontrolle an, senkt aber genau die Werte, von denen deine Reichweite abhaengt." },
        { type: "h2", text: "Was beim Blocken passiert" },
        { type: "ul", items: [
          "Die Person ist sofort raus, ihre Verweildauer faellt weg",
          "Ein Kommentar weniger heisst weniger Bewegung im Chat",
          "Weniger Bewegung heisst weniger Ausspielung",
        ] },
        { type: "p", text: "Diskussionen und auch mal Kritik sind Aktivitaet. Aktivitaet ist das, was TikTok belohnt." },
        { type: "h2", text: "Der bessere Weg" },
        { type: "ol", items: [
          "Stummschalten statt blockieren",
          "Ruhig bleiben und das Thema im Chat lenken",
          "Mod einsetzen, wenn es unuebersichtlich wird",
          "Erst bei Beleidigungen, Respektlosigkeit oder Spam wirklich blockieren",
        ] },
        { type: "callout", text: "Blocken ist ein Werkzeug fuer Notfaelle, kein Standardreflex." },
      ],
    },
    {
      slug: "watchtime-hebel-im-alltag",
      title: "Watchtime im Alltag steigern",
      summary:
        "Fuenf Gewohnheiten, die die Verweildauer erhoehen, ohne dass du mehr Stunden streamst.",
      reading_minutes: 4,
      source_label: "ZOE-Schulung",
      blocks: [
        { type: "lead", text: "Watchtime entsteht nicht durch laenger streamen, sondern durch Gruende zu bleiben." },
        { type: "h3", text: "1. Hook in den ersten Sekunden" },
        { type: "p", text: "Sag direkt, warum jemand dranbleiben soll. Ein Satz reicht: gleich kommt das Match, gleich erklaere ich das Ziel, gleich passiert etwas." },
        { type: "h3", text: "2. Micro-Loops alle drei bis fuenf Minuten" },
        { type: "p", text: "Ein kleiner Trigger in kurzen Abstaenden. Eine Frage in den Chat, ein Mini-Ziel, eine kleine Challenge. So entsteht nie ein Loch." },
        { type: "h3", text: "3. Namen nennen" },
        { type: "p", text: "Wer seinen Namen hoert, bleibt laenger. Das ist der billigste Watchtime-Hebel, den es gibt." },
        { type: "h3", text: "4. Ein Grund zu bleiben" },
        { type: "p", text: "Jedes LIVE braucht ein sichtbares Ziel. Likes, Teamherzen, ein Rangplatz, eine Story, die weitergeht." },
        { type: "h3", text: "5. Deine Energie" },
        { type: "p", text: "Stimme, Blick, Bewegung. Deine Energie bestimmt die Stimmung im Raum. Muede Streams halten niemanden." },
        { type: "callout", text: "Wenn die Zuschauerzahl faellt: nicht schneller reden, sondern eine Frage stellen und jemanden direkt ansprechen." },
      ],
    },
  ],

  // ==========================================================
  "battles-matches": [
    {
      slug: "match-gameplay-5-minuten",
      title: "Match-Gameplay: die fuenf Minuten im Detail",
      summary:
        "Start-Challenge, Speed, Blitz-Booster, Nebel, Handschuh. Wann du was einsetzt und was du liegen laesst.",
      reading_minutes: 7,
      source_label: "ZOE-Schulung",
      blocks: [
        { type: "lead", text: "Ein Match gewinnst du nicht mit Lautstaerke, sondern mit Reihenfolge. Hier der Ablauf, der sich bei uns durchgesetzt hat." },
        { type: "h2", text: "Minute 1 bis 2: Start-Challenge" },
        { type: "p", text: "Ganz am Anfang zaehlt das erste Geschenk jeder Person doppelt oder dreifach. Wirklich nur das erste pro Person. Sag es sofort an, sonst verpufft es." },
        { type: "ul", items: [
          "Community auf Likes, Teilen und Teamherzen ansetzen",
          "Ansage: erstes Geschenk von jedem zaehlt gerade mehr",
          "Noch keine Booster einsetzen, erst beobachten",
        ] },
        { type: "h2", text: "Minute 2 bis 3: Speed-Challenge oder Aufbau" },
        { type: "p", text: "Die Speed-Challenge wird durch die Zahl der schenkenden Zuschauer oder eine Punktemarke ausgeloest. Was genau gefragt ist, steht oben im Match-Banner. Lies es und sag es laut." },
        { type: "callout", text: "Waehrend Start- und Speed-Challenge keine Blitz-Booster einsetzen. Die Phase laeuft von allein, Booster waeren verschenkt." },
        { type: "h2", text: "Minute 3 bis 4: Blitz-Booster" },
        { type: "p", text: "Jetzt wird taktisch. Punktestand pruefen, Community ehrlich abholen, Rueckstand oder Fuehrung klar aussprechen." },
        { type: "ul", items: [
          "Blitz 2: Geschenke der Top-2-Supporter zaehlen doppelt",
          "Blitz 3: Geschenke der Top-3-Supporter zaehlen doppelt",
        ] },
        { type: "p", text: "Der Vorteil in dieser Minute: du hast noch Zeit zu reagieren, falls der Gegner kontert. Am Ende eingesetzt verpufft der Blitz." },
        { type: "h2", text: "Minute 4 bis 5: Endphase" },
        { type: "ol", items: [
          "Bei etwa 20 Sekunden Restzeit den Nebel aktivieren",
          "Bei etwa 19 Sekunden den Booster-Handschuh mit Faktor 5",
          "Zeitbooster einsetzen, wenn verfuegbar, das bringt 10 Sekunden extra",
          "Ruhig bleiben und klar durchsagen statt schreien",
        ] },
        { type: "h2", text: "Grundprinzip" },
        { type: "ul", items: [
          "Start-Challenge sofort nutzen",
          "Speed nur triggern, nichts verschwenden",
          "Blitz in Minute 3 bis 4",
          "Nebel bei 20 Sekunden, Handschuh bei 19",
          "Struktur schlaegt Lautstaerke",
        ] },
      ],
    },
    {
      slug: "matchpartner-waehlen",
      title: "Matchpartner richtig waehlen",
      summary:
        "Warum immer dieselben Partner deine Reichweite bremsen und worauf du bei der Auswahl achtest.",
      reading_minutes: 4,
      source_label: "ZOE-Schulung",
      blocks: [
        { type: "lead", text: "Matches bringen dir fremde Zuschauer. Wenn du immer mit denselben Leuten matchst, siehst du immer dieselbe Zuschauergruppe." },
        { type: "h2", text: "Das Problem mit Dauer-Partnern" },
        { type: "ul", items: [
          "Die Zuschauer des Partners kennen dich schon, es kommt kaum jemand Neues",
          "Der Ablauf wiederholt sich und wirkt langweilig",
          "Leute kommen rein, bleiben aber nicht",
        ] },
        { type: "h2", text: "Worauf du achtest" },
        { type: "ul", items: [
          "Redet der Partner ueberhaupt oder sitzt er stumm da",
          "Passt die Energie zu deinem Stream, ohne dass es chaotisch wird",
          "Bleibt der Umgang respektvoll, auch wenn es knapp wird",
          "Bringt der Partner eine andere Zuschauergruppe mit als beim letzten Mal",
        ] },
        { type: "p", text: "Ein negativer oder toxischer Partner zieht deinen Stream mit runter. Zieh das laufende Match sauber durch, aber ueberleg danach, ob das eine Wiederholung wert war." },
        { type: "callout", text: "Wenn du exklusive Matches oder Event-Partner brauchst, meld dich im Management. Wir vermitteln passende Partner." },
      ],
    },
  ],
  // ==========================================================
  "tiktok-geschenke": [
    {
      slug: "auszahlungssystem-missionen",
      title: "Das Auszahlungssystem und seine Missionen",
      summary:
        "Wie sich deine Auszahlung berechnet: drei Missionen nach jedem LIVE, drei weitere am Ende der Woche.",
      reading_minutes: 8,
      source_label: "TikTok-System seit August 2025",
      blocks: [
        { type: "lead", text: "Deine Auszahlung haengt nicht nur an den Diamanten. TikTok rechnet Missionen dazu oder ab. Wer sie kennt, holt jede Woche mehr raus, ohne mehr zu schenken zu bekommen." },
        { type: "h2", text: "Teil 1: direkt nach jedem LIVE" },
        { type: "p", text: "Diese drei Missionen werden sofort nach dem Stream berechnet und bringen zusammen bis zu 40 Prozent." },
        { type: "h3", text: "Mission 1: LIVE-Dauer" },
        { type: "ul", items: [
          "Unter 5 Minuten: plus 20 Prozent",
          "5 bis 10 Minuten: plus 30 Prozent",
          "10 bis 25 Minuten: plus 35 Prozent",
          "Ueber 25 Minuten: plus 38 Prozent",
        ] },
        { type: "p", text: "Deshalb die harte Regel: nie unter 25 Minuten beenden. Der Sprung von 20 auf 38 Prozent ist der groesste Hebel im ganzen System." },
        { type: "h3", text: "Mission 2: neue Follower im LIVE" },
        { type: "ul", items: [
          "1 bis 2 neue Follower: plus 1 Prozent",
          "3 bis 4 neue Follower: plus 1,5 Prozent",
          "5 und mehr: plus 2 Prozent",
        ] },
        { type: "p", text: "Fuenf neue Follower sind mit einer Geschenketuete leicht zu schaffen. Sag es klar an: wer neu ist, einmal auf Folgen druecken." },
        { type: "h3", text: "Mission 3: keine Verstoesse" },
        { type: "p", text: "Ein Verstoss gegen die Monetarisierungs-Richtlinien kostet 20 Prozent. Kein Verstoss heisst kein Abzug. Sauber streamen ist hier bares Geld." },
        { type: "h2", text: "Teil 2: am Ende der Woche" },
        { type: "p", text: "Hier zaehlt die ganze Woche. Bis zu 13 Prozent zusaetzlich." },
        { type: "h3", text: "Mission 1: gueltige LIVE-Tage" },
        { type: "ul", items: [
          "0 Tage: nichts",
          "1 Tag: plus 6 Prozent",
          "2 Tage und mehr: plus 8 Prozent",
        ] },
        { type: "p", text: "Ein Tag zaehlt ab 5 Minuten LIVE. Zwei Tage sind das Minimum, drei bis fuenf sind das Ziel." },
        { type: "h3", text: "Mission 2: aktive Fanclub-Mitglieder" },
        { type: "ul", items: [
          "10 bis 24 aktive Fans: plus 1 Prozent",
          "25 bis 49: plus 1,5 Prozent",
          "50 und mehr: plus 2 Prozent",
        ] },
        { type: "h3", text: "Mission 3: deine Liga" },
        { type: "ul", items: [
          "Hoechste Liga der Woche uebertroffen: plus 3 Prozent",
          "Aktuelle Liga gehalten: plus 1 Prozent",
        ] },
        { type: "h2", text: "Zusammengefasst" },
        { type: "ol", items: [
          "Immer mindestens 25 bis 30 Minuten LIVE bleiben",
          "Nicht sofort neu starten",
          "Zwei bis vier gueltige LIVE-Tage pro Woche, besser mehr",
          "Neue Follower aktiv ansprechen",
          "Fanclub aktiv halten und Liga verteidigen",
        ] },
        { type: "callout", text: "Sessions von 45 bis 60 Minuten performen deutlich besser als mehrere kurze Streams am selben Tag." },
      ],
    },
    {
      slug: "geschenkegalerie-und-duell",
      title: "Geschenkegalerie und Galerie-Duell",
      summary:
        "Wann die Galerie zurueckgesetzt wird, wie das woechentliche Duell laeuft und wie du beides als Ziel nutzt.",
      reading_minutes: 4,
      source_label: "TikTok-Funktion",
      blocks: [
        { type: "lead", text: "Die Geschenkegalerie gibt deiner Community ein sichtbares Ziel. Wer den Reset kennt, kann die Woche planen." },
        { type: "h2", text: "Der Reset" },
        { type: "p", text: "Die Galerie startet sonntags neu. Das ist der beste Moment, um deiner Community ein frisches Ziel zu geben und gemeinsam in die Woche zu starten. Sprich es im LIVE aktiv an, sonst bekommt es kaum jemand mit." },
        { type: "h2", text: "Das Galerie-Duell" },
        { type: "p", text: "Jede Woche werden Creator mit aehnlichem Leistungslevel gegeneinander gesetzt. Wer mehr Geschenke zum Leuchten bringt, gewinnt. Die Ergebnisse kommen sonntags." },
        { type: "ul", items: [
          "Du kannst eine Woche ueberspringen, dann gewinnt automatisch die Gegenseite",
          "Wer ganz aussteigt, tritt erst nach einem Wiedereinstieg wieder an",
          "Das Duell ist ein Ziel fuer die Community, kein Zwang fuer dich",
        ] },
        { type: "h2", text: "So nutzt du es im LIVE" },
        { type: "ol", items: [
          "Sonntags ansagen, dass die Galerie neu startet",
          "Ein konkretes Wochenziel nennen",
          "Zwischendurch den Stand zeigen",
          "Am Ende der Woche das Ergebnis feiern, egal wie es ausgeht",
        ] },
        { type: "callout", text: "Nie eine Gegenleistung fuer Geschenke versprechen. Das ist Gift Baiting und wird gesperrt. Mehr dazu in der Kategorie Account-Sicherheit." },
      ],
    },
    {
      slug: "community-geschenk",
      title: "Das Community-Geschenk",
      summary:
        "Dein eigenes Geschenk fuer einen Coin. Was es bringt und wie du es freischaltest.",
      reading_minutes: 3,
      source_label: "TikTok-Funktion",
      blocks: [
        { type: "lead", text: "Das Community-Geschenk wird auf Basis deiner LIVE-Inhalte erstellt und traegt dein Gesicht. Deine Fanclub-Mitglieder koennen es fuer einen Coin schicken." },
        { type: "h2", text: "Freischalten" },
        { type: "ol", items: [
          "Geschenkpanel oeffnen",
          "Community-Geschenk auswaehlen",
          "Den Schritten zur Generierung folgen",
        ] },
        { type: "h2", text: "Warum sich das lohnt" },
        { type: "ul", items: [
          "Ein Coin ist fuer jeden machbar, auch fuer stille Zuschauer",
          "Es eignet sich als LIVE-Ziel, an dem sich die ganze Community beteiligen kann",
          "Es staerkt die Bindung zum Fanclub, weil es nur bei dir existiert",
        ] },
        { type: "p", text: "Die Funktion lief zuerst als Test fuer eine begrenzte Gruppe. Wenn du sie im Panel nicht siehst, warst du nicht in der Testgruppe." },
      ],
    },
    {
      slug: "coins-guenstiger-aufladen",
      title: "Coins guenstiger aufladen",
      summary:
        "Ueber den Browser kosten Coins weniger als in der App. Eine Info, die deine Supporter kennen sollten.",
      reading_minutes: 2,
      source_label: "TikTok offiziell",
      blocks: [
        { type: "lead", text: "Wer Coins in der App kauft, zahlt die Gebuehren von Apple oder Google mit. Ueber den Browser faellt das weg." },
        { type: "p", text: "Die offizielle Seite ist tiktok.com/coin. Bis zu 25 Prozent guenstiger, bei Aktionen kommt teilweise Cashback dazu." },
        { type: "callout", text: "Achte auf die Adresse. Nur tiktok.com ist echt, alles andere ist eine Betrugsseite. Teile nie Links, die dir jemand im Chat schickt." },
        { type: "p", text: "Sag es im LIVE ruhig offen. Deine Supporter sparen Geld, du bekommst fuer denselben Betrag mehr Diamanten. Kein Druck, nur eine Info." },
      ],
    },
  ],

  // ==========================================================
  "account-sicherheit": [
    {
      slug: "gift-baiting-vermeiden",
      title: "Gift Baiting: der teuerste Fehler",
      summary:
        "Sobald du eine Gegenleistung fuer Geschenke versprichst, ist es ein Verstoss. Was erlaubt ist und was nicht.",
      reading_minutes: 4,
      source_label: "ZOE-Warnung, echter Sperrfall",
      blocks: [
        { type: "lead", text: "Es gab bei uns bereits eine Sperre wegen Gift Baiting. TikTok wertet es als Manipulation, wenn Geschenke an eine Gegenleistung gekoppelt sind." },
        { type: "h2", text: "Das darfst du nicht sagen" },
        { type: "ul", items: [
          "Ab X Punkten mache ich Y",
          "Fuer Geschenke bekommt ihr etwas zurueck",
          "Ich schreibe deinen Namen auf, wenn du schenkst",
          "Gewinnspiele, die an Gifts oder Follows gekoppelt sind",
        ] },
        { type: "p", text: "Das gilt nicht erst, wenn du es durchziehst. Schon die Ansage im Stream oder im Intro reicht." },
        { type: "h2", text: "Das ist weiter erlaubt" },
        { type: "ul", items: [
          "Dich bedanken und Support wertschaetzen",
          "Die Community motivieren, gemeinsam ein Ziel zu erreichen",
          "Ziele setzen, ohne eine Gegenleistung zu versprechen",
        ] },
        { type: "h2", text: "Was auf dem Spiel steht" },
        { type: "ul", items: [
          "Sperren",
          "Ausschluss aus Ranglisten",
          "Weniger Reichweite ueber laengere Zeit",
          "Einschraenkung der Geschenk-Funktion",
        ] },
        { type: "quote", text: "Keine Deals. Keine Versprechen. Keine Belohnungen fuer Gifts.", source: "ZOE Standard" },
        { type: "callout", text: "Unsicher, ob eine Aktion durchgeht? Kurz im Management fragen, bevor du sie im LIVE ansagst." },
      ],
    },
    {
      slug: "rauchen-alkohol-und-18plus",
      title: "Rauchen, Alkohol und der 18-plus-Schalter",
      summary:
        "Drei Punkte, bei denen TikTok besonders streng prueft, und was sie deinen Account kosten.",
      reading_minutes: 4,
      source_label: "ZOE-Regeln",
      blocks: [
        { type: "lead", text: "Diese drei Punkte fuehren bei uns am haeufigsten zu Einschraenkungen. Sie sind leicht zu vermeiden." },
        { type: "h2", text: "Rauchen und Vapen" },
        { type: "p", text: "Sichtbares Rauchen im Bild fuehrt zu weniger Reichweite, bei Wiederholung zu dauerhaften Einschraenkungen. Auch Match-Anfragen gehen zurueck, weil dein Account als ungeeignet eingestuft wird." },
        { type: "p", text: "Loesung: ausserhalb der Kamera rauchen. Kurz zur Seite gehen, nicht ins Bild halten." },
        { type: "h2", text: "Alkohol" },
        { type: "ul", items: [
          "Kein Alkohol trinken, waehrend du LIVE bist",
          "Keine Flaschen oder Glaeser sichtbar im Bild",
          "Nicht angetrunken ins LIVE gehen",
        ] },
        { type: "p", text: "Hier reagiert TikTok mit sofortigen Sperren, nicht nur mit Reichweitenverlust." },
        { type: "h2", text: "Der 18-plus-Schalter" },
        { type: "p", text: "Wenn du dein LIVE auf 18 plus stellst, sehen dich alle nicht verifizierten Zuschauer nicht mehr. Matchpartner koennen dich oft nicht anfragen und deine Reichweite bricht ein. In den meisten Faellen bringt der Schalter nur Nachteile." },
        { type: "callout", text: "Zu Karneval und aehnlichen Anlaessen wird besonders streng geprueft. Kostueme nicht zu freizuegig, sonst folgt die Sperre." },
      ],
    },
    {
      slug: "sperren-und-widerspruch",
      title: "Sperre, Warnung, Widerspruch",
      summary:
        "Was du selbst machen darfst und wann du dich vor dem Widerspruch im Management melden musst.",
      reading_minutes: 5,
      source_label: "ZOE-Ablauf",
      blocks: [
        { type: "lead", text: "TikTok prueft aktuell strenger als frueher. Wichtig ist, was du nach einem Vorfall machst. Ein falsch eingereichter Widerspruch laesst sich nicht wiederholen." },
        { type: "h2", text: "Das darfst du selbst erledigen" },
        { type: "p", text: "Wurde nur dein LIVE beendet, ohne dass eine Sperre folgt, kannst du den normalen Einspruch selbst stellen." },
        { type: "h2", text: "Hier zuerst im Management melden" },
        { type: "ul", items: [
          "LIVE-Sperre",
          "Kontowarnung",
          "Geschenkesperre",
          "Abzug oder Einfrieren von Einnahmen, im LIVE oder bei der Wochenabrechnung",
          "Accountsperre",
        ] },
        { type: "p", text: "Grund: Nach einem abgelehnten Widerspruch gibt es keinen zweiten Versuch auf demselben Weg. Dann bleibt nur der Weg ueber unseren Ansprechpartner bei TikTok, und der funktioniert nur, solange nichts vorschnell eingereicht wurde." },
        { type: "h2", text: "Was du sofort machst" },
        { type: "ol", items: [
          "Stream beenden",
          "Screenshot und Uhrzeit festhalten",
          "Im Management melden, bevor du irgendetwas absendest",
          "Nicht sofort wieder LIVE gehen",
        ] },
        { type: "h2", text: "Beschraenkungen regelmaessig pruefen" },
        { type: "p", text: "Im Konto-Status siehst du, ob etwas gegen dich vorliegt, ob Widerspruch moeglich ist und welche Einschraenkungen du in der Vergangenheit hattest. Schau da regelmaessig rein, nicht erst wenn etwas schiefgeht." },
        { type: "h2", text: "Zweit-Accounts" },
        { type: "p", text: "TikTok duldet Zweit-Accounts nicht. Die Folgen treffen den Hauptaccount: weniger Reichweite im LIVE, kaum Aufrufe auf Videos, schlechtere Einstufung, Probleme bei Events und Ranglisten. Wenn du noch einen Zweitaccount hast, loesche ihn." },
      ],
    },
  ],
  // ==========================================================
  "community-aufbau": [
    {
      slug: "supporter-binden",
      title: "Supporter binden und neue gewinnen",
      summary:
        "Was du im LIVE und danach machst, damit aus Zuschauern Stammsupporter werden.",
      reading_minutes: 7,
      source_label: "ZOE-Leitfaden",
      blocks: [
        { type: "lead", text: "Jeder, der reinkommt, kann ein Supporter werden. Entscheidend ist, wie du ihn behandelst, bevor er das erste Mal etwas schickt." },
        { type: "h2", text: "Im LIVE" },
        { type: "h3", text: "Jeden gleich behandeln" },
        { type: "p", text: "Egal welches Level. Sobald du einen Namen siehst oder jemand schreibt: begruessen, freundlich, persoenlich. Das ist der Moment, in dem Bindung entsteht." },
        { type: "h3", text: "Gespraech statt Begruessungsschleife" },
        { type: "p", text: "Nach dem Hallo eine Frage stellen. Interesse zeigen. Wer sich wohlfuehlt, bleibt laenger, und wer laenger bleibt, unterstuetzt eher." },
        { type: "h3", text: "Auf Geschenke reagieren" },
        { type: "p", text: "Egal ob klein oder gross: bedanken, den Moment feiern, zeigen dass es dir etwas bedeutet. Supporter geben echtes Geld aus. Das muessen sie spueren." },
        { type: "h3", text: "Ziele klar sagen" },
        { type: "p", text: "Sag in jedem LIVE, worauf du hinarbeitest. Punkte, Rangliste, ein Community-Ziel. Wer dein Ziel kennt, macht eher mit." },
        { type: "h2", text: "Nach dem LIVE" },
        { type: "ol", items: [
          "Leg eine Grenze fest, ab der du dich meldest, zum Beispiel ab 50 oder 100 Diamanten",
          "Kurze Dankesnachricht schicken, zwei Saetze reichen",
          "Jedem Supporter folgen, damit er dich schneller wiederfindet",
          "Wer drei bis fuenf Tage fehlt, bekommt eine freundliche Nachricht ohne Druck",
        ] },
        { type: "quote", text: "Hi, danke fuer deinen Support heute. Ich freue mich, dass du dabei warst. Bis zum naechsten LIVE.", source: "Beispiel, mehr braucht es nicht" },
        { type: "h2", text: "Sichtbar machen" },
        { type: "ul", items: [
          "Chat-Sticker fuer starke Supporter",
          "Namen im LIVE positiv erwaehnen",
          "Dein Team ihre Namen benutzen lassen",
        ] },
        { type: "callout", text: "Behandle Supporter wie Menschen, nicht wie Geldgeber. Wer sich gesehen fuehlt, bleibt." },
      ],
    },
    {
      slug: "unabhaengig-von-supportern-bleiben",
      title: "Nicht von einzelnen Supportern abhaengig werden",
      summary:
        "Warum du weiter aufbauen musst, auch wenn ein grosser Supporter wegbleibt.",
      reading_minutes: 5,
      source_label: "ZOE-Leitfaden",
      blocks: [
        { type: "lead", text: "Kein Supporter gehoert dir. Jeder darf unterstuetzen, wo er will. Das ist normal. Problematisch wird es, wenn dein ganzer Stream an ein oder zwei Personen haengt." },
        { type: "p", text: "Viele hoeren auf, LIVE zu gehen, sobald ein starker Supporter seltener kommt. Genau da stoppt das Wachstum." },
        { type: "h2", text: "Schritt 1: schau dir die letzten 60 Tage an" },
        { type: "p", text: "In der Zuschauerliste im LIVE-Bereich siehst du, wer wirklich regelmaessig da war. Das sind deine Leute, nicht nur die groessten Namen." },
        { type: "h2", text: "Schritt 2: Kontakt aufnehmen, ohne Forderung" },
        { type: "ul", items: [
          "Danke fuer den Support der letzten Wochen, das weiss ich zu schaetzen",
          "Hab dich ein paar Tage nicht gesehen, wollte nur kurz Hallo sagen",
          "Falls du woanders reinschaust, ist das voellig okay",
        ] },
        { type: "p", text: "Ziel ist Verbindung, nicht Rueckforderung." },
        { type: "h2", text: "Schritt 3: erreichbar sein" },
        { type: "p", text: "Verlinke einen Kanal in deinem Profil, ueber den man dich erreicht. Wenn dein privates Konto nicht oeffentlich sein soll, leg ein zweites nur fuer TikTok an. Zehn Minuten am Tag reichen, um Nachrichten zu beantworten." },
        { type: "h2", text: "Schritt 4: eigene Gruppe" },
        { type: "p", text: "Eine TikTok-Gruppe fuer Stammzuschauer und Supporter. Dort kuendigst du LIVEs an, teilst Ziele und postest deine eigenen Clips. Diese Funktion wird stark unterschaetzt." },
        { type: "quote", text: "Wer unabhaengig bleibt, waechst langfristig. Wer abhaengig wird, bleibt stehen.", source: "ZOE Standard" },
      ],
    },
    {
      slug: "schwarzes-brett-und-gruppen",
      title: "Schwarzes Brett und Gruppen",
      summary:
        "Der Unterschied zwischen Gruppe und Schwarzem Brett und wie du beides zum Ankuendigen nutzt.",
      reading_minutes: 4,
      source_label: "TikTok-Funktion",
      blocks: [
        { type: "lead", text: "Beides sind Kanaele zu deiner Community. Sie funktionieren unterschiedlich, und die meisten nutzen nur eines davon." },
        { type: "h2", text: "Die TikTok-Gruppe" },
        { type: "ul", items: [
          "Begrenzte Teilnehmerzahl",
          "Du musst jeden einzeln einladen",
          "Gut fuer den engen Kreis: Stammzuschauer und Supporter",
        ] },
        { type: "h2", text: "Das Schwarze Brett" },
        { type: "ul", items: [
          "Deine Follower melden sich selbst an, du musst niemanden einladen",
          "Keine Teilnehmerbegrenzung",
          "Bilder, Videos und Abstimmungen moeglich",
          "Dein LIVE wird automatisch geteilt",
        ] },
        { type: "h2", text: "So nutzt du es" },
        { type: "ol", items: [
          "LIVE-Zeit posten, sobald sie feststeht",
          "Kurz vor dem Start noch einmal erinnern",
          "Nach dem LIVE die alte Ankuendigung loeschen und die naechste eintragen",
          "Zwischendurch Abstimmungen nutzen, um die Leute einzubinden",
        ] },
        { type: "callout", text: "Wer die Gedanken-Funktion hat, kann Ankuendigungen und Teilungen direkt darueber steuern. Jeder, der dir schon einmal ein Geschenk geschickt hat, sieht diese Ankuendigungen im Feed." },
      ],
    },
  ],

  // ==========================================================
  wachstum: [
    {
      slug: "live-zeiten-finden",
      title: "Deine besten LIVE-Zeiten finden",
      summary:
        "Testen statt raten. Welche Zeitfenster aktuell funktionieren und warum Konstanz mehr bringt als die perfekte Uhrzeit.",
      reading_minutes: 5,
      source_label: "ZOE-Schulung",
      blocks: [
        { type: "lead", text: "Die Uhrzeit entscheidet mit, wie viele Zuschauer du bekommst. Jeder Account ist anders, deshalb musst du testen." },
        { type: "h2", text: "So testest du" },
        { type: "ol", items: [
          "Ein Zeitfenster mehrere Tage hintereinander ausprobieren",
          "Zuschauerzahl, Verweildauer und neue Follower notieren",
          "Danach das naechste Fenster testen",
          "Erst dann festlegen",
        ] },
        { type: "h2", text: "Zeitfenster, die aktuell funktionieren" },
        { type: "ul", items: [
          "Vormittag 10 bis 12 Uhr: wenig Konkurrenz, guter Aufbau",
          "Nachmittag 15 bis 18 Uhr: stabil",
          "Abends 19 bis 23:30 Uhr: die meiste Aktivitaet",
          "Wochenende ab 18 Uhr: deutlich staerker",
        ] },
        { type: "p", text: "Nach Mitternacht bringt es aktuell wenig, ausser du hast bereits eine feste Nacht-Community." },
        { type: "h2", text: "Warum feste Zeiten wichtig sind" },
        { type: "p", text: "TikTok lernt deine LIVE-Zeiten und schickt dir dann genau die Zuschauer, die zu dieser Zeit aktiv sind. Wer jeden Tag zu einer anderen Uhrzeit streamt, faengt jedes Mal von vorn an." },
        { type: "callout", text: "Wenig Konkurrenz heisst mehr Sichtbarkeit. Frueh am Tag und am Wochenendvormittag sind oft weniger Creator online." },
      ],
    },
    {
      slug: "videos-und-storys",
      title: "Videos und Storys richtig einsetzen",
      summary:
        "Was in die Story gehoert, was auf die For You Page und wann du beides postest.",
      reading_minutes: 5,
      source_label: "ZOE-Schulung",
      blocks: [
        { type: "lead", text: "Videos holen neue Leute, das LIVE bindet sie. Entscheidend ist, wo und wann du postest." },
        { type: "h2", text: "Story: deine Community aktivieren" },
        { type: "ul", items: [
          "Ankuendigung, sobald die LIVE-Zeit feststeht",
          "Zweite Story mit Uhrzeit, 30 Minuten vor dem Start",
          "Geschenk- und Danke-Momente aus dem LIVE",
        ] },
        { type: "p", text: "Storys erreichen vor allem Leute, die dir schon folgen. Sie holen deine Community rein." },
        { type: "h2", text: "For You: neue Zuschauer" },
        { type: "p", text: "Ein Video etwa 30 Minuten vor dem LIVE posten. Kurze Meinung, lustiger Clip, ein Highlight aus dem letzten Stream oder etwas Persoenliches. Ziel ist Neugier, nicht Perfektion." },
        { type: "h2", text: "Warum sich der Aufwand lohnt" },
        { type: "ul", items: [
          "Mehr Profilbesuche",
          "Mehr Zuschauer direkt zum Start",
          "Deine Videos arbeiten weiter, waehrend du offline bist",
        ] },
        { type: "h2", text: "LIVE bewerben" },
        { type: "p", text: "Vor dem Start kannst du dein LIVE bewerben lassen. Das bringt schneller Zuschauer rein und wirkt am Anfang am besten. Ein bis zwei Mal pro Woche reicht. Taeglich eingesetzt laesst die Wirkung nach." },
        { type: "callout", text: "Die Bewerben-Funktion holt Leute rein. Ob sie bleiben, entscheidest du in den ersten Minuten." },
      ],
    },
    {
      slug: "arbeit-ausserhalb-des-lives",
      title: "Die Arbeit ausserhalb des LIVEs",
      summary:
        "Zehn Aufgaben zwischen den Streams, die daruber entscheiden, wie stark dein naechstes LIVE startet.",
      reading_minutes: 6,
      source_label: "ZOE-Schulung",
      blocks: [
        { type: "lead", text: "Dein Erfolg beginnt nicht beim Klick auf LIVE gehen. Was du zwischen den Streams machst, entscheidet mit." },
        { type: "ol", items: [
          "Regelmaessig Videos posten, damit du auch offline sichtbar bleibst",
          "Storys taeglich nutzen und die Community mitnehmen",
          "LIVE ankuendigen, sobald die Zeit feststeht, und kurz vorher erinnern",
          "Kontakt halten ueber Nachrichten, Kommentare, Gruppe oder Schwarzes Brett",
          "Profil aktuell halten: Bild, Bio, angepinnte Inhalte",
          "Ziele fuer das naechste LIVE festlegen",
          "LIVE-Zeiten fuer die Woche planen und einhalten",
          "Inhalte vorbereiten: Themen, Aktionen, Challenges, Matches",
          "Events und neue Funktionen pruefen",
          "Nach dem LIVE die Zahlen anschauen und eine Sache fuer das naechste Mal verbessern",
        ] },
        { type: "callout", text: "Wer vorbereitet startet, hat weniger Leerlauf und weniger unangenehme Stille im Stream." },
      ],
    },
    {
      slug: "events-nutzen",
      title: "TikTok-Events richtig angehen",
      summary:
        "Warum Events oft mehr Reichweite bringen als die normale Liga und wie du sie planst.",
      reading_minutes: 5,
      source_label: "ZOE-Schulung",
      blocks: [
        { type: "lead", text: "Events bringen dir Sichtbarkeit bei Leuten, die dich noch nicht kennen. Viele Zuschauer schauen gezielt in die Eventlisten." },
        { type: "h2", text: "Wo du deine Events findest" },
        { type: "ul", items: [
          "Im LIVE oben rechts im Banner: aktuelle Position, Belohnungen, Regeln",
          "Im Profil unter Studio und Kampagnen: alle Events, an denen du teilnimmst",
        ] },
        { type: "h2", text: "So gehst du ein Event an" },
        { type: "ol", items: [
          "Regeln lesen, bevor du startest",
          "Verstehen, wie Punkte entstehen, und dein LIVE danach ausrichten",
          "Bonuszeiten notieren und in dieser Zeit sicher LIVE sein",
          "Schauen, welche Geschenke extra zaehlen",
          "Start- und Endzeit merken, beides ist wichtig",
        ] },
        { type: "p", text: "Events sind nach Leistungsklasse aufgeteilt. Du trittst also gegen Creator mit aehnlichen Zahlen an, nicht gegen die groessten Accounts der Plattform." },
        { type: "callout", text: "Wer Events plant, statt nur mitzulaufen, hat deutlich bessere Chancen. Und deine Community bekommt ein gemeinsames Ziel." },
      ],
    },
    {
      slug: "platinum-push",
      title: "Der Platinum Push",
      summary:
        "Was der Agentur-Push ist, wie du deine Zeiten meldest und was du in dem Fenster liefern musst.",
      reading_minutes: 5,
      source_label: "ZOE Star Agency",
      blocks: [
        { type: "lead", text: "Als Elite Agency melden wir eure festen LIVE-Zeiten an TikTok. In diesem Fenster wird dein LIVE deutlich haeufiger auf der For You Page gezeigt." },
        { type: "h2", text: "Was der Push macht" },
        { type: "ul", items: [
          "Dein LIVE erscheint waehrend des Zeitraums oefter auf der For You Page",
          "Mehr Menschen sehen dich, die dich noch nicht kennen",
          "Kein garantierter Erfolg, aber eine deutlich hoehere Chance auf neue Zuschauer und Follower",
        ] },
        { type: "h2", text: "So nutzt du ihn" },
        { type: "ol", items: [
          "10 bis 15 Minuten vor der Push-Zeit LIVE gehen",
          "Vorbereitet sein: Matches, Challenges, Musik, gutes Licht",
          "Aktiv und ansprechbar sein, der erste Eindruck entscheidet",
          "Neue Zuschauer bewusst begruessen und einbinden",
        ] },
        { type: "h2", text: "Die Regeln" },
        { type: "ul", items: [
          "Pushes gibt es von Mittwoch bis Sonntag",
          "Maximal ein Push pro Tag",
          "Ein bis fuenf Pushes pro Woche moeglich",
          "Push-Zeiten sind verbindlich. Wer sie nicht einhaelt, verliert die Funktion",
        ] },
        { type: "h2", text: "So meldest du deine Zeiten" },
        { type: "p", text: "Immer privat im Management, spaetestens Sonntag 18 Uhr fuer die kommende Woche. Format: Anmeldename plus Datum plus Uhrzeit, zum Beispiel creator123 plus 24.07.2026 plus 20:30 Uhr." },
        { type: "callout", text: "Viele streamen nicht durchgehend, die Community ist aber online. Der Push ist genau dafuer da, in dieser Zeit ein Team aufzubauen." },
      ],
    },
    {
      slug: "wochenende-und-monatswechsel",
      title: "Wochenende und Monatswechsel",
      summary:
        "Warum diese Tage die stärkste Phase im Kalender sind und wie du sie einplanst.",
      reading_minutes: 4,
      source_label: "ZOE-Schulung",
      blocks: [
        { type: "lead", text: "Zuschauerverhalten, Algorithmus und Budget der Supporter treffen am Wochenende und zum Monatswechsel zusammen. Das ist planbar, nicht zufaellig." },
        { type: "h2", text: "Wochenende" },
        { type: "p", text: "Mehr Leute sind online, bleiben laenger und sind offener fuer neue Creator. Freitag bis Sonntag entscheidet oft, wie stark du in der Woche darauf ausgespielt wirst." },
        { type: "h2", text: "Monatswechsel" },
        { type: "ul", items: [
          "Viele setzen sich neue Ziele",
          "Supporter orientieren sich neu, Teams veraendern sich",
          "Neue Creator werden entdeckt",
          "Zum Monatsanfang ist mehr Budget da als am Monatsende",
        ] },
        { type: "h2", text: "Was du daraus machst" },
        { type: "ol", items: [
          "Am Wochenende laengere Sessions einplanen",
          "Zum Monatsanfang bewusst mehr Praesenz zeigen",
          "In Phasen, in denen viele grosse Creator offline sind, gezielt LIVE gehen",
          "Auch wenn das Ziel nicht sofort faellt: diese Tage bauen Reichweite fuer spaeter auf",
        ] },
        { type: "callout", text: "Wochenende plus Monatswechsel plus Struktur ergibt Wachstum. Zwei davon reichen nicht." },
      ],
    },
  ],

  // ==========================================================
  "profil-optimierung": [
    {
      slug: "begruessungsnachricht",
      title: "Die Begruessungsnachricht im LIVE",
      summary:
        "Der Text, den jeder neue Zuschauer sieht. Kurz, freundlich, mit einem klaren naechsten Schritt.",
      reading_minutes: 3,
      source_label: "ZOE-Vorlagen",
      blocks: [
        { type: "lead", text: "Sobald jemand dein LIVE betritt, sieht er automatisch eine Nachricht von dir. Die meisten lassen das Feld leer. Schade, denn es ist der erste Satz, den ein Fremder von dir liest." },
        { type: "h2", text: "Was reingehoert" },
        { type: "ul", items: [
          "Eine kurze Begruessung",
          "Ein Hinweis, was hier passiert",
          "Ein klarer naechster Schritt, meist folgen oder schreiben",
        ] },
        { type: "h2", text: "Vorlagen" },
        { type: "ul", items: [
          "Schoen, dass du da bist. Folg mir, dann verpasst du kein LIVE",
          "Ich gehe fast taeglich live. Schreib kurz, woher du kommst",
          "Willkommen. Hier ist immer was los, bleib gern eine Runde",
          "Hi, ich freue mich ueber jede Nachricht von dir. Schreib einfach",
          "Neu hier? Sag kurz Hallo im Chat, dann begruesse ich dich direkt",
        ] },
        { type: "callout", text: "Halte den Text kurz. Zwei Zeilen werden gelesen, fuenf nicht." },
      ],
    },
    {
      slug: "profil-als-visitenkarte",
      title: "Dein Profil als Visitenkarte",
      summary:
        "Profilbild, Bio, angepinnte Videos und Links. Was ein Besucher in drei Sekunden verstehen muss.",
      reading_minutes: 4,
      source_label: "ZOE-Schulung",
      blocks: [
        { type: "lead", text: "Wer dein LIVE verlaesst und auf dein Profil geht, entscheidet dort, ob er folgt. Drei Sekunden hast du." },
        { type: "h2", text: "Profilbild" },
        { type: "ul", items: [
          "Du stehst klar im Vordergrund",
          "Gutes Licht, Gesicht deutlich erkennbar",
          "Kein unruhiger Hintergrund, kein Textchaos",
        ] },
        { type: "h2", text: "Bio" },
        { type: "p", text: "Kurz und klar. Was machst du, wann bist du LIVE, wofuer stehst du. Ein Beispiel: taegliche LIVEs, Chat und Matches, ZOE Creator." },
        { type: "h2", text: "Videos und angepinnte Inhalte" },
        { type: "ul", items: [
          "Aktuelle Videos, nicht drei Monate alt",
          "Oben angepinnt, was dich am besten zeigt",
          "Storys taeglich nutzen",
        ] },
        { type: "h2", text: "Erreichbarkeit" },
        { type: "p", text: "Ein Kontaktweg im Profil, damit deine Community dich auch ausserhalb von TikTok erreicht. Wenn dein privates Konto nicht oeffentlich sein soll, leg ein zweites nur dafuer an." },
        { type: "callout", text: "Pruefe dein Profil einmal im Monat, als waerst du ein Fremder. Wuerdest du dir selbst folgen?" },
      ],
    },
  ],

  // ==========================================================
  "live-psychologie": [
    {
      slug: "konstanz-schlaegt-talent",
      title: "Konstanz schlaegt Talent",
      summary:
        "Was passiert, wenn du Tage auslaesst, und die acht Hebel, die dich stattdessen weiterbringen.",
      reading_minutes: 6,
      source_label: "ZOE-Schulung",
      blocks: [
        { type: "lead", text: "Deine Community ist jeden Tag online, auch ohne dich. Wenn du nicht da bist, wandert der Support weiter und die Bindung geht verloren. Zurueck kommt sie nur langsam." },
        { type: "h2", text: "Die acht Hebel" },
        { type: "h3", text: "1. Entry Hook" },
        { type: "p", text: "Die ersten Sekunden entscheiden. Starte direkt mit einer Ansage, einer Challenge oder einer Emotion." },
        { type: "h3", text: "2. Micro-Loops" },
        { type: "p", text: "Alle drei bis fuenf Minuten ein kleiner Trigger: Challenge, Frage an den Chat, Mini-Ziel." },
        { type: "h3", text: "3. Namen sind Bindung" },
        { type: "p", text: "Namen aktiv nennen, wertschaetzen, reagieren. Wer sich gesehen fuehlt, bleibt." },
        { type: "h3", text: "4. Matches nicht sofort" },
        { type: "p", text: "Erst Community aufbauen, Stimmung erzeugen, Chat aktivieren. Danach Matches." },
        { type: "h3", text: "5. Ein Grund zu bleiben" },
        { type: "p", text: "Jedes LIVE braucht ein Ziel: etwas erreichen, unterhalten, eine Story weiterspinnen." },
        { type: "h3", text: "6. Energie uebertraegt sich" },
        { type: "p", text: "Stimme, Blick, Bewegung. Deine Energie bestimmt, wie der Stream sich anfuehlt." },
        { type: "h3", text: "7. Offline ist Vorbereitung" },
        { type: "p", text: "Vorher ankuendigen, Spannung aufbauen, nachher ein Highlight posten. So bleibst du im Kopf." },
        { type: "h3", text: "8. Plan statt Zufall" },
        { type: "p", text: "Ohne Plan wird es Chaos. Mit Plan bleibt der Fokus. Struktur schlaegt Zufall." },
        { type: "quote", text: "Wer konstant ist, gewinnt. Wer unregelmaessig ist, verliert automatisch.", source: "ZOE Standard" },
        { type: "callout", text: "Was du heute machst, siehst du oft erst in ein bis zwei Monaten in den Zahlen. Das gilt in beide Richtungen." },
      ],
    },
    {
      slug: "tagesstruktur-im-stream",
      title: "Tagesstruktur: was wann funktioniert",
      summary:
        "Vormittag, Nachmittag, Abend. Welcher Inhalt zu welcher Tageszeit passt.",
      reading_minutes: 4,
      source_label: "ZOE-Schulung",
      blocks: [
        { type: "lead", text: "Nicht jede Tageszeit braucht dasselbe Programm. Wer das trennt, wirkt abwechslungsreicher und haelt laenger durch." },
        { type: "h3", text: "Frueh am Tag" },
        { type: "p", text: "Oft ist der Traffic hoch und die Konkurrenz niedrig. Gute Zeit fuer Gespraeche mit der Community, ruhige Matches und Aufbau." },
        { type: "h3", text: "Mittag und Nachmittag" },
        { type: "p", text: "Nimm die Leute in deinen Tag mit. Kochen, unterwegs sein, draussen. Persoenliche Momente binden staerker als jedes perfekte Setup." },
        { type: "h3", text: "Abend" },
        { type: "p", text: "Jetzt das geplante Programm: mehrere Matchpartner, Strafmatches, kleine Storylines, Spannung. Dadurch sehen dich auch die Zuschauer der anderen Streams." },
        { type: "callout", text: "Strafmatches heisst lustig, nicht eklig oder gefaehrlich. Es soll unterhalten und die Leute im LIVE halten." },
      ],
    },
  ],

  // ==========================================================
  "agentur-standards": [
    {
      slug: "start-bei-zoe",
      title: "Dein Start bei ZOE",
      summary:
        "Die ersten Schritte nach der Aufnahme: Profil, Gruppen, Kommunikation, erste LIVEs.",
      reading_minutes: 6,
      source_label: "ZOE Willkommen-Handout",
      blocks: [
        { type: "lead", text: "Damit du direkt weisst, wie alles laeuft: die wichtigsten Punkte fuer deine ersten Tage." },
        { type: "h2", text: "1. Profil vorbereiten" },
        { type: "ul", items: [
          "Profilbild mit gutem Licht, du klar im Vordergrund",
          "Kurze Bio: LIVE-Zeiten, was dich ausmacht",
          "Regelmaessig Videos posten, Storys taeglich nutzen",
        ] },
        { type: "h2", text: "2. LIVEs vorbereiten" },
        { type: "ul", items: [
          "Gutes Licht, ruhiger Hintergrund, fester Halter",
          "Feste LIVE-Zeiten planen",
          "Zuschauer aktiv begruessen statt abwarten",
        ] },
        { type: "h2", text: "3. In den Gruppen" },
        { type: "p", text: "Alle Creator folgen sich gegenseitig. Wenn du neu in eine Gruppe kommst, geben dir andere ein kurzes Zeichen, damit du zurueckfolgen kannst. In den Gruppen kommen News, Updates, Match-Infos und Aenderungen bei TikTok." },
        { type: "ul", items: [
          "Aktiv bleiben und anderen folgen",
          "Ab und zu bei Teamkollegen im Stream vorbeischauen",
          "Kurz Hallo sagen oder ein Teamherz dalassen",
        ] },
        { type: "h2", text: "4. Kommunikation mit dem Management" },
        { type: "p", text: "Bei Fragen zu Tools, Matches, Regeln, Einstellungen oder Events meldest du dich direkt. Auch Banner und Grafiken bekommst du auf Anfrage." },
        { type: "callout", text: "Offizielle Regeln, Updates und Anleitungen kommen ueber die Gruppen und diese Academy, nicht per Einzelnachricht." },
      ],
    },
    {
      slug: "mindestanforderungen",
      title: "Mindestanforderungen",
      summary:
        "LIVE-Tage, Stunden und die Regeln zu Kamera und Filtern, die seit Maerz 2026 gelten.",
      reading_minutes: 3,
      source_label: "ZOE-Regeln 2026",
      blocks: [
        { type: "lead", text: "Damit die Zusammenarbeit fuer beide Seiten funktioniert, gibt es feste Mindestwerte." },
        { type: "kpi", label: "LIVE-Tage pro Monat", value: "mindestens 8" },
        { type: "kpi", label: "LIVE-Stunden pro Monat", value: "mindestens 20" },
        { type: "h2", text: "Dazu gilt" },
        { type: "ul", items: [
          "LIVE nur mit Kamera",
          "Keine Dauerfilter",
          "Kein Standbild statt Kamera",
          "Kein Wechsel zwischen Bild und Kamera waehrend Matches",
        ] },
        { type: "p", text: "Die Werte sind ein Minimum, kein Ziel. Wer regelmaessig deutlich darueber liegt, waechst schneller und verdient mehr." },
        { type: "callout", text: "Wenn du eine Zeit lang nicht streamen kannst, sag vorher Bescheid. Planbare Pausen sind kein Problem, unangekuendigte Funkstille schon." },
      ],
    },
  ],
  // ==========================================================
  technik: [
    {
      slug: "ausstattung-schritt-fuer-schritt",
      title: "Ausstattung Schritt fuer Schritt",
      summary:
        "Was du wirklich brauchst, in welcher Reihenfolge du aufruestest und worauf du verzichten kannst.",
      reading_minutes: 5,
      source_label: "ZOE-Schulung",
      blocks: [
        { type: "lead", text: "Du brauchst kein Studio. Du brauchst ein stabiles Bild, gutes Licht und verstaendlichen Ton. Der Rest kommt spaeter." },
        { type: "h2", text: "Stufe 1: das Minimum" },
        { type: "ul", items: [
          "Fester Handyhalter oder Stativ",
          "Fensterlicht oder eine einfache Lampe vor dir, nicht hinter dir",
          "Ruhige Ecke ohne Durchgangsverkehr",
          "Stabiles WLAN, im Zweifel naeher an den Router",
        ] },
        { type: "h2", text: "Stufe 2: sichtbarer Unterschied" },
        { type: "ul", items: [
          "Ringlicht auf mittlerer Helligkeit, nicht voll aufgedreht",
          "Zweite Lichtquelle seitlich, damit das Gesicht nicht flach wirkt",
          "Hintergrund bewusst gestalten: eine Wand, ein Bild, eine Lichtkette reichen",
        ] },
        { type: "h2", text: "Stufe 3: Feinschliff" },
        { type: "ul", items: [
          "Externes Mikro, wenn der Raum hallt",
          "Zweites Geraet fuer den Chat, damit du nicht dauernd am Stream-Handy tippst",
          "Powerbank oder Ladekabel, damit lange Sessions nicht am Akku scheitern",
        ] },
        { type: "h2", text: "Ton pruefen" },
        { type: "p", text: "Nimm dich vor dem LIVE 20 Sekunden auf und hoer es dir an. Zu leise, zu hallig oder zu viel Nebengeraeusch faellt dir so vorher auf, nicht erst durch Kommentare." },
        { type: "callout", text: "Bevor du Geld ausgibst: Halter und Licht bringen mehr als jede Kamera." },
      ],
    },
  ],

  // ==========================================================
  "analyse-verstehen": [
    {
      slug: "nach-dem-live-auswerten",
      title: "Nach dem LIVE auswerten",
      summary:
        "Vier Zahlen, eine Schlussfolgerung. So ziehst du in fuenf Minuten etwas aus dem Stream, das den naechsten besser macht.",
      reading_minutes: 4,
      source_label: "ZOE-Schulung",
      blocks: [
        { type: "lead", text: "Auswerten heisst nicht, alle Zahlen anzuschauen. Es heisst, aus wenigen Zahlen eine Entscheidung fuer das naechste LIVE abzuleiten." },
        { type: "h2", text: "Die vier Zahlen" },
        { type: "ul", items: [
          "Zuschauer im Schnitt, nicht der Spitzenwert",
          "Verweildauer",
          "Neue Follower",
          "Interaktionen: Kommentare, Likes, Teilungen",
        ] },
        { type: "h2", text: "Die eine Frage" },
        { type: "p", text: "Was lief gut, und was mache ich naechstes Mal anders? Eine Sache reicht. Zehn Vorsaetze setzt niemand um." },
        { type: "h2", text: "Typische Muster" },
        { type: "ul", items: [
          "Viele Zuschauer, kurze Verweildauer: dein Start holt Leute rein, haelt sie aber nicht",
          "Wenig Zuschauer, hohe Verweildauer: dein Inhalt sitzt, dir fehlt Sichtbarkeit. Videos und Ankuendigungen ausbauen",
          "Kaum neue Follower: du sprichst den Follow nicht aktiv an",
          "Stiller Chat: zu wenig Fragen, zu wenig Namen",
        ] },
        { type: "h2", text: "Ueber die Woche" },
        { type: "p", text: "Schreib dir Uhrzeit, Dauer und die vier Werte kurz auf. Nach zwei Wochen siehst du dein Muster deutlicher als jede App es dir zeigt." },
        { type: "callout", text: "Zahlen sind kein Urteil ueber dich. Sie zeigen nur, welche Stellschraube als naechstes dran ist." },
      ],
    },
  ],
};
