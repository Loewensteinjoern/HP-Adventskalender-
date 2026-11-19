// ===== Zwischenszenen mit Kinobalken (Daten: data/szenen.json) =====
// Eine Szene ist eine Liste von Schritten. Jeder Schritt hat genau eine Art:
//   balken: true/false        Kinobalken ein-/ausfahren
//   kamera: [x,y] | null      Kamera schwenkt zu einer Kachel (null = zurück zu Charly)
//   ort: {map, kamera, nacht} | null   andere Karte zeigen, Charly bleibt unsichtbar (Haken)
//   sag: dialogId             Dialog zeigen und warten
//   warte: Sekunden
//   ton: sfx | note: 'C5' | musik: name
//   aktion: {set, unset, join, leave}  wie eine Gesprächs-Aktion (ohne Quest-Fanfare)
//   figur: {char, nach:[x,y], dir, warten}   Figur läuft auf der aktuellen Karte
//   spieler: [x,y], dir       Charly läuft (Begleiter folgen)
//   blick: {char|'spieler', dir}
//   blase: {char, text}
//   einblenden / ausblenden: Objekt-id, zeit   (einblenden setzt vorher das Flag "sichtbar", ausblenden nachher "weg")
//   fx: {art, x, y, w, zeit}  Effekte: funken, tropfen, schnee, morgenlicht, frost
//   gehe: {map, x, y, dir, nurWennWoanders}   Charly wechselt die Karte (mit Abblende)
//   schwarz: {set, unset}     kurz abblenden, dabei Flags ändern
//   tour: 'start'             Führung beginnt
const SZ = {
  a: null, balken: 0, balkenZiel: 0, kamera: null, fxList: [], schnell: false,
  get laeuft() { return !!this.a; },

  start(id, cb) {
    this.a = { id, steps: DATA.szenen[id], i: 0, wait: null, cb };
    this.schnell = false;
    G.mode = 'szene'; G.bubble = null; G.trail = null; G.autoPath = null;
    this.weiter();
  },
  // Führt Schritte aus, bis einer warten muss
  weiter() {
    while (this.a && !this.a.wait) {
      const st = this.a.steps[this.a.i++];
      if (!st) return this.ende();
      this.schnell = false;
      this.schritt(st);
    }
  },
  ende() {
    const a = this.a; this.a = null;
    this.balkenZiel = 0; this.kamera = null; G.autoPath = null;
    if (G.ortAlt) this.ortZurueck();
    G.mode = 'play';
    if (a && a.cb) a.cb(); else G.next();
    G.autoSzenen();
  },
  warten(art, extra) { this.a.wait = Object.assign({ art, t: 0 }, extra || {}); },

  schritt(st) {
    const s = G.save;
    if ('balken' in st) { this.balkenZiel = st.balken ? 1 : 0; this.warten('zeit', { dauer: 0.5 }); }
    else if ('kamera' in st) { this.kamera = st.kamera; this.warten('zeit', { dauer: st.zeit || 1.2 }); }
    else if ('ort' in st) { if (st.ort) this.ortZeigen(st.ort); else this.ortZurueck(); this.warten('zeit', { dauer: 0.3 }); }
    else if (st.sag) { this.warten('dialog'); DLG.show(G.lines(st.sag), () => { if (this.a) { this.a.wait = null; this.weiter(); } }); }
    else if ('warte' in st) this.warten('zeit', { dauer: st.warte });
    else if (st.ton) AU.sfx(st.ton);
    else if (st.note) AU.note(st.note);
    else if (st.musik) AU.playMusic(st.musik);
    else if (st.aktion) G.applyAction(st.aktion, true);
    else if (st.figur) {
      const n = G.npcByChar(st.figur.char);
      if (n) {
        if (st.figur.nach) G.npcWalk(n, st.figur.nach, st.figur.dir);
        else if (st.figur.dir) n.dir = st.figur.dir;
        if (st.figur.warten !== false && st.figur.nach) this.warten('figur', { n, max: 12 });
      }
    }
    else if (st.spieler) { G.walkPlayer(st.spieler, st.dir); this.warten('spieler', { max: 12 }); }
    else if (st.blick) {
      const e = st.blick.char === 'spieler' ? G.player : (G.followers.find(f => f.char === st.blick.char) || G.npcByChar(st.blick.char));
      if (e) e.dir = st.blick.dir;
    }
    else if (st.blase) {
      const e = G.followers.find(f => f.char === st.blase.char) || G.npcByChar(st.blase.char) || (G.guide && G.guide.char === st.blase.char ? G.guide : null);
      if (e) G.bubble = { e, text: st.blase.text, t0: G.time };
    }
    else if (st.einblenden || st.ausblenden) {
      const id = st.einblenden || st.ausblenden, rein = !!st.einblenden, dauer = st.zeit || 1.5;
      if (rein) s.flags[id + '_da'] = true;
      G.objAlpha[id] = { von: rein ? 0 : 1, nach: rein ? 1 : 0, t0: G.time, dauer };
      this.warten('zeit', { dauer, fertig: () => { delete G.objAlpha[id]; if (!rein) s.flags[id + '_weg'] = true; } });
    }
    else if (st.fx) { this.fxList.push(Object.assign({ t0: G.time, bis: G.time + (st.fx.zeit || 1.5), mid: G.mapId }, st.fx)); if (st.fx.warten) this.warten('zeit', { dauer: st.fx.zeit || 1.5 }); }
    else if (st.gehe) {
      const g = st.gehe;
      if (g.nurWennWoanders && G.mapId === g.map) return;
      G.fade = { t: 0, door: { to: g.map, tx: g.x, ty: g.y, dir: g.dir || 'down' }, done: false };
      this.warten('fade');
    }
    else if (st.schwarz) { G.fade = { t: 0, door: null, done: false, aktion: st.schwarz }; this.warten('fade'); }
    else if (st.tour) G.tourStart();
  },

  update(dt) {
    const a = this.a; if (!a) return;
    if (!DLG.open && (IN.take('a') || IN.take('b'))) this.schnell = true;
    const w = a.wait; if (!w) return;
    const k = this.schnell ? 4 : 1;
    w.t += dt * k;
    let fertig = false;
    if (w.art === 'zeit') fertig = w.t >= w.dauer;
    else if (w.art === 'figur') fertig = (!w.n.path || !w.n.path.length) && !w.n.moving || w.t > w.max;
    else if (w.art === 'spieler') fertig = (!G.autoPath || !G.autoPath.length) && !G.player.moving || w.t > w.max;
    else if (w.art === 'fade') fertig = !G.fade;
    if (fertig) { if (w.fertig) w.fertig(); a.wait = null; this.weiter(); }
  },
  // Wird jedes Bild aufgerufen (auch außerhalb von Szenen): Balken, Effekte
  tick(dt) {
    const sp = this.schnell ? 8 : 2.2;
    this.balken += clamp(this.balkenZiel - this.balken, -dt * sp, dt * sp);
    this.fxList = this.fxList.filter(f => G.time < f.bis);
    this.fxList.forEach(f => {
      if (f.mid !== G.mapId) return;
      const X = f.x * TILE + 16, Y = f.y * TILE + 16, W = (f.w || 1) * TILE;
      if (f.art === 'funken') for (let i = 0; i < 3; i++) R.parts.push({ x: X + (Math.random() - 0.5) * W, y: Y + (Math.random() - 0.5) * 24, vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 40, life: 0.9, t: 0, col: pickOne(['#ffd36a', '#ff8a2a', '#fff2b0']), mid: G.mapId, big: true });
      if (f.art === 'tropfen' && Math.random() < 0.7) R.parts.push({ x: X - W / 2 + Math.random() * W, y: Y - 20 + Math.random() * 30, vx: 0, vy: 40 + Math.random() * 30, life: 0.8, t: 0, col: '#9ad0ff', mid: G.mapId });
      if (f.art === 'schnee') for (let i = 0; i < 3; i++) R.parts.push({ x: X - W / 2 + Math.random() * W, y: Y, vx: (Math.random() - 0.5) * 30, vy: 30 + Math.random() * 50, life: 2.2, t: 0, col: '#eef4ff', mid: G.mapId, big: Math.random() < 0.4 });
      if (f.art === 'frost' && Math.random() < 0.5) R.parts.push({ x: X + (Math.random() - 0.5) * W, y: Y + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 6, vy: -4, life: 1.6, t: 0, col: '#cfe8ff', mid: G.mapId, soft: 1 });
    });
  },
  // Overlays über der Welt (unter der Dialogbox)
  draw(time) {
    const c = R.ctx;
    this.fxList.forEach(f => {
      if (f.art !== 'morgenlicht' || f.mid !== G.mapId) return;
      const k = Math.min(1, (time - f.t0) / 1, (f.bis - time) / 1);
      const g = c.createLinearGradient(0, 0, VIEW_W * 0.7, VIEW_H);
      g.addColorStop(0, 'rgba(255,214,140,' + (0.32 * k).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,214,140,0)');
      c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
    });
    const h = Math.round(this.balken * 34);
    if (h > 0) { c.fillStyle = '#000'; c.fillRect(0, 0, VIEW_W, h); c.fillRect(0, VIEW_H - h, VIEW_W, h); }
  },

  // Haken: andere Karte zeigen, ohne dass Charly dorthin geht
  ortZeigen(o) {
    if (!G.ortAlt) G.ortAlt = { mapId: G.mapId };
    G.mapId = o.map; G.hidePlayer = true; G.nacht = !!o.nacht;
    this.kamera = o.kamera || null; R.camMap = null;
    if (o.musik) AU.playMusic(o.musik);
  },
  ortZurueck() {
    const alt = G.ortAlt; if (!alt) return;
    G.ortAlt = null; G.mapId = alt.mapId; G.hidePlayer = false; G.nacht = false; this.kamera = null; R.camMap = null;
    AU.playMusic(DATA.maps[G.mapId].music);
  },
};
