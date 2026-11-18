# CLAUDE.md – Die Reise zum Winterphönix

Quelle: `plan/STARTPAKET.md`, Abschnitt 1 (verbindlich). Weltlexikon und Haustiere: `plan/STARTPAKET.md` Abschnitt 3–4 bzw. `plan/MASTERPLAN_V4.md`.

## Projekt
- Adventskalender-Spiel „Die Reise zum Winterphönix“, Geschenk von Jörn für seine Frau (Spielfigur: Charly).
- Gerät: **iPad, Querformat**, Safari, als Web-App auf dem Homescreen. iPhone muss laufen, ist aber zweitrangig.
- Jörn kann nicht programmieren und prüft durch Spielen. Was Claude nicht selbst testet, testet niemand.

## Arbeitsweise
- Sitzungsstart: `STATUS.md` lesen. Nichts fragen, was dort oder in `plan/` steht.
- **Eine Sitzung = eine Stufe** aus dem Stufenplan.
- Sitzungsende: bauen → Tests → Commit → `STATUS.md` aktualisieren (Stand, Entscheidungen, offene Punkte, nächster Schritt).
- Bericht an Jörn: Ergebnis zuerst, je Punkt eine Zeile, was er testen soll, höchstens eine Frage. Kurz, er liest am Handy.

## Feste Regeln
- **Eigene Welt:** nur Namen aus dem Weltlexikon (Startpaket Abschnitt 3, Masterplan V4 Abschnitt 2). Keine Original-Figuren, -Wappen, -Namen oder -Musik aus Harry Potter oder anderen Werken. Die Stimmung (verschneites Zauberschloss, Kerzen, Porträts, Eulen) ist frei.
- **Alles selbst erzeugt:** Grafik als Pixel im Code, Musik und Töne per Web Audio. Nichts von fremden Servern, keine Fremdbibliotheken, keine Tracker. Content-Security-Policy wie in Glutberg.
- **Öffentliches Repo:** keine Nachnamen, keine Adresse, keine Fotos, keine privaten Daten. Fotos von Jörn dienen nur als Vorlage und werden nie committet.
- **Texte** über `textContent`, nie `innerHTML` mit Spieltext.
- **Speichern:** Schlüssel `winterphoenix_save`, Datenformat mit Versionsnummer und Migration. Ein Update darf einen bestehenden Spielstand **nie** löschen. Export/Import als Code (für Gerätewechsel und Sicherung).
- **Tagesfreischaltung:** Zeitzone Europe/Berlin. Tag N öffnet am N. Dezember um 0:00. Verpasste Tage bleiben nachholbar, ab dem 24.12. ist alles offen.
- **Testmodus:** `?testtag=N` simuliert Tag N mit eigenem Speicherplatz (`winterphoenix_test`) und berührt den echten Spielstand nicht.
- **Kein Game Over:** Bei einer Niederlage geht es kurz vor der Stelle weiter. Kämpfe sind leicht, Bosse eher Rätselkämpfe.
- **Kein Service Worker,** damit Updates sicher ankommen.
- **Wasserzeichen** im Titelbild/Abspann: „Entwickelt und erstellt von Jörn Löwenstein mit Hilfe von künstlicher Intelligenz (Claude)“.
- **Glutberg-Vorlage** nur lesen (Link in `STATUS.md`), nie ins Repo kopieren – sie enthält private Insider.

## Technik
- Quellcode in `src/` (Module), Inhalte als JSON in `data/` (Karten, Figuren, Gegner, Bosse, Objekte, Quests, Dialoge).
- Build-Skript (Node, ohne Pakete) bündelt alles zu **einer** Datei `docs/index.html`. GitHub Pages veröffentlicht aus `main` → `/docs`. Planungsdokumente liegen in `plan/`.
- Grafikmaß (in der Stilprobe freigeben): Bild 512×384 (4:3), Kachel 32×32, Figur 32×40, ganzzahlig skaliert, Dreiviertelperspektive.
- Steuerung: Steuerkreuz links, A/B rechts (Glutberg-Prinzip, für das Querformat angepasst). Ton-Schalter mit Hinweis auf den Stummschalter.
- Vorlage Glutberg: Steuerung, Dialogbox, Gras/Effekte, Speicherlogik und Datenaufbau übernehmen und an das neue Grafikmaß anpassen.
- Befehle: `npm run build` (baut `docs/`), `npm test` (Kern-Tests), `npm run smoke` (Headless-Browser), `npm run check` (alles). Neue Karten: `data/maps/<id>.json`; neue Maler in `src/engine/paint_*.js`.

## Auslieferung (Prinzip wie Anatomie-3d)
- GitHub Pages + Homescreen-App: `docs/index.html`, `docs/app.webmanifest` (`display: standalone`, `orientation: landscape`, `start_url: ./`), Icons 180/192/512 als PNG (vom Build-Skript selbst erzeugt), `apple-mobile-web-app-capable`, `apple-touch-icon`, `theme-color`.
- Abweichend von Anatomie-3d: **kein `sw.js`**, Pages aus `/docs` statt Wurzel.
- Repo ist vorerst privat → vor dem ersten iPad-Test Jörn erinnern: Repo öffentlich stellen, Pages einschalten (main, /docs).

## Modelle und Nutzungslimit (Entscheidung Jörn, 18.11.)
- Ziel: Kosten und Nutzungslimit schonen.
- **Stufe 1–3 (Motor, Generalprobe):** Opus baut selbst, ohne Hilfs-Agenten.
- **Stufe 4 (Updates im Dezember):** Opus plant jedes Update knapp (Auftrag mit Karten, Quests, Dialogen, Tests) und prüft am Ende. Inhalte (JSON-Daten, Dialoge, Karten) schreibt ein Sonnet-Agent. Haiku nur für rein mechanische Aufgaben (z. B. Umbenennen, Tests laufen lassen).
- Ein Hilfs-Agent bekommt immer: `CLAUDE.md`, `STATUS.md`, den Abschnitt der Story-Bibel und den konkreten Auftrag. Ergebnis gilt erst, wenn alle Tests grün sind und Opus es gesehen hat.
- Sparsam arbeiten: große Dateien nicht mehrfach lesen, nur gezielt suchen, kurze Berichte.

## Tests vor jedem Push
- Datenprüfung: Jede Karte ist erreichbar, jede Tür hat ein Ziel, jede Quest ist abschließbar, jeder Dialog-Verweis existiert.
- Spielstand: Ein alter Spielstand übersteht das Update (Migrationstest mit gutem und kaputtem Beispiel).
- Freischaltung: 30.11., 1.12., 24.12. und 25.12. werden richtig behandelt.
- Rauchtest im Headless-Browser, falls verfügbar: Das Spiel startet ohne Fehler auf der Konsole.
- Schon freigeschaltete Tage nur mit besonderer Vorsicht ändern. Im Zweifel `git revert`.
