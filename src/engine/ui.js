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
    // Schloss Løvestein
    const towers = [[40, 30, 130, 1], [70, 60, 100, 0], [130, 24, 165, 1], [154, 90, 110, 0], [244, 28, 150, 1], [272, 70, 95, 0], [342, 22, 135, 1], [364, 70, 90, 0], [434, 26, 120, 1]];
    let wi = 0;
    towers.forEach(([x, w, h, roof]) => {
      const top = 300 - h; p.r(x, top, w, h, '#151228');
      if (roof) for (let i = 0; i < w / 2 + 6; i++) p.r(x + w / 2 - i, top - (w / 2 + 6) * 1.4 + i * 1.4, i * 2, 2, '#1c1834');
      else for (let xx = x; xx < x + w; xx += 8) p.r(xx, top - 5, 5, 5, '#151228');
      for (let yy = top + 12; yy < 290; yy += 18) for (let xx = x + 6; xx < x + w - 6; xx += 14) {
        const k = this.windows[wi++ % this.windows.length]; if (k[0] < 0.45) continue;
        c.fillStyle = k[1] < 0.5 ? '#ffcf6a' : '#f0a040'; c.globalAlpha = 0.7 + 0.3 * Math.sin(time * 2 + k[2] * 20); c.fillRect(xx, yy, 3, 5);
      }
      c.globalAlpha = 1;
    });
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
    // Auswahl
    opts.forEach((o, i) => {
      const y = 196 + i * 26, on = i === this.sel;
      if (on) { c.fillStyle = 'rgba(20,14,30,0.7)'; c.fillRect(VIEW_W / 2 - 110, y - 17, 220, 24); c.fillStyle = '#e09a2c'; c.fillRect(VIEW_W / 2 - 110, y - 17, 3, 24); }
      R.text((on ? '▸ ' : '') + o.label, VIEW_W / 2, y, { size: 16, align: 'center', color: on ? '#ffd36a' : '#f4ead8', weight: on ? 700 : 500 });
    });
    const info = G.day > 0 ? 'Heute ist der ' + G.day + '. Dezember – Türchen ' + G.day + ' ist offen.' : 'Noch ' + G.daysLeft() + (G.daysLeft() === 1 ? ' Tag' : ' Tage') + ' bis zum ersten Türchen.';
    R.text(info, VIEW_W / 2, 330, { size: 12, align: 'center', color: '#3a2a50', weight: 600, shadow: false });
    R.text(WATERMARK, VIEW_W / 2, 366, { size: 8, align: 'center', color: '#5a5070', weight: 500, shadow: false });
    R.text('Version ' + DATA.welt.version, VIEW_W / 2, 378, { size: 7, align: 'center', color: '#7a7090', weight: 500, shadow: false });
    this.testBadge(G);
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
    if (IN.take('up')) { this.sel = (this.sel + n - 1) % n; AU.sfx('menue'); }
    if (IN.take('down')) { this.sel = (this.sel + 1) % n; AU.sfx('menue'); }
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
    const ids = questIds().filter(id => DATA.quests[id].day <= G.day).reverse();
    if (!ids.length) {
      lines.push(['Das erste Türchen öffnet sich am 1. Dezember.', '#f4ead8', 600]);
      lines.push(['Bis dahin: Schau dich im Gemeinschaftsraum um, weck Diego', '#c8b898', 500]);
      lines.push(['und lass ihn nach Geheimnissen schnüffeln (Taste B).', '#c8b898', 500]);
    }
    ids.forEach(id => {
      const q = DATA.quests[id], done = G.save.done.indexOf(id) >= 0;
      lines.push(['Türchen ' + q.day + ' · ' + q.title + (done ? '  ✓' : ''), done ? '#9ab070' : '#ffd36a', 700]);
      if (done) return;
      let shownCurrent = false;
      q.steps.forEach(st => {
        if (G.save.flags[st.flag]) lines.push(['  ✓ ' + st.text, '#8a8070', 500]);
        else if (!shownCurrent) { shownCurrent = true; R.wrap(st.text, 400, 13, 600).forEach((l, i) => lines.push([(i ? '     ' : '  ▸ ') + l, '#f4ead8', 600])); }
      });
      if (q.teilweise && !shownCurrent) lines.push(['  Fortsetzung folgt …', '#c8b898', 500]);
      lines.push(['', '', 400]);
    });
    const total = allSecretIds().length, found = G.save.secrets.length;
    const maxRows = 12; this.scroll = clamp(this.scroll, 0, Math.max(0, lines.length - maxRows));
    lines.slice(this.scroll, this.scroll + maxRows).forEach(([t, col, wgt], i) => R.text(t, 34, 74 + i * 20, { size: 13, color: col, weight: wgt }));
    c.fillStyle = 'rgba(224,154,44,0.4)'; c.fillRect(34, VIEW_H - 54, VIEW_W - 68, 1);
    R.text('🐾 Geheimnisse gefunden: ' + found + ' von ' + total + '      Fragmente: ' + G.save.fragments.length + ' von 24', 34, VIEW_H - 34, { size: 12, color: '#c8b898' });
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
