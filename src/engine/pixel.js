// ===== Pixel-Werkzeuge: alle Grafiken werden im Code gemalt =====
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function srand(seed) { let s = (seed | 0) % 2147483647; if (s <= 0) s += 2147483646; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbHex(r, g, b) { return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
// Farbe aufhellen (amt > 0) oder abdunkeln (amt < 0)
function shade(h, amt) {
  const [r, g, b] = hexRgb(h);
  return amt >= 0 ? rgbHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt) : rgbHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}

// Mal-Pinsel für einen Canvas-Kontext
function Pen(g) {
  return {
    g,
    r(x, y, w, h, c) { if (w <= 0 || h <= 0) return; g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); },
    px(x, y, c) { g.fillStyle = c; g.fillRect(x | 0, y | 0, 1, 1); },
    ell(cx, cy, rx, ry, c) {
      g.fillStyle = c;
      for (let y = -ry; y <= ry; y++) {
        const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / ((ry + 0.4) * (ry + 0.4)))));
        if (w > 0) g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1);
      }
    },
    circ(cx, cy, rad, c) { this.ell(cx, cy, rad, rad, c); },
    // Senkrechter Farbverlauf in Stufen (Pixel-Look)
    vgrad(x, y, w, h, c1, c2, steps) {
      steps = steps || 4;
      const [a, b, d] = hexRgb(c1), [e, f, k] = hexRgb(c2);
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1 || 1), y0 = y + Math.round(h * i / steps), y1 = y + Math.round(h * (i + 1) / steps);
        this.r(x, y0, w, y1 - y0, rgbHex(a + (e - a) * t, b + (f - b) * t, d + (k - d) * t));
      }
    },
    // Linie (Bresenham)
    line(x0, y0, x1, y1, c) {
      g.fillStyle = c; x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) { g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
    },
  };
}

// Dunkle Kontur um alle sichtbaren Pixel (bessere Lesbarkeit der Figuren)
function outline(c, col) {
  const g = c.getContext('2d'), w = c.width, h = c.height, d = g.getImageData(0, 0, w, h).data, add = [];
  const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 40;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
    if (!op(x, y) && (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1))) add.push(x, y);
  g.fillStyle = col;
  for (let i = 0; i < add.length; i += 2) g.fillRect(add[i], add[i + 1], 1, 1);
}

// Farbpaletten der Welt
const PAL = {
  holz: '#8a5632', holzHell: '#a86d40', holzDunkel: '#5e3820', holzSchwarz: '#3a2214',
  bernstein: '#e09a2c', bernsteinHell: '#f4c35a', bernsteinDunkel: '#a8661a',
  moos: '#4f6b2a', mossHell: '#6f8f3a', moosDunkel: '#33481a',
  stein: '#8d7c6a', steinHell: '#b0a08a', steinDunkel: '#5e5246',
  kalt: '#3a4a78', kaltHell: '#9cc0f0', schnee: '#eef4ff',
  glut: '#ff8a2a', glutHell: '#ffd36a', glutRot: '#e0442a',
  rot: '#b8322a', gruen: '#2f6a32', gold: '#e8c050',
};
