// ===== Datenprüfung (läuft beim Bauen und in den Tests) =====
function validateData() {
  const errors = [], warnings = [];
  const E = m => errors.push(m), Wn = m => warnings.push(m);
  const maps = DATA.maps, dlg = DATA.dialogs, chars = DATA.characters;
  const setFlags = new Set();

  function checkDialogRef(id, where) {
    const ids = Array.isArray(id) ? id : [id];
    ids.forEach(d => { if (!dlg[d]) E(where + ': Dialog „' + d + '“ fehlt'); });
  }
  function checkConds(list, where) {
    (list || []).forEach(c => { if (!COND_RE.test(c)) E(where + ': unbekannte Bedingung „' + c + '“'); });
  }
  function checkAction(a, where) {
    if (!a) return;
    checkConds(a.if, where);
    if (a.dialog) checkDialogRef(a.dialog, where);
    (a.set || []).forEach(f => setFlags.add(f));
    if (a.join && !chars[a.join]) E(where + ': Begleiter „' + a.join + '“ unbekannt');
    if (a.leave && !chars[a.leave]) E(where + ': Begleiter „' + a.leave + '“ unbekannt');
    if (a.seq && !DATA.puzzles[a.seq]) E(where + ': Rätsel „' + a.seq + '“ fehlt');
    if (a.demo && !DATA.puzzles[a.demo]) E(where + ': Rätsel „' + a.demo + '“ fehlt');
    if (a.minigame) { if (a.minigame.type !== 'takt') E(where + ': unbekanntes Minispiel'); checkAction(a.win, where + ' Sieg'); if (!a.win) E(where + ': Minispiel ohne Sieg-Aktion'); }
  }
  const checkTalk = (list, where) => (list || []).forEach((t, i) => checkAction(t, where + '[' + i + ']'));

  // Dialoge: Sprecher müssen existieren, Zeilen nicht zu lang
  Object.keys(dlg).forEach(id => {
    if (!Array.isArray(dlg[id]) || !dlg[id].length) return E('Dialog ' + id + ' ist leer');
    dlg[id].forEach(([sp, tx], i) => {
      if (sp && !chars[sp]) E('Dialog ' + id + '[' + i + ']: Sprecher „' + sp + '“ unbekannt');
      if (typeof tx !== 'string' || !tx) E('Dialog ' + id + '[' + i + ']: Text fehlt');
      else if (tx.length > 190) Wn('Dialog ' + id + '[' + i + '] ist sehr lang (' + tx.length + ' Zeichen)');
    });
  });
  Object.keys(chars).forEach(c => checkTalk(chars[c].talk, 'Figur ' + c));

  // Musik: jede Note muss lesbar sein (z. B. A#4:2, Pause -:6)
  Object.keys(DATA.musik).forEach(id => (DATA.musik[id].voices || []).forEach((vc, i) => vc.notes.trim().split(/\s+/).forEach(tok => {
    if (!/^([A-G][#b]?[0-8]|-):\d+(\.\d+)?$/.test(tok)) E('Musik ' + id + ' Stimme ' + i + ': unlesbare Note „' + tok + '“');
  })));

  // Karten
  if (!maps[DATA.welt.start.map]) E('Startkarte fehlt');
  Object.keys(maps).forEach(mid => {
    const m = maps[mid], w = m.tiles[0].length, where = 'Karte ' + mid;
    m.tiles.forEach((row, y) => {
      if (row.length !== w) E(where + ': Zeile ' + y + ' hat falsche Länge');
      for (const ch of row) if (!DATA.tiles[ch]) E(where + ': unbekannte Kachel „' + ch + '“ in Zeile ' + y);
    });
    const inB = (x, y) => x >= 0 && y >= 0 && x < w && y < m.tiles.length;
    if (m.music && !DATA.musik[m.music]) E(where + ': Musik „' + m.music + '“ fehlt');
    (m.objects || []).forEach((o, i) => {
      const t = DATA.objects[o.type];
      if (!t) return E(where + ': Objekt-Typ „' + o.type + '“ fehlt');
      if (!inB(o.x, o.y) || !inB(o.x + t.w - 1, o.y + t.h - 1)) E(where + ': Objekt ' + o.type + ' liegt außerhalb');
      checkConds(o.if, where + ' Objekt ' + i); checkTalk(o.talk, where + ' Objekt ' + o.type);
    });
    (m.npcs || []).forEach(n => {
      if (!chars[n.char]) E(where + ': NPC-Figur „' + n.char + '“ fehlt');
      if (!inB(n.x, n.y)) E(where + ': NPC ' + n.char + ' außerhalb');
      checkConds(n.if, where + ' NPC ' + n.char); checkTalk(n.talk, where + ' NPC ' + n.char);
    });
    (m.spots || []).forEach((s, i) => { if (!inB(s.x, s.y)) E(where + ': Stelle ' + i + ' außerhalb'); checkConds(s.if, where); checkTalk(s.talk, where + ' Stelle ' + i); });
    (m.secrets || []).forEach(s => {
      if (!s.id) E(where + ': Geheimnis ohne id');
      if (!inB(s.x, s.y)) E(where + ': Geheimnis ' + s.id + ' außerhalb');
      checkConds(s.if, where + ' Geheimnis ' + s.id); checkAction(s.found, where + ' Geheimnis ' + s.id);
    });
    (m.doors || []).forEach((d, i) => {
      const t = maps[d.to];
      if (!t) return E(where + ': Tür ' + i + ' führt zu fehlender Karte „' + d.to + '“');
      if (!inB(d.x, d.y)) E(where + ': Tür ' + i + ' außerhalb');
      if (tileSolid(t, d.tx, d.ty)) E(where + ': Tür ' + i + ' endet in einer Wand von ' + d.to);
      if (doorAt(t, d.tx, d.ty)) E(where + ': Tür ' + i + ' endet direkt auf einer Tür');
    });
  });

  // Rätsel (Reihenfolge)
  Object.keys(DATA.puzzles).forEach(id => {
    const P = DATA.puzzles[id];
    if (!Array.isArray(P.order) || !P.order.length) return E('Rätsel ' + id + ': Reihenfolge fehlt');
    if (!Array.isArray(P.notes) || P.notes.length < Math.max.apply(null, P.order)) E('Rätsel ' + id + ': zu wenige Töne');
    P.order.forEach(v => setFlags.add(id + '_' + v));
    checkAction(P.win, 'Rätsel ' + id + ' Sieg'); checkAction(P.fail, 'Rätsel ' + id + ' Fehler');
  });

  // Erreichbarkeit: vom Start über Türen alle Karten, Figuren und Objekte.
  // Bedingte Objekte/Figuren (z. B. Geheimgang-Steine) gelten als wegräumbar.
  const ctx = { flags: {}, day: 24, done: [], followers: Object.keys(chars) };
  const blockedAt = (m, x, y) => tileSolid(m, x, y) ||
    (m.objects || []).some(o => !o.if && objSolid(o) && objCovers(o, x, y)) ||
    (m.npcs || []).some(n => !n.if && n.x === x && n.y === y);
  const seen = {}; Object.keys(maps).forEach(k => { seen[k] = new Set(); });
  const queue = [[DATA.welt.start.map, DATA.welt.start.x, DATA.welt.start.y]];
  while (queue.length) {
    const [mid, x, y] = queue.pop(), m = maps[mid];
    if (!m || seen[mid].has(x + ',' + y)) continue;
    seen[mid].add(x + ',' + y);
    const d = doorAt(m, x, y);
    if (d && maps[d.to]) { queue.push([d.to, d.tx, d.ty]); continue; }
    Object.values(DIRS).forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      if (!blockedAt(m, nx, ny) && !seen[mid].has(nx + ',' + ny)) queue.push([mid, nx, ny]);
    });
  }
  const nearReach = (mid, cells) => cells.some(([x, y]) => Object.values(DIRS).some(([dx, dy]) => seen[mid].has((x + dx) + ',' + (y + dy))) || seen[mid].has(x + ',' + y));
  Object.keys(maps).forEach(mid => {
    const m = maps[mid];
    if (!seen[mid].size) return E('Karte ' + mid + ' ist nicht erreichbar');
    (m.doors || []).forEach((d, i) => { if (!seen[mid].has(d.x + ',' + d.y)) E('Karte ' + mid + ': Tür ' + i + ' ist nicht erreichbar'); });
    (m.npcs || []).forEach(n => { if (!nearReach(mid, [[n.x, n.y]])) E('Karte ' + mid + ': ' + n.char + ' ist nicht erreichbar'); });
    (m.secrets || []).forEach(s => { if (!nearReach(mid, [[s.x, s.y]])) E('Karte ' + mid + ': Geheimnis ' + s.id + ' ist nicht erreichbar'); });
    (m.objects || []).forEach(o => {
      if (!o.talk) return;
      const t = DATA.objects[o.type], cells = [];
      for (let yy = 0; yy < t.h; yy++) for (let xx = 0; xx < t.w; xx++) cells.push([o.x + xx, o.y + yy]);
      if (!nearReach(mid, cells)) E('Karte ' + mid + ': Objekt ' + o.type + ' ist nicht erreichbar');
    });
  });

  // Quests: jeder Schritt muss irgendwo gesetzt werden können
  const days = {};
  Object.keys(DATA.quests).forEach(id => {
    const q = DATA.quests[id];
    if (!(q.day >= (q.neben ? 0 : 1) && q.day <= 24)) E('Quest ' + id + ': Tag ungültig');
    if (!q.neben) { if (days[q.day]) E('Quest ' + id + ': Tag ' + q.day + ' doppelt'); days[q.day] = id; }
    if (!q.neben && !q.fragment) E('Quest ' + id + ': Fragment fehlt');
    if (!q.title || !Array.isArray(q.steps) || !q.steps.length) E('Quest ' + id + ': Titel oder Schritte fehlen');
    if (q.start) checkDialogRef(q.start, 'Quest ' + id);
    (q.steps || []).forEach((st, i) => stepFlags(st).forEach(f => {
      if (!setFlags.has(f)) {
        if (q.teilweise) Wn('Quest ' + id + ' Schritt ' + (i + 1) + ' (' + f + ') ist noch nicht baubar – Quest als „teilweise“ markiert');
        else E('Quest ' + id + ' Schritt ' + (i + 1) + ': Flag „' + f + '“ wird nirgends gesetzt – nicht abschließbar');
      }
    }));
    if (q.teilweise) Wn('Quest ' + id + ' ist noch nicht vollständig gebaut');
  });
  return { errors, warnings };
}
