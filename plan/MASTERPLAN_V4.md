# WINTERPHÖNIX MASTERPLAN V4
## Projektbibel, Story-Dokument und Design-Bibel

**Projektname:** Die Reise zum Winterphönix
**Version:** Masterplan V4 (Stand 18.11.2026)
**Status:** Arbeitsfassung, verbindlich zusammen mit `plan/STARTPAKET.md`
**Genre:** Storybasiertes Open-World-Adventskalender-RPG
**Primäre Inspiration:** Die Reise zum Glutberg

**Änderungen gegenüber V3**
- Alle Namen aus dem Weltlexikon übernommen (eigene Welt, keine Originalnamen).
- Haustiere mit Rollen und Aussehen ergänzt (Abschnitt 5, 13).
- Aussehen der Hauptfiguren festgelegt.
- Fragment-System: ein Winterfragment pro Quest (24 Zeilen „Phönixlied“), Details in `plan/STORY_BIBEL.md`.
- Questtitel Q14, Q17, Q18 an die eigene Welt angepasst.
- Technik und Auslieferung konkretisiert (Abschnitt 17).

---

## Inhaltsverzeichnis
1. Projektvision · 2. Weltlexikon · 3. Spielerlebnis · 4. Inspirationsquellen · 5. Hauptfiguren und Haustiere · 6. Hauptgeschichte · 7. Weltstruktur · 8. Questsystem · 9. Hauptquestreihe Q01–Q24 · 10. Gegnerbibliothek · 11. Bossbibliothek · 12. Zaubersystem · 13. Art Bible · 14. Figurenregeln · 15. Licht- und Magiesystem · 16. Referenzräume · 17. Möbelbibliothek · 18. Technische Architektur · 19. Produktionsstand · 20. Offene Punkte

---

# 1. Projektvision

## Grundidee
Die Reise zum Winterphönix ist ein Open-World-RPG in einem verschneiten Zauberschloss, aufgebaut als Adventskalender-Spiel.

Der Spieler erlebt nicht 24 voneinander getrennte Level, sondern eine einzige zusammenhängende Welt, die sich über die Adventszeit weiterentwickelt: Neue Bereiche öffnen sich, neue Geheimnisse werden sichtbar, neue Quests und Dialoge erscheinen.

Das Spiel soll das Gefühl vermitteln, einen kompletten magischen Winter in der Zauberschule Løvestein zu verbringen.

## Hauptziel
Die Spielerin soll am Ende sagen:
> „Ich habe einen Dezember in Løvestein erlebt.“

Nicht:
> „Ich habe 24 Level gespielt.“

---

# 2. Weltlexikon (verbindliche Namen)

| Begriff | Im Spiel |
|---|---|
| Zauberschule | **Løvestein** |
| Charlys Haus | **Bernfuchs** (Bernstein/Moosgrün) |
| weitere Häuser | **Eisvogel** (Türkis/Perlweiß), **Tannenhirsch** (Tannengrün/Kupfer), **Sternbär** (Pflaume/Silber) |
| Wissensfigur | **Lotte Silberfeder**, Haus Eisvogel, Bücherwurm, Hinweisgeberin, Bibliotheksquests |
| See | **Spiegelsee** |
| Wald | **Raunwald** |
| Dorf | **Dorf Schneeweiler** |
| Hütte | **Wildhüterhütte** |
| Licht | **Luxa** |
| Öffnen | **Clavis** |
| Reparieren | **Restauro** |
| Heranholen | **Advoco** |
| Feuer | **Flammula** |
| Schweben | **Levitas** |
| Schutz | **Custodia** |
| Finalzauber | **Phoenix Hiemis** |

Weitere Namen (Lehrkräfte, Porträts, NPCs): freigegeben in `plan/STORY_BIBEL.md`.

Regel: Keine Original-Figuren, -Wappen, -Namen oder -Musik aus Harry Potter oder anderen Werken. Die Stimmung (verschneites Zauberschloss, Kerzen, Porträts, Eulen) ist frei.

---

# 3. Spielerlebnis

Winterphönix verfolgt vier emotionale Kernziele.

- **Wärme:** Kaminfeuer, Kerzenlicht, Gemeinschaftsräume, Weihnachtsstimmung.
- **Neugier:** Geheimgänge, versteckte Räume, Rätsel, Sammelobjekte. Kernmechanik: Diegos **Schnüffeln**.
- **Magie:** schwebende Kerzen, lebendige Porträts, verzauberte Gegenstände, alte Zauber.
- **Weihnachten:** Schnee, Dekoration, Geschenke, Adventsstimmung.

---

# 4. Inspirationsquellen

## Primäre Referenz: Die Reise zum Glutberg
Übernommen werden: Herz, Atmosphäre, Storyfokus, Entdeckungsgefühl. Technisch: Steuerung, Dialogbox, Gras/Effekte, Speicherlogik, Datenaufbau (siehe Abschnitt 18).

## Sekundäre Referenzen (nur Stimmung und Handwerk, keine Inhalte)
- **Winterliche Zauberschul-Filme:** Schlossatmosphäre, Wintergefühl, magische Stimmung.
- **Zelda Minish Cap:** Dreiviertelperspektive, Raumgestaltung.
- **Pokémon HG/SS:** Lesbarkeit, Weltdesign.

---

# 5. Hauptfiguren und Haustiere

## Charly
- **Haus:** Bernfuchs
- **Eigenschaften:** neugierig, mutig, freundlich, hilfsbereit
- **Rolle:** Hauptfigur (Spielfigur)
- **Aussehen:** blonde Haare, Brille, Umhang in Bernfuchs-Farben (Bernstein/Moosgrün)

## Jörn
- **Rolle:** Begleiter
- **Eigenschaften:** loyal, zuverlässig, unterstützend
- **Funktion:** Storybegleiter, Kommentator, emotionaler Anker
- **Aussehen:** kurze rot-blond-braune Haare, Brille
- **Haus:** Vorschlag Bernfuchs (beide im Gemeinschaftsraum der Stilprobe)

## Lotte Silberfeder
- **Rolle:** unterstützende Hauptfigur, Haus Eisvogel, Bücherwurm
- **Funktion:** Wissen, Hinweise, Bibliotheksquests
- **Aussehen (Vorschlag):** dunkle Locken, Umhang in Türkis/Perlweiß, immer ein Buch unter dem Arm

## Haustiere (Pflicht)

| Tier | Rolle | Aussehen |
|---|---|---|
| **Diego** (Hund) | Schlosshund von Løvestein, guter Hausgeist. Folgt Charly ab Q01. Fähigkeit **Schnüffeln**: zeigt Geheimnisse und Geheimgänge in der Nähe durch funkelnde Pfotenspuren. | Straßenhund, etwa kniehoch, blond und schwarzbraun gescheckt |
| **Mailo** (Hund) | Echter, lebendiger Hund an der Wildhüterhütte, kennt die Außengebiete. Führt Charly in Q11 durch den Raunwald und in Q18 noch einmal. Freund von Diego, gemeinsame Szenen. | Cavalier King Charles Spaniel, weiß-braun |
| **Gandalf** (Hamster) | Alter, weiser Bibliothekshamster, kennt die Legende des Winterphönix. Schlüsselfigur in Q13. | Goldhamster-Männchen, braun-weiß |
| **Frieda** (Hamster) | Lebt im Bernfuchs-Gemeinschaftsraum. Ihr Laufrad treibt in Q05 die Sternenuhr an. Nebenquest: Lieblingskörner im Schloss sammeln. | Goldhamster-Weibchen, dreifarbig: weiß, schwarz, braun |

---

# 6. Hauptgeschichte

## Die Legende des Winterphönix
Der Winterphönix ist ein uraltes magisches Wesen. Alle 300 Winter steigt er in der längsten Nacht auf und erneuert die Magie des Winters. Über Jahrhunderte wurde seine Geschichte vergessen; nur Fragmente sind geblieben.

Vor 900 Jahren sperrte der einsame **Winterkönig Raureif** das Phönixfeuer in seine Krone, weil er den Winter für immer behalten wollte.

## Ausgangslage
Kurz vor Weihnachten häufen sich seltsame Ereignisse in Løvestein:
- Magische Objekte reagieren ungewöhnlich.
- Alte Magie erwacht.
- Verschlossene Orte öffnen sich.
- Winterenergie breitet sich aus.

## Ziel der Geschichte
Charly muss die Wahrheit über den Winterphönix entdecken. Dafür muss sie Hinweise finden, Fragmente sammeln, Rätsel lösen und die Geheimnisse von Løvestein entschlüsseln. Am Heiligabend hilft sie dem Phönix zur Wiedergeburt.

## Fragmente
Jede Hauptquest bringt ein **Winterfragment** mit einer Zeile der Legende. Zusammen ergeben sie das „Phönixlied“, das im Finale gebraucht wird.

---

# 7. Weltstruktur

## Weltgröße
Freigegeben: 20–30 Karten.

## Hauptgebiete – Løvestein
- Schlosskern
- Große Halle
- Bibliothek (mit geheimem Archiv)
- Bernfuchs-Gemeinschaftsraum (Keller)
- Krankenflügel
- Uhrenturm
- Sternwarte (Astronomieturm)
- Kerker / Gewölbe
- Gewächshäuser
- Eulenturm
- Porträtgalerie

## Außenbereiche
- Innenhof
- Spiegelsee
- Wildhüterhütte
- Dorf Schneeweiler
- Raunwald

## Späte Spielgebiete
- Wintergewölbe (unter Schneeweiler)
- Winterruinen
- Phönixheiligtum

---

# 8. Questsystem

Jeder Adventstag besitzt:
- **Hauptquest:** Pflichtinhalt, ca. 10 Minuten.
- **Nebenaktivitäten:** optional.
- **Geheimnisse:** optional, oft über Diegos Schnüffeln.

Freischaltung: Tag N am N. Dezember, 0:00 Uhr (Europe/Berlin). Verpasste Tage bleiben nachholbar.

---

# 9. Hauptquestreihe Q01–Q24

Kurzfassung. Ausführlich (Ort, Rätsel, Fragment, Haustier-Moment): `plan/STORY_BIBEL.md`.

| Nr. | Titel | Kern |
|---|---|---|
| Q01 | Die letzte Winterfeder | Einführung in Løvestein, erste Hinweise, Begegnung mit Lotte, Diego folgt |
| Q02 | Die singenden Kerzen | Magische Kerzen, erstes Winterrätsel, Luxa |
| Q03 | Die Eule ohne Erinnerung | Verwirrte Eule trägt wichtige Informationen, Clavis |
| Q04 | Das Herz des Uhrenturms | Uhrenturm reagiert auf Wintermagie, Restauro, Uhrmeister |
| Q05 | Die verlorene Sternenuhr | Sternenuhr reparieren, Frieda treibt sie an |
| Q06 | Das Flüstern der Porträts | Gespräche der Porträts entschlüsseln |
| Q07 | Schnee über dem Spiegelsee | Symbole unter Eis, Mailo kennenlernen |
| Q08 | Die singenden Gewächshäuser | Verzauberte Pflanzen beruhigen, Advoco |
| Q09 | Das vergessene Klassenzimmer | Geheimraum erforschen, Levitas |
| Q10 | Die Eulenbotschaft | Nachrichten aus der Vergangenheit entschlüsseln |
| Q11 | Schatten im Raunwald | Erste Winterkreaturen, Flammula, Mailo führt |
| Q12 | Das Lied des Nordwinds | Verlorene Melodie rekonstruieren |
| Q13 | Die Bibliothek unter der Bibliothek | Geheimes Archiv, Gandalf erzählt die Legende |
| Q14 | Die Prüfung der vier Häuser | Vier Prüfungen, vier Flammen |
| Q15 | Die Frostnacht | Løvestein vor Wintermagie schützen, Custodia, Frostpoltergeist |
| Q16 | Die goldene Feder | Eine Feder des Winterphönix sichern |
| Q17 | Die Karte des Baumeisters | Geheimwege freischalten |
| Q18 | Das Eis unter Schneeweiler | Wintergewölbe erkunden, Mailo führt |
| Q19 | Der Ruf des Phönix | Erste direkte Begegnung mit der Phönixmagie |
| Q20 | Die Ruinen des ersten Winters | Winterruinen, Eisdrache Skarn |
| Q21 | Die Krone des Winterkönigs | Geschichte des Winterkönigs aufdecken |
| Q22 | Der letzte Geheimgang | Zugang zum Heiligtum, Phoenix Hiemis |
| Q23 | Das Herz des Winters | Winterenergie stabilisieren – Boss: Winterkönig |
| Q24 | Die Reise zum Winterphönix | Heiligtum, Wahrheit, finale Prüfung – Boss: Winterphönix |

---

# 10. Gegnerbibliothek
Kämpfe sind leicht. Kein Game Over: Bei einer Niederlage geht es kurz vor der Stelle weiter. Kampf spätestens ab Q11.

- **Fliegendes Tintenfass:** Fernkampf durch Tintenspritzer.
- **Beißendes Buch:** schnelle Nahkampfangriffe.
- **Frostwicht:** Wintermagie.
- **Schneepixie:** klein, schnell, schwer zu treffen.
- **Verzauberte Rüstung:** hohe Verteidigung.

---

# 11. Bossbibliothek
Bosse sind eher Rätselkämpfe.

| Boss | Thema | Quest |
|---|---|---|
| Uhrmeister | Zeitmagie | Q04 |
| Frostpoltergeist Klirr | Winterchaos | Q15 |
| Eisdrache Skarn | Alte Wintermagie | Q20 |
| Winterkönig Raureif | Herrschaft über den Winter | Q23 |
| Winterphönix | Wiedergeburt, Magie, Hoffnung (kein Kampf zum Besiegen, sondern zum Retten) | Q24 |

---

# 12. Zaubersystem

| Zauber | Wirkung | gelernt (Vorschlag) |
|---|---|---|
| Luxa | Licht erzeugen | Q02 |
| Clavis | Verschlossenes öffnen | Q03 |
| Restauro | Objekte reparieren | Q04 |
| Advoco | Gegenstände heranholen | Q08 |
| Levitas | Objekte schweben lassen | Q09 |
| Flammula | Feuer, Eis tauen, Kampf | Q11 |
| Custodia | Schutz | Q15 |
| Phoenix Hiemis | Finalzauber (ENTWURF) | Q22 |

---

# 13. Art Bible

- **Perspektive:** Dreiviertelansicht.
- **Stilrichtung:** filmnah + gemütlicher.
- **Ziel:** klassische Zauberschloss-Stimmung, zusätzlich wärmer, wohnlicher, winterlicher.
- **Detailgrad:** über Glutberg.
- **Stimmung:** belebtes Løvestein.
  - Erlaubt: Bücher, Pergamente, Tassen, verschobene Stühle.
  - Verboten: sterile Räume, leere Flächen.
- **Grafikmaß** (in der Stilprobe freigeben): Bild 512×384 (4:3), Kachel 32×32, Figur 32×40, ganzzahlig skaliert.
- **Hauswappen:** eigene Tiere (Fuchs, Eisvogel, Hirsch, Bär) in Hausfarben, keine Anlehnung an bekannte Wappen.

---

# 14. Figurenregeln

- **Standardgröße:** 32 × 40 Pixel (Tiere kleiner: Hunde ca. 24 × 20, Hamster ca. 12 × 10).
- **Anforderungen:** Wiedererkennbarkeit, Hausfarben, Umhänge, individuelle Silhouetten.
- **Aussehen** der Hauptfiguren und Tiere: siehe Abschnitt 5.

---

# 15. Licht- und Magiesystem

- **Kaminlicht:** Warmorange
- **Kerzenlicht:** Goldgelb
- **Fensterlicht:** Winterblau
- **Schnüffel-Spuren:** goldene, funkelnde Pfotenabdrücke
- **Magieregel:** Magie ist immer präsent, aber niemals aufdringlich.

---

# 16. Referenzräume

## Referenzraum 001 – Bernfuchs-Gemeinschaftsraum
- **Struktur:** zwei Ebenen
- **Mittelpunkt:** großer Kamin
- **Bereiche:** Kaminbereich, Lesegalerie, Fensternische, Pflanzenecke, Geheimecke (Sternenuhr, Q05), Friedas Häuschen mit Laufrad
- **Ziel:** gemütlichster Raum des Spiels. Stilprobe in Stufe 1 mit Charly, Jörn, Diego, Frieda.

## Referenzraum 002 – Schlosskern
Herz von Løvestein. Verbindet die wichtigsten Gebiete.

---

# 17. Möbelbibliothek

## Bücherregale
1. Bernfuchs-Regal
2. Bibliotheks-Regal
3. Lehrer-Regal
4. Altes Løvestein-Regal
5. Vitrinen-Regal
6. Verzaubertes Regal

## Sofas und Sessel
Bernfuchs-Lesesessel, Kaminsessel, Bibliothekssessel, Bernfuchs-Sofa, Kaminsofa, Lesesofa.

## Teppiche
Bernfuchs-Hauptteppich, Fensternischen-Teppich, Bibliotheksteppich, Große-Halle-Teppich, Winterphönix-Teppich, Lehrerteppich.

---

# 18. Technische Architektur

## Endziel
Eine einzige Datei `docs/index.html`, gebaut aus `src/` (Module) und `data/` (JSON) durch ein Node-Build-Skript ohne Pakete.

## Enthält
Karten, Sprites (als Pixel im Code), Dialoge, Spielsysteme, Musik (Web Audio), Speicherstände.

## JSON-System
Definiert für: Karten, Figuren, Gegner, Bosse, Objekte, Quests, Dialoge. Speicherstand: Schlüssel `winterphoenix_save`, mit Versionsnummer und Migration, Export/Import als Code.

## Übernahme aus Glutberg (gelesen, nicht kopiert)
- **Aufbau in drei Schichten:** Daten → Kernlogik ohne DOM (in Node testbar) → Grafik/Eingabe/Spiel im Browser.
- **Daten:** Dialoge als Listen `[Sprecher, Text]`; Karten als Zeichenraster mit Kachel-Tabelle (`solid`, `grass`, `look` …); NPCs mit `showIf`/`hideIf`/`setFlag`; Deko-Objekte als kompakte Liste; Türen/Tore mit Ziel und Bedingung.
- **Grafik:** Kacheln werden beim Start per Code auf kleine Canvas gemalt (mehrere Animationsframes), Konturen automatisch, fester Zufallsgenerator pro Kachel, nur bei Bewegung neu zeichnen, ganzzahlige Skalierung in Geräte-Pixeln.
- **Gras/Effekte:** Gras mit 4 Frames (Wiegen + Rascheln beim Betreten), Partikel, Umgebungseffekte pro Gebiet (hier: Schneeflocken, Kerzenfunken).
- **Steuerung:** Pointer-Events mit Pointer-Capture, Steuerkreuz nach Richtung vom Mittelpunkt, A/B-Tasten, Tastatur als Ersatz, Zoom-/Scroll-Gesten unterdrückt, Safe-Area beachtet.
- **Ton:** AudioContext wird bei der ersten Berührung entsperrt; Ton-Schalter mit eigener Einstellung; Lieder als Notentext.
- **Speichern:** Laden prüft jedes Feld und fällt bei Fehlern sicher zurück. Neu für Winterphönix: Migration statt Verwerfen, Sicherung vor jedem Überschreiben.
- **Sicherheit:** CSP `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'`, `referrer: no-referrer`.

## Auslieferung (Prinzip Anatomie-3d)
- GitHub Pages aus `main` → `/docs`.
- Homescreen-App: `app.webmanifest` (`display: standalone`, `orientation: landscape`), `apple-mobile-web-app-capable`, `apple-touch-icon` (180 px), Icons 192/512 – vom Build-Skript selbst als PNG erzeugt.
- **Kein Service Worker** (anders als Anatomie-3d), damit Updates sicher ankommen.
- Repo vorerst privat; vor dem ersten iPad-Test öffentlich stellen und Pages einschalten.

---

# 19. Produktionsstand

## Freigegeben (aus V3)
✅ Projektvision · ✅ Weltstruktur · ✅ Art Bible · ✅ Lichtsystem · ✅ Weihnachtsregeln · ✅ Magieregeln · ✅ Figurenstandard · ✅ Referenzraum Gemeinschaftsraum · ✅ Questgerüst Q01–Q24 · ✅ Gegnerbibliothek · ✅ Bossbibliothek · ✅ Möbelbibliothek · ✅ Weltlexikon · ✅ Haustiere · ✅ Story-Bibel Q01–Q24 und Namen (18.11.)

## Zur Freigabe
⏳ Grafikmaß (Stilprobe, Stufe 1)

---

# 20. Offene Punkte

1. Bibliothek als Referenzraum.
2. Große Halle als Referenzraum.
3. Vollständige Figurenbibliothek.
4. Materialbibliothek.
5. Objektbibliothek.
6. Fenster- und Vorhangsystem.
7. Pflanzensystem.
8. Freigabe des Grafikmaßes in der Stilprobe.

# ENDE MASTERPLAN V4
