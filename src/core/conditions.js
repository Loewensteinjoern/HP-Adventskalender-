// ===== Bedingungen und Aktionen aus den Daten =====
// Bedingungen: "flag:x", "day>=3", "quest:Q01" (offen und aktiv), "done:Q01",
// "follower:diego", "glut>=1" (Anzahl Glutsplitter). Ein "!" davor kehrt um.
// ctx: { flags, day, done[], followers[] }

function questIsActive(id, ctx) {
  const q = DATA.quests[id];
  return !!q && q.day <= ctx.day && ctx.done.indexOf(id) < 0;
}

function checkCond(c, ctx) {
  if (typeof c !== 'string') return false;
  if (c[0] === '!') return !checkCond(c.slice(1), ctx);
  let m;
  if ((m = /^flag:(\w+)$/.exec(c))) return !!ctx.flags[m[1]];
  if ((m = /^day>=(\d+)$/.exec(c))) return ctx.day >= +m[1];
  if ((m = /^day<(\d+)$/.exec(c))) return ctx.day < +m[1];
  if ((m = /^quest:(\w+)$/.exec(c))) return questIsActive(m[1], ctx);
  if ((m = /^done:(\w+)$/.exec(c))) return ctx.done.indexOf(m[1]) >= 0;
  if ((m = /^follower:(\w+)$/.exec(c))) return ctx.followers.indexOf(m[1]) >= 0;
  if ((m = /^glut>=(\d+)$/.exec(c))) return (ctx.glut || 0) >= +m[1];
  return false;
}
const COND_RE = /^!?(flag:\w+|day>=\d+|day<\d+|quest:\w+|done:\w+|follower:\w+|glut>=\d+)$/;

function condsOk(list, ctx) { return !list || list.every(c => checkCond(c, ctx)); }

// Erste passende Gesprächs-/Untersuchen-Regel aus einer Liste
function pickTalk(list, ctx) {
  if (!Array.isArray(list)) return null;
  for (const t of list) if (condsOk(t.if, ctx)) return t;
  return null;
}
