// ===== Start =====
function updateSoundButton() {
  const b = document.getElementById('snd');
  b.textContent = AU.on ? '♪ Ton an' : '♪ Ton aus';
  b.classList.toggle('off', !AU.on);
}
let hintTimer = null;
function showSoundHint() {
  const h = document.getElementById('hint');
  h.textContent = 'Kein Ton? Lautstärke hochdrehen und die Stummschaltung (Kontrollzentrum) ausschalten.';
  h.classList.add('show');
  clearTimeout(hintTimer); hintTimer = setTimeout(() => h.classList.remove('show'), 6000);
}
// Prüft, ob es zu jeder Kachel und jedem Objekt einen Maler gibt
function selfCheck() {
  Object.keys(DATA.tiles).forEach(k => { if (!PAINT_TILE[DATA.tiles[k].paint]) console.error('Kachel-Maler fehlt: ' + DATA.tiles[k].paint); });
  Object.keys(DATA.objects).forEach(k => { if (!PAINT_OBJ[DATA.objects[k].paint]) console.error('Objekt-Maler fehlt: ' + DATA.objects[k].paint); });
  Object.keys(DATA.characters).forEach(k => { const s = DATA.characters[k].sprite; if (s && !ANIMALS[s] && !LOOKS[s]) console.error('Figur fehlt: ' + s); });
}
// Tutorial: Die erklärte Taste leuchtet, solange der Satz zu sehen ist
const TASTEN = { a: 'bA', b: 'bB', menu: 'bMenu', ton: 'snd', dpad: 'dpad' };
let tasteAn = null;
function tasteLeuchten() {
  const k = DLG.taste();
  if (k === tasteAn) return;
  if (tasteAn && TASTEN[tasteAn]) document.getElementById(TASTEN[tasteAn]).classList.remove('glow');
  if (k && TASTEN[k]) document.getElementById(TASTEN[k]).classList.add('glow');
  tasteAn = k;
}
function boot() {
  selfCheck();
  R.init(); IN.init(); AU.init(); UI.init(); G.init();
  updateSoundButton();
  setInterval(() => AU.watch(), 1500);
  // Nur im Testmodus: Einblick für den automatischen Rauchtest
  if (G.testDay !== null) {
    window.__wp = () => ({
      mode: G.mode, map: G.mapId, waerme: G.save ? G.save.waerme : null, stufe: G.save ? G.save.stufe : 0, ep: G.save ? G.save.ep : 0, wahl: G.save ? G.save.wahl : 0, kraft: G.save ? G.save.kraft : 0, hasSave: !!G.save, flags: G.save ? Object.assign({}, G.save.flags) : {},
      pos: G.player ? { x: G.player.x, y: G.player.y, dir: G.player.dir } : null, trail: !!G.trail,
      followers: G.followers.map(f => ({ char: f.char, x: f.x, y: f.y })), dialog: DLG.open, done: G.save ? G.save.done.slice() : [], fragments: G.save ? G.save.fragments.length : 0,
    });
    window.__face = d => { G.player.dir = d; };
    window.__tag = () => ({ tag: G.save.tag, tagEnde: G.save.tagEnde, day: G.day, kalender: G.kalender, mode: G.mode, szene: SZ.a ? SZ.a.id : null, balken: SZ.balken, frage: G.frage ? G.frage.titel : null, start: Object.keys(G.save.flags).filter(k => /^start_/.test(k)) });
    window.__tour = () => ({ station: G.save.flags.tour, map: G.mapId, guide: G.guide ? { x: G.guide.x, y: G.guide.y, weg: G.guide.weg, rest: G.guide.path ? G.guide.path.length : null, moving: G.guide.moving, tuer: G.guide.tuer } : null });
    window.__tourDoor = () => { const st = G.tourStation(), d = DATA.maps[G.mapId].doors.find(x => x.to === st.nach); G.player.x = G.player.fx = d.x; G.player.y = G.player.fy = d.y; G.onArrive(); };
    window.__pos = (x, y, d) => { const p = G.player; p.x = p.fx = x; p.y = p.fy = y; p.dir = d; p.moving = false; };
    window.__guideFrage = () => G.guideFrage();
    window.__szene = id => SZ.start(id);
    window.__figurBild = () => { const cv = mkCanvas(6 * 36, 44), g = cv.getContext('2d'); ['down', 'left', 'right', 'up'].forEach((d, i) => g.drawImage(SPR.get('raureif', d, 0), i * 36, 2)); g.drawImage(SZ.schattenBild('right', 1), 4 * 36, 2); g.drawImage(SPR.get('charly', 'down', 0), 5 * 36, 2); return cv.toDataURL(); };
    window.__fx = () => SZ.fxList.some(f => f.art === 'schatten');
    window.__stationen = () => DATA.fuehrung.stationen;
    window.__tuerOk = to => G.tourTuerOk(DATA.maps[G.mapId].doors.find(d => d.to === to));
    window.__npcs = () => visibleNpcs(DATA.maps[G.mapId], G.ctx()).map(n => n.char);
    window.__go = (mid, x, y, d) => { G.trail = null; G.enterMap(mid, x, y, d); };
    window.__flags = o => { Object.assign(G.save.flags, o); if (o.diego_dabei && G.save.followers.indexOf('diego') < 0) G.save.followers.push('diego'); G.enterMap(G.mapId, G.player.x, G.player.y, G.player.dir); };
    // Ton-Prüfung: Musikstück offline berechnen, Spitzenpegel und Sprünge (Knackser) messen
    window.__audioCheck = async name => {
      delete AU.songs[name];
      const buf = await AU.renderSong(name, 44100), d = buf.getChannelData(0);
      let peak = 0, jump = 0, sum = 0;
      for (let i = 1; i < d.length; i++) { peak = Math.max(peak, Math.abs(d[i])); jump = Math.max(jump, Math.abs(d[i] - d[i - 1])); sum += d[i] * d[i]; }
      // Schleifennaht: Ende → Anfang darf nicht springen
      jump = Math.max(jump, Math.abs(d[0] - d[d.length - 1]));
      return { peak, jump, rms: Math.sqrt(sum / d.length), sec: d.length / 44100 };
    };
    window.__breakAudio = () => { AU.__alt = AU.ctx; AU.ctx.suspend(); AU.lastCt = AU.ctx.currentTime; AU.stall = 5; AU.ctx.__kaputt = true; AU.watch(); };
    window.__audio = () => ({ state: AU.ctx ? AU.ctx.state : 'keiner', rate: AU.ctx ? AU.ctx.sampleRate : 0, song: AU.cur ? AU.cur.name : null, neu: !!(AU.__alt && AU.ctx && AU.ctx !== AU.__alt), fertig: Object.keys(AU.songs) });
    window.__audioRender = async name => { const b = await AU.renderSong(name, 44100), d = b.getChannelData(0), out = new Float32Array(d.length * 2); out.set(d, 0); out.set(d, d.length); return out; };
    window.__probeInstall = () => { const an = AU.ctx.createAnalyser(); an.fftSize = 2048; AU.master.connect(an); AU.__an = an; };
    window.__probe = () => { const d = new Float32Array(2048); AU.__an.getFloatTimeDomainData(d); let nan = 0, pk = 0; d.forEach(v => { if (!isFinite(v)) nan++; else pk = Math.max(pk, Math.abs(v)); });
      return { state: AU.ctx.state, master: AU.master.gain.value, nan, pk: +pk.toFixed(3), on: AU.on, song: AU.cur && AU.cur.name }; };
    window.__mini = () => (G.mini ? { type: G.mini.type || 'takt', phase: G.mini.phase, seq: G.mini.seq ? G.mini.seq.slice() : [], round: G.mini.round, hour: G.mini.hour, ziel: G.mini.fragen ? (G.mini.fragen[G.mini.round] || {}).stunde : null } : null);
    window.__pickSpell = z => { UI.sel = G.spells().indexOf(z); return G.mode; };
    window.__teleport = (x, y, d) => { G.enterMap(G.mapId, x, y, d); };
    window.__kampf = () => (G.mode === 'kampf' && KB.F ? { phase: KB.phase, ende: KB.F.ende, waerme: KB.F.waerme, max: KB.F.max, gegner: KB.F.gegner.map(e => ({ id: e.id, kraft: e.kraft })), aktionen: KB.akts().map(a => a.art), ok: KB.akts().map(a => a.ok), energie: KB.F.energie, kakao: KB.F.kakao, eingefroren: KB.F.eingefroren, kochen: KB.F.kochen, schwaeche: KB.F.gegner.map(e => DATA.kampf.gegner[e.id].schwaeche), sel: KB.sel, zsel: KB.zsel, zauber: KB.F.zauber.slice(), ziel: KB.pend ? KB.pend.ziel : null } : null);
    window.__setWaerme = n => { G.save.waerme = n; };
    window.__giveEp = n => { epGeben(G.save, n); if (G.save.wahl > 0) G.stufeFrage(); };
    window.__startFight = g => G.startFight(g, null);
    window.__kampfChance = x => { if (x === null) delete G.kampfTest; else G.kampfTest = x; };
    window.__warm = () => ({ waerme: G.save.waerme, warm: G.save.warm, besucht: G.save.besucht.slice(), glut: G.save.glut.slice(), alarm: !!G.alarm });
  }
  let hinted = false;
  ['pointerdown', 'touchend', 'keydown', 'mousedown'].forEach(n => addEventListener(n, () => {
    AU.unlock();
    if (!hinted && AU.on) { hinted = true; showSoundHint(); }
  }, { capture: true, passive: true }));
  const snd = document.getElementById('snd');
  snd.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); AU.unlock(); AU.setOn(!AU.on); updateSoundButton(); if (AU.on) showSoundHint(); });
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    try { G.update(dt); G.draw(G.time, dt); tasteLeuchten(); } catch (e) { console.error(e); }
    IN.clear();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
