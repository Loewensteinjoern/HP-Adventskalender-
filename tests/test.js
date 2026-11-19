// Pflicht-Tests vor jedem Push: Daten, Spielstand/Migration, Freischaltung, Export.
// Aufruf: node tests/test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { loadData, loadCore } = require('../tools/lib');

const D = loadData(), C = loadCore(D);
let fails = 0, count = 0;
const ok = (cond, name) => { count++; if (!cond) { fails++; console.error('✗ ' + name); } };
const fx = f => fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8');
const mem = (init) => { const m = Object.assign({}, init); return { m, getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; };

// --- Datenprüfung ---
const v = C.validateData();
ok(v.errors.length === 0, 'Datenprüfung ohne Fehler: ' + v.errors.join('; '));

// --- Freischaltung (Europe/Berlin) ---
const day = iso => C.unlockedDay(new Date(iso));
ok(day('2026-11-30T12:00:00Z') === 0, '30.11. mittags: noch nichts offen');
ok(day('2026-11-30T22:59:59Z') === 0, '30.11. 23:59:59 Berlin: noch nichts offen');
ok(day('2026-11-30T23:00:00Z') === 1, '1.12. 0:00 Berlin (23:00 UTC): Tag 1 offen');
ok(day('2026-12-01T10:00:00Z') === 1, '1.12. tagsüber: Tag 1');
ok(day('2026-12-23T22:59:00Z') === 23, '23.12. 23:59 Berlin: Tag 23');
ok(day('2026-12-24T00:00:00Z') === 24, '24.12.: Tag 24');
ok(day('2026-12-25T12:00:00Z') === 24, '25.12.: alles offen');
ok(day('2027-01-15T12:00:00Z') === 24, 'Januar: alles offen');
ok(day('2026-06-01T12:00:00Z') === 0, 'Sommer davor: nichts offen');
ok(C.daysUntilStart(new Date('2026-11-18T10:00:00Z')) === 13, 'Countdown am 18.11.: 13 Tage');
ok(C.daysUntilStart(new Date('2026-11-30T22:30:00Z')) === 1, 'Countdown 30.11. spätabends: 1 Tag');
ok(C.parseTestDay('?testtag=5') === 5 && C.parseTestDay('?a=1&testtag=24') === 24, 'Testtag wird gelesen');
ok(C.parseTestDay('?testtag=25') === null && C.parseTestDay('') === null && C.parseTestDay('?testtag=x') === null, 'Ungültiger Testtag wird ignoriert');

// --- Bedingungen ---
const ctx = { flags: { a: true }, day: 1, done: [], followers: ['joern'] };
ok(C.checkCond('flag:a', ctx) && C.checkCond('!flag:b', ctx) && C.checkCond('quest:Q01', ctx) && !C.checkCond('done:Q01', ctx), 'Bedingungen');
ok(!C.checkCond('quest:Q01', Object.assign({}, ctx, { day: 0 })), 'Q01 vor dem 1.12. nicht aktiv');

// --- Spielstand: Migration ---
const gut = C.migrateSave(JSON.parse(fx('save_v1_gut.json')));
ok(gut && gut.save.x === 5 && gut.save.flags.q01_feder === true && gut.save.secrets[0] === 'zimtstern', 'Guter v1-Stand bleibt unverändert');
ok(gut.save.zukunftsfeld && gut.save.zukunftsfeld.bleibt === 'erhalten', 'Unbekannte Felder bleiben erhalten');
const alt = C.migrateSave(JSON.parse(fx('save_v0_alt.json')));
ok(alt && alt.save.v === 2 && alt.save.map === 'kellergang' && alt.save.x === 3 && alt.save.flags.diego_dabei, 'v0 wird über v1 nach v2 migriert');
const schief = C.migrateSave(JSON.parse(fx('save_v1_schief.json')));
ok(schief && schief.save.map === D.welt.start.map && schief.save.flags.ok === true && !('boese<script>' in schief.save.flags), 'Schiefer Stand wird repariert, nicht verworfen');
ok(schief.save.followers.indexOf('drache') < 0 && schief.save.followers[0] === 'joern' && schief.save.seenDay === 24, 'Begleiter und Tage werden bereinigt');
ok(C.migrateSave(null) === null && C.migrateSave({ v: 'x' }) === null, 'Unsinn wird erkannt');
const neuer = C.migrateSave({ v: 7, map: 'gemeinschaftsraum', x: 5, y: 8, flags: { x: true } });
ok(neuer && neuer.save.v === 7 && neuer.save.flags.x, 'Neuerer Stand wird nicht herabgestuft');

// --- Speicher: nie löschen, Sicherung, kaputter Stand ---
const st = mem({ winterphoenix_save: fx('save_v1_gut.json') });
ok(C.storeLoad(st, 'winterphoenix_save').source === 'main', 'Laden aus dem Hauptspeicher');
const s2 = C.newSave(1); s2.flags.neu = true;
C.storeWrite(st, 'winterphoenix_save', s2);
ok(st.m.winterphoenix_save_backup === fx('save_v1_gut.json'), 'Vor dem Überschreiben wird gesichert');
const kaputt = mem({ winterphoenix_save: fx('save_kaputt.txt'), winterphoenix_save_backup: fx('save_v1_gut.json') });
const r = C.storeLoad(kaputt, 'winterphoenix_save');
ok(r.source === 'backup' && r.save.x === 5 && r.broken, 'Kaputter Stand: Sicherung wird geladen');
ok(kaputt.m.winterphoenix_save_defekt === fx('save_kaputt.txt') && kaputt.m.winterphoenix_save === fx('save_kaputt.txt'), 'Kaputter Stand wird aufgehoben, nicht gelöscht');
C.storeWrite(kaputt, 'winterphoenix_save', r.save);
ok(kaputt.m.winterphoenix_save_backup === fx('save_v1_gut.json'), 'Kaputter Stand überschreibt nie die gute Sicherung');
const leer = C.storeLoad(mem({}), 'winterphoenix_save');
ok(leer.save === null && !leer.broken, 'Ohne Spielstand: neues Spiel');
const test = mem({ winterphoenix_save: fx('save_v1_gut.json') });
C.storeWrite(test, 'winterphoenix_test', C.newSave(2));
ok(test.m.winterphoenix_save === fx('save_v1_gut.json') && !test.m.winterphoenix_save_backup, 'Testmodus berührt den echten Spielstand nicht');

// --- Export / Import ---
const code = C.exportCode(gut.save);
const back = C.importCode(code);
ok(back.save && back.save.flags.q01_feder && back.save.x === 5, 'Export-Code lässt sich wieder laden');
ok(C.importCode('  ' + code.slice(0, 40) + '\n' + code.slice(40) + ' ').save, 'Code mit Zeilenumbruch/Leerzeichen geht');
ok(C.importCode(code.slice(0, -3) + 'zzz').error, 'Veränderter Code wird abgelehnt');
ok(C.importCode('hallo').error, 'Kein Code wird abgelehnt');
ok(C.exportCode({ v: 1, flags: { ä: 1 }, name: 'Løvestein ö' }).length > 10, 'Umlaute im Export');

// --- Quests ---
const q = C.newSave(0); Object.assign(q.flags, { diego_dabei: true, q01_feder: true, q01_joern: true });
ok(C.updateQuests(q, 1).length === 0, 'Teilweise gebaute Quest wird nicht vorzeitig abgeschlossen');

// --- Spielstand v2 (Stufe S2): Wärme, Karte, Glutsplitter ---
ok(gut.save.v === 2 && gut.save.waerme === 10 && gut.save.besucht.indexOf(gut.save.map) >= 0 && gut.save.glut.length === 0 && gut.save.warm === null, 'v1-Stand bekommt Wärme, Karte und Glutsplitter dazu');
const w2 = C.migrateSave({ v: 2, map: 'innenhof', x: 5, y: 8, waerme: 99, glut: ['a', 'b', 'c', 7], warm: { map: 'gibtsnicht', x: 1, y: 1, dir: 'up' }, besucht: ['innenhof', 'quatsch'] });
ok(w2.save.waerme === 12 && w2.save.glut.length === 3 && w2.save.warm === null && w2.save.besucht.join() === 'innenhof', 'v2-Stand wird bereinigt (Wärme gedeckelt, unbekannte Orte raus)');

// --- Kampf ---
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const nie = () => 0.999, kann = (F, a) => C.kampfAktionen(F).find(x => x.art === a).ok;
ok(C.waermeMax({ glut: [] }) === 10 && C.waermeMax({ glut: ['a', 'b', 'c'] }) === 12, 'Drei Glutsplitter: mehr Wärme');
ok(C.newSave(0).kakao === 3 && C.newSave(0).energie === 6 && gut.save.kakao === 3, 'Spielstand: Kakao und Energie (auch für alte Stände)');
let F = C.kampfNeu('pixie1', { zauber: ['luxa'] });
C.kampfZug(F, { art: 'zauber', z: 'luxa', ziel: 0 }, nie);
ok(!F.ende && F.gegner[0].kraft === 1 && F.energie === 4, 'Luxa: 2 Schaden, kostet 2 Energie');
C.kampfZug(F, { art: 'zauber', z: 'luxa', ziel: 0 }, nie);
ok(F.ende === 'sieg', 'Zweimal Luxa besiegt die Schneepixie');
F = C.kampfNeu('wicht1', { zauber: ['flammula'], energie: 1 });
ok(!kann(F, 'zaubern') && kann(F, 'schneeball') && kann(F, 'kakao') && kann(F, 'bellen'), 'Ohne Energie: kein Zauber, aber Schneeball, Kakao und Diego');
C.kampfZug(F, { art: 'kakao' }, nie);
ok(F.kakao === 2 && F.energie === 3 && kann(F, 'zaubern'), 'Kakao gibt Energie zurück und wird verbraucht');
F = C.kampfNeu('wicht1', { kakao: 0 });
ok(!kann(F, 'kakao') && kann(F, 'kochen'), 'Kakao alle: nur noch kochen');
C.kampfZug(F, { art: 'kochen' }, nie);
ok(!kann(F, 'kakao') && !kann(F, 'kochen') && !kann(F, 'mut'), 'Jörn kocht: Kakao und Mut gehen solange nicht');
C.kampfZug(F, { art: 'bellen', ziel: 0 }, nie); ok(F.kakao === 0, 'Kakao nach 2 Runden noch nicht fertig');
C.kampfZug(F, { art: 'bellen', ziel: 0 }, nie); ok(F.kakao === 2 && kann(F, 'kakao'), 'Nach 3 Runden: 2 Kakao mehr');
F = C.kampfNeu('wicht1', {});
C.kampfZug(F, { art: 'mut' }, () => 0.01);
ok(F.eingefroren && !kann(F, 'schneeball') && kann(F, 'kakao') && kann(F, 'bellen'), 'Frost-Angriff: Charly setzt aus, Jörn und Diego können handeln');
ok(C.kampfZug(F, { art: 'schneeball', ziel: 0 }, nie)[0].nix && F.runde === 2, 'Eingefroren: Charlys Aktion wird abgelehnt');
C.kampfZug(F, { art: 'bellen', ziel: 0 }, nie); ok(!F.eingefroren, 'Nach einer Runde taut Charly wieder auf');
F = C.kampfNeu('probe', {});
const evF = C.kampfZug(F, { art: 'flucht' }, rnd);
ok(!F.ende && evF.length === 1, 'Probekampf: kein Weglaufen');
F = C.kampfNeu('pixie2', { waerme: 1 });
for (let i = 0; i < 20 && !F.ende; i++) C.kampfZug(F, { art: 'schnueffeln' }, rnd);
ok(F.ende === 'kalt' && F.waerme === 0, 'Bei 0 Wärme endet der Kampf (danach Aufwachen im Warmen)');
// Schwierigkeit: klug gespielt fast immer gewinnbar, aber nicht in einer Runde; Probekampf auch ohne Zauber
const spiel = (g, klug) => {
  const f = C.kampfNeu(g, { zauber: klug ? Object.keys(D.zauber) : [] }); let n = 0;
  while (!f.ende && n < 60) {
    n++; const t = C.kampfLebend(f)[0]; let a;
    if (f.waerme <= 4 && kann(f, 'kakao')) a = { art: 'kakao' };
    else if (f.kakao === 0 && kann(f, 'kochen')) a = { art: 'kochen' };
    else if (f.eingefroren) a = { art: 'bellen', ziel: t.nr };
    else if (klug && kann(f, 'zaubern')) a = { art: 'zauber', z: D.kampf.gegner[t.id].schwaeche, ziel: t.nr };
    else if (klug && kann(f, 'kakao') && f.energie < 2) a = { art: 'kakao' };
    else a = { art: 'schneeball', ziel: t.nr };
    C.kampfZug(f, a, rnd);
  }
  return { sieg: f.ende === 'sieg', n };
};
Object.keys(D.kampf.gruppen).forEach(g => {
  let win = 0, kurz = 0;
  for (let i = 0; i < 400; i++) { const r = spiel(g, true); if (r.sieg) win++; if (r.n < 2) kurz++; }
  ok(win >= 360, 'Kampf ' + g + ': klug gespielt fast immer gewinnbar (' + win + '/400)');
  ok(kurz === 0, 'Kampf ' + g + ': nie in einer Runde vorbei');
});
let pw = 0; for (let i = 0; i < 400; i++) if (spiel('probe', false).sieg) pw++;
ok(pw >= 380, 'Probekampf auch ohne Zauber fast immer gewinnbar (' + pw + '/400)');
const K = { gruppen: [{ g: 'pixie1', ab: 2 }, { g: 'wicht1', ab: 7 }] };
ok([0.1, 0.5, 0.99].every(r => C.kampfGruppeWaehlen(K, 3, () => r) === 'pixie1') && C.kampfGruppeWaehlen(K, 1, () => 0.5) === null, 'Zufallskampf: nur Gegner, die schon dran sind');
// Regel aus dem Fahrplan wird geprüft: Frostwicht vor Flammula ist ein Fehler
const D2 = JSON.parse(JSON.stringify(D)); D2.maps.innenhof.kampf.gruppen.push({ g: 'wicht1', ab: 2 });
ok(loadCore(D2).validateData().errors.some(e => /Frostwicht taucht ab Tag 2 auf/.test(e)), 'Datenprüfung meldet Gegner, deren Zauber noch nicht gelernt werden kann');
const D3 = JSON.parse(JSON.stringify(D)); delete D3.karte.orte.innenhof;
ok(loadCore(D3).validateData().errors.some(e => /Schlosskarte/.test(e)), 'Datenprüfung: jeder Ort steht auf der Schlosskarte');

console.log((fails ? '✗ ' + fails + ' von ' : '✓ alle ') + count + ' Tests' + (fails ? ' fehlgeschlagen' : ' bestanden'));
v.warnings.forEach(w => console.log('  Hinweis: ' + w));
process.exit(fails ? 1 : 0);
