// ===== Tagesfreischaltung (Europe/Berlin) =====
const SEASON_YEAR = 2026;

function berlinDate(now) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const o = {};
  parts.forEach(p => { if (p.type !== 'literal') o[p.type] = parseInt(p.value, 10); });
  return { y: o.year, m: o.month, d: o.day, h: o.hour % 24, min: o.minute };
}

// 0 = vor dem 1. Dezember, 1..24 = freigeschaltete Tage, ab 24.12. bleibt alles offen
function unlockedDay(now) {
  const b = berlinDate(now);
  if (b.y > SEASON_YEAR) return 24;
  if (b.y < SEASON_YEAR || b.m < 12) return 0;
  return Math.min(24, b.d);
}

function daysUntilStart(now) {
  if (unlockedDay(now) > 0) return 0;
  const b = berlinDate(now);
  const a = Date.UTC(b.y, b.m - 1, b.d), s = Date.UTC(SEASON_YEAR, 11, 1);
  return Math.max(0, Math.round((s - a) / 864e5));
}

// ?testtag=N (0..24) -> Zahl, sonst null
function parseTestDay(search) {
  const m = /[?&]testtag=(\d{1,2})(?:&|$)/.exec(search || '');
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 0 && n <= 24 ? n : null;
}

// Stunden bis Mitternacht in Berlin (aufgerundet, mindestens 1)
function hoursUntilNextDay(now) {
  const b = berlinDate(now);
  return Math.max(1, Math.ceil((24 * 60 - (b.h * 60 + b.min)) / 60));
}
