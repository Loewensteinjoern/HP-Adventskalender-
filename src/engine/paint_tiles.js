// ===== Kacheln (32×32) =====
// nb: Nachbarzeichen { up, down, left, right } und Kachelposition { x, y }
const isWallCh = ch => ch === 'W' || ch === 'D' || ch === 'X';

function planks(p, R, nb, cols) {
  for (let r = 0; r < 4; r++) {
    const y = r * 8, base = cols[(R() * cols.length) | 0];
    p.r(0, y, 32, 8, base);
    p.r(0, y, 32, 1, shade(base, 0.12));
    p.r(0, y + 7, 32, 1, shade(base, -0.38));
    const seam = (nb.x * 13 + nb.y * 7 + r * 11) % 32;
    p.r(seam, y, 1, 7, shade(base, -0.38));
    p.px(seam + 1, y + 1, shade(base, 0.15));
    for (let i = 0; i < 3; i++) p.r((R() * 28) | 0, y + 2 + ((R() * 4) | 0), 2 + ((R() * 4) | 0), 1, shade(base, -0.12));
    if (R() < 0.25) { const kx = (R() * 28) | 0; p.r(kx, y + 3, 2, 2, shade(base, -0.3)); }
  }
}

const PAINT_TILE = {
  decke(p, R, nb) {
    p.r(0, 0, 32, 32, '#1d130e');
    for (let i = 0; i < 6; i++) p.r((R() * 30) | 0, (R() * 30) | 0, 2, 1, '#261a12');
    const trim = (ch) => ch && ch !== 'T';
    if (trim(nb.down)) { p.r(0, 27, 32, 5, '#4a2c18'); p.r(0, 27, 32, 1, '#7a4c2c'); p.r(0, 31, 32, 1, '#24160c'); }
    if (trim(nb.up)) { p.r(0, 0, 32, 4, '#3a2214'); p.r(0, 0, 32, 1, '#6a4428'); }
    if (trim(nb.right)) { p.r(28, 0, 4, 32, '#3a2214'); p.r(28, 0, 1, 32, '#24160c'); p.r(31, 0, 1, 32, '#5a3820'); }
    if (trim(nb.left)) { p.r(0, 0, 4, 32, '#3a2214'); p.r(3, 0, 1, 32, '#24160c'); p.r(0, 0, 1, 32, '#5a3820'); }
  },
  wand_putz(p, R, nb) {
    const lower = !isWallCh(nb.down), top = nb.up === 'T';
    // Putz, warmes Creme
    p.r(0, 0, 32, 32, '#d2b083');
    for (let i = 0; i < 14; i++) p.px((R() * 32) | 0, (R() * 32) | 0, R() < 0.5 ? '#c4a174' : '#dcbd92');
    if (top) { p.r(0, 0, 32, 7, '#4a2c18'); p.r(0, 6, 32, 1, '#2e1a0e'); p.r(0, 1, 32, 1, '#6e4428'); p.r(0, 7, 32, 2, '#b8956a'); }
    if (lower) {
      // Holzvertäfelung mit Feldern
      p.r(0, 11, 32, 21, '#7a4a2a');
      p.r(0, 11, 32, 2, '#5a341c'); p.r(0, 11, 32, 1, '#9a6a42');
      p.r(3, 15, 26, 12, '#6c4024'); p.r(3, 15, 26, 1, '#4e2e18'); p.r(3, 26, 26, 1, '#94643c'); p.r(28, 15, 1, 12, '#94643c'); p.r(3, 15, 1, 12, '#4e2e18');
      p.r(0, 28, 32, 4, '#3e2414'); p.r(0, 28, 32, 1, '#6a4428');
    }
  },
  dielen(p, R, nb) { planks(p, R, nb, ['#94603a', '#8c5a35', '#9a663d', '#905d37']); },
  galerie(p, R, nb) { planks(p, R, nb, ['#a2703f', '#9a6a3c', '#a87543']); },
  galerie_front(p, R, nb) {
    planks(p, R, nb, ['#a2703f', '#9a6a3c']);
    p.r(0, 13, 32, 19, '#5c361e');
    p.r(0, 13, 32, 2, '#8a5a34'); p.r(0, 15, 32, 1, '#3e2414');
    for (let x = 2; x < 32; x += 16) { p.r(x, 18, 12, 10, '#4e2c18'); p.r(x, 18, 12, 1, '#3a2010'); p.r(x, 27, 12, 1, '#74482a'); p.r(x + 11, 18, 1, 10, '#74482a'); }
    p.r(0, 30, 32, 2, '#2e1a0e');
    // Geländer
    for (let x = 1; x < 32; x += 6) { p.r(x, 2, 2, 11, '#6e4226'); p.px(x, 2, '#9a6a42'); }
    p.r(0, 0, 32, 3, '#7a4a2a'); p.r(0, 0, 32, 1, '#b07a48');
  },
  galerie_seite(p, R, nb) {
    planks(p, R, nb, ['#94603a', '#8c5a35', '#9a663d']);
    p.r(0, 0, 11, 32, '#5c361e'); p.r(9, 0, 2, 32, '#3a2010'); p.r(0, 0, 2, 32, '#7a4a2a');
    for (let y = 3; y < 32; y += 10) { p.r(3, y, 5, 6, '#4e2c18'); p.r(3, y, 5, 1, '#74482a'); }
    p.r(11, 0, 5, 32, 'rgba(0,0,0,0.22)');
  },
  treppe(p) {
    for (let i = 0; i < 4; i++) {
      const y = i * 8, t = shade('#a06a40', -i * 0.06);
      p.r(0, y, 32, 5, t); p.r(0, y, 32, 1, shade(t, 0.2)); p.r(0, y + 5, 32, 3, '#5e3820');
    }
    p.r(0, 0, 3, 32, '#4a2c18'); p.r(29, 0, 3, 32, '#4a2c18'); p.r(1, 0, 1, 32, '#6e4428'); p.r(30, 0, 1, 32, '#6e4428');
  },
  wand_stein(p, R, nb) {
    p.r(0, 0, 32, 32, '#3a3340');
    for (let row = 0; row < 4; row++) {
      const y = row * 8, off = (row + nb.y) % 2 ? 8 : 0;
      for (let x = -off; x < 32; x += 16) {
        const c = ['#6e6472', '#675d6b', '#746a78'][(R() * 3) | 0];
        p.r(x + 1, y + 1, 14, 6, c); p.r(x + 1, y + 1, 14, 1, shade(c, 0.15)); p.r(x + 1, y + 6, 14, 1, shade(c, -0.2));
      }
    }
    if (nb.up === 'T') { p.r(0, 0, 32, 4, '#2a2430'); }
    if (!isWallCh(nb.down)) { p.r(0, 26, 32, 6, '#2e2834'); p.r(0, 26, 32, 1, '#4e4652'); }
  },
  steinboden(p, R, nb) {
    p.r(0, 0, 32, 32, '#3a3440');
    for (let i = 0; i < 4; i++) {
      const x = (i % 2) * 16 + ((nb.y % 2) && i < 2 ? 0 : 0), y = (i >> 1) * 16;
      const c = ['#5c5560', '#635b66', '#575060', '#605864'][(R() * 4) | 0];
      p.r(x + 1, y + 1, 14, 14, c); p.r(x + 1, y + 1, 14, 1, shade(c, 0.14)); p.r(x + 1, y + 1, 1, 14, shade(c, 0.08));
      if (R() < 0.4) p.r(x + 3 + ((R() * 8) | 0), y + 4 + ((R() * 8) | 0), 3, 1, shade(c, -0.2));
    }
  },
  ausgang_unten(p, R, nb) {
    PAINT_TILE.steinboden(p, R, nb);
    p.r(4, 2, 24, 12, '#4f6b2a'); p.r(5, 3, 22, 10, '#e09a2c'); p.r(7, 5, 18, 6, '#4f6b2a');
    for (let y = 16; y < 32; y += 2) p.r(0, y, 32, 2, 'rgba(10,6,12,' + ((y - 14) / 22).toFixed(2) + ')');
  },
};
