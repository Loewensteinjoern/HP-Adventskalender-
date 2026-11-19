// Rauchtest S2b: Prolog Tag 0 (Fest, Hauslaternen, Führung, Haupttor), Tagesablauf am Kamin, Abkürzung, Testsprung.
// Aufruf: node tests/smoke_prolog.js [ordner-für-bilder]
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const FILE = 'file://' + path.join(__dirname, '..', 'docs', 'index.html');
const SHOTS = process.argv[2] || null;

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const neu = async () => {
    const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(String(e)));
    return page;
  };
  let page = await neu();
  const wait = ms => page.waitForTimeout(ms);
  const key = async (k, n = 1, w = 90) => { for (let i = 0; i < n; i++) { await page.keyboard.down(k); await wait(30); await page.keyboard.up(k); await wait(w); } };
  const st = () => page.evaluate(() => window.__wp());
  const tag = () => page.evaluate(() => window.__tag());
  const tour = () => page.evaluate(() => window.__tour());
  const shot = async n => { if (SHOTS) await page.locator('#c').screenshot({ path: path.join(SHOTS, n + '.png') }); };
  const busy = s => s.dialog || s.mode === 'szene';
  // Dialoge und Szenen durchklicken; optional unterwegs Bilder machen
  const drain = async (bilder) => {
    for (let i = 0; i < 400; i++) {
      const s = await st();
      if (bilder && bilder[i]) await shot(bilder[i]);
      if (!busy(s)) { await wait(300); if (!busy(await st())) return; }
      if (s.dialog) await key('Enter', 1, 70); else await wait(120);
    }
    errors.push('Szene/Dialog endet nicht');
  };

  // 1) Neues Spiel mit Kalendertag 1: Prolog kommt zuerst
  await page.goto(FILE + '?testtag=1'); await wait(500);
  await key('Enter'); await wait(1600); await shot('p01_fest');
  { const t = await tag(); if (t.szene !== 'prolog_fest') errors.push('Prolog-Fest startet nicht: ' + JSON.stringify(t)); if (t.balken < 0.9) errors.push('Keine Kinobalken'); }
  await drain({ 6: 'p02_rede', 14: 'p03_laternen', 22: 'p04_joern', 30: 'p05_wurzelgruen' });
  let s = await st(), T = await tour();
  if (!s.flags.prolog_joern || !s.followers.some(f => f.char === 'joern')) errors.push('Jörn hat sich beim Fest nicht angeschlossen');
  if (T.station !== 0 || !T.guide) errors.push('Führung beginnt nicht: ' + JSON.stringify(T));
  if (s.flags.start_Q01) errors.push('Q01 startet schon während des Prologs');
  if ((await tag()).day !== 0) errors.push('Erzähltag im Prolog ist nicht 0');
  await wait(2500); await shot('p06_fuehrung_start');

  // 2) Führung: Wurzelgrün läuft zur richtigen Tür, Charly folgt
  const stationen = await page.evaluate(() => window.__stationen());
  for (let i = 0; i < stationen.length - 1; i++) {
    let g = null;
    for (let k = 0; k < 100; k++) {
      const q = await st(); if (q.dialog) { await key('Enter', 1, 70); continue; }
      T = await tour(); g = T.guide;
      if (g && g.rest === 0 && !g.moving) break;
      await wait(150);
    }
    if (T.map !== stationen[i].map) errors.push('Station ' + i + ': falsche Karte ' + T.map);
    if (!g || g.rest !== 0) errors.push('Station ' + i + ' (' + T.map + '): Wurzelgrün kommt nicht an der Tür an ' + JSON.stringify(T));
    else if (!g.tuer) errors.push('Station ' + i + ': keine Tür gemerkt');
    if ([1, 4, 8, 16].indexOf(i) >= 0) await shot('p1' + String(i).padStart(2, '0') + '_' + T.map);
    // falsche Tür ist gesperrt (Station 2: Schlosskern hat viele Türen)
    if (i === 2) {
      const ok = await page.evaluate(() => window.__tuerOk('vorhalle'));
      if (ok) errors.push('Führung: falsche Tür ist nicht gesperrt');
    }
    await page.evaluate(() => window.__tourDoor()); await wait(900);
  }
  for (let k = 0; k < 60; k++) { const q = await st(); if (q.dialog) await key('Enter', 1, 70); else { T = await tour(); if (T.guide && T.guide.rest === 0 && !T.guide.moving) break; await wait(150); } }
  if (T.map !== 'gemeinschaftsraum' || T.station !== stationen.length - 1) errors.push('Führung endet nicht im Gemeinschaftsraum: ' + JSON.stringify(T));
  await shot('p20_gemeinschaftsraum');

  // 3) Diego wecken → Pit stürmt herein → Haupttor-Szene
  await page.evaluate(() => window.__pos(13, 4, 'left'));
  await key('Enter', 1, 200);
  await drain({ 4: 'p21_diego', 12: 'p22_pit', 22: 'p23_tor_eis', 30: 'p24_tor_auf', 40: 'p25_diego_knurrt' });
  s = await st();
  if (!s.flags.prolog_tour || !s.flags.prolog_tor || !s.followers.some(f => f.char === 'diego')) errors.push('Diego/Haupttor-Szene unvollständig: ' + JSON.stringify(s.flags));
  if (s.map !== 'vorhalle') errors.push('Nach der Haupttor-Szene nicht in der Vorhalle: ' + s.map);
  { const n = await page.evaluate(() => window.__npcs()); if (n.indexOf('sternwald') >= 0 || n.indexOf('wurzelgruen') >= 0) errors.push('Szenen-Figuren bleiben in der Vorhalle stehen'); }
  if ((await tour()).guide) errors.push('Wurzelgrün führt nach dem Prolog weiter');
  await shot('p26_frei');

  // Questlog zeigt „Zurück zum Kamin“
  await key('Escape'); await key('Enter', 1, 200); await shot('p27_questlog'); await key('x'); await key('x');

  // 4) Kamin: Tag beenden → Gute Nacht, Haken, direkt Morgen 1 (Kalender ist schon weiter)
  await page.evaluate(() => window.__go('gemeinschaftsraum', 14, 4, 'up'));
  await wait(300); await key('Enter', 1, 250);
  if ((await tag()).frage !== 'Den ersten Tag beenden?') errors.push('Kamin fragt nicht nach dem Tagesende: ' + JSON.stringify(await tag()));
  await shot('p28_frage');
  await key('Enter', 1, 300);
  await drain({ 3: 'p29_nacht', 12: 'p30_haken', 18: 'p31_haken_hand', 26: 'p32_morgen' });
  { const t = await tag(); s = await st();
    if (t.tag !== 1 || t.tagEnde || !s.flags.prolog_fertig) errors.push('Morgen 1 beginnt nicht nach dem Prolog: ' + JSON.stringify(t));
    if (!s.flags.start_Q01) errors.push('Q01 startet nicht am Morgen');
    if (s.map !== 'gemeinschaftsraum') errors.push('Morgen nicht am Kamin');
    if (!s.flags.hand_da) errors.push('Haken Tag 0: Handabdruck fehlt'); }
  await shot('p33_tag1');
  // Kamin an Tag 1 ohne erledigte Quest: noch nicht schlafen
  await page.evaluate(() => window.__go('gemeinschaftsraum', 14, 4, 'up')); await wait(200);
  await key('Enter', 1, 250);
  if ((await tag()).frage) errors.push('Tag 1 lässt sich ohne Quest beenden');
  await drain();
  // Neu laden: Tag 1 bleibt, kein zweiter Morgen
  await page.reload(); await wait(500); await key('Enter'); await wait(600); await drain();
  { const t = await tag(); if (t.tag !== 1 || t.szene) errors.push('Nach Neuladen falscher Tag: ' + JSON.stringify(t)); }
  await page.close();

  // 5) Tag 0 (vor dem 1.12.): Führung abkürzen, Gute Nacht ohne Morgen
  page = await neu();
  await page.goto(FILE + '?testtag=0'); await wait(500);
  await key('Enter'); await wait(500); await drain();
  // mitten in der Führung neu laden: Station und Führerin bleiben
  await page.evaluate(() => window.__tourDoor()); await wait(1000); await drain();
  T = await tour();
  await page.reload(); await wait(500); await key('Enter'); await wait(800); await drain();
  { const T2 = await tour(); if (T2.station !== T.station || T2.map !== T.map || !T2.guide) errors.push('Neuladen mitten in der Führung: ' + JSON.stringify([T, T2])); }
  await page.evaluate(() => window.__guideFrage()); await wait(200);
  if ((await tag()).frage !== 'Prof. Wurzelgrün') errors.push('Wurzelgrün bietet keine Abkürzung an');
  await key('ArrowDown'); await key('Enter', 1, 300); await drain(); await wait(800); await drain();
  T = await tour();
  if (T.map !== 'gemeinschaftsraum' || T.station !== stationen.length - 1) errors.push('Abkürzung führt nicht in den Gemeinschaftsraum: ' + JSON.stringify(T));
  await page.evaluate(() => window.__pos(13, 4, 'left')); await key('Enter', 1, 200); await drain();
  await page.evaluate(() => window.__go('gemeinschaftsraum', 14, 4, 'up')); await wait(200);
  await key('Enter', 1, 250); await key('Enter', 1, 300); await drain();
  { const t = await tag(); if (t.tag !== 0 || !t.tagEnde) errors.push('Tag 0 vor dem 1.12.: falscher Stand ' + JSON.stringify(t)); }
  // Kamin danach: Hinweis auf das nächste Türchen, keine Frage
  await key('Enter', 1, 250); if ((await tag()).frage) errors.push('Bereits beendeter Tag fragt erneut'); await drain();
  // Mit Kalendertag 2: zwei Morgen hintereinander? Nein – erst Morgen 1, Tag 1 muss beendet werden
  await page.goto(FILE + '?testtag=2'); await wait(500); await key('Enter'); await wait(600); await drain();
  { const t = await tag(); if (t.tag !== 1 || t.day !== 1) errors.push('Verpasste Tage: nach dem Prolog muss Tag 1 kommen, nicht Tag 2: ' + JSON.stringify(t)); }
  await page.close();

  // 6) Testsprung: direkt zu Tag 3
  page = await neu();
  await page.goto(FILE + '?testtag=3'); await wait(500);
  await key('ArrowRight'); await key('Enter'); await wait(500); await drain();
  { const t = await tag(), q = await st(); if (t.tag !== 3 || !q.flags.prolog_fertig || q.followers.length !== 2) errors.push('Testsprung kaputt: ' + JSON.stringify(t)); }
  // Hilfe im Menü
  await key('Escape'); await key('ArrowDown', 3); await key('Enter', 1, 200);
  if ((await st()).mode !== 'hilfe') errors.push('Hilfe im Menü fehlt'); await shot('p40_hilfe');
  await key('x'); await key('x');
  // Echter Spielstand bleibt unberührt
  if ((await page.evaluate(() => Object.keys(localStorage))).indexOf('winterphoenix_save') >= 0) errors.push('Testmodus hat den echten Spielstand angelegt');

  await browser.close();
  if (errors.length) { console.error('Prolog-Rauchtest FEHLER:\n - ' + errors.join('\n - ')); process.exit(1); }
  console.log('Prolog-Rauchtest ok: Fest, Führung (' + stationen.length + ' Stationen), Haupttor, Gute Nacht, Haken, Morgen, Abkürzung, Neuladen, Testsprung.');
})().catch(e => { console.error(e); process.exit(1); });
