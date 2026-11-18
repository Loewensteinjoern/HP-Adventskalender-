// ===== Darstellung: Karte, Figuren, Licht, Effekte =====
const R = {
  cv: null, ctx: null, S: 1, bgCache: {}, objCache: {}, light: null, lctx: null, cam: { x: 0, y: 0 }, parts: [],
  FONT: '"Avenir Next", "Segoe UI", system-ui, -apple-system, sans-serif',
  SERIF: 'Georgia, "Times New Roman", serif',

  init() {
    this.cv = document.getElementById('c'); this.ctx = this.cv.getContext('2d');
    this.light = mkCanvas(VIEW_W, VIEW_H); this.lctx = this.light.getContext('2d');
    addEventListener('resize', () => this.resize()); addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));
    this.resize();
  },
  // Ganzzahlige Skalierung in Geräte-Pixeln; Platz für Steuerung links/rechts (quer) oder unten (hoch)
  resize() {
    const dpr = window.devicePixelRatio || 1, vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
    const land = vw >= vh;
    document.body.classList.toggle('hoch', !land);
    const aw = land ? vw - 2 * Math.min(200, Math.max(140, vw * 0.16)) : vw - 8;
    const ah = land ? vh - 16 : vh - 230;
    let S = Math.floor(Math.min(aw * dpr / VIEW_W, ah * dpr / VIEW_H));
    if (S < 1) S = 1;
    this.S = S;
    this.cv.width = VIEW_W * S; this.cv.height = VIEW_H * S;
    this.cv.style.width = (VIEW_W * S / dpr) + 'px'; this.cv.style.height = (VIEW_H * S / dpr) + 'px';
    this.ctx.imageSmoothingEnabled = false;
  },
  begin() { const c = this.ctx; c.setTransform(this.S, 0, 0, this.S, 0, 0); c.imageSmoothingEnabled = false; c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; },

  // --- Hintergrund einer Karte (Kacheln + Teppiche), einmal gemalt ---
  background(mid) {
    if (this.bgCache[mid]) return this.bgCache[mid];
    const m = DATA.maps[mid], w = mapW(m), h = mapH(m), c = mkCanvas(w * TILE, h * TILE), g = c.getContext('2d');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = m.tiles[y][x], t = DATA.tiles[ch], tc = mkCanvas(TILE, TILE);
      const nb = { up: tileChar(m, x, y - 1), down: tileChar(m, x, y + 1), left: tileChar(m, x - 1, y), right: tileChar(m, x + 1, y), x, y };
      (PAINT_TILE[t.paint] || PAINT_TILE.dielen)(Pen(tc.getContext('2d')), srand(x * 977 + y * 131 + 7), nb);
      g.drawImage(tc, x * TILE, y * TILE);
    }
    // weicher Schatten unter Wänden und Galerie
    for (let y = 1; y < h; y++) for (let x = 0; x < w; x++) {
      if (!DATA.tiles[m.tiles[y][x]].solid && DATA.tiles[m.tiles[y - 1][x]].solid) {
        for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(20,8,4,' + (0.32 - i * 0.05) + ')'; g.fillRect(x * TILE, y * TILE + i, TILE, 1); }
      }
    }
    (m.objects || []).forEach(o => { const t = objType(o); if (t.decal && !o.if) g.drawImage(this.objImg(o, 0), o.x * TILE, o.y * TILE - t.up); });
    return (this.bgCache[mid] = c);
  },
  objImg(o, f) {
    const t = objType(o), k = o.type + ':' + (o.seed || 0) + ':' + (o.v || '') + ':' + f;
    if (!this.objCache[k]) {
      const W = t.w * TILE, H = t.h * TILE + t.up, c = mkCanvas(W, H);
      PAINT_OBJ[t.paint](Pen(c.getContext('2d')), f, srand(31 + (o.seed || 1) * 101), W, H, o.v);
      this.objCache[k] = c;
    }
    return this.objCache[k];
  },
  objFrame(o, time) { const t = objType(o); return t.frames ? Math.floor(time * (t.fps || 4) + o.x * 0.7) % t.frames : 0; },

  camera(px, py, m) {
    const mw = mapW(m) * TILE, mh = mapH(m) * TILE;
    this.cam.x = mw <= VIEW_W ? -Math.round((VIEW_W - mw) / 2) : Math.round(clamp(px + 16 - VIEW_W / 2, 0, mw - VIEW_W));
    this.cam.y = mh <= VIEW_H ? -Math.round((VIEW_H - mh) / 2) : Math.round(clamp(py + 16 - VIEW_H / 2, 0, mh - VIEW_H));
  },

  // --- Welt zeichnen ---
  world(G, time) {
    const c = this.ctx, m = DATA.maps[G.mapId], ctx = G.ctx(), cam = this.cam;
    const pp = G.renderPos(G.player);
    this.camera(pp.x, pp.y, m);
    c.fillStyle = '#0c0810'; c.fillRect(0, 0, VIEW_W, VIEW_H);
    c.drawImage(this.background(G.mapId), -cam.x, -cam.y);
    const objs = visibleObjs(m, ctx);
    objs.forEach(o => { const t = objType(o); if (t.decal && o.if) c.drawImage(this.objImg(o, 0), o.x * TILE - cam.x, o.y * TILE - t.up - cam.y); });
    objs.forEach(o => { const t = objType(o); if (t.wall) c.drawImage(this.objImg(o, this.objFrame(o, time)), o.x * TILE - cam.x, o.y * TILE - t.up - cam.y); });
    this.paws(G, time);
    // Figuren und Möbel nach Tiefe sortiert
    const list = [];
    objs.forEach(o => { const t = objType(o); if (!t.wall && !t.decal && !t.overlay) list.push({ y: (o.y + t.h) * TILE, d: () => c.drawImage(this.objImg(o, this.objFrame(o, time)), o.x * TILE - cam.x, o.y * TILE - t.up - cam.y) }); });
    visibleNpcs(m, ctx).forEach(n => {
      const np = n.fx !== undefined ? G.renderPos(n) : { x: n.x * TILE, y: n.y * TILE };
      const fr = n.moving ? G.walkFrame(n) : (n.anim ? Math.floor(time * 2 + n.x) % 2 : 0);
      list.push({ y: np.y + TILE + 0.5, d: () => this.actor(n.char, np.x, np.y - (n.lift || 0), n.dir, fr, n.pose, time, n.lift) });
    });
    G.followers.forEach(f => { const p = G.renderPos(f); list.push({ y: p.y + TILE + 0.4, d: () => this.actor(f.char, p.x, p.y, f.dir, G.walkFrame(f), f.pose, time) }); });
    list.push({ y: pp.y + TILE + 0.6, d: () => this.actor('charly', pp.x, pp.y, G.player.dir, G.walkFrame(G.player), null, time) });
    list.sort((a, b) => a.y - b.y).forEach(e => e.d());
    objs.forEach(o => { const t = objType(o); if (t.overlay) c.drawImage(this.objImg(o, this.objFrame(o, time)), o.x * TILE - cam.x, o.y * TILE - t.up - cam.y); });
    // Rätsel-Vorführung: das gerade klingende Objekt leuchtet
    objs.forEach(o => {
      if (!G.demoVal(o)) return;
      const t = objType(o), x = o.x * TILE + t.w * 16 - cam.x, y = o.y * TILE - t.up / 2 - cam.y;
      const g = c.createRadialGradient(x, y, 0, x, y, 34); g.addColorStop(0, 'rgba(255,230,140,0.75)'); g.addColorStop(1, 'rgba(255,230,140,0)');
      c.fillStyle = g; c.fillRect(x - 34, y - 34, 68, 68);
    });
    this.particles(G, m, objs, time);
    this.lights(G, m, objs, pp, time);
    this.bubble(G, time);
  },
  // Kleine Sprechblase über einer Figur
  bubble(G, time) {
    const b = G.bubble; if (!b || DLG.open) return;
    const c = this.ctx, p = b.e.fx !== undefined ? G.renderPos(b.e) : { x: b.e.x * TILE, y: b.e.y * TILE };
    const age = time - b.t0, a = Math.min(1, age * 5, (3.2 - age) * 3);
    c.font = '600 9px ' + this.FONT; const w = Math.ceil(c.measureText(b.text).width) + 10;
    const x = Math.round(clamp(p.x + 16 - this.cam.x - w / 2, 2, VIEW_W - w - 2)), y = Math.round(p.y - this.cam.y - 30);
    c.globalAlpha = Math.max(0, a);
    c.fillStyle = 'rgba(250,244,230,0.95)'; c.fillRect(x, y, w, 14); c.fillRect(x + w / 2 - 2, y + 14, 4, 3);
    c.fillStyle = 'rgba(60,40,30,0.6)'; c.fillRect(x, y + 14, w, 1);
    c.fillStyle = '#3a2a1e'; c.textAlign = 'left'; c.fillText(b.text, x + 5, y + 10);
    c.globalAlpha = 1;
  },
  actor(key, x, y, dir, fr, pose, time, lift) {
    const c = this.ctx, cx = x - this.cam.x, cy = y - this.cam.y;
    c.fillStyle = 'rgba(20,8,4,0.28)';
    if (!lift) { c.beginPath(); c.ellipse(cx + 16, cy + 29, key === 'diego' ? 11 : 9, 3, 0, 0, 6.283); c.fill(); }
    if (ANIMALS[key]) {
      c.drawImage(SPR.get(key, dir, fr, pose), cx, cy - 2);
      if (pose === 'schlaf') this.zzz(cx + 22, cy - 6, time);
    } else c.drawImage(SPR.get(key, dir, fr), cx, cy - 10);
  },
  zzz(x, y, time) {
    const c = this.ctx, k = (time * 0.8) % 1;
    c.globalAlpha = 1 - k; c.fillStyle = '#f4ead8'; c.font = '700 8px ' + this.FONT; c.fillText('z', x + k * 6, y - k * 10);
    c.globalAlpha = Math.max(0, 0.8 - k); c.font = '700 6px ' + this.FONT; c.fillText('z', x + 6 + k * 4, y - 8 - k * 8); c.globalAlpha = 1;
  },

  // Goldene Pfotenspur von Diegos Schnüffeln
  paws(G, time) {
    const tr = G.trail; if (!tr) return;
    const c = this.ctx, age = time - tr.t0, life = 7;
    if (age > life) { G.trail = null; return; }
    const fade = age > life - 1.5 ? (life - age) / 1.5 : 1;
    tr.pts.forEach((pt, i) => {
      const show = age - i * 0.09; if (show < 0 || i === 0) return;
      const a = Math.min(1, show * 3) * fade, side = i % 2 ? 5 : -5;
      const prev = tr.pts[i - 1], vert = prev.x === pt.x;
      const x = pt.x * TILE + 16 - this.cam.x + (vert ? side : 0), y = pt.y * TILE + 18 - this.cam.y + (vert ? 0 : side);
      c.globalAlpha = a * 0.35; c.fillStyle = '#ffd36a'; c.beginPath(); c.arc(x, y, 7, 0, 6.283); c.fill();
      c.globalAlpha = a; c.fillStyle = '#ffd36a';
      c.fillRect(x - 2, y - 1, 5, 4); c.fillRect(x - 3, y - 4, 2, 2); c.fillRect(x - 1, y - 5, 2, 2); c.fillRect(x + 1, y - 5, 2, 2); c.fillRect(x + 3, y - 4, 2, 2);
      c.fillStyle = '#fff6c8'; c.fillRect(x - 1, y, 2, 1);
    });
    if (tr.target && age > tr.pts.length * 0.09) {
      const x = tr.target.x * TILE + 16 - this.cam.x, y = tr.target.y * TILE + 14 - this.cam.y, s = 4 + Math.sin(time * 8) * 2;
      c.globalAlpha = fade; c.fillStyle = '#fff2b0';
      c.fillRect(x - s, y, s * 2 + 1, 1); c.fillRect(x, y - s, 1, s * 2 + 1); c.fillRect(x - 1, y - 1, 3, 3);
      c.globalAlpha = fade * 0.3; c.beginPath(); c.arc(x, y, 10, 0, 6.283); c.fill();
    }
    c.globalAlpha = 1;
  },

  particles(G, m, objs, time) {
    const c = this.ctx, kind = (m.ambient || {}).particles;
    if (kind === 'funken') objs.forEach(o => {
      if (o.type !== 'kamin' || Math.random() > 0.12) return;
      this.parts.push({ x: o.x * TILE + 36 + Math.random() * 24, y: o.y * TILE + 60, vx: (Math.random() - 0.5) * 8, vy: -18 - Math.random() * 14, life: 1.2 + Math.random(), t: 0, col: Math.random() < 0.5 ? '#ffd36a' : '#ff8a2a', mid: G.mapId });
    });
    if (kind === 'schnee') for (let i = 0; i < 2; i++) if (Math.random() < 0.6) this.parts.push({ x: this.cam.x + Math.random() * (VIEW_W + 60) - 30, y: this.cam.y - 4, vx: -3 + Math.random() * 6, vy: 30 + Math.random() * 22, life: 12, t: 0, col: '#eef4ff', mid: G.mapId, big: Math.random() < 0.3 });
    if (kind === 'staub' && Math.random() < 0.06) this.parts.push({ x: this.cam.x + Math.random() * VIEW_W, y: this.cam.y + Math.random() * VIEW_H, vx: (Math.random() - 0.5) * 4, vy: -2 - Math.random() * 3, life: 4, t: 0, col: '#d8d0e8', mid: G.mapId, soft: 1 });
    const dt = 1 / 60;
    this.parts = this.parts.filter(p => (p.t += dt) < p.life && p.mid === G.mapId);
    this.parts.forEach(p => {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx += (Math.random() - 0.5) * 2;
      c.globalAlpha = (1 - p.t / p.life) * (p.soft ? 0.5 : 1); c.fillStyle = p.col;
      c.fillRect(Math.round(p.x - this.cam.x), Math.round(p.y - this.cam.y), p.big ? 2 : 1, p.big ? 2 : 1);
    });
    c.globalAlpha = 1;
  },

  // Dunkelheit mit ausgesparten Lichtern, dazu warmes Leuchten
  lights(G, m, objs, pp, time) {
    const amb = m.ambient || {}, L = this.lctx, c = this.ctx;
    const srcs = [];
    objs.forEach(o => {
      const t = objType(o); if (!t.light) return;
      const fl = t.light.flicker ? 1 + Math.sin(time * 9 + o.x) * 0.04 + Math.sin(time * 23 + o.y) * 0.03 : 1;
      srcs.push({ x: o.x * TILE + t.light.x - this.cam.x, y: o.y * TILE - t.up + t.light.y - this.cam.y + t.up, r: t.light.r * fl, col: t.light.col });
    });
    srcs.push({ x: pp.x + 16 - this.cam.x, y: pp.y + 12 - this.cam.y, r: 70, col: '255,220,180', soft: true });
    L.globalCompositeOperation = 'source-over'; L.clearRect(0, 0, VIEW_W, VIEW_H);
    L.fillStyle = 'rgba(' + (amb.tint || '20,10,30') + ',' + (amb.dark || 0.4) + ')'; L.fillRect(0, 0, VIEW_W, VIEW_H);
    L.globalCompositeOperation = 'destination-out';
    srcs.forEach(s => {
      const g = L.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      g.addColorStop(0, s.soft ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      L.fillStyle = g; L.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
    });
    c.drawImage(this.light, 0, 0);
    c.globalCompositeOperation = 'lighter';
    srcs.forEach(s => {
      if (s.soft) return;
      const g = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 0.8);
      g.addColorStop(0, 'rgba(' + s.col + ',0.16)'); g.addColorStop(1, 'rgba(' + s.col + ',0)');
      c.fillStyle = g; c.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
    });
    c.globalCompositeOperation = 'source-over';
  },

  // --- Text ---
  text(str, x, y, o) {
    o = o || {}; const c = this.ctx;
    c.font = (o.weight || 600) + ' ' + (o.size || 13) + 'px ' + (o.serif ? this.SERIF : this.FONT);
    c.textAlign = o.align || 'left'; c.textBaseline = 'alphabetic';
    if (o.shadow !== false) { c.fillStyle = o.shadowCol || 'rgba(0,0,0,0.6)'; c.fillText(str, x + 1, y + 1); }
    c.fillStyle = o.color || '#f4ead8'; c.fillText(str, x, y);
    c.textAlign = 'left';
  },
  wrap(str, maxW, size, weight) {
    const c = this.ctx; c.font = (weight || 500) + ' ' + size + 'px ' + this.FONT;
    const words = str.split(' '), lines = []; let cur = '';
    words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur);
    return lines;
  },
  panel(x, y, w, h, alpha) {
    const c = this.ctx;
    c.fillStyle = 'rgba(28,18,30,' + (alpha || 0.94) + ')'; c.fillRect(x, y, w, h);
    c.fillStyle = '#e09a2c'; c.fillRect(x, y, w, 2); c.fillRect(x, y + h - 2, w, 2); c.fillRect(x, y, 2, h); c.fillRect(x + w - 2, y, 2, h);
    c.fillStyle = '#4f6b2a'; c.fillRect(x + 3, y + 3, w - 6, 1); c.fillRect(x + 3, y + h - 4, w - 6, 1);
    c.fillStyle = '#ffd36a'; [[x, y], [x + w - 4, y], [x, y + h - 4], [x + w - 4, y + h - 4]].forEach(([a, b]) => c.fillRect(a, b, 4, 4));
  },
};
