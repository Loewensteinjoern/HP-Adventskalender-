// Rauchtest S2: Probekampf, Zufallskampf im Tiefschnee, Niederlage ohne Game Over, Schlosskarte.
// Aufruf: node tests/smoke_kampf.js [ordner-für-bilder]
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
  const kb = () => page.evaluate(() => window.__kampf());
  const drain = async () => { for (let i = 0; i < 80; i++) { const s = await st(); if (!s.dialog) { await wait(250); if (!(await st()).dialog) return; } await key('Enter', 1, 80); } };
  const go = (m, x, y, d) => page.evaluate(a => window.__go(...a), [m, x, y, d]);
  const flags = o => page.evaluate(f => window.__flags(f), o);
  const shot = async n => { if (SHOTS) await page.locator('#c').screenshot({ path: path.join(SHOTS, n + '.png') }); };
  // Bis zur Auswahl im Kampf warten (Meldungen mit A weiterklicken, Dialoge wegklicken)
  const bisMenue = async () => {
    for (let i = 0; i < 120; i++) {
      if ((await st()).dialog) { await key('Enter', 1, 80); continue; }
      const k = await kb(); if (!k || k.phase === 'menu') return k;
      if (k.phase === 'ev' || k.phase === 'ende') await key('Enter', 1, 120); else await wait(120);
    }
    return kb();
  };
  await page.goto(FILE + '?testtag=2'); await wait(500);
  await key('Enter'); await wait(500); await drain(); await wait(300); await drain();
  await flags({ diego_dabei: true, zauber_luxa: true });

  // Steuerkreuz-Navigation im Kampfmenü
  const nav = async art => {
    for (let t = 0; t < 12; t++) {
      const k = await kb(); const i = k.aktionen.indexOf(art);
      if (k.sel === i) return;
      if ((k.sel ^ 1) === i) await key('ArrowRight', 1, 90); else await key('ArrowDown', 1, 90);
    }
    errors.push('Menüpunkt nicht erreichbar: ' + art);
  };

  // 1) Probekampf am zitternden Schneehaufen im Innenhof
  await go('innenhof', 17, 10, 'right'); await shot('40_innenhof_tiefschnee');
  await key('Enter', 1, 200); await drain(); await wait(1400);
  let k = await bisMenue();
  if (!k) { errors.push('Probekampf startet nicht'); }
  else {
    await shot('41_kampf_menue');
    if (k.gegner[0].id !== 'schneepixie') errors.push('Probekampf: falscher Gegner');
    if (k.aktionen.join() !== 'zaubern,schneeball,kakao,mut,bellen,schnueffeln,flucht') errors.push('Kampfaktionen: ' + k.aktionen.join());
    await nav('schnueffeln'); await key('Enter', 1, 400); await shot('42_schnueffeln');
    k = await bisMenue();
    await nav('zaubern'); await key('Enter', 1, 200); await shot('43_zauberwahl');
    await key('Enter', 1, 500); await shot('44_luxa');
    for (let i = 0; i < 40 && (await kb()); i++) { await key('Enter', 1, 150); }
    await wait(400); await drain(); await wait(300);
    const s = await st();
    if (!s.flags.kampf_probe) errors.push('Probekampf: Sieg nicht gezählt');
    if (s.mode !== 'play') errors.push('Nach dem Kampf nicht zurück im Spiel: ' + s.mode);
  }

  // 2) Zufallskampf im Tiefschnee: Diego knurrt vorher
  await page.evaluate(() => window.__kampfChance(1));
  await go('innenhof', 16, 13, 'right'); await key('ArrowRight', 1, 250);
  const w = await page.evaluate(() => window.__warm());
  if (!w.alarm && !(await kb())) errors.push('Kein Überfall im Tiefschnee');
  await shot('45_knurren'); await wait(1300);
  k = await bisMenue();
  if (!k) errors.push('Zufallskampf startet nicht');
  else {
    await shot('46_zufallskampf');
    if (k.gegner.some(g => g.id !== 'schneepixie')) errors.push('An Tag 2 darf nur die Schneepixie kommen: ' + JSON.stringify(k.gegner));
    // Zurückziehen geht bei normalen Kämpfen
    await nav('flucht'); await key('Enter', 1, 300);
    for (let i = 0; i < 20 && (await kb()); i++) await key('Enter', 1, 150);
    if ((await st()).mode !== 'play') errors.push('Zurückziehen klappt nicht');
  }
  await page.evaluate(() => window.__kampfChance(0));
  // Auf normalem Schnee nie ein Überfall
  await go('innenhof', 5, 4, 'right'); await page.evaluate(() => window.__kampfChance(1));
  await key('ArrowRight', 2, 260);
  if ((await kb()) || (await page.evaluate(() => window.__warm())).alarm) errors.push('Überfall auf normalem Schnee');
  await page.evaluate(() => window.__kampfChance(0));

  // 3) Niederlage: kein Game Over, Aufwachen im Warmen mit voller Wärme
  await go('arkadengang', 18, 3, 'right'); await key('ArrowRight', 1, 900);
  if ((await st()).map !== 'innenhof') errors.push('Arkadengang → Innenhof fehlt');
  const warm = (await page.evaluate(() => window.__warm())).warm;
  if (!warm || warm.map !== 'arkadengang') errors.push('Warmer Ort nicht gemerkt: ' + JSON.stringify(warm));
  await page.evaluate(() => window.__setWaerme(1));
  await page.evaluate(() => window.__kampfChance(1));
  await go('innenhof', 16, 13, 'right'); await page.evaluate(() => window.__setWaerme(1)); await key('ArrowRight', 1, 250);
  await wait(1300); k = await bisMenue();
  await page.evaluate(() => window.__kampfChance(0));
  if (!k) errors.push('Kampf für Niederlage startet nicht');
  else {
    for (let t = 0; t < 8 && (await kb()); t++) { await nav('mut'); await key('Enter', 1, 200); await bisMenue(); }
    await shot('47_kalt');
    for (let i = 0; i < 30 && (await kb()); i++) await key('Enter', 1, 150);
    await wait(1500); await shot('48_aufwachen'); await drain();
    const s = await st(), ww = await page.evaluate(() => window.__warm());
    if (s.map !== 'arkadengang') errors.push('Nach Niederlage nicht im Warmen aufgewacht: ' + s.map);
    if (ww.waerme !== 10) errors.push('Nach Niederlage nicht voll aufgewärmt: ' + ww.waerme);
  }

  // 4) Frostwicht ab Tag 7 (mit Flammula)
  await page.goto(FILE + '?testtag=7'); await wait(400);
  await key('Enter'); await wait(400); await drain();
  await flags({ diego_dabei: true, zauber_luxa: true, zauber_flammula: true, kampf_probe: true });
  await page.evaluate(() => window.__startFight('wicht_pixie'));
  k = await bisMenue(); await shot('49_frostwicht');
  if (!k || k.gegner[0].id !== 'frostwicht') errors.push('Frostwicht-Kampf startet nicht');
  else {
    // Flammula auf den Frostwicht (Ziel wählen)
    for (let r = 0; r < 6 && (await kb()) && !(await kb()).ende; r++) {
      k = await bisMenue(); if (!k) break;
      const t = k.gegner.findIndex(g => g.kraft > 0), z = k.gegner[t].id === 'frostwicht' ? 'flammula' : 'luxa';
      await nav('zaubern'); await key('Enter', 1, 150);
      for (let i = 0; i < 6 && (await kb()).zauber[(await kb()).zsel] !== z; i++) await key('ArrowDown', 1, 90);
      await key('Enter', 1, 200);
      const k2 = await kb();
      if (k2 && k2.phase === 'ziel') { if (r === 0) await shot('50_ziel'); for (let i = 0; i < 3 && (await kb()).ziel !== t; i++) await key('ArrowRight', 1, 90); await key('Enter', 1, 200); }
      if (r === 0) { await wait(500); await shot('51_flammula'); }
    }
    for (let i = 0; i < 30 && (await kb()); i++) await key('Enter', 1, 150);
    await drain();
    if (!((await st()).flags.siege >= 1)) errors.push('Frostwicht-Kampf nicht gewonnen');
  }

  // 5) Schlosskarte im Menü
  await go('schlosskern', 10, 8, 'down');
  await key('Escape', 1, 200); await key('ArrowDown', 1, 150); await key('Enter', 1, 300);
  if ((await st()).mode !== 'karte') errors.push('Schlosskarte öffnet sich nicht');
  await shot('52_karte'); await key('x', 1, 200);

  await browser.close();
  if (errors.length) { console.error('KAMPF-TEST FEHLER:\n- ' + errors.join('\n- ')); process.exit(1); }
  console.log('Kampf-Test ok: Probekampf, Überfall im Tiefschnee, Zurückziehen, Niederlage ohne Game Over, Frostwicht, Schlosskarte.');
})().catch(e => { console.error(e); process.exit(1); });
