# STARTPAKET – Die Reise zum Winterphönix

Stand: 18.11.2026 · Für die erste Claude-Code-Sitzung

---

## 0. Anleitung für Jörn (einmalig)

1. Auf github.com ein **öffentliches** Repository anlegen, z. B. `winterspiel` (neutraler Name), mit README.
2. Zwei-Faktor-Anmeldung bei GitHub prüfen (Einstellungen → Password and authentication).
3. claude.ai/code öffnen → Repository `winterspiel` wählen.
4. Diese Datei **und** den Masterplan V3 anhängen.
5. Die Glutberg-Datei **nicht** ins Repo legen (sie enthält Insider über Simon). Claude soll sie nur als Vorlage lesen: Link angeben, notfalls die HTML herunterladen und anhängen.
6. Die Nachricht aus Abschnitt 9 einfügen und senden.

---

## 1. Inhalt für `CLAUDE.md` (gilt in jeder Sitzung)

### Projekt
- Adventskalender-Spiel „Die Reise zum Winterphönix“, Geschenk von Jörn für seine Frau (Spielfigur: Charly).
- Gerät: **iPad, Querformat**, Safari, als Web-App auf dem Homescreen. iPhone muss laufen, ist aber zweitrangig.
- Jörn kann nicht programmieren und prüft durch Spielen. Was Claude nicht selbst testet, testet niemand.

### Arbeitsweise
- Sitzungsstart: `STATUS.md` lesen. Nichts fragen, was dort oder in `plan/` steht.
- **Eine Sitzung = eine Stufe** aus dem Stufenplan.
- Sitzungsende: bauen → Tests → Commit → `STATUS.md` aktualisieren (Stand, Entscheidungen, offene Punkte, nächster Schritt).
- Bericht an Jörn: Ergebnis zuerst, je Punkt eine Zeile, was er testen soll, höchstens eine Frage. Kurz, er liest am Handy.

### Feste Regeln
- **Eigene Welt:** nur Namen aus dem Weltlexikon (Abschnitt 3). Keine Original-Figuren, -Wappen, -Namen oder -Musik aus Harry Potter oder anderen Werken. Die Stimmung (verschneites Zauberschloss, Kerzen, Porträts, Eulen) ist frei.
- **Alles selbst erzeugt:** Grafik als Pixel im Code, Musik und Töne per Web Audio. Nichts von fremden Servern, keine Fremdbibliotheken, keine Tracker. Content-Security-Policy wie in Glutberg.
- **Öffentliches Repo:** keine Nachnamen, keine Adresse, keine Fotos, keine privaten Daten. Fotos von Jörn dienen nur als Vorlage und werden nie committet.
- **Texte** über `textContent`, nie `innerHTML` mit Spieltext.
- **Speichern:** Schlüssel `winterphoenix_save`, Datenformat mit Versionsnummer und Migration. Ein Update darf einen bestehenden Spielstand **nie** löschen. Export/Import als Code (für Gerätewechsel und Sicherung).
- **Tagesfreischaltung:** Zeitzone Europe/Berlin. Tag N öffnet am N. Dezember um 0:00. Verpasste Tage bleiben nachholbar, ab dem 24.12. ist alles offen.
- **Testmodus:** `?testtag=N` simuliert Tag N mit eigenem Speicherplatz (`winterphoenix_test`) und berührt den echten Spielstand nicht.
- **Kein Game Over:** Bei einer Niederlage geht es kurz vor der Stelle weiter. Kämpfe sind leicht, Bosse eher Rätselkämpfe.
- **Kein Service Worker,** damit Updates sicher ankommen.
- **Wasserzeichen** im Titelbild/Abspann: „Entwickelt und erstellt von Jörn Löwenstein mit Hilfe von künstlicher Intelligenz (Claude)“.

### Technik
- Quellcode in `src/` (Module), Inhalte als JSON in `data/` (Karten, Figuren, Gegner, Bosse, Objekte, Quests, Dialoge).
- Build-Skript (Node, ohne Pakete) bündelt alles zu **einer** Datei `docs/index.html`. GitHub Pages veröffentlicht aus `main` → `/docs`. Planungsdokumente liegen in `plan/`.
- Grafikmaß (in der Stilprobe freigeben): Bild 512×384 (4:3), Kachel 32×32, Figur 32×40, ganzzahlig skaliert, Dreiviertelperspektive.
- Steuerung: Steuerkreuz links, A/B rechts (Glutberg-Prinzip, für das Querformat angepasst). Ton-Schalter mit Hinweis auf den Stummschalter.
- Vorlage Glutberg: Steuerung, Dialogbox, Gras/Effekte, Speicherlogik und Datenaufbau übernehmen und an das neue Grafikmaß anpassen.

### Tests vor jedem Push
- Datenprüfung: Jede Karte ist erreichbar, jede Tür hat ein Ziel, jede Quest ist abschließbar, jeder Dialog-Verweis existiert.
- Spielstand: Ein alter Spielstand übersteht das Update (Migrationstest mit gutem und kaputtem Beispiel).
- Freischaltung: 30.11., 1.12., 24.12. und 25.12. werden richtig behandelt.
- Rauchtest im Headless-Browser, falls verfügbar: Das Spiel startet ohne Fehler auf der Konsole.
- Schon freigeschaltete Tage nur mit besonderer Vorsicht ändern. Im Zweifel `git revert`.

---

## 2. Bauauftrag

**Ziel:** Ein gemütliches Open-World-Rätsel-RPG in einem verschneiten Zauberschloss. Vom 1. bis 24.12. öffnet täglich eine Hauptquest (ca. 10 Min). Dazu kommen Erkundung, Nebenquests, Geheimgänge und Gespräche.
**Zielperson:** Jörns Frau, iPad quer.
**Aufbau:** Eine zusammenhängende Welt mit etwa 20 Karten, die über den Advent wächst. Die Story läuft um die Legende des Winterphönix (Masterplan V3, Abschnitt 4 und 8).
**Bewusst nicht dabei:** Online-Funktionen, Konten, Bestenliste, schwere Kämpfe, echtes Geschenk am Ende.
**Fertig, wenn:**
1. Am 1.12. läuft Q01 auf dem iPad als Homescreen-App, die Musik spielt.
2. Jede Quest Q01–Q24 ist am jeweiligen Tag spielbar und in ca. 10 Min. lösbar.
3. Jedes Update erhält den Spielstand, belegt durch den Migrationstest.
4. Die vier Haustiere kommen mit ihren Rollen und ihrem Aussehen vor (Abschnitt 4).
5. Es werden keine fremden Inhalte geladen und es stehen keine privaten Daten im Repo.
6. Die Abnahme mit dem Sicherheits-Check ist vor dem 1.12. bestanden.

---

## 3. Weltlexikon (verbindliche Namen)

| Masterplan V3 | Im Spiel |
|---|---|
| Hogwarts | Zauberschule **Løvestein** |
| Hufflepuff | Haus **Bernfuchs** (Bernstein/Moosgrün), Charlys Haus |
| weitere Häuser | **Eisvogel** (Türkis/Perlweiß), **Tannenhirsch** (Tannengrün/Kupfer), **Sternbär** (Pflaume/Silber) |
| Hermine | **Lotte Silberfeder**, Haus Eisvogel, Bücherwurm, Hinweisgeberin, Bibliotheksquests |
| Schwarzer See | Spiegelsee |
| Verbotener Wald | Raunwald |
| Hogsmeade | Dorf Schneeweiler |
| Hagrids Hütte | Wildhüterhütte |
| Lumos | Luxa (Licht) |
| Alohomora | Clavis (Öffnen) |
| Reparo | Restauro (Reparieren) |
| Accio | Advoco (Heranholen) |
| Incendio | Flammula (Feuer) |
| Wingardium Leviosa | Levitas (Schweben) |
| Expecto Patronum | Custodia (Schutz) |
| Winterphönix-Feuer | Phoenix Hiemis (Finalzauber) |

Weitere Namen (Lehrkräfte, Porträts, NPCs) schlägt Claude in der Story-Bibel vor, Jörn gibt sie frei.

---

## 4. Haustiere (Pflicht)

- **Diego** (Hund, lebt heute bei Jörn und Charly): Schlosshund von Løvestein, guter Hausgeist (Hauself-Rolle). Folgt Charly ab Q01. Seine Fähigkeit **Schnüffeln** zeigt Geheimnisse und Geheimgänge in der Nähe durch funkelnde Pfotenspuren. Das ist die Kernmechanik für „Neugier“.
- **Mailo** (früherer Hund): kommt als echter, lebendiger Hund vor. Er wohnt an der Wildhüterhütte und kennt die Außengebiete. Im Raunwald (Q11) führt er Charly mit seiner Nase sicher hindurch, in Q18 noch einmal. Diego und Mailo werden Freunde und haben gemeinsame Szenen.
- **Gandalf** (früherer Hamster): alter, weiser Bibliothekshamster, kennt die Legende des Winterphönix. Schlüsselfigur in Q13.
- **Frieda** (Hamster, lebt heute): lebt im Bernfuchs-Gemeinschaftsraum. Ihr Laufrad treibt in Q05 die Sternenuhr an. Nebenquest: ihre Lieblingskörner im Schloss sammeln.

### Aussehen (Vorlage für die Sprites)

| Figur | Aussehen |
|---|---|
| Charly | blonde Haare, Brille, Umhang in Bernfuchs-Farben |
| Jörn | kurze rot-blond-braune Haare, Brille |
| Diego | Straßenhund, etwa kniehoch, blond und schwarzbraun gescheckt |
| Mailo | Cavalier King Charles Spaniel, weiß-braun |
| Frieda | Goldhamster-Weibchen, dreifarbig: weiß, schwarz, braun |
| Gandalf | Goldhamster-Männchen, braun-weiß |

---

## 5. Stufenplan

| Stufe | Bis | Inhalt | Jörn testet |
|---|---|---|---|
| 0 | 20.11. | Repo, CLAUDE.md, Masterplan V4 (V3 mit Weltlexikon), Story-Bibel Q01–Q24 (je 3–5 Zeilen: Ort, Rätsel, Fragment, Haustier-Moment) | Story-Bibel lesen und freigeben |
| 1 | 24.11. | Motor: Steuerung, Kollision, Kartenwechsel, Dialog, Questlog, Speichern, Freischaltung, Testmodus. Stilprobe: Bernfuchs-Gemeinschaftsraum mit Charly, Jörn, Diego, Frieda | ca. 30 Min: Look und Steuerung |
| 2 | 29.11. | Schlosskern, Große Halle, Bibliothek, Innenhof, Q01–Q04, erste Nebenquests, Musik, Homescreen-App | ca. 30 Min |
| 3 | 30.11. | Generalprobe auf iPad und iPhone, Abnahme mit Sicherheits-Check | ca. 45 Min |
| 4 | laufend | Etwa zweimal pro Woche ein Update mit neuen Gebieten und Quests, immer 3–4 Tage Vorsprung. Kampf bis Q11, Q24 bis spätestens 20.12. | je ca. 20 Min |

---

## 6. Sicherheitsblatt (Stufe 1: Speicher nur auf dem Gerät)

- **Daten:** nur der Spielstand im Browser, keine echten Personendaten.
- **Wer könnte was wollen:** Kaum jemand. Fremde können den öffentlichen Code lesen.
- **Was wäre schlimm:** Der Spielstand geht verloren oder ein Update bricht das Spiel. Gegenmittel: Migrationstest, Export-Code, `git revert`.
- **Annahmen:** GitHub-Konto mit Zwei-Faktor-Anmeldung, Spielen über Jörns Link.
- **Restrisiko (bewusst akzeptiert):** Spätere Quests lassen sich im Code oder über die Datumseinstellung vorab sehen.

---

## 7. Offene Punkte

1. Freigabe des Grafikmaßes in der Stilprobe.
2. Namen von Lehrkräften und NPCs in der Story-Bibel.

---

## 8. Inhalt für `STATUS.md` (Startzustand)

- Stand: Stufe 0 beginnt.
- Repo ist vorerst **privat** (GitHub Free: kein Pages bei privaten Repos). Vor dem ersten iPad-Test in Stufe 1 Jörn erinnern, das Repo auf öffentlich zu stellen und Pages einzuschalten.
- Entscheidungen: siehe CLAUDE.md, Weltlexikon, Bauauftrag.
- Nächster Schritt: Masterplan V4 und Story-Bibel schreiben, Jörn gibt sie frei.

---

## 9. Erste Nachricht an Claude Code (einfügen)

> Lies das angehängte STARTPAKET und den Masterplan V3. Lege die Repo-Struktur an: CLAUDE.md und STATUS.md aus dem Startpaket, plan/MASTERPLAN_V4.md (V3 mit den Namen aus dem Weltlexikon), plan/STORY_BIBEL.md. Die Glutberg-Vorlage findest du unter https://claude.ai/artifact/B31G6yek3y8CZfhDK3Tyt1 – nur lesen, nicht ins Repo legen. Übernimm das Auslieferungsprinzip (GitHub Pages + Homescreen-App) wie bei meiner Anatomie-App. Arbeite Stufe 0 ab, committe und zeig mir dann die Story-Bibel zur Freigabe.
