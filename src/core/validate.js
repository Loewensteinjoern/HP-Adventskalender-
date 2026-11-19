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
    if (a.zauber && !DATA.zauber[a.zauber]) E(where + ': Zauber „' + a.zauber + '“ fehlt');
    if (a.seq && !DATA.puzzles[a.seq]) E(where + ': Rätsel „' + a.seq + '“ fehlt');
    if (a.demo && !DATA.puzzles[a.demo]) E(where + ': Rätsel „' + a.demo + '“ fehlt');
    if (a.kampf) {
      if (!DATA.kampf.gruppen[a.kampf]) E(where + ': Kampf-Gruppe „' + a.kampf + '“ fehlt');
      else kampfRegel(a.kampf, a.if, null, where);
      checkAction(a.win, where + ' Sieg'); if (!a.win) E(where + ': Kampf ohne Sieg-Aktion');
    }
    if (a.glut) setFlags.add('glut_' + a.glut);
    if (a.szene && !(DATA.szenen || {})[a.szene]) E(where + ': Szene „' + a.szene + '“ fehlt');
    if (a.minigame) { if (a.minigame.type !== 'takt' && a.minigame.type !== 'uhr') E(where + ': unbekanntes Minispiel'); if (a.minigame.type === 'uhr' && !(DATA.puzzles[a.minigame.raetsel] || {}).fragen) E(where + ': Uhr-Rätsel fehlt'); checkAction(a.win, where + ' Sieg'); if (!a.win) E(where + ': Minispiel ohne Sieg-Aktion'); }
  }
  // Regel aus dem Fahrplan: Ein Gegner darf erst auftauchen, wenn seine Schwäche als Zauber gelernt werden kann.
  // Belegt durch "day>=N" (N ≥ Lerntag) oder "flag:zauber_x" in den Bedingungen bzw. "ab" bei Zufallskämpfen.
  function kampfRegel(gid, conds, ab, where) {
    const g = DATA.kampf.gruppen[gid];
    let tag = ab || 0; const flags = [];
    (conds || []).forEach(c => { let m; if ((m = /^day>=(\d+)$/.exec(c))) tag = Math.max(tag, +m[1]); if ((m = /^flag:zauber_(\w+)$/.exec(c))) flags.push(m[1]); });
    g.gegner.forEach(id => {
      const T = DATA.kampf.gegner[id];
      if (!T) return E(where + ': Gegner „' + id + '“ fehlt');
      const Z = DATA.zauber[T.schwaeche];
      if (!Z) return E('Gegner ' + id + ': Schwäche-Zauber „' + T.schwaeche + '“ fehlt');
      if (flags.indexOf(T.schwaeche) < 0 && tag < Z.tag) E(where + ': ' + T.name + ' taucht ab Tag ' + tag + ' auf, ' + Z.name + ' gibt es aber erst ab Tag ' + Z.tag);
    });
  }
  const checkTalk = (list, where) => (list || []).forEach((t, i) => checkAction(t, where + '[' + i + ']'));

  // Dialoge: Sprecher müssen existieren, Zeilen nicht zu lang
  Object.keys(dlg).forEach(id => {
    if (!Array.isArray(dlg[id]) || !dlg[id].length) return E('Dialog ' + id + ' ist leer');
    dlg[id].forEach(([sp, tx, taste], i) => {
      if (sp && !chars[sp]) E('Dialog ' + id + '[' + i + ']: Sprecher „' + sp + '“ unbekannt');
      if (taste !== undefined && ['a', 'b', 'menu', 'ton', 'dpad'].indexOf(taste) < 0) E('Dialog ' + id + '[' + i + ']: unbekannte Taste „' + taste + '“');
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
    if (!DATA.karte.orte[mid]) E(where + ': fehlt auf der Schlosskarte (data/karte.json)');
    if (m.kampf) {
      checkConds(m.kampf.if, where + ' Kampf');
      if (!(m.kampf.chance > 0 && m.kampf.chance < 0.5)) E(where + ': Kampf-Chance ungültig');
      if (!m.tiles.some(r => [...r].some(ch => DATA.tiles[ch] && DATA.tiles[ch].kampf))) E(where + ': Kämpfe eingestellt, aber kein Tiefschnee');
      (m.kampf.gruppen || []).forEach(g => { if (!DATA.kampf.gruppen[g.g]) E(where + ': Kampf-Gruppe „' + g.g + '“ fehlt'); else kampfRegel(g.g, m.kampf.if, g.ab, where + ' Kampf ' + g.g); });
    }
    (m.doors || []).forEach((d, i) => {
      const t = maps[d.to];
      if (!t) return E(where + ': Tür ' + i + ' führt zu fehlender Karte „' + d.to + '“');
      if (!inB(d.x, d.y)) E(where + ': Tür ' + i + ' außerhalb');
      if (tileSolid(t, d.tx, d.ty)) E(where + ': Tür ' + i + ' endet in einer Wand von ' + d.to);
      if (doorAt(t, d.tx, d.ty)) E(where + ': Tür ' + i + ' endet direkt auf einer Tür');
    });
  });

  // Szenen (data/szenen.json)
  const objIds = new Set(); Object.keys(maps).forEach(mid => (maps[mid].objects || []).forEach(o => { if (o.id) objIds.add(o.id); }));
  const ARTEN = ['balken', 'kamera', 'ort', 'sag', 'warte', 'ton', 'note', 'musik', 'aktion', 'figur', 'spieler', 'blick', 'blase', 'einblenden', 'ausblenden', 'fx', 'gehe', 'schwarz', 'tour'];
  const posOk = (mid, x, y) => maps[mid] && !tileSolid(maps[mid], x, y);
  Object.keys(DATA.szenen || {}).forEach(id => {
    const where = 'Szene ' + id;
    if (!Array.isArray(DATA.szenen[id]) || !DATA.szenen[id].length) return E(where + ' ist leer');
    DATA.szenen[id].forEach((st, i) => {
      const w = where + ' Schritt ' + (i + 1), art = Object.keys(st).find(k => ARTEN.indexOf(k) >= 0);
      if (!art) return E(w + ': unbekannte Art');
      if (st.sag) checkDialogRef(st.sag, w);
      if (st.aktion) checkAction(st.aktion, w);
      if (st.schwarz) checkAction(st.schwarz, w);
      if (st.figur && !chars[st.figur.char]) E(w + ': Figur „' + st.figur.char + '“ fehlt');
      if (st.blase && !chars[st.blase.char]) E(w + ': Figur „' + st.blase.char + '“ fehlt');
      if (st.gehe && !posOk(st.gehe.map, st.gehe.x, st.gehe.y)) E(w + ': Ziel ' + st.gehe.map + ' ungültig');
      if (st.ort && !maps[st.ort.map]) E(w + ': Ort ' + st.ort.map + ' fehlt');
      if (st.musik && !DATA.musik[st.musik]) E(w + ': Musik „' + st.musik + '“ fehlt');
      const oid = st.einblenden || st.ausblenden;
      if (oid) { if (!objIds.has(oid)) E(w + ': Objekt-id „' + oid + '“ gibt es auf keiner Karte'); setFlags.add(oid + (st.einblenden ? '_da' : '_weg')); }
    });
  });
  (DATA.welt.auto || []).forEach(a => { if (!DATA.szenen[a.szene]) E('welt.auto: Szene „' + a.szene + '“ fehlt'); checkConds(a.if, 'welt.auto ' + a.szene); });
  if (DATA.welt.haken0 && !DATA.szenen[DATA.welt.haken0]) E('Haken Tag 0 fehlt');
  ['nacht', 'nacht_prolog', 'morgen'].forEach(k => { if (!DATA.szenen[k]) E('Szene „' + k + '“ fehlt (Tagesablauf)'); });
  const ps = DATA.welt.prologStart;
  if (ps && !posOk(ps.map, ps.x, ps.y)) E('Prolog-Start ungültig');
  // Führung: jede Station führt durch eine echte Tür zur nächsten
  const F = DATA.fuehrung;
  if (F) {
    F.stationen.forEach((st, i) => {
      const w = 'Führung Station ' + i;
      if (!maps[st.map]) return E(w + ': Karte ' + st.map + ' fehlt');
      if (st.dialog) checkDialogRef(st.dialog, w);
      if (st.hinweis) checkDialogRef(st.hinweis, w);
      const nx = F.stationen[i + 1];
      if (nx) {
        if (!(maps[st.map].doors || []).some(d => d.to === st.nach)) E(w + ': keine Tür von ' + st.map + ' nach ' + st.nach);
        if (nx.map !== st.nach) E(w + ': nächste Station liegt nicht in ' + st.nach);
      } else if (!st.ziel || !posOk(st.map, st.ziel[0], st.ziel[1])) E(w + ': letzte Station braucht ein freies Ziel');
    });
    if (!posOk(F.abkuerzen.map, F.abkuerzen.x, F.abkuerzen.y)) E('Führung: Abkürzung endet in einer Wand');
    if (F.stationen.length && F.stationen[F.stationen.length - 1].map !== F.abkuerzen.map) E('Führung: Abkürzung führt nicht zur letzten Station');
  }
  (DATA.welt.prolog ? DATA.welt.prolog.steps : []).forEach(st => { if (!/^prolog_/.test(st.flag)) E('Prolog-Schritt ' + st.flag + ': Flag muss mit prolog_ beginnen'); });
  (DATA.hilfe || []).forEach((h, i) => { if (!h.titel || !h.text) E('Hilfe ' + i + ': Titel oder Text fehlt'); });

  // Rätsel (Reihenfolge)
  Object.keys(DATA.puzzles).forEach(id => {
    const P = DATA.puzzles[id];
    if (P.fragen) { P.fragen.forEach((f, i) => { if (!f.text || !(f.stunde >= 1 && f.stunde <= 12)) E('Uhr-Rätsel ' + id + ' Frage ' + (i + 1) + ' ungültig'); }); return; }
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

  Object.keys(DATA.karte.orte).forEach(k => { if (!maps[k]) E('Schlosskarte: Ort „' + k + '“ gibt es nicht'); });
  Object.keys(DATA.kampf.gegner).forEach(id => { const T = DATA.kampf.gegner[id]; ['name', 'angriffe', 'treffer', 'besiegt', 'hinweis', 'aussetzen', 'ausgewichen'].forEach(f => { if (!T[f]) E('Gegner ' + id + ': ' + f + ' fehlt'); }); });
  Object.keys(DATA.zauber).forEach(z => { if (!(DATA.zauber[z].tag >= 1 && DATA.zauber[z].tag <= 24)) E('Zauber ' + z + ': Lerntag fehlt'); });

  // Quests: jeder Schritt muss irgendwo gesetzt werden können
  const days = {};
  Object.keys(DATA.quests).forEach(id => {
    const q = DATA.quests[id];
    if (!(q.day >= (q.neben ? 0 : 1) && q.day <= 24)) E('Quest ' + id + ': Tag ungültig');
    if (!q.neben) { if (days[q.day]) E('Quest ' + id + ': Tag ' + q.day + ' doppelt'); days[q.day] = id; }
    if (!q.neben && !q.fragment) E('Quest ' + id + ': Fragment fehlt');
    if (!q.title || !Array.isArray(q.steps) || !q.steps.length) E('Quest ' + id + ': Titel oder Schritte fehlen');
    if (q.start) checkDialogRef(q.start, 'Quest ' + id);
    if (q.haken && !DATA.szenen[q.haken]) E('Quest ' + id + ': Haken-Szene „' + q.haken + '“ fehlt');
    (q.steps || []).forEach(st => stepFlags(st).forEach(f => { const m = /^zauber_(\w+)$/.exec(f); if (m && DATA.zauber[m[1]] && DATA.zauber[m[1]].tag !== q.day) E('Quest ' + id + ': ' + DATA.zauber[m[1]].name + ' wird an Tag ' + q.day + ' gelernt, laut zauber.json aber an Tag ' + DATA.zauber[m[1]].tag); }));
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
