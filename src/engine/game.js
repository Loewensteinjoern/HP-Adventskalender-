// ===== Spielablauf =====
const STEP_TIME = 0.17;

const G = {
  mode: 'title', save: null, key: SAVE_KEY, testDay: null, day: 0, storeOk: true,
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
  refreshDay(announce) {
    const old = this.day;
    this.day = this.testDay !== null ? this.testDay : unlockedDay(new Date());
    if (announce && this.mode !== 'title' && this.day > old) this.enterPlayEvents();
  },
  daysLeft() { if (this.testDay === null) return daysUntilStart(new Date()); return this.testDay > 0 ? 0 : Math.max(1, daysUntilStart(new Date())); },
  ctx() { return { flags: this.save.flags, day: this.day, done: this.save.done, followers: this.save.followers }; },
  persist() {
    if (!this.save || !this.storeOk || this.mode === 'title') return;
    const s = this.save, p = this.player;
    s.map = this.mapId; s.x = p.x; s.y = p.y; s.dir = p.dir; s.updated = Date.now();
    storeWrite(localStorage, this.key, s);
  },

  // --- Start eines Spiels ---
  startGame(save, isNew) {
    this.save = save;
    this.mode = 'play'; this.revealed = {}; this.trail = null;
    this.enterMap(save.map, save.x, save.y, save.dir);
    if (isNew) this.queue.push(() => this.say(DATA.welt.intro));
    this.enterPlayEvents();
    this.persist();
  },
  // Neues Türchen und Start-Dialoge freigeschalteter Quests
  enterPlayEvents() {
    const s = this.save;
    if (this.day > s.seenDay) {
      const q = questIds().map(id => DATA.quests[id]).find(q => q.day === this.day);
      this.queue.push(() => { this.banner('Türchen ' + this.day + ' ist offen' + (q ? ': ' + q.title : '!')); AU.sfx('tuerchen'); this.next(); });
      s.seenDay = this.day;
    }
    questIds().forEach(id => {
      const q = DATA.quests[id];
      if (q.start && q.day <= this.day && s.done.indexOf(id) < 0 && !s.flags['start_' + id])
        this.queue.push(() => { s.flags['start_' + id] = true; this.say(q.start); });
    });
    if (!DLG.open) this.next();
  },
  next() { const f = this.queue.shift(); if (f) f(); },
  banner(text) { this.bannerMsg = { text, t0: this.time }; },

  enterMap(mid, x, y, dir) {
    this.mapId = mid;
    this.player = { x, y, fx: x, fy: y, dir, t: 1, moving: false, par: 0 };
    const back = DIRS[dir] ? [-DIRS[dir][0], -DIRS[dir][1]] : [0, 1], m = DATA.maps[mid];
    let bx = x, by = y;
    this.followers = this.save.followers.map(ch => {
      const nx = bx + back[0], ny = by + back[1];
      if (!blockedAt(m, nx, ny, this.ctx()) && !doorAt(m, nx, ny)) { bx = nx; by = ny; }
      return { char: ch, x: bx, y: by, fx: bx, fy: by, dir, t: 1, moving: false, par: 0, pose: null };
    });
    AU.playMusic(m.music);
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
    if (this.fade) return this.updateFade(dt);
    if (DLG.open) { DLG.update(dt); this.moveTick(dt, false); return; }
    if (this.mode === 'menu') return this.updateMenu();
    if (this.mode === 'questlog' || this.mode === 'lied') {
      if (IN.take('up')) UI.scroll--; if (IN.take('down')) UI.scroll++;
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
    if (arrived && this.onArrive()) return;
    if (allowInput && !this.player.moving) { const d = IN.dir(); if (d) this.tryMove(d); }
  },
  tryMove(d) {
    const p = this.player, m = DATA.maps[this.mapId], ctx = this.ctx();
    p.dir = d;
    const nx = p.x + DIRS[d][0], ny = p.y + DIRS[d][1];
    if (blockedAt(m, nx, ny, ctx)) {
      const o = objAt(m, nx, ny, ctx), sp = spotAt(m, nx, ny, ctx);
      if (o && o.bump && o.talk) this.runTalk(pickTalk(o.talk, ctx));
      else if (sp && sp.bump) this.runTalk(pickTalk(sp.talk, ctx));
      return;
    }
    // Begleiter rücken nach
    let px = p.x, py = p.y;
    this.followers.forEach(f => {
      const ox = f.x, oy = f.y;
      if (ox !== px || oy !== py) { f.fx = ox; f.fy = oy; f.x = px; f.y = py; f.moving = true; f.t = 0; f.par ^= 1; f.dir = px > ox ? 'right' : px < ox ? 'left' : py > oy ? 'down' : 'up'; }
      px = ox; py = oy;
    });
    p.fx = p.x; p.fy = p.y; p.x = nx; p.y = ny; p.moving = true; p.t = 0; p.par ^= 1;
  },
  onArrive() {
    const m = DATA.maps[this.mapId], d = doorAt(m, this.player.x, this.player.y);
    if (d) { AU.sfx('tuer'); this.fade = { t: 0, door: d, done: false }; return true; }
    return false;
  },
  updateFade(dt) {
    const f = this.fade; f.t += dt / 0.5;
    if (f.t >= 0.5 && !f.done) { f.done = true; this.trail = null; this.enterMap(f.door.to, f.door.tx, f.door.ty, f.door.dir); this.persist(); }
    if (f.t >= 1) this.fade = null;
    IN.clear();
  },

  // --- Sprechen und Untersuchen ---
  interact() {
    const p = this.player, m = DATA.maps[this.mapId], ctx = this.ctx();
    const tx = p.x + DIRS[p.dir][0], ty = p.y + DIRS[p.dir][1];
    const f = this.followers.find(e => e.x === tx && e.y === ty);
    if (f) { f.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir]; return this.runTalk(pickTalk(DATA.characters[f.char].talk, ctx)); }
    const n = npcAt(m, tx, ty, ctx);
    if (n) { if (n.pose !== 'schlaf') n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir]; return this.runTalk(pickTalk(n.talk, ctx)); }
    const sec = secretAt(m, tx, ty, ctx);
    if (sec && this.revealed[sec.id]) return this.findSecret(sec);
    const o = objAt(m, tx, ty, ctx);
    if (o && o.talk) return this.runTalk(pickTalk(o.talk, ctx));
    const sp = spotAt(m, tx, ty, ctx);
    if (sp && sp.talk) return this.runTalk(pickTalk(sp.talk, ctx));
  },
  // Dialogtext mit Platzhaltern
  lines(id) {
    return DATA.dialogs[id].map(([sp, tx]) => [sp, tx.replace(/\{tage\}/g, String(this.daysLeft())).replace(/\{tag\}/g, String(this.day))]);
  },
  say(id, cb) { DLG.show(this.lines(id), () => { if (cb) cb(); this.next(); }); },
  runTalk(t) {
    if (!t) return;
    let id = t.dialog;
    if (Array.isArray(id)) { const opts = id.filter(x => x !== this.lastTalk[id.join()]); id = pickOne(opts.length ? opts : id); this.lastTalk[t.dialog.join()] = id; }
    if (t.sound) AU.sfx(t.sound);
    const apply = () => this.applyAction(t);
    if (id) this.say(id, apply); else apply();
  },
  applyAction(t) {
    const s = this.save;
    (t.set || []).forEach(f => { s.flags[f] = true; });
    if (t.join && s.followers.indexOf(t.join) < 0) {
      s.followers.push(t.join);
      const m = DATA.maps[this.mapId], n = (m.npcs || []).find(n => n.char === t.join);
      const last = this.followers[this.followers.length - 1] || this.player;
      const at = n || last;
      this.followers.push({ char: t.join, x: at.x, y: at.y, fx: at.x, fy: at.y, dir: 'down', t: 1, moving: false, par: 0, pose: null });
    }
    if (t.leave) { s.followers = s.followers.filter(c => c !== t.leave); this.followers = this.followers.filter(f => f.char !== t.leave); }
    const neu = updateQuests(s, this.day);
    neu.forEach(id => this.queue.push(() => { AU.sfx('fund'); this.banner('Winterfragment ' + DATA.quests[id].day + ' gefunden!');
      DLG.show([['', 'Ein eisblauer Splitter leuchtet auf. Darin klingt eine Zeile des Phönixlieds:'], ['', '„' + DATA.quests[id].fragment + '“']], () => this.next()); }));
    this.persist();
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
    let best = null;
    (m.secrets || []).filter(s => condsOk(s.if, ctx)).forEach(s => {
      const path = findPath(m, { x: d.x, y: d.y }, s, ctx, 14);
      if (path && (!best || path.length < best.path.length)) best = { s, path };
    });
    if (!best) return this.say('diego_kein_geruch');
    this.revealed[best.s.id] = true;
    this.trail = { pts: best.path, target: { x: best.s.x, y: best.s.y }, t0: this.time };
    AU.sfx('spur');
  },
  findSecret(sec) {
    this.trail = null;
    if (sec.count !== false && this.save.secrets.indexOf(sec.id) < 0) this.save.secrets.push(sec.id);
    this.runTalk(sec.found);
  },

  // --- Titel und Menü ---
  titleOptions() {
    const o = [];
    if (this.save) o.push({ id: 'weiter', label: 'Weiterspielen' });
    o.push({ id: 'neu', label: this.save ? 'Neues Spiel' : 'Spiel beginnen' });
    o.push({ id: 'laden', label: 'Spielstand-Code eingeben' });
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
  },
  menuOptions() {
    return [
      { id: 'log', label: 'Questlog' }, { id: 'lied', label: 'Phönixlied' },
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
    else if (id === 'log' || id === 'lied') { this.mode = id === 'log' ? 'questlog' : 'lied'; UI.scroll = 0; }
    else if (id === 'export') { this.persist(); UI.codePanel('export', exportCode(this.save)); }
    else if (id === 'import') this.openImport();
    else if (id === 'ton') { AU.unlock(); AU.setOn(!AU.on); updateSoundButton(); }
    else if (id === 'titel') { this.persist(); this.mode = 'title'; UI.sel = 0; AU.playMusic('titel'); }
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
    R.world(this, time);
    UI.testBadge(this);
    UI.banner(this, time);
    DLG.draw(time);
    if (this.mode === 'menu') UI.list('Menü', this.menuOptions(), time);
    if (this.mode === 'questlog') UI.questlog(this);
    if (this.mode === 'lied') UI.lied(this);
    if (this.fade) { R.ctx.fillStyle = 'rgba(8,4,10,' + (1 - Math.abs(this.fade.t - 0.5) * 2).toFixed(3) + ')'; R.ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
    UI.toastDraw(dt);
  },
};
