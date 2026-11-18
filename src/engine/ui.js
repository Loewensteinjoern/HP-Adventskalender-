// ===== Titelbild, Menü, Questlog, Phönixlied, Code-Fenster =====
const PHOENIX = [
  '...........o...........',
  '..........ooo..........',
  '.y.......ooYoo.......y.',
  '.yy......oYYYo......yy.',
  '..yyy....oYWYo....yyy..',
  '..yyyyy...YYY...yyyyy..',
  '...yyyyyyyYYYyyyyyyy...',
  '....yyyyyyYYYyyyyyy....',
  '......yyyyYYYyyyy......',
  '.........oYYYo.........',
  '..........oYo..........',
  '.........o.o.o.........',
  '........o..o..o........',
  '.......o...o...o.......',
];
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const UI = {
  snow: [], sel: 0, scroll: 0, toastMsg: null, toastT: 0,
  init() {
    for (let i = 0; i < 90; i++) this.snow.push({ x: Math.random() * VIEW_W, y: Math.random() * VIEW_H, s: 0.4 + Math.random() * 1.2, w: Math.random() * 6 });
    const R0 = srand(5); this.stars = []; for (let i = 0; i < 60; i++) this.stars.push([R0() * VIEW_W, R0() * 150, R0()]);
    const R1 = srand(11); this.windows = []; for (let i = 0; i < 40; i++) this.windows.push([R1(), R1(), R1()]);
  },
  toast(msg) { this.toastMsg = msg; this.toastT = 4.5; },

  // --- Titelbild ---
  title(G, time, opts) {
    const c = R.ctx, p = Pen(c);
    p.vgrad(0, 0, VIEW_W, VIEW_H, '#0a0c24', '#2a2450', 8);
    this.stars.forEach(([x, y, k]) => { c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(time * (0.5 + k) + k * 9)); c.fillStyle = '#eef4ff'; c.fillRect(x | 0, y | 0, 1, 1); });
    c.globalAlpha = 1;
    const mg = c.createRadialGradient(430, 58, 0, 430, 58, 50); mg.addColorStop(0, 'rgba(244,240,208,0.18)'); mg.addColorStop(1, 'rgba(244,240,208,0)'); c.fillStyle = mg; c.fillRect(380, 8, 100, 100); p.circ(430, 58, 16, '#f4f0d0'); p.circ(436, 54, 14, '#e8e4c4');
    this.castle(time);
    p.r(0, 296, VIEW_W, 88, '#d8e4f4'); p.r(0, 296, VIEW_W, 3, '#eef4ff');
    for (let x = 0; x < VIEW_W; x += 23) p.ell(x, 298, 14, 4, '#eef4ff');
    // Phönix
    const s = 3, bx = VIEW_W / 2 - PHOENIX[0].length * s / 2, by = 46 + Math.sin(time * 1.5) * 3;
    const gl = c.createRadialGradient(VIEW_W / 2, by + 20, 0, VIEW_W / 2, by + 20, 60);
    gl.addColorStop(0, 'rgba(255,190,90,0.35)'); gl.addColorStop(1, 'rgba(255,190,90,0)'); c.fillStyle = gl; c.fillRect(VIEW_W / 2 - 60, by - 40, 120, 120);
    const PC = { o: '#ff8a2a', y: '#ffd36a', Y: '#fff2b0', W: '#ffffff' }, flap = Math.sin(time * 3) > 0.6 ? 1 : 0;
    PHOENIX.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === '.') continue; const wing = ch === 'y' && (x < 8 || x > 14); c.fillStyle = PC[ch]; c.fillRect(bx + x * s, by + (y - (wing ? flap : 0)) * s, s, s); } });
    R.text('Die Reise zum', VIEW_W / 2, 112, { size: 18, serif: true, align: 'center', color: '#e8dcc4', weight: 400 });
    R.text('Winterphönix', VIEW_W / 2, 150, { size: 40, serif: true, align: 'center', color: '#ffd36a', weight: 700, shadowCol: '#7a3a10' });
    this.snowfall(time);
    // Auswahl nebeneinander im Schnee, damit das Schloss frei bleibt
    c.font = '700 14px ' + R.FONT;
    const ws = opts.map(o => c.measureText(o.label).width + 26), gap = 10, tot = ws.reduce((x, y) => x + y, 0) + gap * (opts.length - 1);
    let ox = (VIEW_W - tot) / 2;
    opts.forEach((o, i) => {
      const on = i === this.sel, w = ws[i];
      c.fillStyle = on ? '#2a1e40' : 'rgba(42,30,64,0.12)'; c.fillRect(ox, 309, w, 24);
      if (on) { c.fillStyle = '#e09a2c'; c.fillRect(ox, 309, w, 2); c.fillRect(ox, 331, w, 2); }
      R.text(o.label, ox + w / 2, 326, { size: 14, align: 'center', weight: on ? 700 : 600, color: on ? '#ffd36a' : '#3a2a50', shadow: on });
      ox += w + gap;
    });
    const info = G.day > 0 ? 'Heute ist der ' + G.day + '. Dezember – Türchen ' + G.day + ' ist offen.' : 'Noch ' + G.daysLeft() + (G.daysLeft() === 1 ? ' Tag' : ' Tage') + ' bis zum ersten Türchen.';
    R.text(info, VIEW_W / 2, 352, { size: 12, align: 'center', color: '#3a2a50', weight: 600, shadow: false });
    R.text(WATERMARK, VIEW_W / 2, 369, { size: 8, align: 'center', color: '#5a5070', weight: 500, shadow: false });
    R.text('Version ' + DATA.welt.version, VIEW_W / 2, 380, { size: 7, align: 'center', color: '#7a7090', weight: 500, shadow: false });
    this.testBadge(G);
  },
  // --- Schloss Løvestein: runde Türme, Schneedächer, Wimpel, Lichterketten ---
  castleImg: null, castleWin: null, castleTips: null,
  buildCastle() {
    const c = mkCanvas(VIEW_W, 300), p = Pen(c.getContext('2d')), R = srand(42), win = [], tips = [], chainPts = [];
    const BODY = ['#110d22', '#16122a', '#1c1734', '#221c40', '#272048', '#221c40', '#19142e'];
    const roofC = ['#2a1a40', '#3a2458', '#4a2e6a'];
    const wall = (x, w, top) => {
      p.r(x, top, w, 300 - top, '#18132c');
      for (let xx = x; xx < x + w; xx += 9) { p.r(xx, top - 6, 6, 6, '#18132c'); p.r(xx, top - 7, 6, 2, '#e8f0fc'); }
      p.r(x, top, w, 2, '#d8e4f4');
      for (let yy = top + 8; yy < 290; yy += 9) for (let xx = x + 2 + ((yy / 9) % 2) * 6; xx < x + w - 4; xx += 12) p.r(xx, yy, 6, 1, '#120e22');
    };
    // Rundturm: Zylinder mit Schattierung, Kegeldach mit Schnee, Fenster, Wimpel
    const tower = (cx, w, h, roofH, opt) => {
      opt = opt || {}; const base = opt.base || 300, top = base - h, x0 = Math.round(cx - w / 2);
      for (let i = 0; i < w; i++) { const t = i / (w - 1), k = Math.min(BODY.length - 1, Math.floor(Math.sin(t * Math.PI) * (BODY.length - 1) * 0.9 + t * 2)); p.r(x0 + i, top, 1, h, BODY[k]); }
      for (let yy = top + 7; yy < base - 2; yy += 8) for (let i = ((yy / 8) % 2) * 5; i < w; i += 10) p.r(x0 + i, yy, 1, 4, 'rgba(0,0,0,0.25)');
      // Erker-Kranz unter dem Dach
      for (let i = -2; i < w + 2; i += 4) { p.r(x0 + i, top - 2, 3, 5, '#1c1634'); p.px(x0 + i + 1, top + 3, '#120e22'); }
      // Kegeldach
      const brim = w + 8;
      for (let r = 0; r < roofH; r++) {
        const ww = Math.max(1, Math.round(brim * (r + 1) / roofH)), xx = Math.round(cx - ww / 2), y = top - roofH + r;
        p.r(xx, y, ww, 1, roofC[1]); p.r(xx, y, Math.max(1, Math.round(ww * 0.3)), 1, roofC[0]); p.r(xx + Math.round(ww * 0.62), y, Math.max(1, Math.round(ww * 0.2)), 1, roofC[2]);
        if (r < roofH * 0.35 || (r % 5 === 0 && R() < 0.6)) { p.r(xx + 1, y, Math.max(1, ww - 2), 1, r < roofH * 0.35 ? '#e8f0fc' : '#c8d4ec'); }
      }
      for (let i = 0; i < brim; i += 3) p.r(Math.round(cx - brim / 2) + i, top - 1, 2, 2 + ((i * 7) % 3), '#e8f0fc');
      tips.push([cx, top - roofH, opt.flag || '#e09a2c', R() * 6]);
      if (opt.chain) chainPts.push([cx, top, w]);
      // Fenster: Bogenfenster in Etagen, oben ein Rundfenster
      p.circ(cx, top + 9, 3, '#0e0a1c'); win.push([cx - 1, top + 8, 3, 3, R()]);
      for (let yy = top + 20; yy < base - 14; yy += 22) {
        const n = w > 34 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          const wx = n === 1 ? cx - 2 : cx - w / 4 + k * w / 2 - 2;
          p.r(wx - 1, yy - 1, 6, 9, '#0e0a1c'); p.r(wx, yy - 2, 4, 1, '#0e0a1c');
          if (R() < 0.7) win.push([wx, yy, 4, 7, R()]);
        }
      }
      if (opt.balkon) { const by = top + opt.balkon; p.r(x0 - 4, by, w + 8, 3, '#2e2652'); for (let i = -3; i < w + 4; i += 3) p.r(x0 + i, by - 4, 1, 4, '#2e2652'); p.r(x0 - 4, by - 5, w + 8, 1, '#3a3060'); p.r(x0 - 4, by - 6, w + 8, 1, '#e8f0fc'); }
    };
    // Hintere Mauern
    wall(60, 400, 250);
    wall(200, 112, 234);
    // Torbogen mit warmem Licht
    p.ell(256, 272, 14, 14, '#0e0a1c'); p.r(242, 272, 28, 28, '#0e0a1c');
    win.push([245, 272, 22, 26, 0.5, 'tor']);
    // Türme von hinten nach vorn
    tower(208, 26, 90, 26, { base: 292, flag: '#4f6b2a', chain: 1 });
    tower(304, 26, 96, 28, { base: 292, flag: '#22747a', chain: 1 });
    tower(256, 40, 92, 30, { base: 292, balkon: 30, flag: '#e09a2c', chain: 1 });
    tower(150, 32, 84, 28, { flag: '#b8322a', chain: 1 });
    tower(362, 34, 90, 30, { flag: '#7a4a8a', chain: 1 });
    tower(86, 40, 110, 38, { balkon: 30, flag: '#e09a2c', chain: 1 });
    tower(426, 36, 98, 34, { flag: '#4f6b2a', chain: 1 });
    // kleine Ecktürmchen
    tower(110, 14, 22, 14, { base: 246, flag: '#e8c050' });
    tower(402, 14, 20, 12, { base: 262, flag: '#e8c050' });
    tower(40, 20, 56, 20, { flag: '#22747a' });
    tower(476, 20, 64, 22, { flag: '#b8322a' });
    // Schornstein auf der Mauer
    p.r(326, 222, 8, 12, '#18132c'); p.r(325, 220, 10, 3, '#e8f0fc');
    this.chimney = [330, 216];
    this.chains = chainPts.sort((u, v) => u[0] - v[0]);
    this.castleImg = c; this.castleWin = win; this.castleTips = tips;
  },
  castle(time) {
    if (!this.castleImg) this.buildCastle();
    const c = R.ctx;
    c.drawImage(this.castleImg, 0, 0);
    // Fenster flackern warm
    this.castleWin.forEach(([x, y, w, h, k, kind]) => {
      if (kind === 'tor') { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,190,90,0.15)'); g.addColorStop(1, 'rgba(255,170,70,0.75)'); c.fillStyle = g; c.fillRect(x, y, w, h); return; }
      c.globalAlpha = 0.75 + 0.25 * Math.sin(time * (1.5 + k) + k * 30);
      c.fillStyle = k < 0.5 ? '#ffcf6a' : '#f0a040'; c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(255,240,190,0.9)'; c.fillRect(x, y, 1, Math.min(2, h));
    });
    c.globalAlpha = 1;
    // Wimpel im Wind
    this.castleTips.forEach(([x, y, col, ph]) => {
      c.fillStyle = '#c8c0d8'; c.fillRect(x, y - 9, 1, 10);
      const wv = Math.sin(time * 4 + ph);
      c.fillStyle = col;
      for (let i = 0; i < 7; i++) { const hh = Math.max(1, 4 - Math.floor(i / 2)); c.fillRect(x + 1 + i, y - 9 + Math.round(Math.sin(time * 5 + ph + i * 0.7) * (i / 4)) + (wv > 0 && i > 3 ? 1 : 0), 1, hh); }
    });
    // Lichterketten zwischen den Türmen
    const chains = [];
    for (let i = 0; i + 1 < this.chains.length; i++) { const [a1, t1, w1] = this.chains[i], [a2, t2, w2] = this.chains[i + 1]; chains.push([a1 + w1 / 2, t1 + 10, a2 - w2 / 2, t2 + 10]); }
    const cols = ['#ff5a4a', '#ffd36a', '#6ab0ff', '#7ae08a', '#ff9ad0'];
    chains.forEach(([x1, y1, x2, y2], ci) => {
      for (let i = 0; i <= 10; i++) {
        const t = i / 10, x = Math.round(x1 + (x2 - x1) * t), y = Math.round(y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * 10);
        if (x2 - x1 < 4) continue;
        c.fillStyle = 'rgba(40,30,60,0.9)'; c.fillRect(x, y, 1, 1);
        if (i % 2 === 0) { c.globalAlpha = 0.6 + 0.4 * Math.sin(time * 3 + i + ci * 2); c.fillStyle = cols[(i / 2 + ci) % cols.length]; c.fillRect(x - 1, y + 1, 2, 2); c.globalAlpha = 1; }
      }
    });
    // Rauch aus dem Schornstein
    const [sx, sy] = this.chimney;
    for (let i = 0; i < 6; i++) {
      const k = ((time * 0.35) + i / 6) % 1;
      c.globalAlpha = 0.35 * (1 - k); c.fillStyle = '#b8b0c8';
      const r = 2 + k * 6; c.beginPath(); c.arc(sx + Math.sin(k * 5 + i) * 4 + k * 10, sy - k * 50, r, 0, 6.283); c.fill();
    }
    c.globalAlpha = 1;
  },
  snowfall(time) {
    const c = R.ctx; c.fillStyle = '#eef4ff';
    this.snow.forEach(f => { f.y += f.s * 0.6; f.x += Math.sin(time + f.w) * 0.25; if (f.y > VIEW_H) { f.y = -2; f.x = Math.random() * VIEW_W; } c.globalAlpha = 0.5 + f.s * 0.3; c.fillRect(f.x | 0, f.y | 0, f.s > 1.2 ? 2 : 1, f.s > 1.2 ? 2 : 1); });
    c.globalAlpha = 1;
  },
  testBadge(G) {
    if (G.testDay === null) return;
    const c = R.ctx; c.fillStyle = 'rgba(184,50,42,0.9)'; c.fillRect(4, 4, 92, 16);
    R.text('TEST · Tag ' + G.testDay, 10, 16, { size: 10, weight: 700, color: '#ffffff', shadow: false });
  },

  // --- Auswahlliste (Menü, Nachfragen) ---
  list(title, opts, time) {
    const c = R.ctx, w = 260, h = 40 + opts.length * 26, x = (VIEW_W - w) / 2, y = (VIEW_H - h) / 2;
    c.fillStyle = 'rgba(8,4,12,0.5)'; c.fillRect(0, 0, VIEW_W, VIEW_H);
    R.panel(x, y, w, h);
    R.text(title, VIEW_W / 2, y + 24, { size: 15, weight: 700, align: 'center', color: '#ffd36a', serif: true });
    opts.forEach((o, i) => {
      const yy = y + 50 + i * 26, on = i === this.sel;
      if (on) { c.fillStyle = 'rgba(224,154,44,0.18)'; c.fillRect(x + 10, yy - 17, w - 20, 24); }
      R.text((on ? '▸ ' : '  ') + o.label, x + 24, yy, { size: 14, color: on ? '#ffd36a' : '#f4ead8', weight: on ? 700 : 500 });
    });
  },
  // Auf/Ab wählen, A bestätigen, B/Menü zurück. Gibt Index, -1 (zurück) oder null zurück
  navigate(n) {
    if (IN.take('up') || IN.take('left')) { this.sel = (this.sel + n - 1) % n; AU.sfx('menue'); }
    if (IN.take('down') || IN.take('right')) { this.sel = (this.sel + 1) % n; AU.sfx('menue'); }
    if (IN.take('a')) { AU.sfx('menue'); return this.sel; }
    if (IN.take('b') || IN.take('menu')) { AU.sfx('zurueck'); return -1; }
    return null;
  },

  // --- Questlog ---
  questlog(G) {
    const c = R.ctx; R.panel(16, 14, VIEW_W - 32, VIEW_H - 28);
    R.text('Questlog', 34, 42, { size: 20, weight: 700, serif: true, color: '#ffd36a' });
    const head = G.day > 0 ? 'Heute: ' + G.day + '. Dezember' : 'Noch ' + G.daysLeft() + ' Tage bis zum 1. Dezember';
    R.text(head, VIEW_W - 34, 40, { size: 12, align: 'right', color: '#c8b898' });
    const lines = [];
    const all = questIds().filter(id => DATA.quests[id].day <= G.day);
    const neben = all.filter(id => DATA.quests[id].neben && (G.save.done.indexOf(id) < 0) && DATA.quests[id].steps.some(st => stepCount(st, G.save.flags) > 0));
    const ids = all.filter(id => !DATA.quests[id].neben).reverse().concat(neben);
    if (!ids.length) {
      lines.push(['Das erste Türchen öffnet sich am 1. Dezember.', '#f4ead8', 600]);
      lines.push(['Bis dahin: Schau dich im Gemeinschaftsraum um, weck Diego', '#c8b898', 500]);
      lines.push(['und lass ihn nach Geheimnissen schnüffeln (Taste B).', '#c8b898', 500]);
    }
    ids.forEach(id => {
      const q = DATA.quests[id], done = G.save.done.indexOf(id) >= 0;
      lines.push([(q.neben ? 'Nebenaufgabe · ' : 'Türchen ' + q.day + ' · ') + q.title + (done ? '  ✓' : ''), done ? '#9ab070' : (q.neben ? '#c8d8a0' : '#ffd36a'), 700]);
      if (done) return;
      let shownCurrent = false;
      q.steps.forEach(st => {
        const txt = st.text.replace('{n}', String(stepCount(st, G.save.flags)));
        if (stepDone(st, G.save.flags)) lines.push(['  ✓ ' + txt, '#8a8070', 500]);
        else if (!shownCurrent) { shownCurrent = true; R.wrap(txt, 400, 13, 600).forEach((l, i) => lines.push([(i ? '     ' : '  ▸ ') + l, '#f4ead8', 600])); }
      });
      if (q.teilweise && !shownCurrent) lines.push(['  Fortsetzung folgt …', '#c8b898', 500]);
      lines.push(['', '', 400]);
    });
    const total = allSecretIds().length, found = G.save.secrets.length;
    const maxRows = 12; this.scroll = clamp(this.scroll, 0, Math.max(0, lines.length - maxRows));
    lines.slice(this.scroll, this.scroll + maxRows).forEach(([t, col, wgt], i) => R.text(t, 34, 74 + i * 20, { size: 13, color: col, weight: wgt }));
    c.fillStyle = 'rgba(224,154,44,0.4)'; c.fillRect(34, VIEW_H - 54, VIEW_W - 68, 1);
    const sp = Object.keys(DATA.zauber).filter(z => G.save.flags['zauber_' + z]).map(z => DATA.zauber[z].name);
    R.text('🐾 Geheimnisse: ' + found + ' von ' + total + '    Fragmente: ' + G.save.fragments.length + ' von 24', 34, VIEW_H - 38, { size: 12, color: '#c8b898' });
    R.text('✦ Zauber: ' + (sp.length ? sp.join(', ') : 'noch keine'), 34, VIEW_H - 22, { size: 12, color: '#c8b898' });
  },
  lied(G) {
    R.panel(16, 14, VIEW_W - 32, VIEW_H - 28);
    R.text('Das Phönixlied', 34, 42, { size: 20, weight: 700, serif: true, color: '#ffd36a' });
    R.text(G.save.fragments.length + ' von 24 Zeilen', VIEW_W - 34, 40, { size: 12, align: 'right', color: '#c8b898' });
    const rows = [];
    for (let d = 1; d <= 24; d++) {
      const id = questIds().find(q => DATA.quests[q].day === d);
      const has = id && G.save.fragments.indexOf(id) >= 0;
      rows.push([d, has ? DATA.quests[id].fragment : '· · ·', has]);
    }
    const maxRows = 14; this.scroll = clamp(this.scroll, 0, rows.length - maxRows);
    rows.slice(this.scroll, this.scroll + maxRows).forEach(([d, t, has], i) => {
      R.text(String(d).padStart(2, ' '), 40, 70 + i * 20, { size: 12, color: '#a89878', align: 'right', weight: 600 });
      R.text(t, 50, 70 + i * 20, { size: 12, color: has ? '#f4ead8' : '#6a6070', weight: has ? 600 : 400, serif: has });
    });
    if (this.scroll + maxRows < rows.length) R.text('▼', VIEW_W - 40, VIEW_H - 26, { size: 11, color: '#ffd36a' });
  },
  // Takt-Rätsel: vier Glocken um ein Zifferblatt
  mini(G, time) {
    const M = G.mini; if (!M) return;
    if (M.type === 'uhr') return this.uhr(G, M, time);
    const c = R.ctx, cx = VIEW_W / 2, cy = 190;
    c.fillStyle = 'rgba(8,4,12,0.72)'; c.fillRect(0, 0, VIEW_W, VIEW_H);
    R.panel(96, 24, 320, 336);
    R.text('Der Uhrmeister schlägt den Takt', cx, 54, { size: 16, weight: 700, align: 'center', color: '#ffd36a', serif: true });
    R.text('Runde ' + (M.round + 1) + ' von ' + M.cfg.rounds.length, cx, 74, { size: 12, align: 'center', color: '#c8b898' });
    const p = Pen(c);
    p.circ(cx, cy, 46, '#c8a040'); p.circ(cx, cy, 42, '#f4ead8');
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; p.r(cx + Math.cos(a) * 36 - 1, cy + Math.sin(a) * 36 - 1, 3, 3, '#3a2a1e'); }
    const ang = time * 2.2; c.strokeStyle = '#3a2a1e'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ang) * 30, cy + Math.sin(ang) * 30); c.stroke(); c.lineWidth = 1;
    const pos = { up: [cx, cy - 80], right: [cx + 92, cy], down: [cx, cy + 80], left: [cx - 92, cy] };
    const col = { up: '#e09a2c', right: '#22747a', down: '#4f6b2a', left: '#7a4a8a' };
    Object.keys(pos).forEach(d => {
      const [x, y] = pos[d], on = M.lit === d;
      if (on) { const g = c.createRadialGradient(x, y, 0, x, y, 34); g.addColorStop(0, 'rgba(255,230,140,0.8)'); g.addColorStop(1, 'rgba(255,230,140,0)'); c.fillStyle = g; c.fillRect(x - 34, y - 34, 68, 68); }
      p.circ(x, y, 20, on ? '#fff2b0' : col[d]); p.circ(x, y, 16, on ? '#ffd36a' : shade(col[d], -0.25));
      const arrow = { up: '▲', right: '▶', down: '▼', left: '◀' }[d];
      R.text(arrow, x, y + 6, { size: 16, align: 'center', color: on ? '#3a2a1e' : '#f4ead8', weight: 700, shadow: false });
    });
    const msg = M.phase === 'show' ? 'Hör gut zu und merk dir die Schläge …' : M.phase === 'input' ? 'Jetzt du! Steuerkreuz: ' + M.pos + ' von ' + M.seq.length
      : M.phase === 'ok' ? 'Richtig! Der Uhrmeister nickt.' : 'Daneben – er schlägt den Takt noch einmal.';
    R.text(msg, cx, 318, { size: 13, align: 'center', color: M.phase === 'fail' ? '#ff9a7a' : '#f4ead8', weight: 600 });
    R.text('B: aufgeben (später nochmal versuchen)', cx, 342, { size: 10, align: 'center', color: '#8a8070' });
  },
  // Uhr-Rätsel des Uhrmeisters
  uhr(G, M, time) {
    const c = R.ctx, p = Pen(c), cx = VIEW_W / 2, cy = 214;
    c.fillStyle = 'rgba(8,4,12,0.72)'; c.fillRect(0, 0, VIEW_W, VIEW_H);
    R.panel(40, 16, 432, 352);
    R.text('Das Rätsel des Uhrmeisters', cx, 42, { size: 16, weight: 700, align: 'center', color: '#ffd36a', serif: true });
    R.text('Frage ' + (Math.min(M.round, M.fragen.length - 1) + 1) + ' von ' + M.fragen.length, cx, 60, { size: 11, align: 'center', color: '#c8b898' });
    const q = M.fragen[Math.min(M.round, M.fragen.length - 1)];
    R.wrap(q.text, 390, 13, 600).forEach((l, i) => R.text(l, cx, 84 + i * 17, { size: 13, align: 'center', color: '#f4ead8', weight: 600 }));
    p.circ(cx, cy, 70, '#5a4434'); p.circ(cx, cy, 66, '#c8a040'); p.circ(cx, cy, 62, '#f0e6c8');
    for (let h = 1; h <= 12; h++) {
      const a = h / 12 * 6.283 - 1.5708, on = h === M.hour;
      R.text(String(h), cx + Math.cos(a) * 50, cy + Math.sin(a) * 50 + 5, { size: on ? 15 : 12, align: 'center', weight: 700, color: on ? '#b8322a' : '#3a2a1e', shadow: false });
    }
    const a = M.hour / 12 * 6.283 - 1.5708;
    c.strokeStyle = '#b8322a'; c.lineWidth = 5; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * 38, cy + Math.sin(a) * 38); c.stroke(); c.lineWidth = 1;
    c.fillStyle = '#b8322a'; c.beginPath(); c.moveTo(cx + Math.cos(a) * 46, cy + Math.sin(a) * 46); c.lineTo(cx + Math.cos(a + 0.35) * 32, cy + Math.sin(a + 0.35) * 32); c.lineTo(cx + Math.cos(a - 0.35) * 32, cy + Math.sin(a - 0.35) * 32); c.fill();
    p.circ(cx, cy, 4, '#c8a040');
    const msg = M.phase === 'ok' ? 'TICK. RICHTIG.' : M.phase === 'falsch' ? 'TICK. FALSCH. DENK. NACH.' : '◀ ▶ Zeiger drehen · A: Uhr stellen';
    R.text(msg, cx, 316, { size: 13, align: 'center', weight: 700, color: M.phase === 'falsch' ? '#ff9a7a' : M.phase === 'ok' ? '#9ae07a' : '#f4ead8' });
    R.text('B: aufgeben (später nochmal versuchen)', cx, 340, { size: 10, align: 'center', color: '#8a8070' });
  },
  banner(G, time) {
    const b = G.bannerMsg; if (!b) return;
    const age = time - b.t0; if (age > 4) { G.bannerMsg = null; return; }
    const a = Math.min(1, age * 4, (4 - age) * 2), c = R.ctx;
    c.globalAlpha = a; c.font = '700 14px ' + R.FONT; const w = Math.min(VIEW_W - 40, c.measureText(b.text).width + 40), x = (VIEW_W - w) / 2;
    R.panel(x, 12, w, 30, 0.96); R.text(b.text, VIEW_W / 2, 32, { size: 14, weight: 700, align: 'center', color: '#ffd36a' });
    c.globalAlpha = 1;
  },
  toastDraw(dt) {
    if (!this.toastMsg) return;
    this.toastT -= dt; if (this.toastT <= 0) { this.toastMsg = null; return; }
    const c = R.ctx; c.globalAlpha = Math.min(1, this.toastT); c.font = '600 12px ' + R.FONT;
    const w = c.measureText(this.toastMsg).width + 24; c.fillStyle = 'rgba(20,12,24,0.92)'; c.fillRect((VIEW_W - w) / 2, VIEW_H - 40, w, 24);
    R.text(this.toastMsg, VIEW_W / 2, VIEW_H - 24, { size: 12, align: 'center' }); c.globalAlpha = 1;
  },

  // --- Code-Fenster (HTML, weil Text kopiert/eingefügt werden muss) ---
  codePanel(mode, code, onLoad, onClose) {
    this.closePanel();
    const el = document.createElement('div'); el.id = 'panel';
    const box = document.createElement('div'); box.className = 'box'; el.appendChild(box);
    const h = document.createElement('h2'); h.textContent = mode === 'export' ? 'Spielstand sichern' : 'Spielstand laden'; box.appendChild(h);
    const p = document.createElement('p');
    p.textContent = mode === 'export'
      ? 'Diesen Code kopieren und gut aufheben (z. B. in den Notizen). Damit lässt sich der Spielstand auf einem anderen Gerät oder nach einem Missgeschick wiederherstellen.'
      : 'Gesicherten Code hier einfügen. Der aktuelle Spielstand wird vorher als Sicherung behalten.';
    box.appendChild(p);
    const ta = document.createElement('textarea'); ta.spellcheck = false; ta.autocapitalize = 'off'; ta.autocomplete = 'off';
    if (mode === 'export') { ta.value = code; ta.readOnly = true; }
    box.appendChild(ta);
    const msg = document.createElement('p'); msg.className = 'msg'; box.appendChild(msg);
    const row = document.createElement('div'); row.className = 'row'; box.appendChild(row);
    const btn = (label, fn, main) => { const b = document.createElement('button'); b.textContent = label; if (main) b.className = 'main'; b.addEventListener('click', fn); row.appendChild(b); };
    if (mode === 'export') {
      btn('Kopieren', () => {
        ta.select();
        const ok = () => { msg.textContent = 'Kopiert ✓'; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(ok, () => { try { document.execCommand('copy'); ok(); } catch (e) { msg.textContent = 'Bitte den Text markieren und kopieren.'; } });
        else { try { document.execCommand('copy'); ok(); } catch (e) { msg.textContent = 'Bitte den Text markieren und kopieren.'; } }
      }, true);
    } else {
      btn('Laden', () => { const r = onLoad(ta.value); if (r) msg.textContent = r; }, true);
    }
    btn('Schließen', () => { this.closePanel(); if (onClose) onClose(); });
    document.body.appendChild(el);
  },
  closePanel() { const el = document.getElementById('panel'); if (el) el.remove(); },
  panelOpen() { return !!document.getElementById('panel'); },
};
