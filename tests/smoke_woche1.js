// Rauchtest S3: Woche 1 – Tagesende mit Phönixlied, Haken 1–4, Rückblicke, Nebenaufgaben N02–N04, Tagesschmuck, Kerze 4
// Aufruf: node tests/smoke_woche1.js [ordner-für-bilder]
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const FILE = 'file://' + path.join(__dirname, '..', 'docs', 'index.html');
const SHOTS = process.argv[2] || null;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  const wait = ms => page.waitForTimeout(ms);
  const key = async (k, n = 1, w = 110) => { for (let i = 0; i < n; i++) { await page.keyboard.down(k); await wait(35); await page.keyboard.up(k); await wait(w); } };
  const st = () => page.evaluate(() => window.__wp());
  const tag = () => page.evaluate(() => window.__tag());
  const ex = () => page.evaluate(() => window.__extra());
  const busy = s => s.dialog || s.mode === 'szene' || s.mode === 'lied';
  const drain = async () => { for (let i = 0; i < 260; i++) { const s = await st(); if (!busy(s)) { await wait(250); if (!busy(await st())) return; } await key('Enter', 1, 80); } errors.push('Szene/Dialog endet nicht'); };
  const talk = async () => { await key('Enter', 1, 150); await drain(); };
  const go = (m, x, y, d) => page.evaluate(a => window.__go(...a), [m, x, y, d]);
  const flags = o => page.evaluate(f => window.__flags(f), o);
  const npc = async ch => { if (!(await page.evaluate(c => window.__talkNpc(c), ch))) errors.push('Figur ' + ch + ' nicht da'); await drain(); };
  const secret = async id => { if (!(await page.evaluate(i => window.__secret(i), id))) errors.push('Geheimnis ' + id + ' nicht findbar'); await drain(); };
  const shot = async n => { if (SHOTS) await page.locator('#c').screenshot({ path: path.join(SHOTS, n + '.png') }); };
  const expect = async (flag, what) => { const s = await st(); if (!s.flags[flag]) errors.push(what + ' (Flag ' + flag + ' fehlt)'); };
  const cast = async z => { await key('Enter', 1, 200); if ((await st()).mode !== 'zauber') { errors.push('Zaubermenü öffnet sich nicht'); return; } await page.evaluate(n => window.__pickSpell(n), z); await key('Enter', 1, 200); };
  // Charly läuft wirklich (Weg suchen, Schritt für Schritt); steht sie neben dem Ziel, noch ein Schritt darauf
  const walk = async (x, y, versuch = 0) => {
    await page.evaluate(a => window.__walk(a[0], a[1]), [x, y]);
    const map0 = (await st()).map; let last = '', ruhig = 0;
    for (let i = 0; i < 200 && ruhig < 5; i++) { await wait(150); const s = await st(); if (s.dialog) { await drain(); ruhig = 0; continue; } const k = JSON.stringify(s.pos) + s.map; ruhig = k === last ? ruhig + 1 : 0; last = k; }
    const s = await st(); if (!s.pos) return; if (s.map !== map0) { await wait(900); return; }   // Abblende abwarten
    const dx = x - s.pos.x, dy = y - s.pos.y;
    if (Math.abs(dx) + Math.abs(dy) === 1) { await key(dx > 0 ? 'ArrowRight' : dx < 0 ? 'ArrowLeft' : dy > 0 ? 'ArrowDown' : 'ArrowUp', 1, 900); await drain(); }
    else if ((dx || dy) && versuch < 3) { await wait(600); return walk(x, y, versuch + 1); }   // jemand stand im Weg
  };
  const start = async t => { await page.goto(FILE + '?testtag=' + t); await page.evaluate(() => localStorage.clear()); await page.reload(); await wait(500); await key('ArrowRight'); await key('Enter'); await wait(500); await drain(); await wait(300); await drain(); };

  // --- Teil 1: Tag 1 beenden → Phönixlied taut auf → Haken 1 → Hinweis aufs nächste Türchen ---
  await start(1);
  if ((await tag()).tag !== 1) errors.push('Testsprung: Tag 1 erwartet');
  if (!(await st()).flags.erklaert_schmuck) errors.push('Erster Morgen erklärt den Baumschmuck nicht');
  if (!(await st()).flags.gesehen_tor_1) errors.push('Startszene am Tor lief am ersten Morgen nicht');
  // Q01: Daune am Kamin erschnüffeln, dann zu Jörn umdrehen (antippen = nur drehen) und ihn fragen
  await go('gemeinschaftsraum', 15, 4, 'up'); await key('x'); await wait(1300); await key('Enter', 1, 200); await drain();
  await expect('q01_daune', 'Q01: Daune am Kamin');
  let jo = false;
  for (const d of ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp']) {
    await key(d, 1, 200); await key('Enter', 1, 200);
    const s1 = await st(); if (s1.dialog) jo = true; await drain(); if (jo) break;
  }
  if (!jo) errors.push('Q01: Zu Jörn umdrehen und ansprechen klappt nicht');
  // Zu Fuß der Raureif-Spur nach: Gemeinschaftsraum → Kellergang → Schlosskern
  await go('gemeinschaftsraum', 15, 4, 'right'); await walk(17, 2);
  if ((await st()).map !== 'kellergang') errors.push('Q01: Weg in den Kellergang klappt nicht (' + (await st()).map + ')');
  await walk(14, 2); await walk(14, 1);
  if ((await st()).map !== 'schlosskern') errors.push('Q01: Weg in den Schlosskern klappt nicht (' + (await st()).map + ')');
  await walk(6, 9); await shot('w0_spurgabel');
  // Diego zeigt hier nur die drei Quest-Spuren
  await key('x'); await wait(1400);
  if ((await ex()).spuren !== 3) errors.push('Q01: Diego zeigt im Schlosskern nicht genau die drei Quest-Spuren (' + (await ex()).spuren + ')');
  // Jedes Spurende ablaufen: das Wort wird beim Hingehen gefunden (ohne A)
  for (const [x, y, f] of [[8, 4, 'q01_wort_1'], [19, 5, 'q01_wort_2'], [12, 12, 'q01_wort_3']]) {
    await walk(x, y); await drain();
    await expect(f, 'Q01: Wort am Spurende (' + f + ') beim Hingehen gefunden');
  }
  await expect('q01_echt', 'Q01: Wörter zusammengesetzt');
  // Zu Fuß in den Innenhof, dort führt Diego zum Brunnen
  await walk(10, 14); await walk(10, 15);
  if ((await st()).map !== 'arkadengang') errors.push('Q01: Weg in den Arkadengang (' + (await st()).map + ')');
  await walk(19, 3); await walk(20, 3);
  if ((await st()).map !== 'innenhof') errors.push('Q01: Weg in den Innenhof (' + (await st()).map + ')');
  await key('x'); await wait(1400);
  if ((await ex()).spuren !== 1) errors.push('Q01: Diego zeigt im Innenhof nicht genau die Brunnen-Spur');
  await walk(14, 10); await drain();
  await expect('q01_brunnen', 'Q01: Brunnen über Diegos Spur gefunden');
  // Brunnen: erst ohne Glutsplitter (geht nicht), dann mit
  if ((await st()).flags.q01_feder) errors.push('Q01: Feder ohne Glutsplitter aufgetaut');
  await go('innenhof', 14, 9, 'up');
  await talk(); if ((await st()).flags.q01_feder) errors.push('Q01: Feder taut ohne Glutsplitter');
  await go('gemeinschaftsraum', 13, 9, 'up'); await secret('glut_sofa');
  if ((await ex()).glut < 1) errors.push('Q01: Glutsplitter unter dem Sofa fehlt');
  await go('innenhof', 14, 9, 'up'); await talk(); await expect('q01_feder', 'Q01: Feder mit Glutsplitter aufgetaut');
  await go('grosse_halle', 17, 9, 'up'); await talk(); await expect('q01_lotte', 'Q01: Lotte');

  if ((await st()).done.indexOf('Q01') < 0) errors.push('Q01 ohne „Weck Diego“ nicht abschließbar');
  await go('gemeinschaftsraum', 14, 4, 'up'); await key('Enter', 1, 300);
  if (!(await tag()).frage) errors.push('Kamin fragt nicht nach dem Tagesende');
  await key('Enter', 1, 300);
  for (let i = 0; i < 80 && (await st()).mode !== 'lied'; i++) { await key('Enter', 1, 120); }
  if ((await st()).mode !== 'lied') errors.push('Phönixlied-Seite erscheint nicht am Abend');
  else {
    if ((await ex()).lied !== 1) errors.push('Falsche neue Zeile im Phönixlied');
    await wait(1400); await shot('w01_lied_taut'); await wait(2400); await shot('w02_lied_fertig');
    await key('Enter', 1, 300);
  }
  let sah = false;
  for (let i = 0; i < 30; i++) { const t = await tag(); if (t.szene === 'haken_1') { sah = true; break; } await wait(150); }
  if (!sah) errors.push('Haken 1 startet nicht nach dem Phönixlied');
  await wait(4200); await shot('w03_haken1');
  await drain(); await drain();
  const t2 = await tag();
  if (t2.tag !== 1 || !t2.tagEnde) errors.push('Nach Haken 1 ist Tag 1 nicht beendet (Tag ' + t2.tag + ')');
  if (((await st()).flags || {}).gesehen_haken_1 !== true) errors.push('Haken 1 nicht als gesehen gemerkt');
  if ((await st()).map !== 'gemeinschaftsraum') errors.push('Nach Haken 1 nicht im Gemeinschaftsraum');
  if ((await ex()).hide) errors.push('Charly bleibt nach dem Haken unsichtbar');

  // --- Teil 2: alle Haken, Rückblicke, Nebenaufgaben, Schmuck (Tag 4) ---
  await start(4);
  // Ohne Versteck für die Tagesquest im Raum: nur die Spur zum nächsten Versteck
  await go('gemeinschaftsraum', 8, 9, 'up'); await key('x'); await wait(1400);
  if ((await ex()).spuren !== 1) errors.push('Ohne Quest-Versteck sollte Diego genau eine Spur zeigen (' + (await ex()).spuren + ')');
  await flags({ q01_daune: true, q01_echt: true, q01_brunnen: true, q01_feder: true });
  for (const h of ['haken_1', 'haken_2', 'haken_3', 'haken_4']) {
    await page.evaluate(id => window.__szene(id), h);
    await wait(h === 'haken_4' ? 7000 : 3600); await shot('w1_' + h);
    const e = await ex(); if (!e.nacht) errors.push(h + ': keine Nacht');
    await drain();
    const s = await st(); if (s.map !== 'gemeinschaftsraum' || s.mode !== 'play') errors.push(h + ': danach falscher Ort/Modus (' + s.map + ', ' + s.mode + ')');
  }
  // Startszene als Rückblick: Raureifs Schrift am Tor, Lehrerinnen, Versteck
  await page.evaluate(() => window.__szene('tor_1'));
  for (let i = 0; i < 40; i++) { const t = await tag(); if ((await ex()).objs && (await st()).map === 'vorhalle' && i > 22) break; await key('Enter', 1, 260); }
  await shot('w1_tor_schrift');
  await drain();
  if ((await st()).map !== 'gemeinschaftsraum') errors.push('Startszene endet nicht im Gemeinschaftsraum');
  // Kerze 4 ist nach Haken 2 aus und lässt sich mit Luxa wieder anzünden
  await flags({ zauber_luxa: true, kerzen_1: true, kerzen_2: true, kerzen_3: true, kerzen_4: true });
  await go('grosse_halle', 18, 10, 'up');
  if (!(await ex()).objs.some(o => o === 'raureif@12,14')) errors.push('Raureif-Spur zur Tür fehlt nach Haken 2');
  await cast('luxa'); await drain();
  if ((await st()).flags.kerze4_aus) errors.push('Kerze 4 lässt sich nicht wieder anzünden');
  // Rückblicke im Menü
  const rb = (await ex()).rueck;
  ['haken_0', 'tor_1', 'haken_1', 'haken_2', 'haken_3', 'haken_4'].forEach(h => { if (rb.indexOf(h) < 0) errors.push('Rückblick fehlt: ' + h); });
  await key('Escape'); await key('ArrowDown', 3); await key('Enter', 1, 250);
  if ((await st()).mode !== 'rueck') errors.push('Menü „Rückblicke“ öffnet sich nicht');
  await shot('w2_rueckblicke'); await key('ArrowDown', 2); await key('Enter', 1, 300);
  if ((await tag()).szene !== 'haken_1') errors.push('Rückblick spielt nicht den gewählten Haken');
  await drain();

  // N02 Oskars Schneemann – Oskar trägt ein goldenes „!“, solange er eine Aufgabe hat
  await go('innenhof', 8, 13, 'up');
  if ((await ex()).marken.indexOf('oskar') < 0) errors.push('N02: kein „!“ über Oskar');
  await shot('w3_oskar_marke');
  await npc('oskar'); await expect('oskar_auftrag', 'N02: Auftrag');
  await key('Escape'); await key('Enter'); await wait(250); await shot('w3_questlog_neben'); await key('Escape'); await key('Escape');
  await go('grosse_halle', 17, 14, 'up'); await key('Enter', 1, 150); await drain(); await expect('oskar_karotte', 'N02: Karotte (A unter den schwebenden Kerzen)');
  await go('grosse_halle', 4, 4, 'up'); await key('Enter', 1, 150); await drain(); await expect('kohle_halle', 'N02: Kohle Halle');
  await go('gemeinschaftsraum', 14, 4, 'up'); await key('Enter', 1, 150); await drain(); await expect('kohle_gemein', 'N02: Kohle Gemeinschaftsraum');
  // Diego: Spur der laufenden Nebenaufgabe hat Vorrang vor einem näheren Glutsplitter
  await go('vorhalle', 9, 7, 'down'); await key('x'); await wait(1400);
  { const e = await ex(); if (e.ziele.join() !== 'kohle_vorhalle') errors.push('N02: Diego führt nicht zur Kohle, sondern zu ' + e.ziele.join()); }
  await go('vorhalle', 13, 8, 'left'); await secret('kohle_vorhalle'); await expect('kohle_vorhalle', 'N02: Kohle Vorhalle');
  await go('arkadengang', 6, 4, 'up'); await secret('schal'); await expect('oskar_schal', 'N02: Schal');
  await go('innenhof', 8, 13, 'up'); await npc('oskar'); await expect('oskar_fertig', 'N02: fertig');
  await shot('w3_schneemann');

  // N03 Idas Buch: Zimt durch drei Räume verfolgen
  await go('bibliothek', 9, 10, 'up'); await npc('ida'); await expect('ida_auftrag', 'N03: Auftrag');
  await go('treppenhaus', 5, 13, 'up'); await npc('kater'); await expect('zimt_1', 'N03: Zimt im Treppenhaus');
  await go('vorhalle', 5, 6, 'left'); await npc('kater'); await expect('zimt_2', 'N03: Zimt in der Vorhalle');
  await go('gemeinschaftsraum', 8, 9, 'up'); await npc('kater'); await expect('zimt_3', 'N03: Zimt im Gemeinschaftsraum');
  await go('gemeinschaftsraum', 3, 7, 'up'); await key('x'); await wait(1300);
  if (!(await st()).trail) errors.push('N03: Diego findet keine Spur zum Buch');
  await secret('ida_buch'); await expect('ida_buch', 'N03: Buch');
  const glut0 = (await ex()).glut;
  await go('bibliothek', 9, 10, 'up'); await npc('ida'); await expect('ida_fertig', 'N03: fertig');
  if ((await ex()).glut !== glut0 + 1) errors.push('N03: kein Glutsplitter');

  // N04 Finns Zimtsterne
  await go('gemeinschaftsraum', 4, 9, 'up'); await npc('finn'); await expect('finn_auftrag', 'N04: Auftrag');
  for (const [m, x, y, f] of [['bibliothek', 16, 7, 'stern_1'], ['treppenhaus', 13, 14, 'stern_2'], ['wendeltreppe', 9, 5, 'stern_3'], ['arkadengang', 15, 4, 'stern_4']]) {
    await go(m, x, y, 'up'); if (f === 'stern_1') await shot('w4_zimtstern'); await key('Enter', 1, 150); await drain(); await expect(f, 'N04: ' + f);
  }
  await go('eulenstiege', 2, 10, 'left'); await secret('stern_stiege'); await expect('stern_5', 'N04: stern_5');
  await go('gemeinschaftsraum', 14, 4, 'up'); await key('Enter', 1, 150); await drain(); await expect('finn_aufgetaut', 'N04: aufgetaut');
  await go('gemeinschaftsraum', 4, 9, 'up'); await npc('finn'); await expect('finn_fertig', 'N04: fertig');

  // Tagesschmuck Tag 1–4
  for (const [m, id] of [['kellergang', 'schmuck_fliese'], ['wendeltreppe', 'schmuck_stufe'], ['eulenstiege', 'schmuck_eule'], ['uhrenturm', 'schmuck_gloeckchen']]) { await go(m, 5, 5, 'down'); await secret(id); }
  const e2 = await ex();
  if (e2.schmuck !== 6) errors.push('Baumschmuck: ' + e2.schmuck + ' statt 6');
  await go('grosse_halle', 11, 13, 'right'); await wait(500); await shot('w5_baum');
  if (!(await ex()).objs.some(o => o.indexOf('baumschmuck') === 0)) errors.push('Kein Schmuck am Baum zu sehen');
  const s = await st();
  ['N_oskar', 'N_ida', 'N_finn'].forEach(q => { if (s.done.indexOf(q) < 0) errors.push(q + ' nicht abgeschlossen'); });
  await key('Escape'); await key('Enter'); await wait(250); await shot('w6_questlog'); await key('Escape');
  { const mk = (await ex()).marken; if (mk.join() !== 'lotte') errors.push('„!“ falsch in der Halle (nur Lotte, Q01 ist hier offen): ' + mk.join()); }
  await key('ArrowDown', 2); await key('Enter'); await wait(300); await shot('w7_lied'); await key('Escape');

  await browser.close();
  if (errors.length) { console.error('WOCHE-1-TEST FEHLER:\n- ' + errors.join('\n- ')); process.exit(1); }
  console.log('Woche-1-Test ok: Phönixlied am Abend, Haken 1–4, Rückblicke, Kerze 4, Nebenaufgaben N02–N04, Tagesschmuck, keine Konsolenfehler.');
})().catch(e => { console.error(e); process.exit(1); });
