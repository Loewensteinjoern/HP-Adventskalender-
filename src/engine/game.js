// ===== Spielablauf =====
const STEP_TIME = 0.17;

const G = {
  mode: 'title', save: null, key: SAVE_KEY, testDay: null, day: 0, kalender: 0, storeOk: true,
  guide: null, autoPath: null, objAlpha: {}, hidePlayer: false, nacht: false, ortAlt: null, frage: null, tuerHinweis: 0,
  mapId: null, player: null, followers: [], trail: null, revealed: {}, bannerMsg: null, fade: null,
  queue: [], lastTalk: {}, saveTimer: 0, dayTimer: 0, time: 0, sniffT: 0,

  init() {
    this.testDay = parseTestDay(location.search);
    this.key = this.testDay === null ? SAVE_KEY : TEST_KEY;
    this.refreshDay();
    try { localStorage.setItem('winterphoenix_probe', '1'); localStorage.removeItem('winterphoenix_probe'); } catch (e) { this.storeOk = false; }
    const r = this.storeOk ? storeLoad(localStorage, this.key) : { save: null };
    this.save = r.save;
    if (!this.storeOk) UI.toast('Speichern ist in diesem Browser nicht möglich (privater Modus?).');
    else if (r.broken && r.save) UI.toast('Spielstand wurde aus der Sicherung wiederhergestellt.');
    else if (r.broken) UI.toast('Der Spielstand war beschädigt. Er wurde aufgehoben, nicht gelöscht.');
    addEventListener('visibilitychange', () => { if (document.hidden) { this.persist(); AU.suspend(); } else { AU.resume(); this.refreshDay(true); } });
    addEventListener('pagehide', () => this.persist());
    AU.playMusic('titel');
  },
  // kalender = freigeschaltetes Türchen; day = Erzähltag (erst nach „Tag beenden“ und dem nächsten Morgen höher)
  refreshDay(announce) {
    this.kalender = this.testDay !== null ? this.testDay : unlockedDay(new Date());
    this.day = this.save ? Math.min(this.kalender, this.save.tag) : this.kalender;
    if (announce && this.save && this.mode === 'play' && !DLG.open && !this.fade) this.neuerTagPruefen();
  },
  neuerTagPruefen() {
    const s = this.save;
    if (!s.flags.prolog_fertig || this.kalender <= s.tag) return;
    if (s.tagEnde) return this.morgen();
    if (this.tuerHinweis !== this.kalender) { this.tuerHinweis = this.kalender; this.banner('Türchen ' + this.kalender + ' ist offen – beende den Tag am Kamin'); AU.sfx('tuerchen'); }
  },
  daysLeft() { if (this.testDay === null) return daysUntilStart(new Date()); return this.testDay > 0 ? 0 : Math.max(1, daysUntilStart(new Date())); },
  ctx() { return { flags: this.save.flags, day: this.day, done: this.save.done, followers: this.save.followers, glut: this.save.glut.length }; },
  persist() {
    if (!this.save || !this.storeOk || this.mode === 'title') return;
    const s = this.save, p = this.player;
    s.map = this.mapId; s.x = p.x; s.y = p.y; s.dir = p.dir; s.updated = Date.now();
    storeWrite(localStorage, this.key, s);
  },

  // --- Start eines Spiels ---
  startGame(save, isNew) {
    this.save = save; this.refreshDay();
    this.mode = 'play'; this.revealed = {}; this.trail = null; this.guide = null; this.tuerHinweis = 0;
    this.enterMap(save.map, save.x, save.y, save.dir);
    this.enterPlayEvents();
    this.persist();
  },
  // Neuer Morgen (falls fällig), Start-Dialoge freigeschalteter Quests, Prolog-Szenen
  enterPlayEvents() {
    const s = this.save;
    if (s.flags.prolog_fertig && s.tagEnde && this.kalender > s.tag) this.queue.push(() => this.morgen());
    else this.questStarts();
    if (s.wahl > 0) this.queue.push(() => this.stufeFrage());
    if (this.autoSzenen()) return;
    if (!DLG.open && this.mode === 'play') this.next();
  },
  questStarts() {
    const s = this.save;
    questIds().forEach(id => {
      const q = DATA.quests[id];
      if (q.start && q.day <= this.day && s.done.indexOf(id) < 0 && !s.flags['start_' + id])
        this.queue.push(() => { s.flags['start_' + id] = true; this.say(q.start); });
    });
  },
  next() { if (SZ.laeuft) return; const f = this.queue.shift(); if (f) f(); else this.autoSzenen(); },
  // Szenen, die von selbst starten, sobald ihre Bedingung stimmt (Prolog)
  autoSzenen() {
    if (!this.save || this.mode !== 'play' || DLG.open || SZ.laeuft || this.fade) return false;
    const a = (DATA.welt.auto || []).find(x => condsOk(x.if, this.ctx()));
    if (!a) return false;
    SZ.start(a.szene); return true;
  },
  szene(id, cb) { SZ.start(id, cb); },

  // --- Tagesablauf am Kamin ---
  questFuerTag(d) { const id = questIds().find(k => DATA.quests[k].day === d && !DATA.quests[k].neben); return id ? Object.assign({ id }, DATA.quests[id]) : null; },
  tagesAufgabeFertig() {
    const s = this.save;
    if (s.tag === 0) return !!s.flags.prolog_tor;
    const q = this.questFuerTag(s.tag);
    return !q || s.done.indexOf(q.id) >= 0;
  },
  tagEndeFrage() {
    const s = this.save;
    if (s.tagEnde) return DLG.show([['joern', 'Für heute ist Schluss. ' + this.naechstesTuerchen()]], () => this.next());
    if (!this.tagesAufgabeFertig()) return this.say(s.tag === 0 ? 'kamin_prolog_noch' : 'kamin_noch');
    this.frageStellen(s.tag === 0 ? 'Den ersten Tag beenden?' : 'Türchen ' + s.tag + ' beenden?', ['Ja, gute Nacht', 'Noch nicht'], r => { if (r === 0) this.tagBeenden(); else this.next(); });
  },
  tagBeenden() {
    const s = this.save, d = s.tag, q = this.questFuerTag(d);
    SZ.start(d === 0 ? 'nacht_prolog' : 'nacht', () => {
      s.tagEnde = true; if (d === 0) s.flags.prolog_fertig = true;
      this.persist();
      const haken = d === 0 ? DATA.welt.haken0 : q && q.haken;
      const danach = () => this.morgenOderWarten();
      const zeigeHaken = () => (haken && DATA.szenen[haken] ? SZ.start(haken, danach) : danach());
      if (q && s.fragments.indexOf(q.id) >= 0) this.liedZeigen(q.day, zeigeHaken);
      else zeigeHaken();
    });
  },
  morgenOderWarten() {
    if (this.kalender > this.save.tag) return this.morgen();
    DLG.show([['', this.naechstesTuerchen()]], () => this.next());
  },
  naechstesTuerchen() {
    const s = this.save;
    if (s.tag >= 24) return 'Alle Türchen sind offen. Frohe Weihnachten!';
    if (this.testDay !== null) return 'Testmodus: Das nächste Türchen öffnet sich mit ?testtag=' + (s.tag + 1) + '.';
    if (this.kalender === 0) { const n = daysUntilStart(new Date()); return 'Das erste Türchen öffnet sich in ' + n + (n === 1 ? ' Tag' : ' Tagen') + '. Bis dahin kannst du das Schloss weiter erkunden.'; }
    const h = hoursUntilNextDay(new Date());
    return 'Nächstes Türchen in ' + h + (h === 1 ? ' Stunde' : ' Stunden') + '. Du kannst noch weiter erkunden oder das Spiel schließen – alles ist gespeichert.';
  },
  morgen() {
    const s = this.save;
    s.tag = Math.min(24, s.tag + 1); s.tagEnde = false; s.seenDay = Math.max(s.seenDay, s.tag);
    this.refreshDay(); this.tuerHinweis = 0; this.persist();
    // Tag 1 beginnt mit der Szene am Tor (Raureifs Schrift, Legende der Splitter).
    // Beim ersten Morgen erklärt Jörn danach den Baumschmuck, später nur ein kurzer Hinweis.
    const erklaeren = !s.flags.erklaert_schmuck; s.flags.erklaert_schmuck = true;
    SZ.start(s.tag === 1 ? 'tor_1' : 'morgen', () => {
      const q = this.questFuerTag(s.tag);
      const los = () => { this.banner('Türchen ' + s.tag + ' ist offen' + (q ? ': ' + q.title : '!')); AU.sfx('tuerchen'); this.questStarts(); this.next(); };
      if (erklaeren) DLG.show(this.lines('schmuck_erklaerung'), los); else los();
    });
  },
  // Phönixlied-Seite mit neu auftauender Zeile (am Abend)
  liedZeigen(tag, cb) {
    this.liedNeu = { tag, t0: this.time, cb, reim: false, strophe: false };
    this.mode = 'lied'; UI.scroll = Math.max(0, Math.floor((tag - 1) / 4) * 5 - 2);
    AU.melodie(DATA.lied.melodie[(tag - 1) % 4], DATA.lied.takt);
  },
  frageStellen(titel, opts, cb) { this.frage = { titel, opts, cb }; this.mode = 'frage'; UI.sel = 0; },

  // --- Führung mit Prof. Wurzelgrün ---
  tourAktiv() { const f = this.save.flags; return !!f.prolog_fest && !f.prolog_tour && isNum(f.tour); },
  tourStation() { return this.tourAktiv() ? DATA.fuehrung.stationen[this.save.flags.tour] || null : null; },
  // Wurzelgrün übernimmt die Führung dort, wo sie als Figur gerade steht
  tourStart() {
    const n = this.npcByChar('wurzelgruen'), pos = n ? { x: n.x, y: n.y } : null;
    this.save.flags.prolog_fest = true; this.save.flags.tour = 0;
    this.guideSpawn(pos);
  },
  guideSpawn(start) {
    this.guide = null;
    const st = this.tourStation(); if (!st || st.map !== this.mapId) return;
    const m = DATA.maps[this.mapId], p = this.player, ctx = this.ctx();
    let pos = start || null;
    if (!pos) {
      const order = [p.dir].concat(Object.keys(DIRS).filter(d => d !== p.dir));
      for (const d of order) { const x = p.x + DIRS[d][0], y = p.y + DIRS[d][1]; if (!blockedAt(m, x, y, ctx) && !doorAt(m, x, y) && !this.occupied(x, y)) { pos = { x, y }; break; } }
    }
    if (!pos) pos = { x: p.x, y: p.y };
    const g = this.guide = { char: 'wurzelgruen', x: pos.x, y: pos.y, fx: pos.x, fy: pos.y, t: 1, moving: false, par: 0, dir: 'down', path: null, weg: false, cd: 3 };
    g.dir = p.x > g.x ? 'right' : p.x < g.x ? 'left' : p.y < g.y ? 'up' : 'down';
    if (st.dialog) this.queue.push(() => this.say(st.dialog, () => this.guideLos()));
    else this.guideLos();
  },
  guideLos() {
    const g = this.guide, st = this.tourStation(); if (!g || !st) return;
    const m = DATA.maps[this.mapId], ctx = this.ctx();
    let best = null;
    const ziele = st.nach ? (m.doors || []).filter(d => d.to === st.nach) : [{ x: st.ziel[0], y: st.ziel[1] }];
    ziele.forEach(z => { const path = findPath(m, { x: g.x, y: g.y }, z, ctx, 120); if (path && (!best || path.length < best.length)) best = path; });
    if (!best) { g.path = []; return; }
    g.tuer = st.nach && best.length > 1 ? best.pop() : null;
    g.path = best.slice(1); g.dirEnde = st.dir || null;
  },
  guideUpdate(dt) {
    const g = this.guide; if (!g || g.weg) return;
    if (g.moving) { g.t += dt / (STEP_TIME * 1.4); if (g.t >= 1) { g.t = 1; g.moving = false; g.fx = g.x; g.fy = g.y; if (g.gehtRaus) g.weg = true; } return; }
    const p = this.player;
    if (g.path && g.path.length) {
      const n = g.path[0];
      if ((p.x === n.x && p.y === n.y) || this.followers.some(f => f.x === n.x && f.y === n.y)) { g.warte = (g.warte || 0) + dt; if (g.warte < 0.6) return; }
      g.warte = 0; g.path.shift();
      g.dir = n.x > g.x ? 'right' : n.x < g.x ? 'left' : n.y > g.y ? 'down' : 'up';
      g.fx = g.x; g.fy = g.y; g.x = n.x; g.y = n.y; g.t = 0; g.moving = true; g.par ^= 1;
      return;
    }
    if (!g.path) return;
    const dist = Math.abs(p.x - g.x) + Math.abs(p.y - g.y);
    if (g.tuer && dist <= 1 && this.mode === 'play' && !DLG.open) {
      // Sie geht schon mal vor
      g.dir = g.tuer.x > g.x ? 'right' : g.tuer.x < g.x ? 'left' : g.tuer.y > g.y ? 'down' : 'up';
      g.fx = g.x; g.fy = g.y; g.x = g.tuer.x; g.y = g.tuer.y; g.t = 0; g.moving = true; g.gehtRaus = true;
      return;
    }
    g.dir = g.dirEnde && dist > 3 ? g.dirEnde : (p.x > g.x ? 'right' : p.x < g.x ? 'left' : p.y < g.y ? 'up' : 'down');
    g.cd -= dt;
    if (g.cd <= 0 && dist > 3 && !this.bubble) { g.cd = 6; this.bubble = { e: g, text: g.tuer ? 'Hier entlang!' : pickOne(DATA.characters.wurzelgruen.blasen), t0: this.time }; }
  },
  // Während der Führung führt nur die richtige Tür weiter
  tourTuerOk(d) {
    const st = this.tourStation();
    if (!st || st.map !== this.mapId || !this.guide || d.to === st.nach) return true;
    const ziel = (DATA.maps[this.mapId].doors || []).find(x => x.to === st.nach);
    if (this.guide.weg && ziel) { const path = findPath(DATA.maps[this.mapId], this.player, ziel, this.ctx(), 60); if (path) this.trail = { pts: path, target: { x: ziel.x, y: ziel.y }, t0: this.time }; }
    else this.bubble = { e: this.guide, text: 'Hier entlang, bitte!', t0: this.time };
    return false;
  },
  guideFrage() {
    const st = this.tourStation(), letzte = this.save.flags.tour >= DATA.fuehrung.stationen.length - 1;
    if (letzte) return this.say(st.hinweis || 'tour_hinweis');
    this.frageStellen('Prof. Wurzelgrün', ['Weiter, ich folge Ihnen', 'Führung abkürzen'], r => {
      if (r !== 1) return this.say('tour_weiter');
      const A = DATA.fuehrung.abkuerzen;
      this.save.flags.tour = DATA.fuehrung.stationen.length - 1; this.guide = null;
      DLG.show(this.lines('tour_abkuerzen'), () => { this.fade = { t: 0, door: { to: A.map, tx: A.x, ty: A.y, dir: A.dir }, done: false }; });
    });
  },
  // Figuren für Szenen
  npcByChar(ch) { return visibleNpcs(DATA.maps[this.mapId], this.ctx()).find(n => n.char === ch) || null; },
  npcWalk(n, to, dir) {
    const m = DATA.maps[this.mapId];
    if (n.hx === undefined) { n.hx = n.x; n.hy = n.y; n.fx = n.x; n.fy = n.y; n.t = 1; n.par = 0; n.cd = 1; }
    const path = findPath(m, { x: n.x, y: n.y }, { x: to[0], y: to[1] }, this.ctx(), 80);
    n.skript = true; n.endDir = dir || null;
    if (path) n.path = path.slice(1);
    else { n.x = n.fx = to[0]; n.y = n.fy = to[1]; n.path = []; }
  },
  walkPlayer(to, dir) {
    const path = findPath(DATA.maps[this.mapId], this.player, { x: to[0], y: to[1] }, this.ctx(), 80);
    this.autoPath = path ? path.slice(1) : []; this.autoDir = dir || null;
  },
  stepTo(nx, ny) {
    const p = this.player;
    p.dir = nx > p.x ? 'right' : nx < p.x ? 'left' : ny > p.y ? 'down' : 'up';
    let px = p.x, py = p.y;
    this.followers.forEach(f => {
      const ox = f.x, oy = f.y;
      if (ox !== px || oy !== py) { f.fx = ox; f.fy = oy; f.x = px; f.y = py; f.moving = true; f.t = 0; f.par ^= 1; f.dir = px > ox ? 'right' : px < ox ? 'left' : py > oy ? 'down' : 'up'; }
      px = ox; py = oy;
    });
    p.fx = p.x; p.fy = p.y; p.x = nx; p.y = ny; p.moving = true; p.t = 0; p.par ^= 1;
  },
  banner(text) { this.bannerMsg = { text, t0: this.time }; },

  enterMap(mid, x, y, dir) {
    this.mapId = mid; this.bubble = null; this.autoPath = null;   // ein angefangener Weg gilt nur im alten Raum
    this.player = { x, y, fx: x, fy: y, dir, t: 1, moving: false, par: 0 };
    const back = DIRS[dir] ? [-DIRS[dir][0], -DIRS[dir][1]] : [0, 1], m = DATA.maps[mid];
    let bx = x, by = y;
    this.followers = this.save.followers.map(ch => {
      const nx = bx + back[0], ny = by + back[1];
      if (!blockedAt(m, nx, ny, this.ctx()) && !doorAt(m, nx, ny)) { bx = nx; by = ny; }
      return { char: ch, x: bx, y: by, fx: bx, fy: by, dir, t: 1, moving: false, par: 0, pose: null };
    });
    const s = this.save;
    if (s.besucht.indexOf(mid) < 0) s.besucht.push(mid);
    // Drinnen (ohne Kämpfe) ist es warm: Wärme voll, Ort merken für das Aufwachen nach einer Niederlage
    if (!m.kampf) { s.waerme = waermeMax(s); s.energie = ENERGIE_MAX; s.warm = { map: mid, x, y, dir }; }
    this.kampfSchritte = 0; this.alarm = null;
    AU.playMusic(m.music);
    if (this.save.flags.prolog_fest && !this.save.flags.prolog_tour) this.guideSpawn(); else this.guide = null;
  },

  // --- Hilfen für die Darstellung ---
  renderPos(e) { const t = e.moving ? e.t : 1; return { x: Math.round((e.fx + (e.x - e.fx) * t) * TILE), y: Math.round((e.fy + (e.y - e.fy) * t) * TILE) }; },
  walkFrame(e) { if (!e.moving) return 0; return e.t < 0.5 ? (e.par ? 1 : 2) : 0; },

  // --- Hauptschleife ---
  update(dt) {
    this.time += dt;
    if (UI.panelOpen()) { IN.clear(); return; }
    if (this.mode === 'title') return this.updateTitle();
    this.saveTimer += dt; if (this.saveTimer > 30) { this.saveTimer = 0; this.persist(); }
    this.dayTimer += dt; if (this.dayTimer > 60) { this.dayTimer = 0; this.refreshDay(true); }
    this.save.playMs += dt * 1000;
    SZ.tick(dt);
    if (this.fade) return this.updateFade(dt);
    if (this.mode === 'szene') {
      this.updateNpcs(dt); this.guideUpdate(dt); this.moveTick(dt, false);
      if (DLG.open) DLG.update(dt); else SZ.update(dt);
      return;
    }
    if (DLG.open) { DLG.update(dt); this.moveTick(dt, false); return; }
    if (this.mode === 'frage') {
      const r = UI.navigate(this.frage.opts.length);
      if (r === null) return;
      const f = this.frage; this.frage = null; this.mode = 'play'; f.cb(r); return;
    }
    if (this.mode === 'menu') return this.updateMenu();
    if (this.mode === 'rueck') return this.updateRueck();
    if (this.mode === 'mini') return this.updateMini(dt);
    if (this.mode === 'zauber') return this.updateSpell();
    if (this.mode === 'kampf') return KB.update(dt);
    if (this.mode === 'stufe') return this.updateStufe();
    if (this.alarm) { this.alarm.t -= dt; this.moveTick(dt, false); if (this.alarm.t <= 0) { const g = this.alarm.g; this.alarm = null; this.startFight(g, null); } return; }
    if (this.demo) this.updateDemo();
    this.updateNpcs(dt); this.guideUpdate(dt);
    if (this.mode === 'questlog' || this.mode === 'lied' || this.mode === 'karte' || this.mode === 'hilfe') {
      if (IN.take('up')) UI.scroll--; if (IN.take('down')) UI.scroll++;
      const L = this.liedNeu;
      if (this.mode === 'lied' && L) {
        if (IN.take('a') || IN.take('b') || IN.take('menu')) { if (this.time - L.t0 < 3.4) { L.t0 = this.time - 3.4; return; } this.liedNeu = null; this.mode = 'play'; AU.sfx('menue'); L.cb(); }
        return;
      }
      if (IN.take('a') || IN.take('b') || IN.take('menu')) { AU.sfx('zurueck'); this.mode = 'menu'; }
      return;
    }
    if (this.sniffT > 0) { this.sniffT -= dt; if (this.sniffT <= 0) this.sniffDone(); this.moveTick(dt, false); return; }
    if (IN.take('menu')) { AU.sfx('menue'); this.mode = 'menu'; UI.sel = 0; return; }
    if (IN.take('a')) { if (!this.player.moving) this.interact(); }
    else if (IN.take('b')) { if (!this.player.moving) this.sniff(); }
    this.moveTick(dt, true);
  },
  moveTick(dt, allowInput) {
    const all = [this.player].concat(this.followers);
    let arrived = false;
    all.forEach(e => { if (e.moving) { e.t += dt / STEP_TIME; if (e.t >= 1) { e.t = 1; e.moving = false; e.fx = e.x; e.fy = e.y; if (e === this.player) arrived = true; } } });
    if (arrived && this.mode !== 'szene' && this.onArrive()) return;
    if (this.autoPath && !this.player.moving) {
      if (this.autoPath.length) { const n = this.autoPath.shift(); this.stepTo(n.x, n.y); }
      else { if (this.autoDir) this.player.dir = this.autoDir; this.autoPath = null; }
      return;
    }
    if (this.turnHold > 0) { this.turnHold -= dt; if (!IN.dir()) this.turnHold = 0; }
    if (allowInput && !this.player.moving) { const d = IN.dir(); if (d) this.tryMove(d); }
  },
  tryMove(d) {
    const p = this.player, m = DATA.maps[this.mapId], ctx = this.ctx();
    const nx = p.x + DIRS[d][0], ny = p.y + DIRS[d][1];
    // Steht Jörn oder Diego direkt dort: erst nur umdrehen (dann kann man sie mit A ansprechen), beim nächsten Druck Platz tauschen
    if (p.dir !== d && this.followers.some(f => f.x === nx && f.y === ny)) { p.dir = d; this.turnHold = 0.25; return; }
    if (this.turnHold > 0) return;
    p.dir = d;
    if (blockedAt(m, nx, ny, ctx)) {
      const o = objAt(m, nx, ny, ctx), sp = spotAt(m, nx, ny, ctx);
      if (o && o.bump && o.talk) this.runTalk(pickTalk(o.talk, ctx));
      else if (sp && sp.bump) this.runTalk(pickTalk(sp.talk, ctx));
      return;
    }
    const tuer = doorAt(m, nx, ny);
    if (tuer && this.tourAktiv() && !this.tourTuerOk(tuer)) return;
    this.stepTo(nx, ny);
  },
  onArrive() {
    const m = DATA.maps[this.mapId], d = doorAt(m, this.player.x, this.player.y);
    if (d) {
      const st = this.tourStation();
      if (st && st.map === this.mapId && d.to === st.nach) this.save.flags.tour++;
      AU.sfx('tuer'); this.fade = { t: 0, door: d, done: false }; return true;
    }
    const nah = this.revealedNear(); if (nah) { this.findSecret(nah); return true; }
    return this.checkEncounter(m);
  },
  // --- Kämpfe: plötzliche Überfälle im tiefen Schnee ---
  checkEncounter(m) {
    const K = m.kampf, p = this.player;
    if (!K || !condsOk(K.if, this.ctx()) || !(DATA.tiles[tileChar(m, p.x, p.y)] || {}).kampf) return false;
    this.kampfSchritte = (this.kampfSchritte || 0) + 1;
    const chance = this.kampfTest !== undefined ? this.kampfTest : K.chance;
    if (this.kampfSchritte <= (K.schonung || 0) && this.kampfTest === undefined) return false;
    if (Math.random() >= chance) return false;
    const g = kampfGruppeWaehlen(K, this.day, null, this.save.stufe);
    if (!g) return false;
    // Diego spürt die Gefahr zuerst
    const d = this.followers.find(f => f.char === 'diego');
    AU.sfx('knurren');
    if (d) { d.dir = p.dir; this.bubble = { e: d, text: 'Grrr …!', t0: this.time }; }
    this.alarm = { t: d ? 0.9 : 0.4, g };
    return true;
  },
  // Neue Stufe: Charly wählt mehr Kraft oder mehr Lebenspunkte
  stufeFrage() { if (!(this.save.wahl > 0)) return this.next(); this.mode = 'stufe'; UI.sel = 0; },
  updateStufe() {
    const r = UI.navigate(2);
    if (r === null || r < 0) return;
    stufeWaehlen(this.save, r === 0 ? 'kraft' : 'lp'); AU.sfx('fund');
    this.banner(r === 0 ? 'Kraft ' + this.save.kraft + ': Charlys Zauber treffen stärker' : 'Lebenspunkte: Wärme jetzt ' + waermeMax(this.save));
    this.persist();
    if (this.save.wahl > 0) return;
    this.mode = 'play'; this.next();
  },
  startFight(gruppe, talk) {
    const s = this.save;
    this.mode = 'kampf'; this.bubble = null; this.trail = null;
    AU.sfx('kampf'); AU.playMusic('kampf');
    KB.start(gruppe, { max: waermeMax(s), waerme: s.waerme, energie: s.energie, kakao: s.kakao, kraft: s.kraft, zauber: this.spells(), diego: s.followers.indexOf('diego') >= 0, joern: s.followers.indexOf('joern') >= 0 },
      (ende, F) => this.endFight(ende, F, talk));
  },
  endFight(ende, F, talk) {
    const s = this.save, m = DATA.maps[this.mapId];
    this.mode = 'play'; this.kampfSchritte = 0;
    s.waerme = Math.max(1, F.waerme); s.energie = F.energie; s.kakao = F.kakao;
    if (ende === 'kalt') {
      // Kein Game Over: Charly wacht am letzten warmen Ort auf
      const w = s.warm || DATA.welt.start;
      s.waerme = waermeMax(s); s.energie = ENERGIE_MAX;
      this.fade = { t: 0, door: { to: w.map, tx: w.x, ty: w.y, dir: w.dir || 'down' }, done: false };
      this.queue.push(() => this.say('kampf_aufwachen'));
      setTimeout(() => { if (!DLG.open) this.next(); }, 700);
      this.persist(); return;
    }
    AU.playMusic(m.music);
    if (ende === 'sieg') {
      s.flags.siege = (s.flags.siege || 0) + 1;
      const ep = F.gegner.reduce((n, e) => n + (DATA.kampf.gegner[e.id].ep || 0), 0);
      const neu = epGeben(s, ep);
      this.banner(neu ? 'Charly erreicht Stufe ' + s.stufe + '!' : '+' + ep + ' Erfahrung');
      if (neu) AU.sfx('tuerchen');
      if (talk && talk.win) this.runTalk(talk.win);
      if (s.wahl > 0) this.queue.push(() => this.stufeFrage());
    }
    this.persist();
    if (!DLG.open) this.next();
  },
  updateFade(dt) {
    const f = this.fade; f.t += dt / 0.5;
    if (f.t >= 0.5 && !f.done) {
      f.done = true; this.trail = null;
      if (f.door) { this.enterMap(f.door.to, f.door.tx, f.door.ty, f.door.dir); this.persist(); }
      if (f.aktion) this.applyAction(f.aktion);
    }
    if (f.t >= 1) { this.fade = null; if (!DLG.open && this.mode === 'play') this.next(); }
    IN.clear();
  },

  // --- Sprechen und Untersuchen ---
  interact() {
    const p = this.player, m = DATA.maps[this.mapId], ctx = this.ctx();
    const tx = p.x + DIRS[p.dir][0], ty = p.y + DIRS[p.dir][1];
    const g = this.guide;
    if (g && !g.weg && g.x === tx && g.y === ty) { g.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir]; return this.guideFrage(); }
    const f = this.followers.find(e => e.x === tx && e.y === ty);
    if (f) { f.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir]; return this.runTalk(pickTalk(DATA.characters[f.char].talk, ctx)); }
    const n = npcAt(m, tx, ty, ctx);
    if (n) { if (n.pose !== 'schlaf') n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir]; return this.runTalk(pickTalk(n.talk, ctx)); }
    const sec = secretAt(m, tx, ty, ctx);
    if (sec && (DATA.maps[this.mapId].secrets || []).some(s => (this.revealed[s.id] || s.offen) && s.x === sec.x && s.y === sec.y)) return this.findSecret(sec);
    const nah = this.revealedNear(); if (nah) return this.findSecret(nah);
    const o = objAt(m, tx, ty, ctx);
    if (o && o.talk) return this.runTalk(pickTalk(o.talk, ctx));
    const sp = spotAt(m, tx, ty, ctx);
    if (sp && sp.talk) return this.runTalk(pickTalk(sp.talk, ctx));
  },
  // Dialogtext mit Platzhaltern
  lines(id) {
    return DATA.dialogs[id].map(([sp, tx, taste]) => [sp, tx.replace(/\{tage\}/g, String(this.daysLeft())).replace(/\{tag\}/g, String(this.day)).replace(/\{schmuck\}/g, String(this.schmuckZahl())), taste]);
  },
  // Schritt-Flags aller offenen Aufgaben, die noch fehlen: { flag: 'tag' | 'neben' }
  offeneSchritte() {
    const s = this.save, out = {};
    questIds().forEach(id => {
      const q = DATA.quests[id];
      if (q.day > this.day || s.done.indexOf(id) >= 0) return;
      q.steps.forEach(st => stepFlags(st).forEach(f => { if (!s.flags[f]) out[f] = q.neben ? 'neben' : 'tag'; }));
    });
    return out;
  },
  // Hat diese Figur gerade etwas für eine Aufgabe? (goldenes „!“ über dem Kopf)
  hatAufgabe(n, offen) {
    const t = pickTalk(n.talk, this.ctx()); if (!t) return false;
    const sets = (t.set || []).concat(t.win && t.win.set || []);
    return sets.some(f => offen[f]);
  },
  schmuckZahl() { return Object.keys(this.save.flags).filter(k => k.indexOf('schmuck_') === 0).length; },
  // Rückblicke: gesehene Haken noch einmal ansehen
  rueckblicke() {
    const s = this.save, R0 = DATA.welt.rueckblicke || {};
    return Object.keys(R0).filter(id => {
      const d = +((/(\d+)/.exec(id) || [0, 0])[1]);
      return s.flags['gesehen_' + id] || s.tag > d || (s.tag === d && s.tagEnde) || (d === 0 && s.flags.prolog_fertig);
    }).map(id => ({ id, label: R0[id] }));
  },
  updateRueck() {
    const L = this.rueckblicke(), r = UI.navigate(L.length + 1);
    if (r === null) return;
    if (r < 0 || r === L.length) { this.mode = 'menu'; UI.sel = 3; return; }
    this.mode = 'play'; SZ.start(L[r].id);
  },
  say(id, cb) { DLG.show(this.lines(id), () => { if (cb) cb(); this.next(); }); },
  runTalk(t, cast) {
    if (!t) return;
    // Zauber nötig: erst das Zaubermenü, nur der richtige Spruch wirkt
    if (t.zauber && !cast) {
      const known = this.spells();
      if (!known.length) return this.say('zauber_keine');
      this.spellAsk = t; this.mode = 'zauber';
      UI.sel = Math.max(0, known.indexOf(this.lastSpell)); AU.sfx('menue');
      return;
    }
    let id = t.dialog;
    if (Array.isArray(id)) { const opts = id.filter(x => x !== this.lastTalk[id.join()]); id = pickOne(opts.length ? opts : id); this.lastTalk[t.dialog.join()] = id; }
    if (t.sound) AU.sfx(t.sound);
    if (t.seq) return this.seqPress(t.seq, t.val);
    const apply = () => {
      this.applyAction(t);
      if (t.demo) this.demo = { id: t.demo, t0: this.time, played: -1 };
      if (t.minigame) this.startMini(t.minigame, () => this.runTalk(t.win));
      if (t.kampf) this.startFight(t.kampf, t);
      if (t.szene) SZ.start(t.szene);
      if (t.tagende) { this.tagEndeFrage(); return true; }
    };
    if (id) this.say(id, apply);
    else if (!apply() && !t.szene && !t.kampf && !t.minigame) this.next();
  },
  // --- Reihenfolge-Rätsel (z. B. singende Kerzen) ---
  seqPress(id, val) {
    const P = DATA.puzzles[id], f = this.save.flags, n = P.order.filter(v => f[id + '_' + v]).length;
    const note = P.notes[val - 1];
    if (f[id + '_' + val]) { AU.note(note); return; }
    if (P.order[n] === val) {
      f[id + '_' + val] = true; AU.note(note);
      if (n + 1 === P.order.length) this.runTalk(P.win); else this.persist();
    } else {
      P.order.forEach(v => { delete f[id + '_' + v]; });
      AU.sfx(P.failSound || 'jaul');
      this.runTalk(P.fail);
    }
  },
  // --- Takt-Minispiel (Uhrmeister): Schläge merken und nachmachen ---
  spells() { return Object.keys(DATA.zauber).filter(z => this.save.flags['zauber_' + z]); },
  updateSpell() {
    const known = this.spells(), opts = known.length + 1, r = UI.navigate(opts);
    if (r === null) return;
    const t = this.spellAsk; this.spellAsk = null; this.mode = 'play';
    if (r < 0 || r === known.length) return;
    const z = known[r]; this.lastSpell = z;
    if (z === t.zauber) { AU.sfx('zauber'); this.castFx = { t0: this.time, z }; this.runTalk(t, true); }
    else { AU.sfx('zauber'); DLG.show([['charly', DATA.zauber[z].name + '!'], ['', DATA.zauber[z].falsch]], () => this.next()); }
  },
  startMini(cfg, onWin) {
    if (cfg.type === 'uhr') {
      this.mini = { cfg, onWin, type: 'uhr', round: 0, hour: 12, phase: 'frage', t: 0, fragen: DATA.puzzles[cfg.raetsel].fragen };
      this.mode = 'mini'; return;
    }
    const dirs = ['up', 'right', 'down', 'left'], seq = [];
    for (let i = 0; i < cfg.rounds[0]; i++) seq.push(pickOne(dirs));
    this.mini = { cfg, onWin, round: 0, seq, phase: 'show', t: -0.6, idx: -1, pos: 0, lit: null, litT: 0 };
    this.mode = 'mini';
  },
  updateMini(dt) {
    if (this.mini.type === 'uhr') return this.updateUhr(dt);
    const M = this.mini, dirs = ['up', 'right', 'down', 'left'];
    M.t += dt; M.litT -= dt; if (M.litT <= 0) M.lit = null;
    if (IN.take('b') || IN.take('menu')) { this.mini = null; this.mode = 'play'; this.say('takt_abbruch'); return; }
    if (M.phase === 'show') {
      const i = Math.floor(M.t / 0.62);
      if (i > M.idx && i < M.seq.length && M.t >= 0) { M.idx = i; M.lit = M.seq[i]; M.litT = 0.42; AU.tick(M.seq[i]); }
      if (M.t > M.seq.length * 0.62 + 0.2) { M.phase = 'input'; M.pos = 0; }
      IN.clear();
    } else if (M.phase === 'input') {
      const d = dirs.find(k => IN.take(k));
      if (!d) return;
      M.lit = d; M.litT = 0.25; AU.tick(d);
      if (d !== M.seq[M.pos]) { M.phase = 'fail'; M.t = 0; AU.sfx('jaul'); return; }
      M.pos++;
      if (M.pos >= M.seq.length) { M.phase = 'ok'; M.t = 0; AU.sfx('spur'); }
    } else if (M.phase === 'fail' && M.t > 1.4) { M.phase = 'show'; M.t = -0.3; M.idx = -1; }
    else if (M.phase === 'ok' && M.t > 1.1) {
      M.round++;
      if (M.round >= M.cfg.rounds.length) { const cb = M.onWin; this.mini = null; this.mode = 'play'; cb(); return; }
      while (M.seq.length < M.cfg.rounds[M.round]) M.seq.push(pickOne(dirs));
      M.phase = 'show'; M.t = -0.3; M.idx = -1;
    }
  },
  applyAction(t) {
    const s = this.save;
    (t.set || []).forEach(f => { s.flags[f] = true; });
    (t.unset || []).forEach(f => { delete s.flags[f]; });
    if (t.join && s.followers.indexOf(t.join) < 0) {
      s.followers.push(t.join);
      const m = DATA.maps[this.mapId], n = (m.npcs || []).find(n => n.char === t.join);
      const last = this.followers[this.followers.length - 1] || this.player;
      const at = n || last;
      this.followers.push({ char: t.join, x: at.x, y: at.y, fx: at.x, fy: at.y, dir: 'down', t: 1, moving: false, par: 0, pose: null });
    }
    if (t.glut && s.glut.indexOf(t.glut) < 0) {
      const vor = waermeMax(s); s.glut.push(t.glut); const nach = waermeMax(s);
      s.waerme = Math.min(nach, s.waerme + (nach - vor));
      this.banner(nach > vor ? 'Charly ist wärmer geworden! Wärme ' + nach : 'Glutsplitter ' + s.glut.length + ' – noch ' + (3 - s.glut.length % 3) + ' bis zu mehr Wärme');
    }
    if (t.schmuck && !s.flags['schmuck_' + t.schmuck]) { s.flags['schmuck_' + t.schmuck] = true; this.banner('Neuer Schmuck für den Baum in der Großen Halle!'); }
    if (t.geheimnis && s.secrets.indexOf(t.geheimnis) < 0) s.secrets.push(t.geheimnis);
    if (t.leave) { s.followers = s.followers.filter(c => c !== t.leave); this.followers = this.followers.filter(f => f.char !== t.leave); }
    const neu = updateQuests(s, this.day);
    neu.forEach(id => this.queue.push(() => {
      if (DATA.quests[id].neben) { AU.sfx('fund'); this.banner('Nebenaufgabe erledigt: ' + DATA.quests[id].title); this.next(); return; }
      setTimeout(() => AU.sfx('tuerchen'), 900); this.banner('Winterfragment ' + DATA.quests[id].day + ' gefunden!');
      DLG.show([['', 'Ein eisblauer Splitter leuchtet auf. Darin klingt eine Zeile des Phönixlieds:'], ['', '„' + liedZeile(DATA.quests[id].day) + '“']], () => this.next()); }));
    this.persist();
  },

  // Uhr-Rätsel: Denkaufgabe lesen, Zeiger stellen, mit A bestätigen
  updateUhr(dt) {
    const M = this.mini; M.t += dt;
    if (IN.take('b') || IN.take('menu')) { this.mini = null; this.mode = 'play'; this.say('takt_abbruch'); return; }
    if (M.phase === 'ok') { if (M.t > 1.6) { M.round++; M.phase = 'frage'; M.t = 0; M.hour = 12; if (M.round >= M.fragen.length) { const cb = M.onWin; this.mini = null; this.mode = 'play'; cb(); } } return; }
    if (M.phase === 'falsch' && M.t > 1.6) { M.phase = 'frage'; M.t = 0; }
    if (IN.take('right') || IN.take('up')) { M.hour = M.hour % 12 + 1; AU.sfx('zahnrad'); }
    if (IN.take('left') || IN.take('down')) { M.hour = (M.hour + 10) % 12 + 1; AU.sfx('zahnrad'); }
    if (IN.take('a') && M.phase === 'frage') {
      if (M.hour === M.fragen[M.round].stunde) { M.phase = 'ok'; M.t = 0; AU.sfx('fund'); }
      else { M.phase = 'falsch'; M.t = 0; AU.sfx('stoss'); }
    }
  },
  // --- Belebung: Figuren schauen sich um, laufen ein Stück, sagen etwas ---
  occupied(x, y) {
    const p = this.player;
    return (p.x === x && p.y === y) || (p.fx === x && p.fy === y) || this.followers.some(f => (f.x === x && f.y === y) || (f.fx === x && f.fy === y));
  },
  updateNpcs(dt) {
    const m = DATA.maps[this.mapId], ctx = this.ctx(), list = visibleNpcs(m, ctx);
    list.forEach(n => {
      if (n.hx === undefined) { n.hx = n.x; n.hy = n.y; n.fx = n.x; n.fy = n.y; n.t = 1; n.par = 0; n.cd = 1 + Math.random() * 3; }
      if (n.moving) { n.t += dt / (STEP_TIME * (n.skript ? 1.3 : 2)); if (n.t >= 1) { n.t = 1; n.moving = false; n.fx = n.x; n.fy = n.y; } return; }
      // Szenen: Figur läuft einen vorgegebenen Weg
      if (n.skript) {
        if (n.path && n.path.length) {
          const q = n.path[0];
          if (this.occupied(q.x, q.y) && n.path.length > 1) return;
          n.path.shift(); if (this.occupied(q.x, q.y)) { n.path = []; return; }
          n.dir = q.x > n.x ? 'right' : q.x < n.x ? 'left' : q.y > n.y ? 'down' : 'up';
          n.fx = n.x; n.fy = n.y; n.x = q.x; n.y = q.y; n.t = 0; n.moving = true; n.par ^= 1;
        } else if (n.endDir) { n.dir = n.endDir; n.endDir = null; }
        return;
      }
      if (n.pose === 'schlaf') return;
      n.cd -= dt; if (n.cd > 0) return;
      n.cd = 1.4 + Math.random() * 2.8;
      if (n.wander) {
        const d = pickOne(Object.keys(DIRS)), nx = n.x + DIRS[d][0], ny = n.y + DIRS[d][1];
        n.dir = d;
        if (Math.random() < 0.3 || Math.abs(nx - n.hx) + Math.abs(ny - n.hy) > n.wander) return;
        if (blockedAt(m, nx, ny, ctx) || doorAt(m, nx, ny) || this.occupied(nx, ny) || (m.secrets || []).some(q => q.x === nx && q.y === ny)) return;
        n.fx = n.x; n.fy = n.y; n.x = nx; n.y = ny; n.t = 0; n.moving = true; n.par ^= 1;
      } else if (n.turn) n.dir = pickOne(Array.isArray(n.turn) ? n.turn : Object.keys(DIRS));
    });
    // Sprechblasen
    this.bubbleCd = (this.bubbleCd || 3) - dt;
    if (this.bubble && this.time - this.bubble.t0 > 3.2) this.bubble = null;
    if (this.bubbleCd <= 0 && !this.bubble && this.mode !== 'szene') {
      this.bubbleCd = 3.5 + Math.random() * 5;
      const pool = list.filter(n => (DATA.characters[n.char].blasen || []).length).map(n => ({ e: n, ch: n.char }))
        .concat(this.followers.filter(f => (DATA.characters[f.char].blasen || []).length).map(f => ({ e: f, ch: f.char })));
      if (pool.length) { const w = pickOne(pool); this.bubble = { e: w.e, text: pickOne(DATA.characters[w.ch].blasen), t0: this.time }; }
    }
  },
  // Vorführung eines Rätsels: Töne nacheinander, passende Objekte leuchten
  updateDemo() {
    const D = this.demo, P = DATA.puzzles[D.id], i = Math.floor((this.time - D.t0) / 0.75);
    if (i !== D.played && i < P.order.length) { D.played = i; AU.note(P.notes[P.order[i] - 1]); }
    if (i >= P.order.length + 1) this.demo = null;
  },
  demoVal(o) {
    const D = this.demo; if (!D || o.seq !== D.id) return false;
    const i = Math.floor((this.time - D.t0) / 0.75), P = DATA.puzzles[D.id];
    return i >= 0 && i < P.order.length && P.order[i] === o.seqVal;
  },

  // --- Diegos Schnüffeln ---
  sniff() {
    const d = this.followers.find(f => f.char === 'diego');
    if (!d) return this.say('diego_nicht_da');
    d.pose = 'schnueffeln'; this.sniffT = 0.9; AU.sfx('schnueffeln');
  },
  sniffDone() {
    const d = this.followers.find(f => f.char === 'diego'); if (d) d.pose = null;
    const m = DATA.maps[this.mapId], ctx = this.ctx();
    // Vorrang: 1) Verstecke der Türchen-Quest (alle auf einmal), 2) die nächste Spur einer laufenden Nebenaufgabe,
    // 3) sonst die Spur zum nächstgelegenen Versteck.
    const offen = this.offeneSchritte();
    let spuren = [];
    (m.secrets || []).filter(s => condsOk(s.if, ctx) && !(s.count !== false && this.save.secrets.indexOf(s.id) >= 0)).forEach(s => {
      if (spuren.some(x => x.s.x === s.x && x.s.y === s.y)) return;
      const path = findPath(m, { x: d.x, y: d.y }, s, ctx, 80);
      if (!path) return;
      const setzt = (s.found.set || []).filter(f => offen[f]);
      const tag = (s.if || []).some(c => { const q = /^quest:(\w+)$/.exec(c); return q && DATA.quests[q[1]] && !DATA.quests[q[1]].neben; }) || setzt.some(f => offen[f] === 'tag');
      spuren.push({ s, pts: path, target: { x: s.x, y: s.y }, rang: tag ? 0 : setzt.length ? 1 : 2 });
    });
    if (!spuren.length) return this.say('diego_kein_geruch');
    const best = Math.min(...spuren.map(x => x.rang));
    spuren = spuren.filter(x => x.rang === best);
    if (best > 0) spuren = [spuren.reduce((a, b) => (b.pts.length < a.pts.length ? b : a))];
    spuren.forEach(x => { this.revealed[x.s.id] = true; });
    this.trail = { spuren, t0: this.time };
    AU.sfx('spur');
    if (spuren.length > 1) this.banner('Diego wittert ' + spuren.length + ' Spuren!');
  },
  // Aufgedecktes Geheimnis direkt neben Charly (oder unter ihr)
  revealedNear() {
    const m = DATA.maps[this.mapId], p = this.player, ctx = this.ctx();
    // Liegt das Versteck in einem Möbelstück (z. B. Brunnen 2×2), zählt jede Seite davon
    const nah = s => { const o = objAt(m, s.x, s.y, ctx), t = o ? objType(o) : null;
      const x0 = o ? o.x : s.x, y0 = o ? o.y : s.y, x1 = o ? o.x + t.w - 1 : s.x, y1 = o ? o.y + t.h - 1 : s.y;
      return Math.max(x0 - p.x, 0, p.x - x1) + Math.max(y0 - p.y, 0, p.y - y1) <= 1; };
    const r = (m.secrets || []).find(s => (this.revealed[s.id] || s.offen) && condsOk(s.if, ctx) && !(s.count !== false && this.save.secrets.indexOf(s.id) >= 0) && nah(s));
    // an derselben Stelle gilt die erste Variante, deren Bedingung jetzt stimmt (z. B. das letzte von drei Wörtern)
    return r ? secretAt(m, r.x, r.y, ctx) || r : null;
  },
  findSecret(sec) {
    (DATA.maps[this.mapId].secrets || []).forEach(s => { if (s.x === sec.x && s.y === sec.y) delete this.revealed[s.id]; });
    if (this.trail && this.trail.spuren) { this.trail.spuren = this.trail.spuren.filter(x => x.s.x !== sec.x || x.s.y !== sec.y); if (!this.trail.spuren.length) this.trail = null; } else this.trail = null;
    AU.sfx('wuff');
    const zaehlt = sec.count !== false;
    if (sec.found.zauber) return this.runTalk(Object.assign({}, sec.found, zaehlt ? { geheimnis: sec.id } : {}));
    if (zaehlt && this.save.secrets.indexOf(sec.id) < 0) this.save.secrets.push(sec.id);
    this.runTalk(sec.found);
  },

  // --- Titel und Menü ---
  titleOptions() {
    const o = [];
    if (this.save) o.push({ id: 'weiter', label: 'Weiterspielen' });
    o.push({ id: 'neu', label: this.save ? 'Neues Spiel' : 'Spiel beginnen' });
    if (this.testDay > 0) o.push({ id: 'sprung', label: 'Test: Tag ' + this.testDay });
    o.push({ id: 'laden', label: 'Code eingeben' });
    return o;
  },
  updateTitle() {
    if (this.confirm) {
      const r = UI.navigate(2);
      if (r === 0) { this.confirm = false; this.startGame(newSave(Date.now()), true); }
      else if (r === 1 || r === -1) { this.confirm = false; UI.sel = 0; }
      return;
    }
    const opts = this.titleOptions(), r = UI.navigate(opts.length);
    if (r === null || r < 0) return;
    const id = opts[r].id;
    if (id === 'weiter') this.startGame(this.save, false);
    else if (id === 'neu') { if (this.save) { this.confirm = true; UI.sel = 1; } else this.startGame(newSave(Date.now()), true); }
    else if (id === 'laden') this.openImport();
    else if (id === 'sprung') this.startGame(this.testSprung(), false);
  },
  // Nur im Testmodus: Prolog überspringen, Morgen von Tag N beginnt sofort
  testSprung() {
    const s = newSave(Date.now());
    PROLOG_FLAGS.forEach(k => { s.flags[k] = true; });
    s.flags.diego_dabei = true; s.followers = ['joern', 'diego'];
    s.tag = this.testDay - 1; s.tagEnde = true; s.seenDay = s.tag;
    return s;
  },
  menuOptions() {
    return [
      { id: 'log', label: 'Questlog' }, { id: 'karte', label: 'Schlosskarte' }, { id: 'lied', label: 'Phönixlied' }, { id: 'rueck', label: 'Rückblicke' }, { id: 'hilfe', label: 'Hilfe' },
      { id: 'export', label: 'Spielstand sichern (Code)' }, { id: 'import', label: 'Spielstand-Code eingeben' },
      { id: 'ton', label: 'Ton: ' + (AU.on ? 'an' : 'aus') }, { id: 'titel', label: 'Zum Titelbild' }, { id: 'zurueck', label: 'Weiterspielen' },
    ];
  },
  updateMenu() {
    const opts = this.menuOptions(), r = UI.navigate(opts.length);
    if (r === null) return;
    if (r < 0) { this.mode = 'play'; return; }
    const id = opts[r].id;
    if (id === 'zurueck') this.mode = 'play';
    else if (id === 'log' || id === 'lied' || id === 'karte' || id === 'hilfe') { this.mode = { log: 'questlog', lied: 'lied', karte: 'karte', hilfe: 'hilfe' }[id]; UI.scroll = 0; }
    else if (id === 'rueck') { this.mode = 'rueck'; UI.sel = 0; }
    else if (id === 'export') { this.persist(); UI.codePanel('export', exportCode(this.save)); }
    else if (id === 'import') this.openImport();
    else if (id === 'ton') { AU.unlock(); AU.setOn(!AU.on); updateSoundButton(); }
    else if (id === 'titel') { this.persist(); this.mode = 'title'; UI.sel = 0; this.guide = null; AU.playMusic('titel'); }
  },
  openImport() {
    UI.codePanel('import', '', txt => {
      const r = importCode(txt);
      if (r.error) return r.error;
      if (this.save && this.storeOk) { this.persist(); }
      if (this.storeOk) storeWrite(localStorage, this.key, r.save);
      UI.closePanel(); this.queue = []; this.startGame(r.save, false); UI.toast('Spielstand geladen ✓');
      return null;
    });
  },

  // --- Zeichnen ---
  draw(time, dt) {
    R.begin();
    if (this.mode === 'title') {
      UI.title(this, time, this.titleOptions());
      if (this.confirm) UI.list('Wirklich neu beginnen?', [{ label: 'Ja, neu beginnen' }, { label: 'Nein' }], time);
      if (this.confirm) R.text('Der alte Spielstand bleibt als Sicherung erhalten.', VIEW_W / 2, 262, { size: 11, align: 'center', color: '#c8b898' });
      UI.toastDraw(dt);
      return;
    }
    if (this.mode === 'kampf') KB.draw(time);
    else { R.world(this, time); UI.waermeHud(this); }
    SZ.draw(time);
    UI.testBadge(this);
    UI.banner(this, time);
    DLG.draw(time);
    if (this.mode === 'frage') UI.list(this.frage.titel, this.frage.opts.map(label => ({ label })), time);
    if (this.mode === 'hilfe') UI.hilfe(this);
    if (this.mode === 'menu') UI.list('Menü', this.menuOptions(), time);
    if (this.mode === 'rueck') { const L = this.rueckblicke(); UI.list(L.length ? 'Rückblicke' : 'Noch keine Rückblicke', L.concat([{ label: 'Zurück' }]), time); }
    if (this.mode === 'questlog') UI.questlog(this);
    if (this.mode === 'lied') UI.lied(this, this.time);
    if (this.mode === 'karte') UI.karte(this, time);
    if (this.mode === 'stufe') {
      UI.list('Charly erreicht Stufe ' + this.save.stufe + '!', [{ label: 'Mehr Kraft (Zauber stärker)' }, { label: 'Mehr Lebenspunkte (+2 Wärme)' }], time);
      R.text('Jetzt: Kraft ' + this.save.kraft + ' · Wärme ' + waermeMax(this.save) + (this.save.wahl > 1 ? ' · noch ' + this.save.wahl + ' Wahlen' : ''), VIEW_W / 2, VIEW_H / 2 + 62, { size: 11, align: 'center', color: '#c8b898' });
    }
    if (this.mode === 'mini') UI.mini(this, time);
    if (this.mode === 'zauber') UI.list('Welchen Zauber wirkst du?', this.spells().map(z => ({ label: DATA.zauber[z].name + ' – ' + DATA.zauber[z].wirkung })).concat([{ label: 'Abbrechen' }]), time);
    if (this.fade) { R.ctx.fillStyle = 'rgba(8,4,10,' + (1 - Math.abs(this.fade.t - 0.5) * 2).toFixed(3) + ')'; R.ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
    UI.toastDraw(dt);
  },
};
