// ===== Kampf: Regeln ohne Darstellung (in Node testbar) =====
// Rundenbasiert: Charly wählt eine Aktion (für sich, Jörn oder Diego), danach handeln die Gegner.
// Wärme statt Lebenspunkte. Bei 0 Wärme kein Game Over: Charly wacht im Warmen wieder auf.

const WAERME_GRUND = 10;
// Je 3 Glutsplitter: 2 Wärme mehr
function waermeMax(save) { return WAERME_GRUND + 2 * Math.floor(((save && save.glut) || []).length / 3); }

function kampfNeu(gruppeId, opt) {
  opt = opt || {};
  const g = DATA.kampf.gruppen[gruppeId];
  const max = opt.max || WAERME_GRUND;
  return {
    gruppe: gruppeId, tutorial: !!g.tutorial, flucht: g.flucht !== false,
    gegner: g.gegner.map((id, i) => { const t = DATA.kampf.gegner[id]; return { id, nr: i, kraft: t.kraft, max: t.kraft, aus: 0, erkannt: false }; }),
    waerme: clamp(isNum(opt.waerme) ? opt.waerme : max, 1, max), max, mut: 0, runde: 1, ende: null,
    zauber: opt.zauber || [], diego: opt.diego !== false, joern: opt.joern !== false,
  };
}
function kampfLebend(F) { return F.gegner.filter(e => e.kraft > 0); }
const gName = e => DATA.kampf.gegner[e.id].name;
const fill = (s, e) => s.replace(/\{name\}/g, e ? gName(e) : '');

// Welche Aktionen gerade möglich sind
function kampfAktionen(F) {
  const a = [{ art: 'zaubern', label: 'Zaubern', wer: 'charly', ok: F.zauber.length > 0 }, { art: 'schneeball', label: 'Schneeball', wer: 'charly', ok: true }];
  if (F.joern) a.push({ art: 'kakao', label: 'Kakao', wer: 'joern', ok: true }, { art: 'mut', label: 'Mut zusprechen', wer: 'joern', ok: true });
  if (F.diego) a.push({ art: 'bellen', label: 'Bellen', wer: 'diego', ok: true }, { art: 'schnueffeln', label: 'Schnüffeln', wer: 'diego', ok: true });
  a.push({ art: 'flucht', label: 'Zurückziehen', wer: 'charly', ok: F.flucht });
  return a;
}
// Braucht die Aktion ein Ziel?
function kampfZielNoetig(art) { return art === 'zauber' || art === 'schneeball' || art === 'bellen'; }

// Führt Charlys Wahl aus und lässt danach die Gegner handeln.
// akt: { art, z (Zauber), ziel (Index) }. Liefert eine Liste von Ereignissen für die Darstellung.
function kampfZug(F, akt, rnd) {
  rnd = rnd || Math.random;
  const ev = [], K = DATA.kampf;
  if (F.ende) return ev;
  const lebend = kampfLebend(F);
  let ziel = F.gegner[akt.ziel];
  if (!ziel || ziel.kraft <= 0) ziel = lebend[0];
  const hit = (e, dmg, text, fx) => {
    e.kraft = Math.max(0, e.kraft - dmg);
    ev.push({ wer: 'charly', text, fx, ziel: e.nr, dmg });
    if (e.kraft <= 0) ev.push({ wer: '', text: fill(K.gegner[e.id].besiegt, e), fx: 'weg', ziel: e.nr });
  };
  switch (akt.art) {
    case 'zauber': {
      const T = K.gegner[ziel.id], Z = DATA.zauber[akt.z] || { name: akt.z };
      if (akt.z === T.schwaeche) {
        ziel.erkannt = true; ziel.aus = Math.max(ziel.aus, 1);
        hit(ziel, K.regeln.zauberSchaden, Z.name + '! ' + fill(T.treffer, ziel), 'zauber_' + akt.z);
      } else if (T.ausweichen && rnd() < T.ausweichen) {
        ev.push({ wer: 'charly', text: Z.name + '! ' + fill(T.ausgewichen, ziel), fx: 'zauber_' + akt.z, ziel: ziel.nr, dmg: 0, vorbei: true });
      } else hit(ziel, 1, Z.name + '! ' + fill(K.texte.zauber_schwach, ziel), 'zauber_' + akt.z);
      break;
    }
    case 'schneeball': {
      const T = K.gegner[ziel.id];
      if (T.ausweichen && rnd() < T.ausweichen) ev.push({ wer: 'charly', text: fill(T.ausgewichen, ziel), fx: 'schneeball', ziel: ziel.nr, dmg: 0, vorbei: true });
      else hit(ziel, 1, fill(K.texte.schneeball, ziel), 'schneeball');
      break;
    }
    case 'kakao': {
      const plus = Math.min(K.regeln.kakao, F.max - F.waerme); F.waerme += plus;
      ev.push({ wer: 'joern', text: K.texte.kakao.replace('{n}', String(plus)), fx: 'kakao', heil: plus });
      break;
    }
    case 'mut': F.mut = K.regeln.mutRunden; ev.push({ wer: 'joern', text: K.texte.mut, fx: 'mut' }); break;
    case 'bellen': ziel.aus = Math.max(ziel.aus, 1); ev.push({ wer: 'diego', text: fill(K.texte.bellen, ziel), fx: 'bellen', ziel: ziel.nr }); break;
    case 'schnueffeln': {
      lebend.forEach(e => {
        e.erkannt = true;
        const z = K.gegner[e.id].schwaeche, Z = DATA.zauber[z];
        const kann = F.zauber.indexOf(z) >= 0;
        ev.push({ wer: 'diego', text: fill(K.gegner[e.id].hinweis, e) + (kann ? ' ' + K.texte.hinweis_kann.replace('{z}', Z.name) : ' ' + K.texte.hinweis_fehlt), fx: 'schnueffeln', ziel: e.nr });
      });
      break;
    }
    case 'flucht':
      if (!F.flucht) { ev.push({ wer: '', text: K.texte.keine_flucht }); return ev; }
      F.ende = 'flucht'; ev.push({ wer: '', text: K.texte.flucht, fx: 'flucht' }); return ev;
    default: return ev;
  }
  if (!kampfLebend(F).length) { F.ende = 'sieg'; return ev; }
  // Gegner sind dran
  kampfLebend(F).forEach(e => {
    if (F.ende) return;
    const T = K.gegner[e.id];
    if (e.aus > 0) { e.aus--; ev.push({ wer: '', text: fill(T.aussetzen, e), fx: 'aus', ziel: e.nr }); return; }
    let dmg = pickOne(T.angriff, rnd);
    const geschuetzt = F.mut > 0 && dmg > 0;
    if (geschuetzt) dmg = Math.max(0, dmg - K.regeln.mutSchutz);
    F.waerme = Math.max(0, F.waerme - dmg);
    ev.push({ wer: '', text: fill(pickOne(T.angriffe, rnd), e) + (geschuetzt ? ' ' + K.texte.geschuetzt : '') + (dmg ? ' ' + K.texte.kalt.replace('{n}', String(dmg)) : ''), fx: 'angriff', von: e.nr, schaden: dmg });
    if (F.waerme <= 0) { F.ende = 'kalt'; ev.push({ wer: '', text: K.texte.erfroren, fx: 'kalt' }); }
  });
  if (F.mut > 0) F.mut--;
  F.runde++;
  return ev;
}

// Zufällige Begegnung für eine Karte und einen Tag (gewichtete Auswahl)
function kampfGruppeWaehlen(kampf, day, rnd) {
  const list = (kampf.gruppen || []).filter(g => day >= g.ab);
  const sum = list.reduce((s, g) => s + (g.w || 1), 0);
  if (!sum) return null;
  let r = (rnd || Math.random)() * sum;
  for (const g of list) { r -= g.w || 1; if (r < 0) return g.g; }
  return list[list.length - 1].g;
}
