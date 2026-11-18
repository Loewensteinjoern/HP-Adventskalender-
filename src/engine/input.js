// ===== Eingabe: Steuerkreuz, A, B, Menü – Touch und Tastatur =====
const IN = {
  held: [], presses: [],
  press(k) {
    if (DIRS[k]) { if (this.held.indexOf(k) < 0) this.held.push(k); }
    this.presses.push(k);
  },
  release(k) { const i = this.held.indexOf(k); if (i >= 0) this.held.splice(i, 1); },
  dir() { return this.held.length ? this.held[this.held.length - 1] : null; },
  take(k) { const i = this.presses.indexOf(k); if (i >= 0) { this.presses.splice(i, 1); return true; } return false; },
  clear() { this.presses.length = 0; },

  init() {
    const KMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right',
      Enter: 'a', ' ': 'a', z: 'a', y: 'a', x: 'b', Backspace: 'b', Escape: 'menu', m: 'menu' };
    addEventListener('keydown', e => {
      const k = KMAP[e.key]; if (!k) return;
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      e.preventDefault(); if (!e.repeat) this.press(k);
    });
    addEventListener('keyup', e => { const k = KMAP[e.key]; if (k) this.release(k); });
    addEventListener('blur', () => { this.held.length = 0; });

    // Steuerkreuz: Richtung aus der Lage zum Mittelpunkt
    const dpad = document.getElementById('dpad'), arrows = {};
    dpad.querySelectorAll('.ar').forEach(el => { arrows[el.dataset.d] = el; });
    let padDir = null;
    const setPad = d => {
      if (d === padDir) return;
      if (padDir) { this.release(padDir); arrows[padDir].classList.remove('on'); }
      padDir = d;
      if (d) { this.press(d); arrows[d].classList.add('on'); }
    };
    const padPos = e => {
      const r = dpad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < r.width * 0.1) return setPad(null);
      setPad(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    };
    dpad.addEventListener('pointerdown', e => { e.preventDefault(); try { dpad.setPointerCapture(e.pointerId); } catch (_) {} padPos(e); });
    dpad.addEventListener('pointermove', e => { if (padDir || e.buttons) padPos(e); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => dpad.addEventListener(n, () => setPad(null)));

    [['bA', 'a'], ['bB', 'b'], ['bMenu', 'menu']].forEach(([id, k]) => {
      const el = document.getElementById(id);
      el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); try { el.setPointerCapture(e.pointerId); } catch (_) {} this.press(k); el.classList.add('on'); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => el.addEventListener(n, () => { this.release(k); el.classList.remove('on'); }));
    });
    // Zoomen, Scrollen und Lupe auf dem iPad unterdrücken (außer im Code-Fenster)
    ['touchstart', 'touchmove', 'touchend', 'gesturestart', 'dblclick', 'contextmenu'].forEach(n => document.addEventListener(n, e => {
      if (e.target && e.target.closest && e.target.closest('#panel')) return;
      if (e.cancelable) e.preventDefault();
    }, { passive: false }));
  },
};
