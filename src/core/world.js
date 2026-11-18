// ===== Welt: Karten, Kollision, Wege =====
function mapW(m) { return m.tiles[0].length; }
function mapH(m) { return m.tiles.length; }
function tileChar(m, x, y) {
  if (y < 0 || y >= m.tiles.length || x < 0 || x >= m.tiles[0].length) return null;
  return m.tiles[y][x];
}
function tileSolid(m, x, y) {
  const c = tileChar(m, x, y);
  return c === null || !!(DATA.tiles[c] || {}).solid;
}
function objType(o) { return DATA.objects[o.type]; }
function objCovers(o, x, y) {
  const t = objType(o);
  return x >= o.x && x < o.x + t.w && y >= o.y && y < o.y + t.h;
}
function visibleObjs(m, ctx) { return (m.objects || []).filter(o => condsOk(o.if, ctx)); }
function visibleNpcs(m, ctx) { return (m.npcs || []).filter(n => condsOk(n.if, ctx)); }
function objAt(m, x, y, ctx) { return visibleObjs(m, ctx).find(o => objCovers(o, x, y)) || null; }
function npcAt(m, x, y, ctx) { return visibleNpcs(m, ctx).find(n => n.x === x && n.y === y) || null; }
function spotAt(m, x, y, ctx) { return (m.spots || []).find(s => s.x === x && s.y === y && condsOk(s.if, ctx)) || null; }
function doorAt(m, x, y) { return (m.doors || []).find(d => d.x === x && d.y === y) || null; }
function secretAt(m, x, y, ctx) { return (m.secrets || []).find(s => s.x === x && s.y === y && condsOk(s.if, ctx)) || null; }

function blockedAt(m, x, y, ctx) {
  if (tileSolid(m, x, y)) return true;
  if (visibleObjs(m, ctx).some(o => objType(o).solid && objCovers(o, x, y))) return true;
  if (npcAt(m, x, y, ctx)) return true;
  return false;
}

// Kürzester Weg (Breitensuche) bis auf das Ziel oder direkt daneben (Ziel darf fest sein)
function findPath(m, from, to, ctx, maxLen) {
  const w = mapW(m), h = mapH(m), key = (x, y) => y * w + x;
  const prev = new Map(); prev.set(key(from.x, from.y), null);
  const q = [[from.x, from.y]];
  const isGoal = (x, y) => Math.abs(x - to.x) + Math.abs(y - to.y) <= (blockedAt(m, to.x, to.y, ctx) ? 1 : 0);
  while (q.length) {
    const [x, y] = q.shift();
    if (isGoal(x, y)) {
      const path = []; let k = key(x, y);
      while (k !== null) { path.unshift({ x: k % w, y: Math.floor(k / w) }); k = prev.get(k); }
      return path.length - 1 <= (maxLen || 99) ? path : null;
    }
    for (const d of Object.values(DIRS)) {
      const nx = x + d[0], ny = y + d[1], k = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || prev.has(k)) continue;
      if (blockedAt(m, nx, ny, ctx)) continue;
      prev.set(k, key(x, y)); q.push([nx, ny]);
    }
  }
  return null;
}
