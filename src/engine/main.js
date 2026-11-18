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
function boot() {
  selfCheck();
  R.init(); IN.init(); AU.init(); UI.init(); G.init();
  updateSoundButton();
  // Nur im Testmodus: Einblick für den automatischen Rauchtest
  if (G.testDay !== null) {
    window.__wp = () => ({
      mode: G.mode, map: G.mapId, hasSave: !!G.save, flags: G.save ? Object.assign({}, G.save.flags) : {},
      pos: G.player ? { x: G.player.x, y: G.player.y, dir: G.player.dir } : null, trail: !!G.trail,
      followers: G.followers.map(f => ({ char: f.char, x: f.x, y: f.y })), dialog: DLG.open, done: G.save ? G.save.done.slice() : [], fragments: G.save ? G.save.fragments.length : 0,
    });
    window.__face = d => { G.player.dir = d; };
    window.__go = (mid, x, y, d) => { G.trail = null; G.enterMap(mid, x, y, d); };
    window.__flags = o => { Object.assign(G.save.flags, o); if (o.diego_dabei && G.save.followers.indexOf('diego') < 0) G.save.followers.push('diego'); G.enterMap(G.mapId, G.player.x, G.player.y, G.player.dir); };
    // Ton-Prüfung: Musikstück offline berechnen, Spitzenpegel und Sprünge (Knackser) messen
    window.__audioCheck = async name => {
      const song = DATA.musik[name], sec = 8, o = new OfflineAudioContext(1, 44100 * sec, 44100);
      const keep = { ctx: AU.ctx, music: AU.music };
      AU.ctx = o; AU.music = o.createGain(); AU.music.gain.value = 0.55; AU.music.connect(o.destination);
      const eighth = 60 / song.bpm / 2;
      song.voices.forEach(v => { const pv = parseVoice(v.notes); pv.ev.forEach(e => { const t = 0.05 + e.t * eighth; if (t < sec - 0.5) AU.tone(v.inst, e.f, t, e.dur * eighth, v.vol || 0.4); }); });
      const buf = await o.startRendering(); AU.ctx = keep.ctx; AU.music = keep.music;
      const d = buf.getChannelData(0); let peak = 0, jump = 0, sum = 0;
      for (let i = 1; i < d.length; i++) { peak = Math.max(peak, Math.abs(d[i])); jump = Math.max(jump, Math.abs(d[i] - d[i - 1])); sum += d[i] * d[i]; }
      return { peak, jump, rms: Math.sqrt(sum / d.length) };
    };
    window.__mini = () => (G.mini ? { phase: G.mini.phase, seq: G.mini.seq.slice(), round: G.mini.round } : null);
    window.__teleport = (x, y, d) => { G.enterMap(G.mapId, x, y, d); };
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
    try { G.update(dt); G.draw(G.time, dt); } catch (e) { console.error(e); }
    IN.clear();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
