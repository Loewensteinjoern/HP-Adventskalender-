// ===== Kampfbildschirm: Gegner-Figuren, Ablauf, Effekte =====

// --- Gegner, im Code gemalt (32×40, doppelt gezeichnet) ---
function drawPixie(fr) {
  const c = mkCanvas(32, 40), p = Pen(c.getContext('2d'));
  const up = fr % 2 === 0;
  // Flügel (zwei Bilder: oben/unten)
  const wing = (x, dir) => {
    const y0 = up ? 10 : 16;
    p.ell(x, y0 + 4, 5, up ? 7 : 5, 'rgba(200,236,255,0.75)'); p.ell(x + dir, y0 + 3, 3, up ? 5 : 3, 'rgba(240,250,255,0.9)');
    p.px(x + dir * 2, y0 + 1, '#ffffff');
  };
  wing(8, -1); wing(24, 1);
  // Kleid aus Eiskristall
  for (let i = 0; i < 9; i++) p.r(16 - Math.floor(i / 2) - 1, 21 + i, 2 + Math.floor(i / 2) * 2, 1, i < 3 ? '#cfeaff' : i < 6 ? '#9cd0f8' : '#6aa8e0');
  p.px(14, 27, '#ffffff'); p.px(18, 25, '#ffffff');
  p.r(13, 30, 1, 4, '#bcd8f0'); p.r(18, 30, 1, 4, '#bcd8f0');
  // Arme
  p.r(11, 22, 3, 1, '#dff0ff'); p.r(18, 22, 3, 1, '#dff0ff'); p.px(10, up ? 21 : 23, '#ffffff'); p.px(21, up ? 21 : 23, '#ffffff');
  // Kopf mit Zackenhaar
  p.circ(16, 15, 5, '#e8f6ff'); p.r(12, 17, 9, 2, '#d4ecfc');
  [[11, 10], [13, 8], [16, 7], [19, 8], [21, 10]].forEach(([x, y]) => { p.r(x, y, 2, 3, '#ffffff'); p.px(x, y - 1, '#cfeaff'); });
  p.r(13, 14, 2, 2, '#1a2a4a'); p.r(18, 14, 2, 2, '#1a2a4a'); p.px(13, 14, '#ffffff'); p.px(18, 14, '#ffffff');
  p.px(15, 18, '#5a7aa8'); p.px(16, 18, '#5a7aa8'); p.px(17, 17, '#5a7aa8'); p.px(14, 17, '#5a7aa8');
  p.px(12, 16, '#f8c8d8'); p.px(20, 16, '#f8c8d8');
  outline(c, '#1a2a4a');
  // Glitzer (ohne Kontur)
  p.px(up ? 5 : 27, up ? 26 : 8, '#ffffff'); p.px(up ? 27 : 4, up ? 30 : 12, '#cfeaff');
  return c;
}
function drawWicht(fr) {
  const c = mkCanvas(32, 40), p = Pen(c.getContext('2d'));
  const b = fr % 2 ? 1 : 0;
  // Füße
  p.r(10, 36, 5, 3, '#6a98c8'); p.r(18, 36, 5, 3, '#6a98c8');
  // Körper aus Eis
  p.ell(16, 28 + b, 9, 8, '#8ab8e0'); p.ell(15, 27 + b, 8, 7, '#bfe0f8'); p.ell(13, 25 + b, 3, 3, '#e4f4ff');
  [[12, 30], [19, 27], [16, 33]].forEach(([x, y]) => p.px(x, y + b, '#6a98c8'));
  // Arme mit Eiskrallen
  const ay = b ? 20 : 24;
  p.r(4, ay, 4, 3, '#9ccaf0'); p.r(24, ay, 4, 3, '#9ccaf0');
  [[3, ay - 2], [5, ay - 3], [26, ay - 3], [28, ay - 2]].forEach(([x, y]) => p.r(x, y, 1, 3, '#ffffff'));
  // Kopf
  p.ell(16, 17 + b, 7, 5, '#cfeaff');
  p.r(11, 15 + b, 3, 2, '#2ae0ff'); p.r(19, 15 + b, 3, 2, '#2ae0ff'); p.px(12, 15 + b, '#e8ffff'); p.px(20, 15 + b, '#e8ffff');
  p.r(10, 14 + b, 4, 1, '#5a88b8'); p.r(19, 14 + b, 4, 1, '#5a88b8');
  p.r(14, 19 + b, 5, 1, '#3a5a88');
  // Eiszapfen-Bart
  [[11, 21, 3], [14, 21, 4], [17, 21, 4], [20, 21, 3]].forEach(([x, y, h]) => { for (let i = 0; i < h; i++) p.r(x + Math.floor(i / 2), y + i + b, Math.max(1, 2 - Math.floor(i / 2)), 1, '#f4fbff'); });
  // Zipfelmütze aus Eis
  for (let i = 0; i < 11; i++) { const w = 2 + i * 1.4 | 0; p.r(16 - (w >> 1) + (i < 3 ? 2 - i : 0), 2 + i + b, w, 1, i % 3 === 0 ? '#9ccaf0' : '#e8f6ff'); }
  p.r(8, 13 + b, 17, 2, '#ffffff');
  outline(c, '#16263e');
  return c;
}
const FOES = { schneepixie: drawPixie, frostwicht: drawWicht };
const FOE_SPR = { cache: {}, get(id, fr) { const k = id + fr; return this.cache[k] || (this.cache[k] = FOES[id](fr)); } };

const SPELL_COL = { luxa: '255,244,190', flammula: '255,140,50', clavis: '200,180,255', restauro: '160,230,160', advoco: '180,220,255', levitas: '230,210,255', custodia: '255,220,120', phoenix: '255,180,80' };
const AKT_ICON = { zaubern: '✦', schneeball: '❄', kakao: '☕', kochen: '🔥', mut: '♥', bellen: '🐾', schnueffeln: '🐾', flucht: '↩' };
const AKT_INFO = {
  zaubern: 'Charly zaubert (kostet 2 Energie). Der richtige Zauber wirkt besonders stark.',
  schneeball: 'Charly wirft einen Schneeball (schwach, aber immer möglich).',
  kakao: 'Jörn reicht heißen Kakao: Wärme und Energie kommen zurück.',
  kochen: 'Jörn kocht am Feuer neuen Kakao: dauert 3 Runden, dann 2 Becher mehr.',
  mut: 'Jörn spricht Mut zu: Die nächsten Angriffe tun weniger weh.',
  bellen: 'Diego bellt einen Gegner an – der setzt eine Runde aus.',
  schnueffeln: 'Diego schnüffelt und verrät die Schwächen der Gegner.',
  flucht: 'Zurück ins Warme. Der Kampf endet ohne Sieger.',
};

const KB = {
  F: null, phase: null, sel: 0, evs: [], ev: null, evT: 0, t0: 0, onEnd: null, pend: null, vis: null, visW: 0, shake: 0, bg: null,

  start(gruppe, opt, onEnd) {
    this.F = kampfNeu(gruppe, opt);
    this.onEnd = onEnd; this.phase = 'intro'; this.t = 0; this.sel = 0; this.evs = []; this.ev = null; this.pend = null; this.shake = 0;
    this.vis = this.F.gegner.map(e => ({ kraft: e.kraft, alpha: 1, gone: false, erkannt: false }));
    this.visW = this.F.waerme; this.visMut = 0; this.visE = this.F.energie; this.visK = this.F.kakao; this.visKochen = false; this.visFrost = false;
  },
  akts() { return kampfAktionen(this.F); },
  lebend() { return this.F.gegner.filter((e, i) => !this.vis[i].gone && e.kraft > 0); },

  update(dt) {
    this.t += dt; if (this.shake > 0) this.shake -= dt;
    const F = this.F;
    if (this.phase === 'intro') { IN.clear(); if (this.t > 1.1) { this.phase = 'menu'; if (F.tutorial && !G.save.flags.kampf_erklaert) { G.save.flags.kampf_erklaert = true; G.say('kampf_tutorial'); } } return; }
    if (this.phase === 'menu') {
      const A = this.akts(), n = A.length;
      const mv = d => { let s = this.sel + d; if (s < 0) { s = this.sel + 2 * Math.ceil(n / 2) - 2; if (s >= n) s -= 2; } else if (s >= n) s = this.sel % 2; this.sel = s; AU.sfx('menue'); };
      if (IN.take('up')) mv(-2);
      if (IN.take('down')) mv(2);
      if (IN.take('left') || IN.take('right')) { this.sel = this.sel ^ 1; if (this.sel >= n) this.sel = n - 1; AU.sfx('menue'); }
      IN.take('b'); IN.take('menu');
      if (IN.take('a')) {
        const a = A[this.sel];
        if (!a.ok) { AU.sfx('stoss'); this.hint = { text: a.warum, t0: this.t }; return; }
        AU.sfx('menue');
        if (a.art === 'zaubern') { this.phase = 'zauber'; this.zsel = Math.max(0, F.zauber.indexOf(G.lastSpell)); return; }
        this.wahl({ art: a.art });
      }
      return;
    }
    if (this.phase === 'zauber') {
      const n = F.zauber.length + 1;
      if (IN.take('up') || IN.take('left')) { this.zsel = (this.zsel + n - 1) % n; AU.sfx('menue'); }
      if (IN.take('down') || IN.take('right')) { this.zsel = (this.zsel + 1) % n; AU.sfx('menue'); }
      if (IN.take('b') || IN.take('menu')) { AU.sfx('zurueck'); this.phase = 'menu'; return; }
      if (IN.take('a')) {
        if (this.zsel === F.zauber.length) { AU.sfx('zurueck'); this.phase = 'menu'; return; }
        G.lastSpell = F.zauber[this.zsel]; this.wahl({ art: 'zauber', z: F.zauber[this.zsel] });
      }
      return;
    }
    if (this.phase === 'ziel') {
      const L = this.lebend(), n = L.length;
      let i = Math.max(0, L.indexOf(F.gegner[this.pend.ziel]));
      if (IN.take('left') || IN.take('up')) { i = (i + n - 1) % n; AU.sfx('menue'); }
      if (IN.take('right') || IN.take('down')) { i = (i + 1) % n; AU.sfx('menue'); }
      this.pend.ziel = L[i].nr;
      if (IN.take('b') || IN.take('menu')) { AU.sfx('zurueck'); this.phase = this.pend.art === 'zauber' ? 'zauber' : 'menu'; return; }
      if (IN.take('a')) { AU.sfx('menue'); this.ausfuehren(this.pend); }
      return;
    }
    if (this.phase === 'ev') {
      this.evT += dt;
      const dur = this.ev.fx === 'weg' ? 1.0 : 1.25;
      const skip = this.evT > 0.35 && IN.take('a');
      IN.take('b');
      if (this.evT >= dur + 0.9 || skip) this.naechstesEv();
      return;
    }
    if (this.phase === 'ende') {
      if (this.t - this.endT > (F.ende === 'sieg' ? 1.8 : 0.6) || (this.t - this.endT > 0.5 && IN.take('a'))) {
        const cb = this.onEnd; this.phase = null; IN.clear(); cb(F.ende, F);
      }
    }
  },
  wahl(akt) {
    const L = this.lebend();
    if (kampfZielNoetig(akt.art) && L.length > 1) { akt.ziel = (this.pend && this.pend.ziel !== undefined && L.some(e => e.nr === this.pend.ziel)) ? this.pend.ziel : L[0].nr; this.pend = akt; this.phase = 'ziel'; return; }
    akt.ziel = L.length ? L[0].nr : 0; this.ausfuehren(akt);
  },
  ausfuehren(akt) {
    this.visFrost = false; this.evs = kampfZug(this.F, akt); this.phase = 'ev'; this.naechstesEv();
  },
  naechstesEv() {
    // Abgeschlossenes Ereignis endgültig übernehmen
    const old = this.ev;
    if (old && old.fx === 'weg') this.vis[old.ziel].gone = true;
    this.ev = this.evs.shift() || null; this.evT = 0;
    if (!this.ev) {
      if (this.F.ende) { this.phase = 'ende'; this.endT = this.t; if (this.F.ende === 'sieg') AU.sfx('sieg'); return; }
      this.visFrost = this.F.eingefroren; this.visKochen = this.F.kochen > 0;
      this.phase = 'menu'; if (this.sel >= this.akts().length) this.sel = 0;
      // Eingefroren: Auswahl gleich auf Jörn springen
      const A = this.akts(); if (!A[this.sel].ok) { const i = A.findIndex(a => a.ok); if (i >= 0) this.sel = i; }
      return;
    }
    const e = this.ev, v = e.ziel !== undefined ? this.vis[e.ziel] : null;
    // Anzeige nachziehen und Geräusch
    if (e.dmg) v.kraft = Math.max(0, v.kraft - e.dmg);
    if (e.fx === 'schnueffeln') v.erkannt = true;
    if (e.fx && e.fx.indexOf('zauber_') === 0) { this.visE = Math.max(0, this.visE - DATA.kampf.regeln.zauberKosten); AU.sfx('zauber'); if (!e.vorbei && e.dmg >= DATA.kampf.regeln.zauberSchaden) v.erkannt = true; }
    if (e.fx === 'schneeball') AU.sfx('schneeball');
    if (e.dmg) setTimeout(() => AU.sfx('treffer'), 450);
    if (e.frost) { this.visFrost = true; setTimeout(() => AU.sfx('kalt'), 400); }
    if (e.fx === 'kochen') { this.visKochen = true; AU.sfx('kochen'); }
    if (e.fx === 'kakao_fertig') { this.visKochen = false; this.visK += e.kakaoPlus; AU.sfx('kakao'); }
    if (e.fx === 'angriff') { this.visW = Math.max(0, this.visW - e.schaden); AU.sfx(e.schaden ? 'autsch' : 'stoss'); if (e.schaden) this.shake = 0.35; }
    if (e.fx === 'kakao') { this.visW += e.heil; this.visE += e.energie; this.visK--; AU.sfx('kakao'); }
    if (e.fx === 'mut') AU.sfx('mut');
    if (e.fx === 'bellen') AU.sfx('wuff');
    if (e.fx === 'schnueffeln') AU.sfx('schnueffeln');
    if (e.fx === 'weg') AU.sfx('puff');
    if (e.fx === 'kalt') AU.sfx('kalt');
    this.visMut = this.F.mut;
  },

  // --- Zeichnen ---
  backdrop() {
    if (this.bg) return this.bg;
    const c = mkCanvas(VIEW_W, VIEW_H), g = c.getContext('2d'), p = Pen(g), Rn = srand(77);
    p.vgrad(0, 0, VIEW_W, 200, '#0c1030', '#30305a', 7);
    for (let i = 0; i < 50; i++) p.px(Rn() * VIEW_W, Rn() * 130, Rn() < 0.7 ? '#c8d0f0' : '#ffffff');
    // Schlossmauer mit Fenstern
    p.r(0, 96, VIEW_W, 110, '#221c3e');
    for (let x = 0; x < VIEW_W; x += 16) { p.r(x, 86, 10, 10, '#221c3e'); p.ell(x + 5, 86, 6, 2, '#c8d4ec'); }
    p.r(0, 95, VIEW_W, 2, '#c8d4ec');
    for (let y = 104; y < 200; y += 10) for (let x = (y / 10 % 2) * 8; x < VIEW_W; x += 16) p.r(x, y, 10, 1, '#161228');
    [60, 180, 330, 450].forEach(x => { p.r(x - 7, 120, 14, 22, '#0e0a1c'); p.r(x - 5, 122, 10, 18, '#f0b050'); p.r(x - 5, 122, 10, 2, '#ffe0a0'); p.r(x - 1, 122, 2, 18, '#0e0a1c'); p.r(x - 5, 130, 10, 1, '#0e0a1c'); p.r(x - 8, 142, 16, 2, '#e8f0fc'); });
    // Tannen
    const tanne = (x, y, s) => { for (let i = 0; i < 4; i++) { const w = (8 + i * 6) * s, yy = y + i * 9 * s; p.ell(x, yy + 6 * s, w / 2, 5 * s, '#1e4a2e'); p.ell(x - 1, yy + 4 * s, w / 2 - 2, 2 * s, '#e8f0fc'); } p.r(x - 2, y + 40 * s, 4, 8 * s, '#3a2418'); };
    tanne(24, 132, 1.1); tanne(492, 128, 1.2); tanne(250, 150, 0.8);
    // Schneefläche mit Verwehungen
    p.r(0, 196, VIEW_W, VIEW_H - 196, '#d8e4f4');
    for (let x = -10; x < VIEW_W; x += 40) p.ell(x + Rn() * 20, 198 + Rn() * 6, 30, 7, '#eef4ff');
    for (let i = 0; i < 90; i++) p.px(Rn() * VIEW_W, 210 + Rn() * 60, Rn() < 0.5 ? '#c4d2e8' : '#ffffff');
    p.ell(130, 252, 110, 10, '#c8d6ea'); p.ell(385, 250, 110, 10, '#c8d6ea');
    return (this.bg = c);
  },
  // Positionen (Füße) der Gruppe und der Gegner
  partyPos() {
    const F = this.F, L = [{ k: 'charly', x: 96, y: 250 }];
    if (F.joern) L.unshift({ k: 'joern', x: 34, y: 236 });
    if (F.diego) L.push({ k: 'diego', x: 150, y: 260 });
    return L;
  },
  foePos(i) {
    const n = this.F.gegner.length;
    if (n === 1) return { x: 360, y: 246 };
    return [{ x: 310, y: 232 }, { x: 408, y: 254 }, { x: 360, y: 214 }][i] || { x: 360, y: 240 };
  },
  draw(time) {
    const c = R.ctx, F = this.F, e = this.ev, k = e ? Math.min(1, this.evT / 0.9) : 0;
    let sx = 0, sy = 0;
    if (this.shake > 0) { sx = Math.round((Math.random() - 0.5) * 6); sy = Math.round((Math.random() - 0.5) * 4); }
    c.save(); c.translate(sx, sy);
    c.drawImage(this.backdrop(), 0, 0);
    const party = this.partyPos(), ch = party.find(q => q.k === 'charly');
    // Gruppe
    const flucht = F.ende === 'flucht' && (this.phase === 'ende' || (e && e.fx === 'flucht')) ? Math.min(1, (this.phase === 'ende' ? 1 : k)) * 140 : 0;
    party.forEach(q => {
      const dog = q.k === 'diego', w = 64, h = dog ? 64 : 80;
      let x = q.x - flucht, y = q.y - h + (dog ? 4 : 2);
      const aktiv = e && e.wer === q.k && this.evT < 0.5;
      if (q.k === 'joern' && this.visKochen) { y += 10; this.feuer(q.x + 2, q.y + 6, time); }
      if (aktiv) y -= Math.round(Math.sin(this.evT / 0.5 * Math.PI) * 6);
      c.fillStyle = 'rgba(40,50,90,0.25)'; c.beginPath(); c.ellipse(q.x - flucht + 32, q.y, dog ? 22 : 18, 5, 0, 0, 6.283); c.fill();
      const pose = dog && e && e.fx === 'schnueffeln' ? 'schnueffeln' : null;
      const fr = this.phase === 'menu' && q.k === 'charly' ? 0 : (aktiv ? 1 : 0);
      c.drawImage(SPR.get(q.k, 'right', fr, pose), x, y, w, h);
      if (q.k === 'charly') this.stab(x, y, time);
      // Charly getroffen: kurz eisblau
      if (q.k === 'charly' && e && e.fx === 'angriff' && e.schaden && this.evT > 0.45 && this.evT < 0.85) { c.globalAlpha = 0.45; c.fillStyle = '#9cd8ff'; c.fillRect(x + 18, y + 14, 28, 62); c.globalAlpha = 1; }
    });
    // Eingefroren: Charly steckt in einem Eisblock
    if (this.visFrost) {
      const x = ch.x - flucht + 12, y = ch.y - 80;
      c.globalAlpha = 0.38; c.fillStyle = '#bfe8ff'; c.fillRect(x, y, 42, 80); c.globalAlpha = 0.9;
      c.fillStyle = '#ffffff'; c.fillRect(x, y, 42, 2); c.fillRect(x, y, 2, 80); c.fillRect(x + 6, y + 8, 2, 14); c.fillRect(x + 30, y + 40, 2, 10);
      c.fillStyle = '#7ab8e8'; c.fillRect(x + 40, y, 2, 80); c.fillRect(x, y + 78, 42, 2); c.globalAlpha = 1;
      R.text('❄', x + 21, y - 4, { size: 14, align: 'center', color: '#bfe8ff' });
    }
    // Schutzschimmer durch Jörns Mut
    if (this.visMut > 0 || (e && e.fx === 'mut')) {
      const a = e && e.fx === 'mut' ? Math.min(1, this.evT * 2) : 0.5;
      c.globalAlpha = a * (0.55 + 0.2 * Math.sin(time * 5)); c.strokeStyle = '#ffd36a'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(ch.x + 32, ch.y - 36, 30, 44, 0, 0, 6.283); c.stroke(); c.lineWidth = 1; c.globalAlpha = 1;
    }
    // Gegner
    F.gegner.forEach((g, i) => {
      const v = this.vis[i]; if (v.gone) return;
      const P = this.foePos(i), T = DATA.kampf.gegner[g.id];
      let x = P.x, y = P.y - 80, alpha = 1;
      if (g.id === 'schneepixie') y -= 14 + Math.round(Math.sin(time * 3 + i) * 4);
      const meins = e && e.ziel === i;
      if (meins && e.vorbei) x += Math.round(Math.sin(Math.min(1, this.evT / 0.7) * Math.PI) * 26);
      if (meins && e.dmg && this.evT > 0.45 && this.evT < 0.9) x += Math.round(Math.sin(this.evT * 60) * 3);
      if (e && e.fx === 'angriff' && e.von === i && this.evT < 0.5) x -= Math.round(Math.sin(this.evT / 0.5 * Math.PI) * 22);
      if (meins && e.fx === 'bellen') x += Math.round(Math.sin(this.evT * 40) * 2);
      if (meins && e.fx === 'weg') alpha = Math.max(0, 1 - this.evT / 0.8);
      const fr = Math.floor(time * (g.id === 'schneepixie' ? 8 : 3) + i) % 2;
      c.fillStyle = 'rgba(40,50,90,0.25)'; c.beginPath(); c.ellipse(P.x + 32, P.y, 18, 5, 0, 0, 6.283); c.fill();
      c.globalAlpha = alpha; c.drawImage(FOE_SPR.get(g.id, fr), x, y, 64, 80);
      if (meins && e.dmg && this.evT > 0.45 && this.evT < 0.6) { c.globalCompositeOperation = 'lighter'; c.drawImage(FOE_SPR.get(g.id, fr), x, y, 64, 80); c.globalCompositeOperation = 'source-over'; }
      c.globalAlpha = 1;
      if (meins && e.fx === 'weg') for (let s = 0; s < 14; s++) { const a = s / 14 * 6.283, r = this.evT * 60; c.fillStyle = '#ffffff'; c.globalAlpha = Math.max(0, 1 - this.evT); c.fillRect(P.x + 32 + Math.cos(a) * r, P.y - 40 + Math.sin(a) * r, 2, 2); c.globalAlpha = 1; }
      if (g.aus > 0 && !(meins && e.fx === 'weg') && this.phase !== 'ev') this.sterne(P.x + 32, y + 6, time);
      // Namensschild mit Kraft
      if (alpha > 0.3) {
        const nx = P.x + 32, ny = (g.id === 'schneepixie' ? P.y - 104 : P.y - 90);
        c.font = '700 10px ' + R.FONT; const tw = Math.max(54, c.measureText(T.name).width + 12);
        c.fillStyle = 'rgba(20,14,30,0.8)'; c.fillRect(nx - tw / 2, ny - 11, tw, 20);
        R.text(T.name, nx, ny - 1, { size: 10, align: 'center', weight: 700, color: '#eef4ff' });
        for (let p = 0; p < g.max; p++) { c.fillStyle = p < v.kraft ? '#9cd8ff' : '#3a4060'; c.fillRect(nx - g.max * 4 + p * 8 + 1, ny + 3, 6, 3); }
        if (v.erkannt) R.text('Schwäche: ' + DATA.zauber[T.schwaeche].name, nx, ny + 19, { size: 9, align: 'center', weight: 700, color: '#ffd36a' });
      }
    });
    if (e) this.effekt(e, k, time, ch);
    // Zielauswahl
    if (this.phase === 'ziel') {
      const P = this.foePos(this.pend.ziel), bob = Math.round(Math.sin(time * 8) * 3);
      const top = this.F.gegner[this.pend.ziel].id === 'schneepixie' ? P.y - 124 : P.y - 110;
      R.text('▼', P.x + 32, top + bob, { size: 16, align: 'center', color: '#ffd36a', weight: 700 });
    }
    // Kälte legt sich über alles
    if (e && e.fx === 'kalt') { c.fillStyle = 'rgba(210,235,255,' + (0.6 * k).toFixed(2) + ')'; c.fillRect(0, 0, VIEW_W, VIEW_H); }
    c.restore();
    UI.snowfall(time);
    this.leiste(time);
    if (this.phase === 'intro') this.wirbel(Math.min(1, this.t / 1.1));
    if (this.phase === 'ende' && F.ende === 'sieg') {
      const a = Math.min(1, (this.t - this.endT) * 3);
      c.globalAlpha = a; R.panel(156, 96, 200, 46); R.text('Gewonnen!', VIEW_W / 2, 127, { size: 22, weight: 700, serif: true, align: 'center', color: '#ffd36a' }); c.globalAlpha = 1;
    }
  },
  sterne(x, y, time) {
    for (let i = 0; i < 3; i++) { const a = time * 3 + i * 2.09; R.text('★', x + Math.cos(a) * 12, y + Math.sin(a) * 3, { size: 9, align: 'center', color: '#ffe080', shadow: false }); }
  },
  // Wirbelnder Frost beim Kampfbeginn
  wirbel(k) {
    const c = R.ctx, a = k < 0.5 ? k * 2 : (1 - k) * 2;
    c.fillStyle = 'rgba(230,244,255,' + (a * 0.9).toFixed(2) + ')';
    for (let i = 0; i < 12; i++) {
      const ang = i / 12 * 6.283 + k * 6, r = 40 + k * 260;
      c.beginPath(); c.moveTo(VIEW_W / 2, VIEW_H / 2); c.arc(VIEW_W / 2, VIEW_H / 2, r, ang, ang + 0.26 * a + 0.02); c.fill();
    }
  },
  // Zauberstab in Charlys Hand; beim Zaubern erhoben, Funken sprühen aus der Spitze
  stabSpitze() {
    const e = this.ev, hebt = this.phase === 'zauber' || this.phase === 'ziel' && this.pend && this.pend.art === 'zauber' || (e && e.fx && e.fx.indexOf('zauber_') === 0 && this.evT < 0.9);
    const ch = this.partyPos().find(q => q.k === 'charly'), hx = ch.x + 50, hy = ch.y - 34;
    return { hx, hy, x: hx + (hebt ? 14 : 20), y: hy - (hebt ? 30 : 14), hebt };
  },
  stab(x0, y0, time) {
    const c = R.ctx, S = this.stabSpitze(), p = Pen(c);
    if (this.visFrost) return;
    // Stab: dunkles Holz mit hellem Griff
    p.line(S.hx - 1, S.hy + 1, S.x - 1, S.y + 1, '#2a160c'); p.line(S.hx, S.hy, S.x, S.y, '#6a3e22'); p.line(S.hx + 1, S.hy, S.x + 1, S.y, '#8a5632'); p.line(S.hx + 1, S.hy - 1, S.x + 1, S.y - 1, '#a86d40');
    // Hand
    p.r(S.hx - 3, S.hy - 2, 6, 6, '#3a2a1e'); p.r(S.hx - 2, S.hy - 1, 4, 4, '#f6d2b6'); p.r(S.hx - 2, S.hy + 2, 4, 1, '#e2ae8e');
    // Glimmen an der Spitze
    const gl = S.hebt ? 1 : 0.35 + 0.15 * Math.sin(time * 4);
    const g = c.createRadialGradient(S.x, S.y, 0, S.x, S.y, S.hebt ? 12 : 6); g.addColorStop(0, 'rgba(255,244,190,' + gl + ')'); g.addColorStop(1, 'rgba(255,244,190,0)');
    c.fillStyle = g; c.fillRect(S.x - 12, S.y - 12, 24, 24); p.r(S.x - 1, S.y - 1, 2, 2, '#fffbe8');
    if (S.hebt) for (let i = 0; i < 8; i++) {
      const k = ((time * 1.6) + i / 8) % 1, a = i * 2.4 + time;
      c.globalAlpha = 1 - k; c.fillStyle = i % 2 ? '#ffd36a' : '#ffffff';
      c.fillRect(S.x + Math.cos(a) * k * 16, S.y + Math.sin(a) * k * 16 - k * 6, 2, 2);
    }
    c.globalAlpha = 1;
  },
  // Lagerfeuer mit Kanne, an dem Jörn Kakao kocht
  feuer(x, y, time) {
    const c = R.ctx, p = Pen(c);
    p.r(x - 12, y - 2, 24, 4, '#5a3420'); p.r(x - 10, y - 4, 20, 3, '#7a4a2a');
    for (let i = 0; i < 6; i++) { const h = 6 + ((Math.sin(time * 12 + i * 2) + 1) * 4 | 0); p.r(x - 8 + i * 3, y - 4 - h, 3, h, i % 2 ? '#ff8a2a' : '#ffd36a'); }
    p.r(x - 7, y - 26, 14, 10, '#6a6a7a'); p.r(x - 7, y - 26, 14, 2, '#9a9aaa'); p.r(x + 7, y - 24, 4, 2, '#6a6a7a'); p.r(x - 9, y - 30, 18, 1, '#3a3a44');
    for (let i = 0; i < 3; i++) { const k = (time * 0.7 + i / 3) % 1; c.globalAlpha = 0.6 * (1 - k); c.fillStyle = '#ffffff'; c.fillRect(x - 3 + i * 3 + Math.sin(k * 6) * 2, y - 30 - k * 18, 2, 3); }
    c.globalAlpha = 1;
    const g = c.createRadialGradient(x, y - 6, 0, x, y - 6, 34); g.addColorStop(0, 'rgba(255,170,80,0.35)'); g.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = g; c.fillRect(x - 34, y - 40, 68, 68);
  },
  effekt(e, k, time, ch) {
    const c = R.ctx, S = this.stabSpitze(), hx = S.x, hy = S.y;
    const ziel = e.ziel !== undefined ? this.foePos(e.ziel) : null;
    const tx = ziel ? ziel.x + 32 + (e.vorbei ? 0 : 0) : 0, ty = ziel ? ziel.y - 44 - (this.F.gegner[e.ziel] && this.F.gegner[e.ziel].id === 'schneepixie' ? 14 : 0) : 0;
    if (e.fx === 'schneeball' && k < 1) {
      const t = Math.min(1, this.evT / 0.5), x = hx + (tx - hx) * t, y = hy + (ty - hy) * t - Math.sin(t * Math.PI) * 40;
      if (t < 1) { Pen(c).circ(x, y, 4, '#ffffff'); c.fillStyle = '#c8d8ec'; c.fillRect(x - 1, y + 2, 3, 1); }
      else for (let i = 0; i < 8; i++) { c.fillStyle = '#ffffff'; c.globalAlpha = 1 - k; c.fillRect(tx + Math.cos(i) * k * 30, ty + Math.sin(i * 1.7) * k * 20, 2, 2); c.globalAlpha = 1; }
    }
    if (e.fx && e.fx.indexOf('zauber_') === 0) {
      const z = e.fx.slice(7), col = SPELL_COL[z] || '255,255,255', t = Math.min(1, this.evT / 0.45);
      // Funkenstrahl
      for (let i = 0; i < 10; i++) {
        const s = Math.max(0, t - i * 0.04), x = hx + (tx - hx) * s, y = hy + (ty - hy) * s + Math.sin(s * 9 + i) * 6;
        c.fillStyle = 'rgba(' + col + ',' + (1 - i / 10).toFixed(2) + ')'; c.fillRect(x - 1, y - 1, 3, 3);
      }
      if (this.evT > 0.45) {
        const a = Math.max(0, 1 - (this.evT - 0.45) / 0.6);
        const gr = c.createRadialGradient(tx, ty, 0, tx, ty, z === 'luxa' ? 90 : 50);
        gr.addColorStop(0, 'rgba(' + col + ',' + (0.9 * a).toFixed(2) + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
        c.fillStyle = gr; c.fillRect(tx - 90, ty - 90, 180, 180);
        if (z === 'luxa' && !e.vorbei) { c.fillStyle = 'rgba(255,250,220,' + (0.5 * a).toFixed(2) + ')'; c.fillRect(0, 0, VIEW_W, VIEW_H); }
        if (z === 'flammula') for (let i = 0; i < 12; i++) { const fy = ty + 20 - ((this.evT * 60 + i * 9) % 50); c.fillStyle = i % 2 ? 'rgba(255,200,80,' + a + ')' : 'rgba(255,110,40,' + a + ')'; c.fillRect(tx - 18 + (i * 7) % 36, fy, 3, 4); }
      }
    }
    if (e.fx === 'angriff') {
      const P = this.foePos(e.von), sxx = P.x + 10, syy = P.y - 44, t = Math.min(1, Math.max(0, (this.evT - 0.15) / 0.4));
      if (t > 0 && t < 1) for (let i = 0; i < 5; i++) { const s = Math.max(0, t - i * 0.06); c.fillStyle = i % 2 ? '#ffffff' : '#9cd8ff'; c.fillRect(sxx + (hx - 10 - sxx) * s, syy + (hy - syy) * s + (i - 2) * 4, 4, 2); }
      if (e.schaden && this.evT > 0.5) R.text('−' + e.schaden, ch.x + 32, ch.y - 84 - this.evT * 16, { size: 14, align: 'center', weight: 700, color: '#9cd8ff' });
    }
    if (e.fx === 'kakao') {
      const p = Pen(c), x = ch.x + 40, y = ch.y - 96;
      p.r(x, y, 10, 9, '#f4ead8'); p.r(x + 1, y + 1, 8, 2, '#7a4a2a'); p.r(x + 10, y + 2, 2, 4, '#f4ead8');
      for (let i = 0; i < 3; i++) { c.globalAlpha = 0.6; c.fillStyle = '#ffffff'; c.fillRect(x + 2 + i * 3, y - 4 - ((this.evT * 14 + i * 4) % 10), 1, 3); c.globalAlpha = 1; }
      if (e.heil) R.text('+' + e.heil, x + 26, y + 2 - this.evT * 14, { size: 14, weight: 700, color: '#ffb060' });
    }
    if (e.fx === 'kakao_fertig') { const j = this.partyPos().find(q => q.k === 'joern'); if (j) R.text('+' + e.kakaoPlus + ' ☕', j.x + 32, j.y - 90 - this.evT * 14, { size: 14, weight: 700, color: '#ffb060', align: 'center' }); }
    if (e.fx === 'kakao' && e.energie) R.text('+' + e.energie + ' ✦', ch.x + 66, ch.y - 80 - this.evT * 14, { size: 13, weight: 700, color: '#9cd8ff' });
    if (e.fx === 'bellen') {
      const d = this.partyPos().find(q => q.k === 'diego');
      if (d) R.text('WUFF!', d.x + 46 + Math.sin(this.evT * 30) * 2, d.y - 62, { size: 14, weight: 700, color: '#fff2b0', align: 'center' });
    }
    if (e.fx === 'schnueffeln' && ziel) R.text('?', tx - 40, ty - 40 - Math.sin(this.evT * 6) * 4, { size: 18, weight: 700, color: '#ffd36a', align: 'center' });
    if (e.fx === 'aus' && ziel) this.sterne(tx, ty - 34, time);
  },
  // Untere Leiste: Wärme links, Auswahl oder Meldung rechts
  leiste(time) {
    const c = R.ctx, F = this.F, x0 = 6, y0 = 270;
    R.panel(x0, y0, VIEW_W - 12, VIEW_H - y0 - 6, 0.95);
    // Wärme und Energie
    R.text('Charly', 20, y0 + 18, { size: 13, weight: 700, color: '#ffd36a' });
    if (F.joern) R.text('☕ Kakao: ' + this.visK, 178, y0 + 18, { size: 11, weight: 700, color: this.visK ? '#e8c8a0' : '#8a7070', align: 'right' });
    const bar = (y, v, max, col, leer, label) => {
      const w = 158, fx = 20; v = clamp(v, 0, max);
      c.fillStyle = '#2a2440'; c.fillRect(fx, y, w, 9);
      c.fillStyle = v / max <= 0.3 ? leer : col; c.fillRect(fx, y, Math.round(w * v / max), 9);
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(fx, y, Math.round(w * v / max), 2);
      R.text(label + ' ' + v + ' / ' + max, fx, y + 22, { size: 11, weight: 700, color: v / max <= 0.3 ? leer : '#f4ead8' });
    };
    const gr = c.createLinearGradient(20, 0, 178, 0); gr.addColorStop(0, '#e0442a'); gr.addColorStop(0.6, '#ff8a2a'); gr.addColorStop(1, '#ffd36a');
    bar(y0 + 26, this.visW, F.max, gr, '#9cc0f0', '🔥 Wärme');
    const gb = c.createLinearGradient(20, 0, 178, 0); gb.addColorStop(0, '#4a5ad8'); gb.addColorStop(1, '#9cd8ff');
    bar(y0 + 60, this.visE, F.emax, gb, '#b090e0', '✦ Energie');
    const st = this.visFrost ? ['❄ Charly ist eingefroren!', '#9cd8ff'] : this.visKochen ? ['🔥 Jörn kocht Kakao …', '#ffb060'] : this.visMut > 0 ? ['♥ Jörns Mut schützt', '#ffd36a'] : null;
    if (st) R.text(st[0], 20, y0 + 100, { size: 11, weight: 700, color: st[1] });
    c.fillStyle = 'rgba(224,154,44,0.4)'; c.fillRect(190, y0 + 10, 1, VIEW_H - y0 - 26);
    const rx = 202, rw = VIEW_W - rx - 16;
    if (this.phase === 'menu') {
      const A = this.akts(), sel = A[this.sel];
      A.forEach((a, i) => {
        const col = i % 2, row = i >> 1, bx = rx + col * (rw / 2), by = y0 + 8 + row * 18, on = i === this.sel;
        if (on) { c.fillStyle = 'rgba(224,154,44,0.2)'; c.fillRect(bx - 4, by, rw / 2 - 4, 17); }
        const wc = { charly: '#ffd36a', joern: '#9ae07a', diego: '#e8b878' }[a.wer];
        R.text(AKT_ICON[a.art] + ' ' + a.label, bx + 2, by + 13, { size: 12, weight: on ? 700 : 600, color: !a.ok ? '#6a6070' : on ? wc : '#f4ead8' });
      });
      const info = this.hint && this.t - this.hint.t0 < 2.5 ? this.hint.text : ({ charly: 'Charly: ', joern: 'Jörn: ', diego: 'Diego: ' }[sel.wer] + AKT_INFO[sel.art]);
      R.wrap(info, rw, 9, 600).slice(0, 2).forEach((l, i) => R.text(l, rx, y0 + 88 + i * 11, { size: 9, weight: 600, color: '#c8b898' }));
    } else if (this.phase === 'zauber') {
      R.text('Welchen Zauber wirkt Charly?', rx, y0 + 18, { size: 12, weight: 700, color: '#ffd36a' });
      const opts = F.zauber.map(z => DATA.zauber[z].name + ' – ' + DATA.zauber[z].wirkung).concat(['Zurück']);
      opts.forEach((o, i) => {
        const col = i % 2, row = i >> 1, bx = rx + col * (rw / 2), by = y0 + 26 + row * 19, on = i === this.zsel;
        if (on) { c.fillStyle = 'rgba(224,154,44,0.2)'; c.fillRect(bx - 4, by - 1, rw / 2 - 4, 18); }
        R.text((on ? '▸ ' : '  ') + o, bx, by + 12, { size: 11, weight: on ? 700 : 500, color: on ? '#ffd36a' : '#f4ead8' });
      });
    } else if (this.phase === 'ziel') {
      R.text('Wen soll es treffen?', rx, y0 + 30, { size: 13, weight: 700, color: '#ffd36a' });
      R.text('◀ ▶ Gegner wählen · A: los · B: zurück', rx, y0 + 52, { size: 11, weight: 600, color: '#c8b898' });
    } else if (this.ev) {
      const name = this.ev.wer ? DATA.characters[this.ev.wer].name : '';
      if (name) R.text(name, rx, y0 + 20, { size: 12, weight: 700, color: '#ffd36a' });
      R.wrap(this.ev.text, rw, 13, 500).slice(0, 4).forEach((l, i) => R.text(l, rx, y0 + (name ? 40 : 24) + i * 18, { size: 13, weight: 500, color: '#f8f0e0' }));
      if (this.evT > 0.35 && Math.floor(time * 3) % 2) { c.fillStyle = '#ffd36a'; c.fillRect(VIEW_W - 30, VIEW_H - 22, 9, 3); c.fillRect(VIEW_W - 28, VIEW_H - 19, 5, 2); }
    } else if (this.phase === 'intro') {
      R.text('Achtung – Gefahr im Schnee!', rx, y0 + 30, { size: 14, weight: 700, color: '#9cd8ff' });
    }
  },
};
