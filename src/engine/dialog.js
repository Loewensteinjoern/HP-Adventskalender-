// ===== Dialogbox mit Schreibmaschinen-Effekt =====
const DLG = {
  pages: [], idx: 0, shown: 0, cb: null, blipAt: 0,
  get open() { return this.pages.length > 0; },
  // lines: [[sprecher, text], ...]; Sprecher '' = Erzähler
  show(lines, cb) {
    const pages = [];
    lines.forEach(([sp, tx]) => {
      const name = sp ? (DATA.characters[sp] || { name: sp }).name : '';
      const wrapped = R.wrap(tx, 470, 15, 500);
      for (let i = 0; i < wrapped.length; i += 3) pages.push({ name, sp, lines: wrapped.slice(i, i + 3) });
    });
    this.pages = pages; this.idx = 0; this.shown = 0; this.cb = cb || null;
  },
  pageLen() { return this.pages[this.idx].lines.join(' ').length; },
  update(dt) {
    if (!this.open) return;
    const before = Math.floor(this.shown);
    this.shown = Math.min(this.pageLen(), this.shown + dt * 55);
    if (Math.floor(this.shown) > before && Math.floor(this.shown) % 5 === 0) AU.sfx('blip');
    if (IN.take('a') || IN.take('b')) {
      if (this.shown < this.pageLen()) { this.shown = this.pageLen(); return; }
      this.idx++; this.shown = 0;
      if (this.idx >= this.pages.length) { const cb = this.cb; this.pages = []; this.cb = null; if (cb) cb(); }
    }
  },
  draw(time) {
    if (!this.open) return;
    const pg = this.pages[this.idx], c = R.ctx, x = 10, y = 286, w = VIEW_W - 20, h = 90;
    R.panel(x, y, w, h, 0.95);
    if (pg.name) {
      c.font = '700 13px ' + R.FONT; const nw = c.measureText(pg.name).width + 20;
      R.panel(x + 12, y - 18, nw, 22, 1); R.text(pg.name, x + 22, y - 2, { size: 13, weight: 700, color: '#ffd36a' });
    }
    let left = Math.floor(this.shown);
    pg.lines.forEach((ln, i) => {
      const part = ln.slice(0, Math.max(0, left)); left -= ln.length + 1;
      R.text(part, x + 16, y + 27 + i * 21, { size: 15, weight: 500, color: pg.name ? '#f8f0e0' : '#e8dcc4' });
    });
    if (this.shown >= this.pageLen() && Math.floor(time * 3) % 2) { c.fillStyle = '#ffd36a'; c.fillRect(x + w - 22, y + h - 16, 9, 3); c.fillRect(x + w - 20, y + h - 13, 5, 2); c.fillRect(x + w - 19, y + h - 11, 3, 2); }
  },
};
