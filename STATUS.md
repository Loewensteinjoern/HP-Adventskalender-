# STATUS

## Stand (18.11.2026)
- **Stufe 2 gebaut** (Version 0.2), wartet auf Jörns iPad-Test.
- Neue Gebiete: Schlosskern (Drehkreuz), Große Halle, Bibliothek, Innenhof (Schnee), Eulenturm, Uhrenturm. Kellertreppe öffnet sich ab 1.12.
- Quests Q01–Q04 vollständig spielbar, je ein Winterfragment. Nebenaufgabe „Knarz’ Schlüsselbund“ (ab Tag 1).
- Neue Mechaniken: Reihenfolge-Rätsel mit Vorführung (Kerzen, `data/puzzles.json`), Takt-Minispiel (Uhrmeister), Geheimgang über Flag (loser Stein), mehrteilige Quest-Schritte (`flags` + `{n}`), Nebenquests (`neben: true`), Zauber als Flags `zauber_*` (Anzeige im Questlog).
- Neue Figuren: Federleicht, Pendel, Leisetritt, Knarz, Sternwald, Uhrmeister, Eule Pimpernell. Musik: schloss, halle, hof, turm.
- Tests: `npm run check` = Build mit Datenprüfung, 36 Kern-Tests, Rauchtest Stufe 1, Quest-Durchlauf Q01–Q04 + Nebenaufgabe (alle grün).
- Look und Grafikmaß von Jörn freigegeben (18.11.).
- Nachbesserung nach Jörns Test: Musik war nur „Klakern“ → weichere Instrumente, Bass eine Oktave höher (iPad-Lautsprecher), Flächenklang in jedem Stück, Tiefpass + Hall + Kompressor, `latencyHint: 'playback'`, leiseres Tipp-Geräusch. Automatischer Ton-Test (Übersteuerung, Knackser, Pegel) im Rauchtest.
- Musik knatterte auf dem iPad weiter → Ursache vermutlich der stumme Freischalt-Ton mit 22.050 Hz (bekannter iOS-Fehler: Gerät wechselt auf falsche Abtastrate). Jetzt mit Geräte-Abtastrate, plus Neuanlage bei falscher Rate. Außerdem wird jedes Stück vorab (OfflineAudioContext) mit Filter und Hall berechnet und als **eine** Schleife abgespielt. Test prüft: Musik läuft live, Rate ≥ 44,1 kHz, keine Übersteuerung/Knackser, nahtlose Schleife.
- Jörns Wünsche (18.11. abends): (1) Zwischen allen Räumen eigene Übergangsräume in eigenem Stil: Großes Treppenhaus (→ Bibliothek, Holztreppe, Gemälde, Kronleuchter), Wendeltreppe (→ Uhrenturm), Arkadengang (→ Innenhof, Bögen mit Schneeblick, Garderobe), Vorhalle (→ Große Halle, Rüstungen, Kronleuchter), Eulenstiege (→ Eulenturm, verschneite Steintreppe). Grundregel ab jetzt: **jeder neue Ort bekommt einen eigenen Übergang**. (2) Uhrmeister-Rätsel neu: drei Denkaufgaben, Stundenzeiger stellen (statt Töne merken). (3) Zaubermenü: An Kerzen, Briefkapsel, Uhrwerk muss der richtige Spruch gewählt werden (`zauber` in der Talk-Regel, `data/zauber.json`); falscher Zauber → eigene Antwort. Q03 hat dafür Schritt 5 „Kapsel mit Clavis öffnen“. (4) Kerzen-Vorführung: Kamera schwenkt, alle vier Kerzen sichtbar (`focus` im Rätsel).
- Ton nach dem Kerzen-Rätsel auf dem iPad weg (im Testbrowser nicht nachstellbar, Pegel dort normal). Absicherung: Wächter alle 1,5 s (Zustand „interrupted/suspended“, stehende Uhr, ungültige Werte) → Hinweis „einmal tippen“ → Tonausgabe wird neu angelegt; Tippen weckt auch den iOS-Zustand „interrupted“; höchstens 14 gleichzeitige Effekt-Klänge; Fragment-Fanfare zeitversetzt; Schutz gegen ungültige Werte. Ton aus/an im Menü legt ebenfalls neu an.
- Belebung: Figuren schauen sich um (`turn`), laufen umher (`wander: n`), Sprechblasen (`blasen` an der Figur). Neue Figuren: Mats, Juna, Ida Muschelweiß, Oskar Rindenmoos, Finn Haselnuss, Kater Zimt, Rotkehlchen.
- Große Halle gemütlicher: zwei Kamine, vier Statuen, Sitzecke mit Teppich, Weihnachtsbuffet, kleine Tannenbäume.

## Entscheidungen
- Siehe `CLAUDE.md`, Weltlexikon und Bauauftrag (`plan/STARTPAKET.md`).
- Grafikmaß wie geplant umgesetzt: 512×384, Kachel 32, Figur 32×40, ganzzahlig skaliert (iPad quer: 3-fach). **Von Jörn freigegeben (18.11.).**
- Tasten: A = sprechen/untersuchen, B = Diego schnüffeln lassen, ☰ = Menü. Kein Schritt-Geräusch.
- Spielstand: `winterphoenix_save` + `_backup` (vorheriger gültiger Stand) + `_defekt` (unlesbarer Stand wird aufgehoben, nie gelöscht). Migrationskette `MIGRATIONS` in `src/core/save.js`.
- Quest-Schritte hängen an Flags; `"teilweise": true` erlaubt Quests, deren Rest erst später gebaut wird (Build warnt).
- Fragment-System: ein Winterfragment pro Quest (24 Zeilen „Phönixlied“).
- Zauber-Reihenfolge: Luxa Q02, Clavis Q03, Restauro Q04, Advoco Q08, Levitas Q09, Flammula Q11, Custodia Q15, Phoenix Hiemis Q22.
- Glutberg-Vorlage (https://claude.ai/artifact/B31G6yek3y8CZfhDK3Tyt1) nur gelesen; nichts davon im Repo.
- Modelle: Stufe 1–3 Opus allein; ab Stufe 4 plant/prüft Opus, Sonnet-Agent schreibt Inhalte.
- Auslieferung wie Anatomie-3d (Pages + Manifest + Apple-Icons), ohne Service Worker, Pages aus `/docs`.

## Offene Punkte
1. **Jörn: iPad-Test.** Repo ist öffentlich, `main` = `startpaket` (18.11.). Pages muss Jörn einschalten (Settings → Pages → main, /docs). Adresse: https://loewensteinjoern.github.io/HP-Adventskalender-/
2. iPhone quer: Bild ist wegen der Höhe nur 2-fach skaliert (klein, aber spielbar).

## Nächster Schritt
**Verbindlich ist jetzt `plan/FAHRPLAN.md`** (ersetzt den Stufenplan ab Stufe 3). Nächste Sitzung: **S1 Story-Bibel V2** (bis 20.11.) – spürbare Bedrohung durch den Winterkönig ab Tag 1, Jörns eigene Geschichte, Tageshaken, Nebenquests, Erkundung, Kampfdesign. Danach S2 Kampfsystem + Schlosskarte, S3 Q01–Q04 neu erzählt, S4 Q05–Q07, S5 Generalprobe 30.11.
