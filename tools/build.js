// Build: bündelt src/ und data/ zu docs/index.html, erzeugt Manifest und Icons.
// Aufruf: node tools/build.js   (Node ohne zusätzliche Pakete)
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { ROOT, CORE_FILES, ENGINE_FILES, read, loadData, loadCore } = require('./lib');

const data = loadData();
const core = loadCore(data);
const v = core.validateData();
v.warnings.forEach(w => console.log('Hinweis: ' + w));
if (v.errors.length) { v.errors.forEach(e => console.error('FEHLER: ' + e)); console.error('Build abgebrochen: ' + v.errors.length + ' Datenfehler.'); process.exit(1); }

const safe = s => s.replace(/<\/script/gi, '<\\/script');
const json = JSON.stringify(data).replace(/</g, '\\u003c');
const script = "'use strict';\n(function () {\nconst DATA = " + json + ';\n' +
  CORE_FILES.concat(ENGINE_FILES).map(f => '// ---- ' + f + ' ----\n' + safe(read(f))).join('\n') + '\nboot();\n})();';
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
let html = read('src/shell.html')
  .replace('<!-- {{BUILDINFO}} -->', '<!-- Version ' + data.welt.version + ' · gebaut ' + stamp + ' UTC · ' + WATERMARK_TEXT() + ' -->')
  .replace('/*__SCRIPT__*/', () => script);
function WATERMARK_TEXT() { return 'Entwickelt und erstellt von Jörn Löwenstein mit Hilfe von künstlicher Intelligenz (Claude)'; }

const out = path.join(ROOT, 'docs');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
fs.writeFileSync(path.join(out, 'app.webmanifest'), JSON.stringify({
  name: 'Die Reise zum Winterphönix', short_name: 'Winterphönix', lang: 'de', dir: 'ltr',
  description: 'Ein Adventskalender-Abenteuer im verschneiten Zauberschloss Løvestein.',
  start_url: './', scope: './', id: './', display: 'standalone', orientation: 'landscape',
  background_color: '#120c1c', theme_color: '#120c1c',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  ],
}, null, 2));

// ---- Icon: Phönix auf Nachthimmel, als PNG ohne Pakete ----
const ICON = [
  '................................',
  '................................',
  '..........*..........*..........',
  '................................',
  '...*...........#..........*.....',
  '..............###...............',
  '.........#...#####...#..........',
  '........###.#######.###.........',
  '.......#####.#####.#####........',
  '........######.#.######.........',
  '..........####.#.####...........',
  '............#######.............',
  '.............#####..............',
  '..............###...............',
  '.............#.#.#..............',
  '................................',
];
function iconPixel(x, y) {
  // 32×32 Raster, oben Himmel, unten Schnee
  const t = y / 31;
  let c = [Math.round(14 + 40 * t), Math.round(12 + 30 * t), Math.round(40 + 50 * t)];
  if (y >= 24) c = y === 24 ? [238, 244, 255] : [216, 228, 244];
  const row = ICON[y - 6];
  if (row) {
    const ch = row[x];
    if (ch === '#') c = y - 6 < 9 ? [255, 211, 106] : [255, 138, 42];
    if (ch === '#' && y - 6 < 7) c = [255, 240, 200];
    if (ch === '*') c = [238, 244, 255];
  }
  return c;
}
const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, dataBuf) {
  const len = Buffer.alloc(4); len.writeUInt32BE(dataBuf.length);
  const td = Buffer.concat([Buffer.from(type), dataBuf]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const c = iconPixel(Math.floor(x * 32 / size), Math.floor(y * 32 / size));
      const o = y * (size * 3 + 1) + 1 + x * 3; raw[o] = c[0]; raw[o + 1] = c[1]; raw[o + 2] = c[2];
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
[180, 192, 512].forEach(s => fs.writeFileSync(path.join(out, 'icon-' + s + '.png'), png(s)));

console.log('Gebaut: docs/index.html (' + Math.round(html.length / 1024) + ' KB), Manifest, 3 Icons. Version ' + data.welt.version);
