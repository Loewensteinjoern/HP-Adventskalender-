# STATUS

## Stand (18.11.2026)
- **Stufe 1 gebaut, wartet auf Jörns iPad-Test** (Look und Steuerung, Freigabe Grafikmaß).
- Motor fertig: Steuerung (Touch + Tastatur), Kollision, Begleiter folgen, Kartenwechsel mit Überblendung, Dialogbox, Questlog, Phönixlied-Seite, Speichern (automatisch + Sicherung), Export/Import-Code, Freischaltung Europe/Berlin, Testmodus `?testtag=N`, Musik/Töne per Web Audio, Licht und Funken.
- Stilprobe: Bernfuchs-Gemeinschaftsraum (Galerie, Kamin, Frieda im Laufrad, Tannenbaum) + Kellergang mit Sir Ottokar. Figuren: Charly, Jörn, Pit, Diego (Lotte vorbereitet).
- Q01 teilweise: Diego wecken → Schnüffeln → Feder → Jörn. Schritt 4 (Große Halle, Lotte) folgt in Stufe 2; Treppe im Kellergang ist bis dahin „zugeschneit“.
- Geheimnisse: Zimtstern (Gemeinschaftsraum), Notiz (Kellergang).
- Tests: `npm run check` → Build mit Datenprüfung, 36 Kern-Tests (Freischaltung, Migration, Sicherung, Export), Rauchtest im Headless-Browser (iPad, iPhone quer/hoch).

## Entscheidungen
- Siehe `CLAUDE.md`, Weltlexikon und Bauauftrag (`plan/STARTPAKET.md`).
- Grafikmaß wie geplant umgesetzt: 512×384, Kachel 32, Figur 32×40, ganzzahlig skaliert (iPad quer: 3-fach). **Freigabe durch Jörn offen.**
- Tasten: A = sprechen/untersuchen, B = Diego schnüffeln lassen, ☰ = Menü. Kein Schritt-Geräusch.
- Spielstand: `winterphoenix_save` + `_backup` (vorheriger gültiger Stand) + `_defekt` (unlesbarer Stand wird aufgehoben, nie gelöscht). Migrationskette `MIGRATIONS` in `src/core/save.js`.
- Quest-Schritte hängen an Flags; `"teilweise": true` erlaubt Quests, deren Rest erst später gebaut wird (Build warnt).
- Fragment-System: ein Winterfragment pro Quest (24 Zeilen „Phönixlied“).
- Zauber-Reihenfolge: Luxa Q02, Clavis Q03, Restauro Q04, Advoco Q08, Levitas Q09, Flammula Q11, Custodia Q15, Phoenix Hiemis Q22.
- Glutberg-Vorlage (https://claude.ai/artifact/B31G6yek3y8CZfhDK3Tyt1) nur gelesen; nichts davon im Repo.
- Modelle: Stufe 1–3 Opus allein; ab Stufe 4 plant/prüft Opus, Sonnet-Agent schreibt Inhalte.
- Auslieferung wie Anatomie-3d (Pages + Manifest + Apple-Icons), ohne Service Worker, Pages aus `/docs`.

## Offene Punkte
1. **Jörn: iPad-Test** – vorher Repo öffentlich stellen, `startpaket` nach `main` übernehmen, Pages einschalten (main, /docs).
2. Freigabe Grafikmaß und Look.
3. iPhone quer: Bild ist wegen der Höhe nur 2-fach skaliert (klein, aber spielbar).

## Nächster Schritt
Stufe 2 (bis 29.11.): Schlosskern, Große Halle, Bibliothek, Innenhof; Q01 fertig, Q02–Q04; erste Nebenquests; Musik ausbauen; Homescreen-App prüfen.
