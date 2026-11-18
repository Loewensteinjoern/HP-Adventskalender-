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
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { this.failed = true; return; }
        // 'playback' = größerer Puffer: verhindert Knacken, wenn das Bild viel zu tun hat
        let c; try { c = new AC({ latencyHint: 'playback' }); } catch (e) { c = new AC(); }
        this.ctx = c;
        const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(c.destination);
        this.master = c.createGain(); this.master.gain.value = this.on ? 0.9 : 0; this.master.connect(comp);
        // Musik: sanfter Tiefpass gegen klickende Höhen, dazu etwas Hall für Wärme
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = 0.4; lp.connect(this.master);
        this.music = c.createGain(); this.music.gain.value = 0.55; this.music.connect(lp);
        const len = Math.floor(c.sampleRate * 2.4), ir = c.createBuffer(2, len, c.sampleRate);
        for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
        const rev = c.createConvolver(); rev.buffer = ir; const wet = c.createGain(); wet.gain.value = 0.28;
        this.music.connect(rev); rev.connect(wet); wet.connect(this.master);
        this.sfxBus = c.createGain(); this.sfxBus.gain.value = 0.45; this.sfxBus.connect(this.master);
        const nb = c.createBuffer(1, c.sampleRate, c.sampleRate), d = nb.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noise = nb;
        const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0);
        if (this.want) this.playMusic(this.want, true);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { this.failed = true; }
  },
  setOn(v) {
    this.on = v;
    try { localStorage.setItem(SOUND_KEY, v ? 'an' : 'aus'); } catch (e) {}
    if (this.master) this.master.gain.setTargetAtTime(v ? 0.9 : 0, this.ctx.currentTime, 0.05);
    if (v && this.want) this.playMusic(this.want, true);
  },
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); },
  resume() { if (this.ctx && this.on) this.ctx.resume(); },

  // --- Instrumente ---
  tone(type, f, t, dur, vol, bus) {
    const c = this.ctx, g = c.createGain(); g.connect(bus || this.music);
    const o = c.createOscillator(); o.frequency.value = f; o.connect(g);
    if (type === 'spieluhr') {
      // weiche Spieluhr: Grundton + leiser Oberton, sanfter Einschwung, langes Ausklingen
      o.type = 'sine'; const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2; const g2 = c.createGain(); g2.gain.value = 0.08; o2.connect(g2); g2.connect(g);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.018); g.gain.setTargetAtTime(0, t + 0.05, 0.55);
      o2.start(t); o2.stop(t + 2.6); o.start(t); o.stop(t + 2.6);
    } else if (type === 'glocke') {
      o.type = 'sine';
      [[2.76, 0.14], [5.4, 0.04]].forEach(([m, v]) => { const ox = c.createOscillator(); ox.type = 'sine'; ox.frequency.value = f * m; const gx = c.createGain(); gx.gain.value = v; ox.connect(gx); gx.connect(g); ox.start(t); ox.stop(t + 3); });
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

  // --- Musik mit Vorausplanung ---
  playMusic(name, force) {
    this.want = name;
    if (!this.ctx || !this.on || this.failed) return;
    if (!force && this.cur && this.cur.name === name) return;
    this.stopMusic();
    const song = DATA.musik[name]; if (!song) return;
    const eighth = 60 / song.bpm / 2;
    const voices = song.voices.map(v => Object.assign({ inst: v.inst, vol: v.vol || 0.4 }, parseVoice(v.notes)));
    const len = Math.max.apply(null, voices.map(v => v.len)) * eighth;
    this.cur = { name, voices, eighth, len, start: this.ctx.currentTime + 0.15, idx: voices.map(() => 0), loop: voices.map(() => 0) };
    this.music.gain.cancelScheduledValues(this.ctx.currentTime);
    this.music.gain.setValueAtTime(0.0001, this.ctx.currentTime); this.music.gain.exponentialRampToValueAtTime(0.55, this.ctx.currentTime + 0.8);
    this.timer = setInterval(() => this.tick(), 50); this.tick();
  },
  stopMusic() { if (this.timer) clearInterval(this.timer); this.timer = null; this.cur = null; },
  tick() {
    const m = this.cur; if (!m || !this.ctx) return;
    const ahead = this.ctx.currentTime + 0.6;
    m.voices.forEach((v, i) => {
      for (let guard = 0; guard < 64; guard++) {
        if (!v.ev.length) return;
        const e = v.ev[m.idx[i]], t = m.start + m.loop[i] * m.len + e.t * m.eighth;
        if (t > ahead) return;
        if (t >= this.ctx.currentTime - 0.05) this.tone(v.inst, e.f, t, e.dur * m.eighth, v.vol);
        m.idx[i]++; if (m.idx[i] >= v.ev.length) { m.idx[i] = 0; m.loop[i]++; }
      }
    });
  },

  note(n) { if (!this.ctx || !this.on || this.failed) return; const f = noteFreq(n); if (f) this.tone('glocke', f, this.ctx.currentTime + 0.01, 1.2, 0.3, this.sfxBus); },
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
    }
  },
};
