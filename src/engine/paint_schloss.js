// ===== Stufe 2: Kacheln und Objekte für Schloss, Große Halle, Bibliothek, Innenhof, Eulen- und Uhrenturm =====

function stoneBlocks(p, R, nb, cols, mortar) {
  p.r(0, 0, 32, 32, mortar);
  for (let row = 0; row < 4; row++) {
    const y = row * 8, off = (row + nb.y) % 2 ? 8 : 0;
    for (let x = -off; x < 32; x += 16) {
      const c = cols[(R() * cols.length) | 0];
      p.r(x + 1, y + 1, 14, 6, c); p.r(x + 1, y + 1, 14, 1, shade(c, 0.14)); p.r(x + 1, y + 6, 14, 1, shade(c, -0.18));
    }
  }
}

Object.assign(PAINT_TILE, {
  marmor(p, R, nb) {
    for (let i = 0; i < 4; i++) {
      const x = (i % 2) * 16, y = (i >> 1) * 16, dark = ((nb.x * 2 + (i % 2)) + (nb.y * 2 + (i >> 1))) % 2;
      const c = dark ? '#8e8274' : '#bcae98';
      p.r(x, y, 16, 16, c); p.r(x, y, 16, 1, shade(c, 0.12)); p.r(x, y + 15, 16, 1, shade(c, -0.2));
      if (R() < 0.5) p.line(x + 2 + ((R() * 6) | 0), y + 3, x + 9 + ((R() * 5) | 0), y + 12, shade(c, -0.08));
    }
  },
  wand_schloss(p, R, nb) {
    stoneBlocks(p, R, nb, ['#a08870', '#988068', '#a88e74'], '#6a5848');
    if (nb.up === 'T') { p.r(0, 0, 32, 5, '#3a2a20'); p.r(0, 5, 32, 1, '#5a4434'); }
    if (!['K', 'O'].includes(nb.down)) { p.r(0, 25, 32, 7, '#5a4434'); p.r(0, 25, 32, 2, '#8a6c54'); p.r(0, 31, 32, 1, '#2e2018'); }
  },
  laeufer(p, R, nb) {
    p.r(0, 0, 32, 32, '#8a2a24');
    for (let y = 2; y < 32; y += 8) for (let x = 4; x < 32; x += 8) { p.r(x, y, 2, 2, '#b8463a'); p.px(x + 1, y + 4, '#6a1e1a'); }
    const edge = ch => ch !== 'R' && ch !== 'O' && ch !== 'd' && ch !== '<' && ch !== '>';
    if (edge(nb.left)) { p.r(0, 0, 3, 32, '#e0a838'); p.r(3, 0, 1, 32, '#6a1e1a'); }
    if (edge(nb.right)) { p.r(29, 0, 3, 32, '#e0a838'); p.r(28, 0, 1, 32, '#6a1e1a'); }
    if (edge(nb.up)) { p.r(0, 0, 32, 3, '#e0a838'); p.r(0, 3, 32, 1, '#6a1e1a'); }
    if (edge(nb.down)) { p.r(0, 29, 32, 3, '#e0a838'); p.r(0, 28, 32, 1, '#6a1e1a'); }
  },
  torbogen(p, R, nb) {
    if (nb.left === 'Y' || nb.right === 'Y') PAINT_TILE.aussenmauer(p, R, nb); else PAINT_TILE.wand_schloss(p, R, nb);
    const leftHalf = nb.right === 'O', rightHalf = nb.left === 'O';
    const cx = leftHalf ? 32 : rightHalf ? 0 : 16, rx = leftHalf || rightHalf ? 28 : 13;
    p.ell(cx, 10, rx + 3, 10, '#6a5848'); p.r(Math.max(0, cx - rx - 3), 10, Math.min(32, (rx + 3) * 2), 22, '#6a5848');
    p.ell(cx, 11, rx, 9, '#1a120e'); p.r(Math.max(0, cx - rx), 11, Math.min(32, rx * 2), 21, '#1a120e');
    for (let y = 14; y < 32; y += 3) p.r(Math.max(0, cx - rx), y, Math.min(32, rx * 2), 1, 'rgba(255,200,120,' + ((y - 12) / 80).toFixed(2) + ')');
  },
  ausgang_links(p, R, nb) {
    if (nb.right === '.') PAINT_TILE.dielen(p, R, nb); else if (nb.right === 'R') PAINT_TILE.laeufer(p, R, nb); else PAINT_TILE.marmor(p, R, nb);
    for (let x = 0; x < 20; x += 2) p.r(x, 0, 2, 32, 'rgba(10,6,12,' + ((20 - x) / 24).toFixed(2) + ')');
  },
  ausgang_rechts(p, R, nb) {
    if (nb.left === '.') PAINT_TILE.dielen(p, R, nb); else if (nb.left === 'R') PAINT_TILE.laeufer(p, R, nb); else PAINT_TILE.marmor(p, R, nb);
    for (let x = 12; x < 32; x += 2) p.r(x, 0, 2, 32, 'rgba(10,6,12,' + ((x - 10) / 24).toFixed(2) + ')');
  },
  treppe_runter(p) {
    for (let i = 0; i < 4; i++) { const y = i * 8, c = shade('#8e8274', -i * 0.18); p.r(0, y, 32, 5, c); p.r(0, y, 32, 1, shade(c, 0.2)); p.r(0, y + 5, 32, 3, shade(c, -0.4)); }
    p.r(0, 0, 3, 32, '#4a3a2e'); p.r(29, 0, 3, 32, '#4a3a2e');
    for (let y = 16; y < 32; y += 2) p.r(0, y, 32, 2, 'rgba(8,4,10,' + ((y - 14) / 24).toFixed(2) + ')');
  },
  schnee(p, R) {
    p.r(0, 0, 32, 32, '#e2eaf6');
    for (let i = 0; i < 10; i++) p.px((R() * 32) | 0, (R() * 32) | 0, R() < 0.5 ? '#c8d4e8' : '#f4f8ff');
    for (let i = 0; i < 2; i++) { const x = (R() * 28) | 0, y = (R() * 28) | 0; p.r(x, y, 4, 1, '#cfd9ec'); }
    if (R() < 0.3) p.px((R() * 32) | 0, (R() * 32) | 0, '#ffffff');
  },
  weg_schnee(p, R, nb) {
    p.r(0, 0, 32, 32, '#6a6470');
    for (let y = 0; y < 32; y += 8) for (let x = ((y / 8) % 2) * 5 - 5; x < 32; x += 10) {
      const c = ['#8a8290', '#7e7686', '#948c9a'][(R() * 3) | 0]; p.r(x + 1, y + 1, 8, 6, c); p.r(x + 1, y + 1, 8, 1, shade(c, 0.2));
    }
    const sn = ch => ch === 'n';
    if (sn(nb.left)) for (let y = 0; y < 32; y += 4) p.r(0, y, 3 + ((R() * 4) | 0), 4, '#e2eaf6');
    if (sn(nb.right)) for (let y = 0; y < 32; y += 4) { const w = 3 + ((R() * 4) | 0); p.r(32 - w, y, w, 4, '#e2eaf6'); }
    for (let i = 0; i < 4; i++) p.r((R() * 28) | 0, (R() * 30) | 0, 3, 2, '#dfe7f4');
  },
  aussenmauer(p, R, nb) {
    if (nb.y < 3) {
      stoneBlocks(p, R, nb, ['#6e7286', '#666a7e', '#767a8e'], '#3e4052');
      if (nb.y === 0) { p.r(0, 0, 32, 6, '#e8f0fc'); for (let x = 0; x < 32; x += 8) p.r(x, 6, 4, 3, '#e8f0fc'); }
      if (nb.y === 2) { p.r(0, 27, 32, 5, '#3e4052'); p.r(0, 30, 32, 2, '#2a2c3a'); }
    } else {
      p.r(0, 0, 32, 32, '#5a5e70');
      for (let x = 0; x < 32; x += 8) { p.r(x, 0, 7, 32, '#666a7e'); p.r(x, 0, 1, 32, '#7a7e92'); }
      p.r(2, 2, 28, 28, '#e8f0fc'); p.r(2, 2, 28, 2, '#ffffff');
      for (let i = 0; i < 4; i++) p.px(4 + ((R() * 24) | 0), 6 + ((R() * 20) | 0), '#c8d4e8');
    }
  },
  stroh(p, R) {
    p.r(0, 0, 32, 32, '#a8884a');
    for (let i = 0; i < 26; i++) { const x = (R() * 30) | 0, y = (R() * 31) | 0, c = ['#c8a85a', '#8a6c34', '#d8b86a'][(R() * 3) | 0]; p.r(x, y, 3 + ((R() * 3) | 0), 1, c); }
  },
  geheimgang(p, R, nb) {
    stoneBlocks(p, R, nb, ['#6e6472', '#675d6b', '#746a78'], '#3a3340');
    p.ell(16, 12, 11, 9, '#0a080e'); p.r(5, 12, 22, 20, '#0a080e');
    for (let y = 18; y < 32; y += 2) p.r(5, y, 22, 1, 'rgba(255,210,120,' + ((y - 16) / 90).toFixed(2) + ')');
  },
});

// Hauswappen-Tiere für Banner
const HAUS = {
  bernfuchs: { a: '#4f6b2a', b: '#e09a2c' }, eisvogel: { a: '#22747a', b: '#eef0f4' },
  tannenhirsch: { a: '#2a5a32', b: '#c0703a' }, sternbaer: { a: '#5a2a5e', b: '#c8c8d8' },
};
function wappen(p, v, cx, cy) {
  if (v === 'eisvogel') {
    p.ell(cx, cy + 2, 6, 4, '#2a9ab8'); p.ell(cx - 2, cy - 3, 4, 4, '#2a9ab8'); p.r(cx - 4, cy + 1, 7, 3, '#e8762a');
    p.r(cx - 10, cy - 3, 5, 2, '#1a1a1a'); p.px(cx - 3, cy - 4, '#ffffff'); p.r(cx + 4, cy + 4, 5, 2, '#1a6a8a');
  } else if (v === 'tannenhirsch') {
    p.ell(cx, cy + 3, 4, 5, '#c0703a'); p.r(cx - 1, cy + 6, 3, 2, '#2a1a12');
    p.r(cx - 8, cy - 8, 2, 8, '#e8d8b0'); p.r(cx + 6, cy - 8, 2, 8, '#e8d8b0'); p.r(cx - 8, cy - 8, 4, 2, '#e8d8b0'); p.r(cx + 4, cy - 8, 4, 2, '#e8d8b0');
    p.r(cx - 6, cy - 4, 2, 2, '#e8d8b0'); p.r(cx + 4, cy - 4, 2, 2, '#e8d8b0'); p.px(cx - 2, cy + 1, '#1a1a1a'); p.px(cx + 1, cy + 1, '#1a1a1a');
  } else if (v === 'sternbaer') {
    p.ell(cx, cy + 2, 7, 6, '#8a6a4a'); p.circ(cx - 5, cy - 4, 2, '#8a6a4a'); p.circ(cx + 5, cy - 4, 2, '#8a6a4a');
    p.ell(cx, cy + 4, 3, 2, '#c8a882'); p.px(cx, cy + 3, '#1a1a1a'); p.px(cx - 3, cy, '#1a1a1a'); p.px(cx + 3, cy, '#1a1a1a');
    p.r(cx - 1, cy - 12, 3, 3, '#f4e890'); p.px(cx, cy - 13, '#f4e890'); p.px(cx, cy - 9, '#f4e890');
  } else {
    p.ell(cx, cy + 1, 7, 6, '#e8762a');
    for (let i = 0; i < 5; i++) { p.r(cx - 6 + i, cy - 9 + i, 3 - (i > 2 ? 1 : 0), 1, '#e8762a'); p.r(cx + 4 - i, cy - 9 + i, 3 - (i > 2 ? 1 : 0), 1, '#e8762a'); }
    p.ell(cx - 3, cy + 4, 3, 2, '#fff4e0'); p.ell(cx + 3, cy + 4, 3, 2, '#fff4e0'); p.r(cx - 1, cy + 5, 2, 2, '#2a1a12');
    p.r(cx - 4, cy - 1, 2, 2, '#2a1a12'); p.r(cx + 3, cy - 1, 2, 2, '#2a1a12');
  }
}

Object.assign(PAINT_OBJ, {
  banner_haus(p, f, R, W, H, v) {
    const c = HAUS[v] || HAUS.bernfuchs;
    p.r(3, 5, 26, 2, '#5a3a20'); p.r(2, 4, 2, 4, '#e8c050'); p.r(28, 4, 2, 4, '#e8c050');
    p.r(5, 7, 22, 46, c.b); p.r(7, 7, 18, 44, c.a);
    for (let i = 0; i < 6; i++) { p.r(5 + i, 53 + i, 11 - i * 2 + 1, 1, c.b); p.r(16 + i, 53 + i, 11 - i * 2, 1, c.b); }
    wappen(p, v, 16, 28);
    p.r(9, 42, 14, 1, c.b); p.r(11, 45, 10, 1, c.b);
  },
  torbogen_gross(p) {
    for (let a = 0; a <= 16; a++) { const ang = Math.PI + a * Math.PI / 16; p.r(64 + Math.cos(ang) * 46 - 3, 40 + Math.sin(ang) * 32 - 3, 7, 6, a % 2 ? '#c8b090' : '#b09878'); }
    p.r(14, 38, 8, 26, '#b09878'); p.r(106, 38, 8, 26, '#b09878'); p.r(14, 38, 8, 2, '#d8c0a0'); p.r(106, 38, 8, 2, '#d8c0a0');
    p.r(56, 4, 16, 12, '#e8c050'); p.r(58, 6, 12, 8, '#4f6b2a'); p.r(62, 8, 4, 4, '#e8c050');
    for (let x = 22; x < 106; x += 6) { p.ell(x, 20 + Math.sin(x / 13) * 3, 4, 3, '#2f6a32'); if (x % 18 === 4) p.r(x - 1, 21, 2, 2, '#c8282a'); }
  },
  girlande(p) {
    for (let x = 2; x < 62; x += 4) { const y = 10 + Math.sin((x - 2) / 60 * Math.PI) * 8; p.ell(x, y, 4, 3, '#2f6a32'); p.px(x, y - 2, '#4a8a3e'); }
    [10, 24, 38, 52].forEach((x, i) => { const y = 12 + Math.sin((x - 2) / 60 * Math.PI) * 8; p.r(x - 1, y, 3, 3, ['#c8282a', '#e8c050', '#c8282a', '#e8c050'][i]); });
    p.r(0, 6, 4, 8, '#c8282a'); p.r(60, 6, 4, 8, '#c8282a');
  },
  saeule(p) {
    p.r(6, 68, 20, 8, '#8e8274'); p.r(6, 68, 20, 2, '#b0a490');
    p.r(9, 8, 14, 60, '#b0a490'); p.r(9, 8, 3, 60, '#ccc0aa'); p.r(19, 8, 4, 60, '#8e8274');
    for (let x = 12; x < 20; x += 3) p.r(x, 10, 1, 56, '#9e9282');
    p.r(5, 2, 22, 7, '#8e8274'); p.r(5, 2, 22, 2, '#ccc0aa');
    p.r(7, 26, 18, 4, '#2f6a32'); p.r(14, 30, 4, 6, '#c8282a');
  },
  kerzen_schwebend(p, f) {
    [[8, 6], [24, 14], [40, 4], [56, 12]].forEach(([x, y], i) => {
      const b = (f + i) % 2;
      p.r(x - 2, y + 8 + b, 4, 12, '#f4ead8'); p.r(x - 2, y + 8 + b, 1, 12, '#ffffff');
      flame(p, x, y + 8 + b, f + i, false);
    });
  },
  tannenbaum_gross(p, f) {
    p.r(24, 104, 16, 10, '#b8322a'); p.r(24, 104, 16, 2, '#e85a4a'); p.r(31, 104, 2, 10, '#e8c050');
    p.r(30, 96, 4, 8, '#5e3820');
    for (let i = 0; i < 5; i++) {
      const top = 8 + i * 18, w = 8 + i * 6;
      for (let y = 0; y < 22; y++) p.r(32 - (w * y / 22) - 2, top + y, (w * y / 22) * 2 + 4, 1, y % 5 === 4 ? '#1f5a26' : (i % 2 ? '#2f6a32' : '#2a6230'));
      for (let x = 32 - w; x < 32 + w; x += 3) p.px(x, top + 21, '#eef4ff');
    }
    for (let i = 0; i < 18; i++) { const y = 20 + ((i * 37) % 76), sp = 6 + (y - 8) / 3.2, x = 32 + (((i * 53) % 100) / 100 - 0.5) * sp * 2; p.r(x, y, 2, 2, ['#ff5a4a', '#ffd36a', '#6ab0ff', '#ff9ad0'][(i + f) % 4]); }
    [[26, 40], [38, 58], [22, 76], [42, 84]].forEach(([x, y]) => { p.circ(x, y, 3, '#c8282a'); p.px(x - 1, y - 1, '#ff8a8a'); });
    p.r(29, 0, 6, 6, '#ffd36a'); p.r(27, 2, 10, 2, '#ffd36a'); p.px(31, 0, '#fff8d0');
  },
  fenster_hoch(p, f, R, W, H, v) {
    const aussen = v === 'aussen';
    p.ell(32, 14, 26, 12, '#4a3a2e'); p.r(6, 14, 52, 46, '#4a3a2e');
    p.ell(32, 15, 22, 10, aussen ? '#c8862a' : '#16204a'); p.vgrad(10, 15, 44, 40, aussen ? '#e8a840' : '#16204a', aussen ? '#ffd27a' : '#3a5a9a', 5);
    if (aussen) { p.r(14, 34, 8, 16, 'rgba(90,50,20,0.35)'); p.circ(44, 24, 3, '#fff2b0'); }
    else for (let i = 0; i < 16; i++) p.px(10 + ((i * 29 + f * (i % 3 + 1) * 2) % 44), 8 + ((i * 17 + f * 4 + i) % 46), '#eef4ff');
    p.r(31, 6, 2, 50, '#4a3a2e'); p.r(10, 30, 44, 2, '#4a3a2e');
    p.r(10, 50, 44, 5, '#c8d8f0'); p.r(4, 56, 56, 5, '#8a7a6a'); p.r(4, 56, 56, 1, '#b0a090'); p.r(6, 54, 52, 3, '#eef4ff');
  },
  lehrertisch(p) {
    p.r(0, 12, 256, 26, '#5e3820'); p.r(0, 12, 256, 4, '#8a5a34'); p.r(0, 16, 256, 2, '#3a2214');
    p.r(4, 18, 248, 20, '#4a2c18'); for (let x = 8; x < 250; x += 30) { p.r(x, 20, 24, 16, '#5a361e'); p.r(x, 20, 24, 1, '#7a4a2a'); }
    p.r(0, 6, 256, 7, '#e8dcc8'); p.r(0, 6, 256, 1, '#ffffff');
    for (let x = 18; x < 250; x += 34) { p.circ(x, 8, 4, '#c8c0b0'); p.circ(x, 8, 3, '#f4ead8'); p.r(x + 8, 2, 3, 7, '#c8a040'); p.r(x + 8, 1, 3, 2, '#e8c050'); }
    p.r(120, 0, 16, 7, '#c8a040'); p.r(122, -2, 12, 3, '#e8c050');
  },
  langtisch(p, f, R, W, H, v) {
    const c = HAUS[v] || HAUS.bernfuchs;
    p.r(0, 30, W, 6, '#5e3820'); p.r(0, 30, W, 1, '#7a4a2a');
    p.r(0, 8, W, 20, '#7a4a2a'); p.r(0, 8, W, 2, '#a86d40'); p.r(0, 26, W, 2, '#4a2c18');
    p.r(0, 13, W, 9, c.a); p.r(0, 13, W, 1, c.b); p.r(0, 21, W, 1, c.b);
    for (let x = 10; x < W - 4; x += 22) {
      p.circ(x, 11, 4, '#c8c0b0'); p.circ(x, 11, 3, '#f4ead8');
      const food = R(); if (food < 0.3) p.r(x - 2, 9, 4, 3, '#c87a3a'); else if (food < 0.6) p.r(x - 2, 9, 4, 2, '#e8c050');
      p.r(x + 6, 6, 3, 6, '#c8c0d0'); p.r(x + 6, 6, 3, 1, '#ffffff');
    }
    for (let x = 4; x < W; x += 40) { p.r(x + 16, 10, 8, 6, '#c8a040'); p.r(x + 17, 6, 6, 4, ['#c84a3a', '#e8c050', '#7ac04a'][(x / 40) % 3]); }
    p.r(0, 36, W, 6, '#4a2c18'); p.r(0, 36, W, 1, '#6a4428'); p.r(0, 0, W, 6, '#4a2c18'); p.r(0, 0, W, 1, '#6a4428');
  },
  singkerze(p, f, R, W, H, v) {
    const on = v === 'an', bob = f % 2;
    p.ell(16, 64, 6, 2, 'rgba(0,0,0,0.25)');
    p.r(11, 14 + bob, 10, 26, '#f4ead8'); p.r(11, 14 + bob, 3, 26, '#ffffff'); p.r(19, 14 + bob, 2, 26, '#d8ccb8');
    p.r(10, 38 + bob, 12, 3, '#c8a040'); p.r(12, 41 + bob, 8, 2, '#a8862a');
    p.r(13, 22 + bob, 2, 6, '#e8dcc8'); p.r(18, 16 + bob, 2, 4, '#e8dcc8');
    p.r(15, 10 + bob, 2, 4, '#3a2a1e');
    if (on) { p.r(13, 1 + bob, 6, 10, '#ff9a2a'); p.r(14, -1 + bob + 2, 4, 4, '#ffd36a'); p.r(15, 4 + bob, 2, 6, '#fff2b0'); }
    else { p.px(14 + bob, 6, '#a8a0b0'); p.px(16 - bob, 3, '#9890a0'); }
    // Notenzeichen
    if (on && f % 2) { p.r(25, 6, 1, 6, '#ffd36a'); p.r(23, 11, 3, 2, '#ffd36a'); }
  },
  spieluhr(p, f) {
    p.r(6, 28, 20, 14, '#6a3a1e'); p.r(6, 28, 20, 2, '#9a6a3a'); p.r(8, 32, 16, 1, '#e8c050');
    p.r(4, 40, 24, 3, '#4a2c18');
    p.r(8, 16, 16, 13, '#7a4a2a'); p.r(8, 16, 16, 2, '#a86d40'); p.r(15, 10, 2, 6, '#c8a040');
    p.circ(16, 8, 3, '#e8c050'); p.px(15, 7, '#fff2b0');
    p.r(26, 32, 4, 2, '#c8a040'); p.r(28, 30 + (f % 2) * 2, 2, 4, '#c8a040');
  },
  lesetisch(p, f) {
    p.r(4, 28, 4, 14, '#4a2c18'); p.r(88, 28, 4, 14, '#4a2c18');
    p.r(0, 12, 96, 18, '#7a4a2a'); p.r(0, 12, 96, 2, '#a86d40'); p.r(0, 28, 96, 2, '#4a2c18');
    p.r(10, 14, 16, 10, '#f4ead8'); p.r(18, 14, 1, 10, '#c8b898'); p.r(12, 16, 5, 1, '#6a5a4a'); p.r(20, 16, 5, 1, '#6a5a4a');
    p.r(40, 10, 12, 8, '#2a4a8a'); p.r(40, 7, 12, 3, '#8a2a2a'); p.r(42, 4, 10, 3, '#3a6a3a');
    p.r(70, 6, 4, 10, '#f4ead8'); flame(p, 72, 6, f, false); p.r(68, 15, 8, 2, '#c8a040');
  },
  pult(p, f) {
    p.r(2, 18, 60, 30, '#5e3820'); p.r(2, 18, 60, 3, '#8a5a34'); p.r(4, 24, 56, 1, '#3a2214');
    p.r(6, 28, 24, 8, '#6e4428'); p.r(34, 28, 24, 8, '#6e4428'); p.r(16, 31, 4, 2, '#e8c050'); p.r(44, 31, 4, 2, '#e8c050');
    p.r(8, 10, 22, 9, '#f4ead8'); p.r(19, 10, 1, 9, '#c8b898');
    p.r(40, 8, 8, 10, '#1a1a2a'); p.r(41, 6, 6, 3, '#3a3a4a'); p.r(46, 0, 1, 10, '#eef0f4'); p.r(45, 0, 3, 3, '#f4ead8');
    p.r(52, 4, 4, 12, '#f4ead8'); flame(p, 54, 4, f, false);
    p.r(28, 2, 10, 8, '#e8c050'); p.px(33, 1, '#f4ead8');
  },
  globus(p) {
    p.r(10, 44, 12, 4, '#4a2c18'); p.r(15, 30, 2, 14, '#c8a040');
    p.circ(16, 18, 11, '#c8a040'); p.circ(16, 18, 9, '#3a6a9a');
    p.r(10, 12, 6, 5, '#5a8a3a'); p.r(17, 19, 5, 6, '#5a8a3a'); p.r(12, 21, 3, 2, '#5a8a3a'); p.px(13, 13, '#7aaa5a');
  },
  mauseloch(p) {
    p.ell(16, 28, 5, 4, '#1a120e'); p.r(11, 28, 10, 4, '#1a120e'); p.px(14, 27, '#3a2a20');
  },
  tanne(p, f, R) {
    p.r(14, 66, 4, 10, '#5e3820');
    for (let i = 0; i < 4; i++) {
      const top = 4 + i * 16, w = 5 + i * 3.5;
      for (let y = 0; y < 18; y++) p.r(16 - (w * y / 18) - 2, top + y, (w * y / 18) * 2 + 4, 1, y % 5 === 4 ? '#1a4a24' : '#25582e');
      for (let x = 16 - w; x < 16 + w; x += 2) p.px(x, top + 16 + (x % 3 === 0 ? 1 : 0), '#eef4ff');
      p.r(16 - w / 2, top + 6, w, 2, '#e8f0fc');
    }
    p.r(13, 2, 6, 4, '#e8f0fc');
  },
  brunnen_eis(p) {
    p.ell(32, 46, 30, 16, '#6e7286'); p.ell(32, 44, 28, 14, '#8a8ea2'); p.ell(32, 44, 24, 11, '#a8d0ec'); p.ell(30, 42, 16, 6, '#c8e4f8');
    p.r(20, 41, 10, 1, '#ffffff'); p.r(36, 47, 8, 1, '#ffffff');
    p.r(28, 14, 8, 30, '#8a8ea2'); p.r(28, 14, 3, 30, '#a8acbe');
    p.ell(32, 14, 10, 4, '#8a8ea2'); p.ell(32, 12, 8, 3, '#e8f0fc');
    for (let i = 0; i < 5; i++) p.r(24 + i * 4, 16, 2, 4 + (i % 3) * 3, '#c8e4f8');
    p.ell(32, 33, 30, 6, 'rgba(0,0,0,0)'); p.r(4, 34, 56, 4, '#e8f0fc');
  },
  laterne(p, f) {
    p.r(15, 22, 3, 40, '#2a2a34'); p.r(11, 60, 11, 4, '#2a2a34');
    p.r(9, 6, 15, 16, '#2a2a34'); p.r(11, 8, 11, 12, '#ffcf6a'); p.r(12, 9, 3, 10, '#fff2b0');
    p.r(7, 4, 19, 3, '#2a2a34'); p.r(13, 1, 7, 3, '#2a2a34'); p.r(8, 2, 17, 3, '#e8f0fc');
    p.r(6, 22, 6, 4, '#2f6a32'); p.r(8, 25, 2, 3, '#c8282a');
  },
  schneemann(p) {
    p.ell(16, 46, 11, 9, '#f4f8ff'); p.ell(16, 44, 10, 7, '#ffffff');
    p.ell(16, 30, 8, 7, '#f4f8ff'); p.circ(16, 17, 6, '#f4f8ff'); p.circ(15, 16, 5, '#ffffff');
    p.r(13, 15, 2, 2, '#1a1a1a'); p.r(18, 15, 2, 2, '#1a1a1a'); p.r(16, 18, 5, 2, '#e8762a');
    p.r(10, 22, 13, 3, '#4f6b2a'); p.r(19, 24, 3, 7, '#4f6b2a'); p.r(20, 24, 2, 7, '#e09a2c');
    p.r(11, 8, 10, 3, '#2a2a34'); p.r(13, 3, 6, 6, '#2a2a34');
    p.r(16, 29, 2, 2, '#2a2a2a'); p.r(16, 34, 2, 2, '#2a2a2a');
    p.line(6, 30, 0, 24, '#5e3820'); p.line(26, 30, 31, 23, '#5e3820');
  },
  baum_kahl(p, f, R, W, H, v) {
    p.r(13, 30, 6, 48, '#4a3424'); p.r(13, 30, 2, 48, '#5e4430');
    const br = [[16, 34, 4, 18], [16, 40, 28, 22], [16, 26, 6, 6], [16, 26, 26, 4], [16, 30, 16, 2], [5, 19, 2, 12], [27, 23, 30, 14]];
    br.forEach(([x1, y1, x2, y2]) => { p.line(x1, y1, x2, y2, '#4a3424'); p.line(x1 + 1, y1, x2 + 1, y2, '#4a3424'); });
    [[4, 18], [6, 6], [26, 4], [16, 2], [28, 22], [2, 12]].forEach(([x, y]) => p.r(x - 2, y - 1, 5, 2, '#e8f0fc'));
    if (v === 'band') { p.r(20, 44, 3, 6, '#c8282a'); p.r(22, 48 + (f % 2), 2, 6, '#c8282a'); p.r(18, 46, 3, 2, '#e85a4a'); }
  },
  stange(p, f, R, W, H, v) {
    p.r(4, 30, 3, 20, '#5e3820'); p.r(57, 30, 3, 20, '#5e3820'); p.r(0, 28, 64, 4, '#7a4a2a'); p.r(0, 28, 64, 1, '#a86d40');
    const owls = v === 'leer' ? [] : [[14, '#8a8a92'], [36, '#a07a50'], [52, '#d8d0c0']];
    owls.forEach(([x, col], i) => {
      const blink = (f + i) % 3 === 0;
      p.ell(x, 20, 6, 8, col); p.ell(x, 22, 4, 5, shade(col, 0.3));
      p.r(x - 4, 14, 3, 3, blink ? col : '#f4ead8'); p.r(x + 1, 14, 3, 3, blink ? col : '#f4ead8');
      if (!blink) { p.px(x - 3, 15, '#1a1a1a'); p.px(x + 2, 15, '#1a1a1a'); }
      p.r(x - 1, 17, 2, 2, '#e09a2c'); p.r(x - 3, 27, 2, 2, '#e09a2c'); p.r(x + 1, 27, 2, 2, '#e09a2c');
      p.px(x - 5, 11, col); p.px(x + 4, 11, col);
    });
    for (let x = 6; x < 60; x += 7) p.px(x, 34 + (x % 3), '#eef0f4');
  },
  zifferblatt(p, f, R, W, H, v) {
    p.circ(64, 34, 31, '#5a4434'); p.circ(64, 34, 29, '#c8a040'); p.circ(64, 34, 26, '#f0e6c8');
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; p.r(64 + Math.cos(a) * 21 - 1, 34 + Math.sin(a) * 21 - 2, 3, 4, '#3a2a1e'); }
    const back = (v === 'ok' ? -1 : 1) * f / 4 * 6.283;
    p.line(64, 34, 64 + Math.round(Math.cos(-back - 1.57) * 18), 34 + Math.round(Math.sin(-back - 1.57) * 18), '#2a1a12');
    p.line(64, 34, 64 + Math.round(Math.cos(back * 0.25) * 12), 34 + Math.round(Math.sin(back * 0.25) * 12), '#2a1a12');
    p.circ(64, 34, 2, '#c8a040');
    p.r(20, 4, 14, 56, '#4a3424'); p.r(94, 4, 14, 56, '#4a3424'); for (let y = 8; y < 60; y += 8) { p.r(22, y, 10, 1, '#6a5040'); p.r(96, y, 10, 1, '#6a5040'); }
  },
  uhrwerk(p, f, R, W, H, v) {
    const ok = v !== 'kaputt', ang = ok ? f * 0.4 : 0;
    p.r(2, 40, 92, 42, '#4a3424'); p.r(2, 40, 92, 3, '#6a5040');
    const gear = (cx, cy, r, teeth, rot, col) => {
      p.circ(cx, cy, r, col); p.circ(cx, cy, r - 3, shade(col, -0.2)); p.circ(cx, cy, 3, '#2a1a12');
      for (let i = 0; i < teeth; i++) { const a = rot + i / teeth * 6.283; p.r(cx + Math.cos(a) * (r + 1) - 2, cy + Math.sin(a) * (r + 1) - 2, 4, 4, col); }
      for (let i = 0; i < 4; i++) { const a = rot + i * 1.57; p.line(cx, cy, cx + Math.round(Math.cos(a) * (r - 4)), cy + Math.round(Math.sin(a) * (r - 4)), shade(col, 0.2)); }
    };
    gear(24, 36, 14, 10, ang, '#c8a040');
    gear(56, 26, 10, 8, -ang * 1.4, '#b89040');
    if (ok || v === 'neu') gear(74, 44, 12, 9, ang * 1.2, '#d8b050');
    else { p.circ(74, 44, 12, '#2a1a12'); p.circ(74, 44, 3, '#5a4434'); }
    p.r(10, 70, 76, 8, '#3a2618'); p.r(44, 50, 4, 30, '#8a6a3a');
  },
  zahnrad(p, f) {
    const cx = 16, cy = 22;
    p.circ(cx, cy, 7, '#d8b050'); p.circ(cx, cy, 2, '#5a4434');
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; p.r(cx + Math.cos(a) * 8 - 1, cy + Math.sin(a) * 8 - 1, 3, 3, '#d8b050'); }
    if (f % 2) { p.px(cx - 4, cy - 5, '#ffffff'); p.px(cx + 5, cy - 3, '#fff2b0'); }
  },
  loser_stein(p) {
    p.r(4, 6, 24, 20, '#746a78'); p.r(4, 6, 24, 2, '#8a8090'); p.r(4, 24, 24, 2, '#4e4652');
    p.r(2, 4, 28, 1, '#2a2430'); p.r(2, 27, 28, 1, '#2a2430'); p.r(2, 4, 1, 24, '#2a2430'); p.r(29, 4, 1, 24, '#2a2430');
    p.px(10, 12, '#5e5464'); p.px(20, 18, '#5e5464');
  },
  werkbank(p) {
    p.r(2, 14, 60, 8, '#7a4a2a'); p.r(2, 14, 60, 2, '#a86d40'); p.r(4, 22, 4, 22, '#4a2c18'); p.r(56, 22, 4, 22, '#4a2c18');
    p.r(8, 8, 8, 6, '#9aa0a8'); p.r(20, 10, 14, 3, '#c8a040'); p.circ(44, 10, 4, '#c8a040'); p.circ(44, 10, 1, '#5a4434'); p.r(50, 6, 2, 8, '#5a5a62');
    p.r(6, 36, 52, 3, '#5e3820');
  },
  statue(p, f, R, W, H, v) {
    const S = '#a8a4b0', SD = '#7a7682', SL = '#ccc8d4';
    p.r(5, 50, 22, 22, '#6a6472'); p.r(5, 50, 22, 2, '#8a8494'); p.r(3, 46, 26, 5, '#7a7482'); p.r(3, 46, 26, 1, '#a09aa8');
    p.r(7, 70, 18, 2, '#4a4452');
    if (v === 'eule') {
      p.ell(16, 32, 10, 13, S); p.ell(16, 35, 6, 8, SL); p.circ(12, 26, 4, SL); p.circ(20, 26, 4, SL); p.r(11, 25, 2, 2, SD); p.r(19, 25, 2, 2, SD);
      p.r(15, 29, 2, 3, SD); p.r(8, 16, 3, 5, S); p.r(21, 16, 3, 5, S); p.r(6, 28, 4, 14, SD); p.r(22, 28, 4, 14, SD);
    } else if (v === 'ritter') {
      p.r(11, 30, 10, 16, S); p.r(9, 18, 14, 14, S); p.r(11, 6, 10, 12, S); p.r(12, 11, 8, 2, SD); p.r(15, 7, 2, 10, SL);
      p.r(5, 20, 4, 14, SD); p.r(23, 4, 2, 42, SD); p.r(20, 4, 8, 2, SL); p.r(9, 18, 14, 2, SL);
    } else {
      p.ell(16, 36, 9, 9, S); p.ell(16, 24, 7, 6, S); p.r(10, 14, 3, 6, S); p.r(19, 14, 3, 6, S);
      p.ell(13, 28, 3, 2, SL); p.ell(19, 28, 3, 2, SL); p.r(15, 27, 2, 2, SD); p.r(12, 23, 2, 2, SD); p.r(18, 23, 2, 2, SD);
      for (let i = 0; i < 10; i++) p.r(24 + (i > 5 ? i - 5 : 0), 40 - i * 2, 4, 3, i > 6 ? SL : S);
    }
    p.r(6, 44, 20, 4, '#2f6a32'); p.r(10, 45, 3, 2, '#c8282a'); p.r(20, 45, 3, 2, '#c8282a'); p.r(15, 42, 3, 3, '#e8c050');
  },
  buffet(p, f) {
    p.r(0, 14, 128, 26, '#5e3820'); p.r(0, 14, 128, 3, '#8a5a34');
    p.r(0, 17, 128, 16, '#b8322a'); for (let x = 0; x < 128; x += 8) p.r(x, 31, 4, 3, '#b8322a'); p.r(0, 17, 128, 1, '#e85a4a');
    p.r(4, 36, 4, 10, '#3a2214'); p.r(120, 36, 4, 10, '#3a2214');
    p.ell(18, 12, 12, 4, '#c8c0b0'); for (let i = 0; i < 6; i++) p.r(9 + i * 3, 8 + (i % 2), 3, 3, i % 2 ? '#c87a3a' : '#e8c890');
    p.ell(46, 12, 10, 4, '#c8c0b0'); [[40, 7], [46, 6], [52, 8]].forEach(([x, y]) => { p.r(x - 3, y, 6, 6, '#a8602a'); p.px(x - 1, y + 2, '#f4ead8'); p.px(x + 1, y + 2, '#f4ead8'); });
    p.ell(74, 10, 12, 5, '#c8a040'); p.ell(74, 8, 10, 3, '#b8322a'); for (let i = 0; i < 3; i++) p.px(68 + i * 5 + (f % 2), 2 - i % 2, 'rgba(255,255,255,0.7)');
    p.r(92, 4, 4, 9, '#f4ead8'); flame(p, 94, 4, f, false); p.r(100, 6, 7, 7, '#f4ead8'); p.r(100, 6, 7, 2, '#6a3a1e'); p.r(110, 6, 7, 7, '#e09a2c'); p.r(110, 4, 7, 3, '#ffffff');
    p.r(60, 15, 8, 3, '#2f6a32'); p.r(63, 14, 2, 2, '#c8282a');
  },
  raureif(p, f) {
    const g = (x, y) => { p.r(x, y, 3, 4, 'rgba(220,240,255,0.85)'); p.px(x - 1, y - 2, 'rgba(220,240,255,0.8)'); p.px(x + 1, y - 3, 'rgba(220,240,255,0.8)'); p.px(x + 3, y - 2, 'rgba(220,240,255,0.8)'); };
    g(8, 14); g(19, 24);
    if (f % 2) { p.px(12, 10, '#ffffff'); p.px(24, 19, '#ffffff'); } else { p.px(6, 20, '#ffffff'); p.px(22, 28, '#ffffff'); }
  },
});
