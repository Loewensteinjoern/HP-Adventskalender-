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
        const c = this.ctx = new AC();
        this.master = c.createGain(); this.master.gain.value = this.on ? 0.8 : 0; this.master.connect(c.destination);
        this.music = c.createGain(); this.music.gain.value = 0.32; this.music.connect(this.master);
        this.sfxBus = c.createGain(); this.sfxBus.gain.value = 0.5; this.sfxBus.connect(this.master);
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
    if (this.master) this.master.gain.setTargetAtTime(v ? 0.8 : 0, this.ctx.currentTime, 0.05);
    if (v && this.want) this.playMusic(this.want, true);
  },
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); },
  resume() { if (this.ctx && this.on) this.ctx.resume(); },

  // --- Instrumente ---
  tone(type, f, t, dur, vol, bus) {
    const c = this.ctx, g = c.createGain(); g.connect(bus || this.music);
    const o = c.createOscillator(); o.frequency.value = f; o.connect(g);
    if (type === 'spieluhr') {
      o.type = 'sine'; const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 4; const g2 = c.createGain(); g2.gain.value = 0.12; o2.connect(g2); g2.connect(g);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o2.start(t); o2.stop(t + 1.5); o.start(t); o.stop(t + 1.5);
    } else if (type === 'glocke') {
      o.type = 'sine'; const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.76; const g2 = c.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(g);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      o2.start(t); o2.stop(t + 2.5); o.start(t); o.stop(t + 2.5);
    } else if (type === 'bass') {
      o.type = 'triangle';
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95);
      o.start(t); o.stop(t + dur);
    } else if (type === 'flaeche') {
      o.type = 'triangle'; const o2 = c.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 1.5; o2.detune.value = 6; o2.connect(g);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * 0.6, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o2.start(t); o2.stop(t + dur); o.start(t); o.stop(t + dur);
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
    this.music.gain.setValueAtTime(0.0001, this.ctx.currentTime); this.music.gain.exponentialRampToValueAtTime(0.32, this.ctx.currentTime + 0.8);
    this.timer = setInterval(() => this.tick(), 60); this.tick();
  },
  stopMusic() { if (this.timer) clearInterval(this.timer); this.timer = null; this.cur = null; },
  tick() {
    const m = this.cur; if (!m || !this.ctx) return;
    const ahead = this.ctx.currentTime + 0.3;
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

  // --- Geräusche ---
  sfx(name) {
    if (!this.ctx || !this.on || this.failed) return;
    const t = this.ctx.currentTime + 0.01, B = this.sfxBus;
    switch (name) {
      case 'blip': this.tone('square', 760, t, 0.03, 0.03, B); break;
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
      case 'stoss': this.tone('sine', 120, t, 0.06, 0.12, B); break;
    }
  },
};
