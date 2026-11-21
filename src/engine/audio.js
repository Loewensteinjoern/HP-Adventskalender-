// ===== Musik und Töne per Web Audio (alles selbst erzeugt) =====
const NOTE_RE = /^([A-G])([#b]?)(\d)$/;
function noteFreq(n) {
  const m = NOTE_RE.exec(n); if (!m) return 0;
  const base = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * Math.pow(2, (base + (parseInt(m[3], 10) - 4) * 12) / 12);
}
function parseVoice(str) {
  const ev = []; let t = 0;
  str.trim().split(/\s+/).forEach(tok => {
    const [n, d] = tok.split(':'); const dur = parseFloat(d) || 1;
    if (n !== '-') ev.push({ t, dur, f: noteFreq(n) });
    t += dur;
  });
  return { ev, len: t };
}

const AU = {
  ctx: null, master: null, music: null, sfxBus: null, on: true, cur: null, timer: null, noise: null, failed: false,
  init() {
    try { this.on = localStorage.getItem(SOUND_KEY) !== 'aus'; } catch (e) {}
  },
  unlock() {
    if (this.failed) return;
    if (this.broken) this.rebuild();
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { this.failed = true; return; }
        // 'playback' = größerer Puffer: verhindert Knacken, wenn das Bild viel zu tun hat
        let c; try { c = new AC({ latencyHint: 'playback' }); } catch (e) { c = new AC(); }
        // iPad-Fehler: Steht das Gerät auf einer falschen Abtastrate, knattert alles. Dann einmal neu anlegen.
        if (c.sampleRate < 44000 && c.close) {
          try { const d = c.createBufferSource(); d.buffer = c.createBuffer(1, 1, 48000); d.connect(c.destination); d.start(0); c.close(); } catch (e) {}
          try { c = new AC({ latencyHint: 'playback' }); } catch (e) { c = new AC(); }
        }
        this.ctx = c;
        const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(c.destination);
        this.master = c.createGain(); this.master.gain.value = this.on ? 0.9 : 0; this.master.connect(comp);
        // Musik: Filter und Hall sind in die vorab berechneten Stücke eingerechnet
        this.music = c.createGain(); this.music.gain.value = 1; this.music.connect(this.master);
        this.sfxBus = c.createGain(); this.sfxBus.gain.value = 0.45; this.sfxBus.connect(this.master);
        const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), d = nb.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noise = nb;
        const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, c.sampleRate); s.connect(c.destination); s.start(0);
        if (this.want) this.playMusic(this.want, true);
      }
      if (this.ctx.state !== 'running' && this.ctx.state !== 'closed') this.ctx.resume();
    } catch (e) { this.failed = true; }
  },
  // Tonausgabe komplett neu anlegen (muss während einer Berührung passieren)
  rebuild() {
    this.broken = false; this.cur = null; this.lastCt = undefined; this.stall = 0;
    const old = this.ctx; this.ctx = null; this.an = null; this.voices = 0; this.songs = {}; this.rendering = {};
    try { if (old && old.close) old.close(); } catch (e) {}
  },
  // Wächter: merkt, wenn Safari die Tonausgabe angehalten oder verdorben hat
  watch() {
    if (!this.ctx || !this.on || document.hidden || this.broken) return;
    const c = this.ctx;
    if (!this.an) { try { this.an = c.createAnalyser(); this.an.fftSize = 256; this.master.connect(this.an); this.anBuf = new Float32Array(256); } catch (e) {} }
    let bad = c.state === 'interrupted' || c.state === 'closed';
    if (c.state === 'suspended') { try { c.resume(); } catch (e) {} this.stall = (this.stall || 0) + 1; }
    else if (c.state === 'running') {
      if (this.lastCt !== undefined && Math.abs(c.currentTime - this.lastCt) < 0.01) this.stall = (this.stall || 0) + 1; else this.stall = 0;
      if (this.an) { this.an.getFloatTimeDomainData(this.anBuf); for (let i = 0; i < this.anBuf.length; i++) if (!isFinite(this.anBuf[i])) { bad = true; break; } }
    }
    this.lastCt = c.currentTime;
    if (bad || this.stall >= 3) { this.broken = true; if (typeof UI !== 'undefined') UI.toast('Der Ton hängt – einmal auf den Bildschirm tippen.'); }
  },
  setOn(v) {
    if (v && this.broken) { this.rebuild(); this.unlock(); }
    this.on = v;
    try { localStorage.setItem(SOUND_KEY, v ? 'an' : 'aus'); } catch (e) {}
    if (this.master) this.master.gain.setTargetAtTime(v ? 0.9 : 0, this.ctx.currentTime, 0.05);
    if (v && this.want) this.playMusic(this.want, true);
    if (!v) this.stopMusic();
  },
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); },
  resume() { if (this.ctx && this.on) this.ctx.resume(); },

  // --- Instrumente ---
  tone(type, f, t, dur, vol, bus) {
    if (!(isFinite(f) && f > 0 && isFinite(t) && isFinite(dur) && dur > 0 && isFinite(vol))) return;
    const c = this.ctx;
    // Echtzeit-Geräusche begrenzen: höchstens 14 gleichzeitig (Offline-Berechnung der Musik ist nicht betroffen)
    if (bus === this.sfxBus) { if ((this.voices || 0) >= 14) return; this.voices = (this.voices || 0) + 1; setTimeout(() => { this.voices = Math.max(0, this.voices - 1); }, (dur + 1.5) * 1000); }
    const g = c.createGain(); g.connect(bus || this.music);
    const o = c.createOscillator(); o.frequency.value = f; o.connect(g);
    if (type === 'spieluhr') {
      // weiche Spieluhr: Grundton + leiser Oberton, sanfter Einschwung, langes Ausklingen
      o.type = 'sine'; const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2; const g2 = c.createGain(); g2.gain.value = 0.08; o2.connect(g2); g2.connect(g);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.018); g.gain.setTargetAtTime(0, t + 0.05, 0.55);
      o2.start(t); o2.stop(t + 2.6); o.start(t); o.stop(t + 2.6);
    } else if (type === 'glocke') {
      o.type = 'sine';
      [[2.76, 0.14]].forEach(([m, v]) => { const ox = c.createOscillator(); ox.type = 'sine'; ox.frequency.value = f * m; const gx = c.createGain(); gx.gain.value = v; ox.connect(gx); gx.connect(g); ox.start(t); ox.stop(t + 3); });
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.setTargetAtTime(0, t + 0.04, 0.8);
      o.start(t); o.stop(t + 3);
    } else if (type === 'bass') {
      // auch auf kleinen Lautsprechern hörbar: Grundton plus Oktave darüber
      o.type = 'sine'; o.frequency.value = f * 2; const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f; const g2 = c.createGain(); g2.gain.value = 0.6; o2.connect(g2); g2.connect(g);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * 0.7, t + 0.03); g.gain.setTargetAtTime(0, t + dur * 0.6, dur * 0.25);
      o2.start(t); o2.stop(t + dur * 1.6); o.start(t); o.stop(t + dur * 1.6);
    } else if (type === 'flaeche') {
      o.type = 'triangle'; const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 1.5; o2.detune.value = 5;
      const o3 = c.createOscillator(); o3.type = 'sine'; o3.frequency.value = f * 2; o3.detune.value = -4;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; o.connect(lp); o2.connect(lp); o3.connect(lp); o.disconnect(g); lp.connect(g);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * 0.45, t + Math.min(0.6, dur * 0.3)); g.gain.setValueAtTime(vol * 0.45, t + dur * 0.8); g.gain.linearRampToValueAtTime(0, t + dur * 1.1);
      [o, o2, o3].forEach(x => { x.start(t); x.stop(t + dur * 1.15); });
    } else if (type === 'blech') {
      // Horn: Sägezahn und Rechteck durch weichen Filter, schwillt an, leichtes Vibrato
      o.type = 'sawtooth'; const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.value = f; o2.detune.value = 6; const g2 = c.createGain(); g2.gain.value = 0.35; o2.connect(g2);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.7; lp.frequency.setValueAtTime(700, t); lp.frequency.linearRampToValueAtTime(1900, t + 0.08); lp.frequency.setTargetAtTime(1200, t + 0.1, 0.3);
      o.disconnect(g); o.connect(lp); g2.connect(lp); lp.connect(g);
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.2; lg.gain.value = f * 0.006; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * 0.5, t + 0.05); g.gain.setValueAtTime(vol * 0.5, t + dur * 0.85); g.gain.linearRampToValueAtTime(0, t + dur + 0.08);
      [o, o2, lfo].forEach(x => { x.start(t); x.stop(t + dur + 0.12); });
    } else if (type === 'pauke') {
      // Pauke: tiefer Ton, der schnell abfällt
      o.type = 'sine'; o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
      const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2.3; const g2 = c.createGain(); g2.gain.setValueAtTime(0.25, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.12); o2.connect(g2); g2.connect(g);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.setTargetAtTime(0, t + 0.02, 0.18);
      o.start(t); o.stop(t + 1); o2.start(t); o2.stop(t + 0.2);
    } else if (type === 'zupf') {
      // gezupfte Streicher: kurz und federnd
      o.type = 'triangle'; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; o.disconnect(g); o.connect(lp); lp.connect(g);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.setTargetAtTime(0, t + 0.01, 0.09);
      o.start(t); o.stop(t + 0.6);
    } else {
      o.type = type;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + 0.02);
    }
  },
  noiseBurst(t, dur, vol, freq, q) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise;
    const fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = freq; fl.Q.value = q || 1;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(this.sfxBus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  },

  // --- Musik: jedes Stück wird einmal vorab berechnet und dann als eine Tonspur in Schleife gespielt ---
  // (Viel weniger Arbeit fürs Gerät als Note für Note – kein Knattern, wenn das Bild viel zu tun hat.)
  songs: {}, rendering: {},
  renderSong(name, sampleRate) {
    if (this.songs[name]) return Promise.resolve(this.songs[name]);
    if (this.rendering[name]) return this.rendering[name];
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext, song = DATA.musik[name];
    if (!OAC || !song) return Promise.resolve(null);
    const sr = sampleRate || (this.ctx ? this.ctx.sampleRate : 44100), eighth = 60 / song.bpm / 2;
    const voices = song.voices.map(v => Object.assign({ inst: v.inst, vol: v.vol || 0.4 }, parseVoice(v.notes)));
    const loop = Math.max.apply(null, voices.map(v => v.len)) * eighth, tail = 3.5;
    const n = Math.ceil((loop + tail) * sr), o = new OAC(1, n, sr);
    const keep = this.ctx; this.ctx = o;
    const lp = o.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = 0.4; lp.connect(o.destination);
    const bus = o.createGain(); bus.gain.value = 0.45; bus.connect(lp);
    const irLen = Math.floor(sr * 2.4), ir = o.createBuffer(1, irLen, sr), id = ir.getChannelData(0), rnd = srand(7);
    for (let i = 0; i < irLen; i++) id[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irLen, 2.6) * 0.5;
    const rev = o.createConvolver(); rev.normalize = true; rev.buffer = ir; const wet = o.createGain(); wet.gain.value = 0.28;
    bus.connect(rev); rev.connect(wet); wet.connect(lp);
    voices.forEach(v => v.ev.forEach(e => { if (e.f) this.tone(v.inst, e.f, 0.02 + e.t * eighth, e.dur * eighth, v.vol, bus); }));
    this.ctx = keep;
    const done = rendered => {
      // Nachklang vom Ende an den Anfang falten: nahtlose Schleife
      const L = Math.floor(loop * sr), src = rendered.getChannelData(0);
      const target = this.ctx || o, out = target.createBuffer(1, L, sr), d = out.getChannelData(0);
      for (let i = 0; i < L; i++) d[i] = src[i] + (i + L < src.length ? src[i + L] : 0);
      this.songs[name] = out; delete this.rendering[name]; return out;
    };
    this.rendering[name] = new Promise(res => {
      o.oncomplete = ev => res(done(ev.renderedBuffer));
      const r = o.startRendering(); if (r && r.then) r.then(b => res(done(b)), () => res(null));
    });
    return this.rendering[name];
  },
  playMusic(name, force) {
    this.want = name;
    if (!this.ctx || !this.on || this.failed) return;
    if (!force && this.cur && this.cur.name === name) return;
    const token = this.token = (this.token || 0) + 1;
    this.renderSong(name).then(buf => {
      if (!buf || token !== this.token || !this.on) return;
      this.stopMusic();
      const c = this.ctx, src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      const g = c.createGain(); g.gain.setValueAtTime(0, c.currentTime); g.gain.linearRampToValueAtTime(1, c.currentTime + 1.2);
      src.connect(g); g.connect(this.music); src.start(c.currentTime + 0.05);
      this.music.gain.cancelScheduledValues(c.currentTime); this.music.gain.setValueAtTime(1, c.currentTime);
      this.cur = { name, src, g };
      // die übrigen Stücke in Ruhe vorbereiten
      Object.keys(DATA.musik).forEach((k, i) => setTimeout(() => this.renderSong(k), 1500 + i * 700));
    });
  },
  stopMusic() {
    const m = this.cur; this.cur = null; if (!m || !this.ctx) return;
    const t = this.ctx.currentTime;
    try { m.g.gain.cancelScheduledValues(t); m.g.gain.setValueAtTime(m.g.gain.value, t); m.g.gain.linearRampToValueAtTime(0, t + 0.5); m.src.stop(t + 0.55); } catch (e) {}
  },

  note(n) { if (!this.ctx || !this.on || this.failed) return; const f = noteFreq(n); if (f) this.tone('glocke', f, this.ctx.currentTime + 0.01, 1.2, 0.3, this.sfxBus); },
  // Spieluhr spielt einen Takt des Phönixlieds
  melodie(notes, takt) {
    if (!this.ctx || !this.on || this.failed) return;
    const t = this.ctx.currentTime + 0.05;
    notes.forEach((n, i) => { const f = noteFreq(n); if (f) this.tone('spieluhr', f, t + i * takt, 1.2, 0.2, this.sfxBus); });
  },
  tick(dir) {
    if (!this.ctx || !this.on || this.failed) return;
    const t = this.ctx.currentTime + 0.01, f = { up: 'G5', right: 'E5', down: 'C5', left: 'A4' }[dir];
    this.noiseBurst(t, 0.05, 0.4, 3200, 3); this.tone('glocke', noteFreq(f), t, 1, 0.28, this.sfxBus);
  },
  // --- Geräusche ---
  sfx(name) {
    if (!this.ctx || !this.on || this.failed) return;
    const t = this.ctx.currentTime + 0.01, B = this.sfxBus;
    switch (name) {
      case 'blip': this.tone('sine', 620, t, 0.025, 0.012, B); break;
      case 'menue': this.tone('sine', 660, t, 0.08, 0.15, B); break;
      case 'zurueck': this.tone('sine', 440, t, 0.08, 0.12, B); break;
      case 'wuff': this.noiseBurst(t, 0.12, 0.5, 500, 2); this.tone('square', 210, t, 0.1, 0.08, B); this.noiseBurst(t + 0.18, 0.1, 0.4, 520, 2); this.tone('square', 190, t + 0.18, 0.08, 0.07, B); break;
      case 'schnueffeln': for (let i = 0; i < 4; i++) this.noiseBurst(t + i * 0.13, 0.07, 0.35, 2600, 1.5); break;
      case 'spur': [1046, 1318, 1568].forEach((f, i) => this.tone('spieluhr', f, t + i * 0.09, 0.4, 0.18, B)); break;
      case 'fund': [784, 988, 1175, 1568].forEach((f, i) => this.tone('glocke', f, t + i * 0.11, 1, 0.22, B)); break;
      case 'tuer': this.noiseBurst(t, 0.25, 0.4, 180, 1); this.tone('sine', 90, t, 0.25, 0.25, B); break;
      case 'piep': this.tone('sine', 1900, t, 0.06, 0.12, B); this.tone('sine', 2300, t + 0.1, 0.06, 0.12, B); break;
      case 'schnarch': this.noiseBurst(t, 0.8, 0.25, 300, 0.8); break;
      case 'tuerchen': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone('glocke', f, t + i * 0.12, 1.2, 0.2, B)); break;
      case 'jaul': { const o = this.ctx.createOscillator(), g = this.ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(760, t + 0.3); o.frequency.linearRampToValueAtTime(480, t + 0.9);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 1); o.connect(g); g.connect(B); o.start(t); o.stop(t + 1.05); break; }
      case 'zauber': [1046, 1568, 2093, 2637].forEach((f, i) => this.tone('spieluhr', f, t + i * 0.06, 0.6, 0.16, B)); this.noiseBurst(t, 0.5, 0.15, 6000, 1); break;
      case 'stein': this.noiseBurst(t, 0.6, 0.5, 220, 0.7); this.tone('sine', 70, t, 0.5, 0.3, B); break;
      case 'zahnrad': for (let i = 0; i < 6; i++) this.noiseBurst(t + i * 0.08, 0.04, 0.35, 2800, 4); break;
      case 'stoss': this.tone('sine', 120, t, 0.06, 0.12, B); break;
      case 'knurren': for (let i = 0; i < 3; i++) this.noiseBurst(t + i * 0.16, 0.18, 0.35, 160, 1.2); this.tone('sawtooth', 70, t, 0.5, 0.05, B); break;
      case 'kampf': this.noiseBurst(t, 0.6, 0.3, 4000, 0.6); [988, 784, 659, 523].forEach((f, i) => this.tone('glocke', f, t + i * 0.07, 0.6, 0.14, B)); break;
      case 'schneeball': this.noiseBurst(t, 0.25, 0.25, 1800, 0.8); break;
      case 'treffer': this.noiseBurst(t, 0.12, 0.45, 700, 1.5); this.tone('sine', 220, t, 0.12, 0.15, B); break;
      case 'autsch': this.noiseBurst(t, 0.3, 0.3, 5200, 2); this.tone('sine', 520, t, 0.25, 0.1, B); this.tone('sine', 390, t + 0.1, 0.25, 0.1, B); break;
      case 'kochen': this.noiseBurst(t, 0.8, 0.2, 900, 0.5); for (let i = 0; i < 5; i++) this.noiseBurst(t + 0.15 + i * 0.12, 0.05, 0.25, 3000, 3); break;
      case 'kakao': [523, 659, 784].forEach((f, i) => this.tone('spieluhr', f, t + i * 0.1, 0.6, 0.16, B)); break;
      case 'mut': [392, 523, 659, 784].forEach((f, i) => this.tone('glocke', f, t + i * 0.08, 0.9, 0.14, B)); break;
      case 'puff': this.noiseBurst(t, 0.4, 0.3, 2400, 0.7); [1568, 1318].forEach((f, i) => this.tone('spieluhr', f, t + i * 0.08, 0.4, 0.12, B)); break;
      case 'kalt': [659, 587, 523, 440].forEach((f, i) => this.tone('glocke', f, t + i * 0.18, 1.2, 0.14, B)); break;
      case 'wusch': [900, 520, 260].forEach((f, i) => this.noiseBurst(t + i * 0.09, 0.22, 0.32, f, 1.2)); this.tone('sine', 110, t, 0.45, 0.12, B); break;
      case 'eiswind': this.noiseBurst(t, 2.2, 0.22, 5200, 0.6); this.noiseBurst(t + 0.3, 1.6, 0.16, 2600, 0.8); [2637, 2489, 3136].forEach((f, i) => this.tone('glocke', f, t + 0.2 + i * 0.35, 1.2, 0.05, B)); break;
      case 'niesen': this.noiseBurst(t, 0.08, 0.2, 1800, 1); this.noiseBurst(t + 0.18, 0.22, 0.5, 3600, 0.8); break;
      case 'schuhu': [392, 330].forEach((f, i) => { this.tone('sine', f, t + i * 0.32, 0.28, 0.16, B); this.noiseBurst(t + i * 0.32, 0.2, 0.08, 900, 1); }); break;
      case 'turmschlag': [131, 262, 330].forEach((f, i) => this.tone('glocke', f, t, 2.2, [0.3, 0.16, 0.08][i], B)); this.noiseBurst(t, 0.1, 0.2, 400, 1); break;
      case 'reim': [1568, 2093].forEach((f, i) => this.tone('spieluhr', f, t + i * 0.12, 0.8, 0.12, B)); break;
      case 'akkord': [523, 659, 784, 1046].forEach(f => this.tone('glocke', f, t, 2.4, 0.11, B)); [262, 392].forEach(f => this.tone('spieluhr', f, t, 2.4, 0.14, B)); break;
      case 'sieg': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => this.tone('glocke', f, t + i * 0.11, 1, 0.18, B)); break;
    }
  },
};
