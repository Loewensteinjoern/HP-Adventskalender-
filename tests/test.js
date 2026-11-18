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
ok(alt && alt.save.v === 1 && alt.save.map === 'kellergang' && alt.save.x === 3 && alt.save.flags.diego_dabei, 'v0 wird nach v1 migriert');
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

console.log((fails ? '✗ ' + fails + ' von ' : '✓ alle ') + count + ' Tests' + (fails ? ' fehlgeschlagen' : ' bestanden'));
v.warnings.forEach(w => console.log('  Hinweis: ' + w));
process.exit(fails ? 1 : 0);
