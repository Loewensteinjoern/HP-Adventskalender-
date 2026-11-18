// Rauchtest im Headless-Browser: startet das Spiel, spielt ein paar Schritte, sammelt Konsolenfehler.
// Aufruf: node tests/smoke.js [ordner-für-bilder]
'use strict';
const path = require('path');
const { chromium } = require('playwright');

const FILE = 'file://' + path.join(__dirname, '..', 'docs', 'index.html');
const SHOTS = process.argv[2] || null;

async function run() {
  const browser = await chromium.launch();
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, hasTouch: true });
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  const key = async (k, n = 1, wait = 120) => { for (let i = 0; i < n; i++) { await page.keyboard.down(k); await page.waitForTimeout(40); await page.keyboard.up(k); await page.waitForTimeout(wait); } };
  const hold = async (k, ms) => { await page.keyboard.down(k); await page.waitForTimeout(ms); await page.keyboard.up(k); await page.waitForTimeout(150); };
  const shot = async name => { if (SHOTS) await page.locator('#c').screenshot({ path: path.join(SHOTS, name + '.png') }); };
  const state = () => page.evaluate(() => window.__wp && window.__wp());
  // A drücken und Dialog bis zum Ende weiterklicken
  const talk = async (first = true) => {
    if (first) await key('Enter', 1, 150);
    for (let i = 0; i < 60 && (await state()).dialog; i++) await key('Enter', 1, 90);
  };

  // 1) Testtag 1: neues Spiel, Intro, Q01 komplett bis Jörn
  await page.goto(FILE + '?testtag=1');
  await page.waitForTimeout(600);
  await shot('01_titel');
  await key('Enter');                 // Spiel beginnen
  await page.waitForTimeout(700);
  await shot('02_intro');
  await talk(false);                  // Intro durchklicken
  await page.waitForTimeout(300); await talk(false); // Türchen-Hinweis + Q01-Start
  await page.waitForTimeout(400);
  await shot('03_raum');
  await talk();                       // Diego wecken (Blick nach links auf Diego)
  let s = await state();
  if (!s.flags.diego_dabei) errors.push('Diego wurde nicht geweckt');
  await key('x');                     // schnüffeln
  await page.waitForTimeout(1500);
  await shot('04_schnueffeln');
  s = await state();
  if (!s.trail) errors.push('Keine Pfotenspur nach dem Schnüffeln');
  // zur Feder: Charly steht auf (13,4); Ziel (15,3) vom Feld (16,3) aus nach links
  await key('ArrowDown', 1, 250); await key('ArrowRight', 3, 250); await key('ArrowUp', 2, 250); await key('ArrowLeft', 1, 250);
  await talk();
  s = await state();
  if (!s.flags.q01_feder) errors.push('Feder nicht gefunden, Position ' + JSON.stringify(s.pos));
  // Jörn ansprechen: er steht direkt hinter Charly
  const j = s.followers.find(f => f.char === 'joern');
  const dir = j.x > s.pos.x ? 'ArrowRight' : j.x < s.pos.x ? 'ArrowLeft' : j.y > s.pos.y ? 'ArrowDown' : 'ArrowUp';
  await page.evaluate(d => window.__face(d), dir.replace('Arrow', '').toLowerCase());
  await talk();
  s = await state();
  if (!s.flags.q01_joern) errors.push('Jörn-Gespräch nicht ausgelöst');
  await shot('05_nach_joern');
  // Menü und Questlog
  await key('Escape'); await page.waitForTimeout(200); await shot('06_menue');
  await key('Enter'); await page.waitForTimeout(200); await shot('07_questlog');
  await key('x'); await key('ArrowDown'); await key('Enter'); await page.waitForTimeout(200); await shot('08_lied');
  await key('x'); await key('x');
  // Durch die Tür in den Kellergang
  await page.evaluate(() => window.__teleport(17, 3, 'up'));
  await hold('ArrowUp', 300); await page.waitForTimeout(900);
  s = await state();
  if (s.map !== 'kellergang') errors.push('Kartenwechsel in den Kellergang hat nicht geklappt');
  await shot('09_kellergang');
  await page.reload(); await page.waitForTimeout(600);
  s = await state();
  if (!s.hasSave) errors.push('Spielstand nach Neuladen nicht vorhanden');

  // 2) Echter Modus vor dem 1.12. darf den Testspeicher nicht berühren
  const keys = await page.evaluate(() => Object.keys(localStorage));
  if (keys.indexOf('winterphoenix_save') >= 0) errors.push('Testmodus hat den echten Spielstand angelegt');
  await page.goto(FILE + '?testtag=0'); await page.waitForTimeout(500);
  await shot('10_titel_vorher');

  // 3) iPhone quer und hoch
  const ph = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, hasTouch: true });
  ph.on('pageerror', e => errors.push('iPhone: ' + e));
  await ph.goto(FILE + '?testtag=1'); await ph.waitForTimeout(500);
  if (SHOTS) await ph.screenshot({ path: path.join(SHOTS, '11_iphone_quer.png') });
  await ph.setViewportSize({ width: 390, height: 844 }); await ph.waitForTimeout(400);
  if (SHOTS) await ph.screenshot({ path: path.join(SHOTS, '12_iphone_hoch.png') });
  if (SHOTS) { await page.goto(FILE + '?testtag=1'); await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, '00_ipad_ganz.png') }); }

  await browser.close();
  if (errors.length) { console.error('RAUCHTEST FEHLER:\n- ' + errors.join('\n- ')); process.exit(1); }
  console.log('Rauchtest ok: keine Konsolenfehler, Q01-Anfang, Schnüffeln, Kartenwechsel und Speichern funktionieren.');
}
run().catch(e => { console.error(e); process.exit(1); });
