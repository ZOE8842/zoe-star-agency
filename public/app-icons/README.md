# ZOE Star App-Icons

Dieser Ordner enthaelt die Icons fuer den PWA-Homescreen-Install
(iPhone "Zum Home-Bildschirm" + Android "Installieren").

## Erwartete Dateien

| Datei | Format | Groesse | Verwendung |
|---|---|---|---|
| `icon-192.png` | PNG | 192x192 | Android Homescreen (Standard) |
| `icon-512.png` | PNG | 512x512 | Android Splash + Hi-Res |
| `maskable-icon-192.png` | PNG | 192x192 | Android adaptive Icon (Safe Zone 80%) |
| `maskable-icon-512.png` | PNG | 512x512 | Android adaptive Icon Hi-Res |
| `apple-touch-icon.png` | PNG | 180x180 (oder 512) | iOS Homescreen |

## Maskable-Icons (Safe Zone)

Maskable Icons werden von Android in unterschiedlichen Formen
(Kreis / Squircle / Rechteck) zugeschnitten. Wichtige Bildbereiche
muessen innerhalb der inneren 80% (Safe Zone) liegen, sonst werden
sie beschnitten. Hintergrund sollte den ganzen Frame fuellen
(z.B. Ink #0A0A0A) und das Logo zentral, mit Padding.

Tool zum Testen: https://maskable.app

## Aktueller Stand

Die Dateien hier sind Provisorium (kopiert aus public/icon-192.png
+ icon-512.png + brand/avatar-512.png). Bitte durch finale Icons
von Nesip ersetzen sobald geliefert.

## Update-Workflow

1. Finale PNGs ersetzen (gleicher Dateiname)
2. git add public/app-icons/
3. git commit -m "feat(pwa): final brand icons"
4. git push origin main
5. Vercel deployed automatisch
6. Verify: https://www.zoe-star.de/app-icons/icon-512.png liefert das neue Bild

## Manifest-Referenz

Diese Pfade sind in public/manifest.webmanifest verlinkt. Wenn die
Dateinamen geaendert werden, muss das Manifest mit angepasst werden.
