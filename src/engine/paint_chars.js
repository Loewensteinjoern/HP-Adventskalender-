// ===== Figuren: Menschen 32×40, Hund 32×32 =====
const LOOKS = {
  charly: { hair: '#f0cf6a', hairD: '#c9a040', hairL: '#fbe9a8', long: true, glasses: '#5a3424', skin: '#f6d2b6', skinD: '#e2ae8e',
    robe: '#3e5624', robeD: '#2c3f18', robeL: '#5a7432', trim: '#e09a2c', eye: '#3a5a8a' },
  joern: { hair: '#b86a3c', hairD: '#8a4a26', hairL: '#d8945c', long: false, glasses: '#2a2422', skin: '#f2cdb0', skinD: '#dca888',
    robe: '#3a4f22', robeD: '#283816', robeL: '#55702e', trim: '#d08a26', eye: '#4a6a3a' },
  pit: { hair: '#5a3a22', hairD: '#3a2414', hairL: '#7a5232', long: false, messy: true, skin: '#f0c8a8', skinD: '#d8a684',
    robe: '#425a26', robeD: '#2e4018', robeL: '#5c7834', trim: '#e09a2c', eye: '#3a2a1e' },
  lotte: { hair: '#3a2418', hairD: '#24140c', hairL: '#5a3a26', long: true, curls: true, skin: '#f2cdb0', skinD: '#dca888',
    robe: '#22747a', robeD: '#16545a', robeL: '#3a9aa0', trim: '#eef0f4', eye: '#3a2a1e' },
};

function drawHuman(L, dir, fr) {
  const c = mkCanvas(32, 40), p = Pen(c.getContext('2d'));
  const step = fr === 1 ? 1 : fr === 2 ? -1 : 0;
  const side = dir === 'left' || dir === 'right';
  // Füße
  if (side) {
    p.r(13 + step * 2, 36, 5, 3, '#3a2418'); p.r(14 - step * 2, 36, 5, 3, '#4a2e1e');
  } else {
    p.r(11, 36 - (step > 0 ? 1 : 0), 4, 3, '#3a2418'); p.r(17, 36 - (step < 0 ? 1 : 0), 4, 3, '#3a2418');
  }
  // Umhang
  const top = 20;
  for (let y = top; y < 37; y++) {
    const t = (y - top) / 16, half = side ? 6 + t * 2 : 7 + t * 2.4, x0 = Math.round(16 - half), w = Math.round(half * 2);
    p.r(x0, y, w, 1, L.robe); p.r(x0, y, 2, 1, L.robeD); p.r(x0 + w - 2, y, 2, 1, L.robeD);
  }
  p.r(8, 36, 16, 1, L.robeD);
  if (dir === 'down') { p.r(15, 22, 2, 14, L.trim); p.r(15, 22, 1, 14, shade(L.trim, 0.3)); }
  if (dir === 'up') { p.r(12, 21, 8, 6, L.robeL); p.r(13, 26, 6, 2, L.robeD); }
  // Arme
  const sw = side ? 0 : step;
  if (!side) {
    p.r(6, 22 + sw, 3, 10, L.robeD); p.r(23, 22 - sw, 3, 10, L.robeD);
    p.r(6, 22 + sw, 1, 10, L.robeL); p.r(25, 22 - sw, 1, 10, L.robeL);
    p.r(6, 32 + sw, 3, 2, L.skin); p.r(23, 32 - sw, 3, 2, L.skin);
  } else {
    p.r(14 + step, 23, 4, 10, L.robeD); p.r(14 + step, 23, 1, 10, L.robeL); p.r(14 + step, 33, 4, 2, L.skin);
  }
  // Schal in Hausfarben
  p.r(10, 19, 12, 3, L.trim); p.r(10, 21, 12, 1, shade(L.trim, -0.25));
  if (dir === 'down') { p.r(18, 22, 3, 6, L.trim); p.r(18, 24, 3, 1, L.robeD); }
  if (dir === 'right') { p.r(12, 22, 3, 5, L.trim); }
  if (dir === 'left') { p.r(17, 22, 3, 5, L.trim); }
  // Lange Haare hinter dem Kopf
  if (L.long && dir !== 'up') {
    if (dir === 'down') { p.r(7, 10, 4, 13, L.hairD); p.r(21, 10, 4, 13, L.hairD); p.r(8, 10, 2, 12, L.hair); p.r(22, 10, 2, 12, L.hair); }
    else { const bx = dir === 'right' ? 8 : 18; p.r(bx, 9, 6, 14, L.hairD); p.r(bx + 1, 9, 4, 13, L.hair); }
  }
  // Kopf
  const hx = side ? (dir === 'right' ? 17 : 15) : 16;
  p.ell(hx, 12, 7, 7, L.skin);
  p.r(hx - 6, 15, 12, 3, L.skin);
  if (dir === 'up') {
    p.ell(16, 11, 8, 8, L.hair); p.r(9, 12, 14, 7, L.hair);
    if (L.long) { p.r(9, 14, 14, 9, L.hair); p.r(10, 21, 12, 2, L.hairD); }
    for (let x = 10; x < 23; x += 3) p.r(x, 6, 1, 12, L.hairD);
    p.r(12, 4, 5, 2, L.hairL);
  } else if (dir === 'down') {
    p.ell(16, 8, 8, 5, L.hair); p.r(8, 7, 16, 4, L.hair);
    p.r(8, 9, 3, 6, L.hair); p.r(21, 9, 3, 6, L.hair);
    if (L.messy) { p.r(12, 2, 2, 2, L.hair); p.r(18, 3, 2, 2, L.hair); p.r(9, 11, 2, 2, L.hair); }
    p.r(11, 10, 10, 1, L.hairD); p.r(12, 4, 6, 2, L.hairL);
    if (L.curls) for (let x = 8; x < 25; x += 3) p.r(x, 11 + (x % 2), 2, 2, L.hairD);
    // Gesicht
    p.r(12, 13, 2, 2, '#2a1a14'); p.r(18, 13, 2, 2, '#2a1a14'); p.px(12, 13, '#ffffff'); p.px(18, 13, '#ffffff');
    p.px(13, 14, L.eye); p.px(19, 14, L.eye);
    p.r(10, 16, 2, 1, '#f0a090'); p.r(20, 16, 2, 1, '#f0a090');
    p.r(15, 17, 3, 1, '#b86a5a');
    if (L.glasses) {
      const g = L.glasses;
      p.r(10, 12, 5, 1, g); p.r(10, 15, 5, 1, g); p.r(10, 12, 1, 4, g); p.r(14, 12, 1, 4, g);
      p.r(17, 12, 5, 1, g); p.r(17, 15, 5, 1, g); p.r(17, 12, 1, 4, g); p.r(21, 12, 1, 4, g);
      p.r(15, 13, 2, 1, g); p.px(11, 13, 'rgba(255,255,255,0.6)'); p.px(18, 13, 'rgba(255,255,255,0.6)');
    }
  } else {
    // Seitenansicht (für rechts gemalt, links wird gespiegelt)
    p.ell(15, 8, 8, 5, L.hair); p.r(8, 7, 13, 6, L.hair); p.r(8, 10, 6, 7, L.hair);
    if (L.messy) { p.r(12, 2, 2, 2, L.hair); p.r(17, 3, 2, 2, L.hair); }
    p.r(11, 4, 6, 2, L.hairL); p.r(9, 13, 4, 2, L.hairD);
    if (L.curls) for (let y = 9; y < 20; y += 3) p.r(8, y, 2, 2, L.hairD);
    p.r(13, 12, 2, 3, L.skinD); // Ohr
    p.r(20, 13, 2, 2, '#2a1a14'); p.px(21, 13, '#ffffff');
    p.r(23, 15, 1, 2, L.skinD); p.r(19, 16, 2, 1, '#f0a090'); p.r(20, 18, 2, 1, '#b86a5a');
    if (L.glasses) { const g = L.glasses; p.r(19, 12, 4, 1, g); p.r(19, 15, 4, 1, g); p.r(19, 12, 1, 4, g); p.r(22, 12, 1, 4, g); p.r(14, 13, 5, 1, g); }
  }
  if (dir === 'left') {
    const m = mkCanvas(32, 40), g = m.getContext('2d'); g.translate(32, 0); g.scale(-1, 1); g.drawImage(c, 0, 0);
    outline(m, '#24160f'); return m;
  }
  outline(c, '#24160f');
  return c;
}

// Diego: Straßenhund, kniehoch, blond mit schwarzbraunen Flecken
const DOG = { base: '#e3bd78', light: '#f4dcaa', shadeC: '#c49a58', patch: '#3e2a1c', patchL: '#5a4030', nose: '#1a1210' };
function drawDog(dir, fr, pose) {
  const c = mkCanvas(32, 32), p = Pen(c.getContext('2d')), D = DOG;
  const st = fr === 1 ? 1 : fr === 2 ? -1 : 0;
  if (pose === 'schlaf') {
    p.ell(15, 24, 12, 6, D.base); p.ell(15, 22, 10, 4, D.light);
    p.ell(10, 21, 4, 3, D.patch);
    p.ell(24, 23, 6, 5, D.base); p.ell(26, 25, 4, 2, D.light);
    p.r(22, 18, 5, 4, D.patch); p.r(23, 23, 3, 1, '#2a1a14'); p.r(29, 24, 2, 2, D.nose);
    p.r(4, 27, 14, 3, D.shadeC); p.r(3, 26, 4, 2, D.base);
    outline(c, '#2a1a12'); return c;
  }
  const side = dir === 'left' || dir === 'right';
  if (side) {
    const sn = pose === 'schnueffeln' ? 5 : 0;
    // Beine
    [[8, st], [12, -st], [18, -st], [22, st]].forEach(([x, o], i) => { p.r(x, 23, 3, 6 - Math.max(0, o), i === 1 ? D.patch : D.base); p.r(x, 28 - Math.max(0, o), 3, 1, D.shadeC); });
    // Körper
    p.ell(15, 19, 10, 5, D.base); p.ell(15, 17, 9, 3, D.light); p.r(8, 21, 16, 2, D.shadeC);
    p.ell(14, 16, 4, 3, D.patch); p.ell(8, 19, 3, 3, D.patch);
    // Schwanz (wedelt)
    const tw = fr % 2 ? -1 : 1;
    p.r(4, 12 + tw, 2, 6, D.base); p.r(3, 10 + tw * 2, 2, 3, D.light);
    // Kopf
    const hy = 11 + sn;
    p.ell(24, hy, 5, 5, D.base); p.r(26, hy + 1, 5, 4, D.light); p.r(29, hy + 1, 2, 2, D.nose);
    p.r(23, hy - 1, 2, 2, '#1a1210'); p.px(23, hy - 1, '#ffffff');
    p.r(19, hy - 4, 4, 7, D.patch); p.r(20, hy - 5, 2, 2, D.patchL);
    if (pose !== 'schnueffeln' && fr === 1) p.r(27, hy + 5, 2, 2, '#e87a8a');
  } else if (dir === 'down') {
    p.ell(16, 21, 7, 6, D.base); p.ell(16, 21, 4, 5, D.light);
    p.r(11, 23, 3, 6 - (st > 0 ? 1 : 0), D.base); p.r(18, 23, 3, 6 - (st < 0 ? 1 : 0), D.patch);
    p.ell(16, 12, 6, 6, D.base);
    p.r(8, 9, 4, 8, D.patch); p.r(20, 8, 4, 7, D.base); p.r(21, 14, 2, 2, D.shadeC);
    p.ell(16, 16, 3, 2, D.light); p.r(15, 14, 3, 2, D.nose);
    p.r(12, 11, 2, 2, '#1a1210'); p.r(18, 11, 2, 2, '#1a1210'); p.px(12, 11, '#ffffff'); p.px(18, 11, '#ffffff');
    p.r(12, 9, 3, 3, D.patch); p.r(12, 11, 2, 2, '#1a1210'); p.px(12, 11, '#ffffff');
    if (fr === 1) p.r(15, 18, 2, 2, '#e87a8a');
  } else {
    p.r(11, 24, 3, 5 - (st > 0 ? 1 : 0), D.base); p.r(18, 24, 3, 5 - (st < 0 ? 1 : 0), D.base);
    p.ell(16, 19, 7, 8, D.base); p.ell(16, 18, 5, 6, D.light); p.ell(14, 17, 3, 4, D.patch);
    p.ell(16, 9, 5, 5, D.base); p.r(10, 6, 4, 7, D.patch); p.r(19, 6, 4, 6, D.base);
    const tw = fr % 2 ? -2 : 2;
    p.r(15 + tw, 25, 2, 5, D.base); p.r(15 + tw, 29, 2, 2, D.light);
  }
  if (dir === 'left') {
    const m = mkCanvas(32, 32), g = m.getContext('2d'); g.translate(32, 0); g.scale(-1, 1); g.drawImage(c, 0, 0);
    outline(m, '#2a1a12'); return m;
  }
  outline(c, '#2a1a12');
  return c;
}

// Sprite-Speicher: SPR.get('charly', 'down', 0, pose)
const SPR = {
  cache: {},
  get(key, dir, fr, pose) {
    const k = key + dir + fr + (pose || '');
    if (!this.cache[k]) this.cache[k] = key === 'diego' ? drawDog(dir, fr, pose) : drawHuman(LOOKS[key], dir, fr);
    return this.cache[k];
  },
};
