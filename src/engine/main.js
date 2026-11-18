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
      delete AU.songs[name];
      const buf = await AU.renderSong(name, 44100), d = buf.getChannelData(0);
      let peak = 0, jump = 0, sum = 0;
      for (let i = 1; i < d.length; i++) { peak = Math.max(peak, Math.abs(d[i])); jump = Math.max(jump, Math.abs(d[i] - d[i - 1])); sum += d[i] * d[i]; }
      // Schleifennaht: Ende → Anfang darf nicht springen
      jump = Math.max(jump, Math.abs(d[0] - d[d.length - 1]));
      return { peak, jump, rms: Math.sqrt(sum / d.length), sec: d.length / 44100 };
    };
    window.__audio = () => ({ state: AU.ctx ? AU.ctx.state : 'keiner', rate: AU.ctx ? AU.ctx.sampleRate : 0, song: AU.cur ? AU.cur.name : null, fertig: Object.keys(AU.songs) });
    window.__audioRender = async name => { const b = await AU.renderSong(name, 44100), d = b.getChannelData(0), out = new Float32Array(d.length * 2); out.set(d, 0); out.set(d, d.length); return out; };
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
