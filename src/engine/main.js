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
  Object.keys(DATA.characters).forEach(k => { const s = DATA.characters[k].sprite; if (s && s !== 'diego' && !LOOKS[s]) console.error('Figur fehlt: ' + s); });
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
      followers: G.followers.map(f => ({ char: f.char, x: f.x, y: f.y })), dialog: DLG.open,
    });
    window.__face = d => { G.player.dir = d; };
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
