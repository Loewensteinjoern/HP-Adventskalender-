// ===== Spielstand: Format, Migration, Speicher, Export =====
// Regel: Ein Update darf einen Spielstand nie löschen. Unbekannte Felder bleiben erhalten.

function newSave(now) {
  const s = DATA.welt.prologStart || DATA.welt.start;
  return {
    v: SAVE_VERSION, created: now, updated: now,
    map: s.map, x: s.x, y: s.y, dir: s.dir,
    flags: {}, done: [], fragments: [], secrets: [],
    followers: [], seenDay: 0, playMs: 0, tag: 0, tagEnde: false,
    waerme: WAERME_GRUND, energie: ENERGIE_MAX, ep: 0, stufe: 1, kraft: 0, lp: 0, wahl: 0, kakao: KAKAO_START, warm: null, besucht: [s.map], glut: [],
  };
}

// Migrationen: MIGRATIONS[n] macht aus Version n die Version n+1
const MIGRATIONS = {
  // v0 = Vorab-Format (nur zum Test der Migrationskette): {version:0, pos:{map,x,y}, flags}
  0: d => {
    const out = Object.assign({}, d);
    out.v = 1;
    if (isObj(d.pos)) { out.map = d.pos.map; out.x = d.pos.x; out.y = d.pos.y; }
    delete out.pos; delete out.version;
    return out;
  },
  // v1 → v2 (Stufe S2): Wärme, letzter warmer Ort, besuchte Orte (Schlosskarte), Glutsplitter
  1: d => {
    const out = Object.assign({}, d);
    out.waerme = WAERME_GRUND; out.warm = null; out.glut = [];
    out.besucht = typeof d.map === 'string' ? [d.map] : [];
    return out;
  },
  // v2 → v3 (S2b): Prolog und Tagesablauf. Alte Stände haben den Prolog nie gesehen – er gilt als gespielt.
  // Erzähltag = zuletzt gesehenes Türchen; vor dem 1.12. ist Tag 0 schon beendet.
  2: d => {
    const out = Object.assign({}, d), f = Object.assign({}, isObj(d.flags) ? d.flags : {});
    PROLOG_FLAGS.forEach(k => { f[k] = true; });
    f.diego_dabei = f.diego_dabei || (Array.isArray(d.followers) && d.followers.indexOf('diego') >= 0);
    out.flags = f;
    const seen = isNum(d.seenDay) ? clamp(Math.round(d.seenDay), 0, 24) : 0;
    out.tag = seen; out.tagEnde = seen === 0;
    return out;
  },
  // v3 → v4 (S3): Q01 ist länger geworden (Daune, Spurgabel, Brunnen). Wer die Feder schon hat, hat diese Schritte erledigt.
  3: d => {
    const out = Object.assign({}, d), f = Object.assign({}, isObj(d.flags) ? d.flags : {});
    if (f.q01_feder || f.q01_joern) ['q01_daune', 'q01_echt', 'q01_brunnen', 'q01_feder'].forEach(k => { f[k] = true; });
    out.flags = f;
    return out;
  },
  // v4 → v5 (S3): Spurgabel ohne Finten – drei Wörter im Raureif. Wer die echte Spur schon hatte, hat alle drei.
  4: d => {
    const out = Object.assign({}, d), f = Object.assign({}, isObj(d.flags) ? d.flags : {});
    if (f.q01_echt) ['q01_wort_1', 'q01_wort_2', 'q01_wort_3'].forEach(k => { f[k] = true; });
    out.flags = f;
    return out;
  },
};
const PROLOG_FLAGS = ['prolog_fest', 'prolog_joern', 'prolog_tour', 'prolog_tor', 'prolog_fertig'];

// Liefert {save, warnings} oder null, wenn gar nichts zu retten ist
function migrateSave(raw) {
  if (!isObj(raw)) return null;
  let d = Object.assign({}, raw);
  const warnings = [];
  let v = isNum(d.v) ? d.v : (isNum(d.version) ? d.version : null);
  if (v === null) return null;
  while (v < SAVE_VERSION) {
    if (!MIGRATIONS[v]) return null;
    d = MIGRATIONS[v](d); v += 1; d.v = v;
    warnings.push('migriert auf v' + v);
  }
  // Neuere Version (z. B. nach einem Zurücksetzen): behalten, nichts herabstufen
  if (v > SAVE_VERSION) warnings.push('Spielstand stammt aus neuerer Version');

  const s = newSave(isNum(d.created) ? d.created : 0);
  const out = Object.assign({}, d);
  out.v = Math.max(v, SAVE_VERSION);
  out.created = isNum(d.created) ? d.created : 0;
  out.updated = isNum(d.updated) ? d.updated : 0;
  out.flags = {};
  if (isObj(d.flags)) Object.keys(d.flags).forEach(k => {
    const val = d.flags[k];
    if (/^\w{1,60}$/.test(k) && (typeof val === 'boolean' || isNum(val))) out.flags[k] = val;
  });
  const strList = a => Array.isArray(a) ? a.filter(x => typeof x === 'string' && x.length < 60) : [];
  out.done = strList(d.done);
  out.fragments = strList(d.fragments);
  out.secrets = strList(d.secrets);
  out.followers = strList(d.followers).filter(f => DATA.characters[f]).filter((f, i, a) => a.indexOf(f) === i);
  // Jörn begleitet Charly, sobald er sich im Prolog angeschlossen hat
  if (out.flags.prolog_joern && out.followers.indexOf('joern') < 0) out.followers.unshift('joern');
  out.tag = isNum(d.tag) ? clamp(Math.round(d.tag), 0, 24) : 0;
  out.tagEnde = d.tagEnde === true;
  out.seenDay = isNum(d.seenDay) ? clamp(d.seenDay, 0, 24) : 0;
  out.playMs = isNum(d.playMs) ? d.playMs : 0;
  out.glut = strList(d.glut);
  const zahl = (v, a, b, def) => isNum(v) ? clamp(Math.round(v), a, b) : def;
  out.stufe = zahl(d.stufe, 1, STUFE_MAX, 1); out.ep = zahl(d.ep, 0, 9999, 0);
  out.kraft = zahl(d.kraft, 0, STUFE_MAX, 0); out.lp = zahl(d.lp, 0, STUFE_MAX, 0); out.wahl = zahl(d.wahl, 0, STUFE_MAX, 0);
  out.besucht = strList(d.besucht).filter(k => DATA.maps[k]);
  out.waerme = isNum(d.waerme) ? clamp(Math.round(d.waerme), 1, waermeMax(out)) : waermeMax(out);
  out.energie = isNum(d.energie) ? clamp(Math.round(d.energie), 0, ENERGIE_MAX) : ENERGIE_MAX;
  out.kakao = isNum(d.kakao) ? clamp(Math.round(d.kakao), 0, KAKAO_MAX) : KAKAO_START;
  const w = d.warm, wm = isObj(w) && typeof w.map === 'string' && DATA.maps[w.map];
  out.warm = wm && isNum(w.x) && isNum(w.y) && !tileSolid(wm, w.x, w.y) && DIRS[w.dir] ? { map: w.map, x: w.x, y: w.y, dir: w.dir } : null;
  // Position: unbekannte Karte oder Wand -> sicher zum Start, Fortschritt bleibt
  const m = typeof d.map === 'string' && DATA.maps[d.map];
  const posOk = m && isNum(d.x) && isNum(d.y) && d.x >= 0 && d.y >= 0 && d.y < m.tiles.length && d.x < m.tiles[0].length
    && !(DATA.tiles[m.tiles[d.y][d.x]] || {}).solid;
  if (posOk) { out.map = d.map; out.x = d.x; out.y = d.y; }
  else { const st = out.flags.prolog_fest ? DATA.welt.start : (DATA.welt.prologStart || DATA.welt.start); out.map = st.map; out.x = st.x; out.y = st.y; warnings.push('Position zurückgesetzt'); }
  out.dir = DIRS[d.dir] ? d.dir : 'down';
  return { save: out, warnings };
}

// st: Objekt mit getItem/setItem (localStorage oder Testattrappe)
function storeLoad(st, key) {
  const tryParse = raw => { try { return migrateSave(JSON.parse(raw)); } catch (e) { return null; } };
  let raw = null;
  try { raw = st.getItem(key); } catch (e) { return { save: null, source: null, broken: false }; }
  if (raw) {
    const r = tryParse(raw);
    if (r) return { save: r.save, warnings: r.warnings, source: 'main', broken: false };
    // Kaputt: Rohdaten aufheben (nie löschen), dann Sicherung versuchen
    try { if (st.getItem(key + '_defekt') !== raw) st.setItem(key + '_defekt', raw); } catch (e) {}
  }
  let braw = null;
  try { braw = st.getItem(key + '_backup'); } catch (e) {}
  if (braw) {
    const r = tryParse(braw);
    if (r) return { save: r.save, warnings: r.warnings, source: 'backup', broken: !!raw };
  }
  return { save: null, source: null, broken: !!raw };
}

function storeWrite(st, key, save) {
  try {
    const old = st.getItem(key);
    // Vorherigen Stand nur dann als Sicherung behalten, wenn er gültig ist
    if (old) { let ok = false; try { ok = !!migrateSave(JSON.parse(old)); } catch (e) {} if (ok) st.setItem(key + '_backup', old); }
    st.setItem(key, JSON.stringify(save));
    return true;
  } catch (e) { return false; }
}

// Export-Code: WP1-<base64>-<prüfwert>
function exportCode(save) {
  const json = JSON.stringify(save);
  return 'WP1-' + utf8ToB64(json) + '-' + hashStr(json);
}
function importCode(code) {
  const c = String(code || '').replace(/\s+/g, '');
  const m = /^WP1-([A-Za-z0-9+/=]+)-([0-9a-z]+)$/.exec(c);
  if (!m) return { error: 'Das ist kein gültiger Spielstand-Code.' };
  let json;
  try { json = b64ToUtf8(m[1]); } catch (e) { return { error: 'Der Code ist beschädigt.' }; }
  if (hashStr(json) !== m[2]) return { error: 'Der Code ist unvollständig oder verändert.' };
  let r = null;
  try { r = migrateSave(JSON.parse(json)); } catch (e) {}
  if (!r) return { error: 'Der Code enthält keinen lesbaren Spielstand.' };
  return { save: r.save };
}
