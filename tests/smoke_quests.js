// Rauchtest Stufe 2: spielt Q01–Q04 und die Nebenaufgabe im Headless-Browser durch.
// Aufruf: node tests/smoke_quests.js [ordner-für-bilder]
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
  const drain = async () => { for (let i = 0; i < 80; i++) { const s = await st(); if (!s.dialog) { await wait(250); if (!(await st()).dialog) return; } await key('Enter', 1, 80); } };
  const talk = async () => { await key('Enter', 1, 150); await drain(); };
  const go = (m, x, y, d) => page.evaluate(a => window.__go(...a), [m, x, y, d]);
  const flags = o => page.evaluate(f => window.__flags(f), o);
  const shot = async n => { if (SHOTS) await page.locator('#c').screenshot({ path: path.join(SHOTS, n + '.png') }); };
  const expect = async (flag, what) => { const s = await st(); if (!s.flags[flag]) errors.push(what + ' (Flag ' + flag + ' fehlt)'); };
  const cast = async z => { await key('Enter', 1, 200); if ((await st()).mode !== 'zauber') { errors.push('Zaubermenü öffnet sich nicht'); return; } await page.evaluate(n => window.__pickSpell(n), z); await key('Enter', 1, 200); };
  const sniffAndFind = async () => { await key('x'); await wait(1300); if (!(await st()).trail) errors.push('Keine Spur beim Schnüffeln'); await talk(); };

  await page.goto(FILE + '?testtag=4'); await wait(500);
  await key('Enter'); await wait(500); await drain(); await wait(300); await drain();
  await flags({ diego_dabei: true, q01_feder: true, q01_joern: true });

  // Kartenwechsel über die geöffnete Kellertreppe
  await go('kellergang', 14, 3, 'up'); await key('ArrowUp', 1, 900);
  if ((await st()).map !== 'schlosskern') errors.push('Kellertreppe führt nicht in den Schlosskern');
  await shot('20_schlosskern');

  // Q01: Lotte in der Großen Halle
  await go('grosse_halle', 17, 9, 'up'); await shot('21_halle'); await talk();
  await expect('q01_lotte', 'Q01: Lotte'); await drain();

  // Q02: Luxa, Spieluhr, Kerzen (erst falsch, dann richtig)
  await go('grosse_halle', 7, 5, 'up'); await talk(); await expect('zauber_luxa', 'Q02: Luxa');
  await go('grosse_halle', 16, 5, 'up'); await talk(); await expect('q02_melodie', 'Q02: Spieluhr'); await wait(400); await shot('22_demo');
  const kx = { 1: 5, 2: 9, 3: 14, 4: 18 };
  await go('grosse_halle', kx[1], 10, 'up'); await cast('luxa'); await drain();
  if ((await st()).flags.kerzen_1) errors.push('Q02: falsche Kerze wurde nicht zurückgesetzt');
  for (const n of [2, 4, 1, 3]) { await go('grosse_halle', kx[n], 10, 'up'); await cast('luxa'); }
  await drain(); await expect('q02_kerzen', 'Q02: Kerzenrätsel'); await shot('23_kerzen_an');

  // Q03: Eule, drei Erinnerungen, Pendel
  await go('eulenturm', 5, 5, 'up'); await talk(); await expect('q03_eule', 'Q03: Eule'); await shot('24_eulenturm');
  await go('schlosskern', 20, 5, 'right'); await sniffAndFind(); await expect('q03_siegel', 'Q03: Siegelwachs');
  await go('innenhof', 17, 8, 'up'); await talk(); await expect('q03_band', 'Q03: Band'); await shot('25_innenhof');
  await go('bibliothek', 11, 5, 'up'); await talk(); await expect('q03_tinte', 'Q03: Tinte'); await shot('26_bibliothek');
  await go('eulenturm', 5, 5, 'up'); await talk(); await expect('q03_erinnert', 'Q03: erinnert');
  await go('uhrenturm', 3, 6, 'up'); await talk(); await expect('q03_clavis', 'Q03: Clavis'); await drain();
  await go('eulenturm', 5, 5, 'up'); await cast('luxa'); await drain();
  if ((await st()).flags.q03_offen) errors.push('Q03: falscher Zauber hat die Kapsel geöffnet');
  await cast('clavis'); await drain(); await expect('q03_offen', 'Q03: Kapsel mit Clavis'); await drain();
  await go('uhrenturm', 3, 6, 'up');

  // Q04: Pendel, Geheimgang, Zahnrad, Uhrwerk, Uhrmeister
  await talk(); await expect('q04_pendel', 'Q04: Pendel');
  await go('uhrenturm', 9, 7, 'right'); await sniffAndFind(); await expect('geheimgang_uhr', 'Q04: Geheimgang');
  await key('ArrowRight', 3, 260); await key('ArrowRight', 1, 200); await shot('27_geheimgang'); await talk(); await expect('q04_zahnrad', 'Q04: Zahnrad');
  await go('uhrenturm', 6, 6, 'up'); await cast('restauro'); await drain(); await expect('q04_eingesetzt', 'Q04: eingesetzt');
  await go('uhrenturm', 9, 5, 'up'); await key('Enter', 1, 150); await drain();
  for (let r = 0; r < 3; r++) {
    let m = null;
    for (let i = 0; i < 30; i++) { m = await page.evaluate(() => window.__mini()); if (m && m.round === r && m.phase === 'frage') break; await wait(150); }
    if (!m || m.type !== 'uhr') { errors.push('Q04: Uhr-Rätsel nicht gestartet'); break; }
    if (r === 0) { await key('Enter', 1, 300); if ((await page.evaluate(() => window.__mini())).phase !== 'falsch') errors.push('Q04: falsche Uhrzeit wurde akzeptiert'); await wait(1800); await shot('28_uhr'); }
    for (let i = 0; i < 12 && (await page.evaluate(() => window.__mini())).hour !== m.ziel; i++) await key('ArrowRight', 1, 90);
    await key('Enter', 1, 200); await wait(1900);
  }
  await drain(); await drain(); await expect('q04_uhrmeister', 'Q04: Uhrmeister');

  // Übergänge: zu Fuß durch alle Verbindungswege
  const walk = async (m, x, y, d, ziel) => { await go(m, x, y, d); await key({ up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[d], 1, 900); const s2 = await st(); if (s2.map !== ziel) errors.push('Weg ' + m + ' → ' + ziel + ' fehlt (gelandet in ' + s2.map + ')'); };
  await walk('schlosskern', 1, 8, 'left', 'treppenhaus'); await shot('30_treppenhaus');
  await walk('treppenhaus', 7, 3, 'up', 'bibliothek'); await walk('bibliothek', 18, 7, 'right', 'treppenhaus');
  await walk('schlosskern', 20, 8, 'right', 'wendeltreppe'); await shot('31_wendeltreppe'); await walk('wendeltreppe', 5, 3, 'up', 'uhrenturm');
  await walk('schlosskern', 10, 13, 'down', 'arkadengang'); await shot('32_arkadengang'); await walk('arkadengang', 18, 3, 'right', 'innenhof');
  await walk('schlosskern', 10, 3, 'up', 'vorhalle'); await shot('33_vorhalle'); await walk('vorhalle', 6, 3, 'up', 'grosse_halle');
  await walk('innenhof', 18, 3, 'up', 'eulenstiege'); await shot('34_eulenstiege'); await walk('eulenstiege', 4, 3, 'up', 'eulenturm');

  // Nebenaufgabe Knarz
  await go('schlosskern', 7, 13, 'up'); await talk(); await expect('knarz_auftrag', 'Knarz: Auftrag');
  await go('innenhof', 4, 7, 'up'); await sniffAndFind(); await expect('knarz_schluessel', 'Knarz: Schlüssel');
  await go('schlosskern', 7, 13, 'up'); await talk(); await drain(); await expect('knarz_fertig', 'Knarz: fertig');

  const s = await st();
  ['Q01', 'Q02', 'Q03', 'Q04', 'N_knarz'].forEach(q => { if (s.done.indexOf(q) < 0) errors.push(q + ' nicht abgeschlossen'); });
  if (s.fragments !== 4) errors.push('Fragmente: ' + s.fragments + ' statt 4');
  await key('Escape'); await key('Enter'); await wait(200); await shot('29_questlog');
  await browser.close();
  if (errors.length) { console.error('QUEST-TEST FEHLER:\n- ' + errors.join('\n- ')); process.exit(1); }
  console.log('Quest-Test ok: Q01–Q04 und Nebenaufgabe durchgespielt, 4 Fragmente, keine Konsolenfehler.');
})().catch(e => { console.error(e); process.exit(1); });
