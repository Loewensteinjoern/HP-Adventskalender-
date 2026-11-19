// ===== Kampf: Regeln ohne Darstellung (in Node testbar) =====
// Rundenbasiert: Charly wählt eine Aktion (für sich, Jörn oder Diego), danach handeln die Gegner.
// Wärme statt Lebenspunkte, Energie für Zauber, Kakao begrenzt (Jörn kann neuen kochen).
// Bei 0 Wärme kein Game Over: Charly wacht im Warmen wieder auf.

const WAERME_GRUND = 10;
const ENERGIE_MAX = 6;
const KAKAO_MAX = 5, KAKAO_START = 3;
const STUFE_MAX = 20;
// Je 3 Glutsplitter: 2 Wärme mehr; dazu je 2 Wärme für jede Stufe, bei der „Lebenspunkte“ gewählt wurde
function waermeMax(save) { return WAERME_GRUND + 2 * Math.floor(((save && save.glut) || []).length / 3) + 2 * ((save && save.lp) || 0); }

// --- Erfahrung und Stufen ---
// EP bis zur nächsten Stufe: 10, 15, 20, …
function epFuerStufe(stufe) { return 10 + 5 * (stufe - 1); }
// Gibt EP; liefert die Zahl der neuen Stufen (jede Stufe = eine Wahl: Kraft oder Lebenspunkte)
function epGeben(save, n) {
  let neu = 0;
  save.ep = (save.ep || 0) + n;
  while (save.stufe < STUFE_MAX && save.ep >= epFuerStufe(save.stufe)) { save.ep -= epFuerStufe(save.stufe); save.stufe++; save.wahl = (save.wahl || 0) + 1; neu++; }
  if (save.stufe >= STUFE_MAX) save.ep = 0;
  return neu;
}
function stufeWaehlen(save, was) {
  if (!(save.wahl > 0)) return false;
  save.wahl--;
  if (was === 'kraft') save.kraft = (save.kraft || 0) + 1; else { save.lp = (save.lp || 0) + 1; save.waerme = (save.waerme || 0) + 2; }
  return true;
}
// Charlys Schaden: Kraft macht den richtigen Zauber stärker, jede zweite Kraft auch Schneeball und andere Zauber
function schadenStark(F) { return DATA.kampf.regeln.zauberSchaden + F.kraft; }
function schadenSchwach(F) { return 1 + Math.floor(F.kraft / 2); }

function kampfNeu(gruppeId, opt) {
  opt = opt || {};
  const g = DATA.kampf.gruppen[gruppeId];
  const max = opt.max || WAERME_GRUND, emax = opt.emax || ENERGIE_MAX;
  return {
    gruppe: gruppeId, tutorial: !!g.tutorial, flucht: g.flucht !== false,
    gegner: g.gegner.map((id, i) => { const t = DATA.kampf.gegner[id]; return { id, nr: i, kraft: t.kraft, max: t.kraft, aus: 0, immun: false, erkannt: false }; }),
    waerme: clamp(isNum(opt.waerme) ? opt.waerme : max, 1, max), max,
    energie: clamp(isNum(opt.energie) ? opt.energie : emax, 0, emax), emax,
    kakao: clamp(isNum(opt.kakao) ? opt.kakao : KAKAO_START, 0, KAKAO_MAX),
    kochen: 0, eingefroren: false, mut: 0, runde: 1, ende: null, kraft: opt.kraft || 0,
    zauber: opt.zauber || [], diego: opt.diego !== false, joern: opt.joern !== false,
  };
}
function kampfLebend(F) { return F.gegner.filter(e => e.kraft > 0); }
const gName = e => DATA.kampf.gegner[e.id].name;
const fill = (s, e) => s.replace(/\{name\}/g, e ? gName(e) : '');

// Welche Aktionen gerade möglich sind (ok) und warum nicht (warum)
function kampfAktionen(F) {
  const K = DATA.kampf, T = K.texte, kosten = K.regeln.zauberKosten;
  const charly = (art, label, ok, warum) => ({ art, label, wer: 'charly', ok: ok && !F.eingefroren, warum: F.eingefroren ? T.warum_eingefroren : warum });
  const a = [
    charly('zaubern', 'Zaubern', F.zauber.length > 0 && F.energie >= kosten, !F.zauber.length ? T.warum_keinzauber : T.warum_energie),
    charly('schneeball', 'Schneeball', true, ''),
  ];
  if (F.joern) {
    a.push({ art: 'kakao', label: 'Kakao (' + F.kakao + ')', wer: 'joern', ok: F.kakao > 0 && !F.kochen, warum: F.kochen ? T.warum_kocht : T.warum_kakao });
    a.push({ art: 'kochen', label: 'Kakao kochen', wer: 'joern', ok: !F.kochen && F.kakao < KAKAO_MAX, warum: F.kochen ? T.warum_kocht : T.warum_voll });
    a.push({ art: 'mut', label: 'Mut zusprechen', wer: 'joern', ok: !F.kochen && F.energie > 0, warum: F.kochen ? T.warum_kocht : T.warum_mut });
  }
  if (F.diego) a.push({ art: 'bellen', label: 'Bellen', wer: 'diego', ok: true }, { art: 'schnueffeln', label: 'Schnüffeln', wer: 'diego', ok: true });
  a.push({ art: 'flucht', label: 'Zurückziehen', wer: 'charly', ok: F.flucht, warum: T.keine_flucht });
  return a;
}
// Braucht die Aktion ein Ziel?
function kampfZielNoetig(art) { return art === 'zauber' || art === 'schneeball' || art === 'bellen'; }

// Führt Charlys Wahl aus und lässt danach die Gegner handeln.
// akt: { art, z (Zauber), ziel (Index) }. Liefert eine Liste von Ereignissen für die Darstellung.
function kampfZug(F, akt, rnd) {
  rnd = rnd || Math.random;
  const ev = [], K = DATA.kampf, R = K.regeln;
  if (F.ende) return ev;
  const erlaubt = kampfAktionen(F).find(a => a.art === (akt.art === 'zauber' ? 'zaubern' : akt.art));
  if (!erlaubt || !erlaubt.ok) { ev.push({ wer: '', text: (erlaubt && erlaubt.warum) || '…', nix: true }); return ev; }
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
      F.energie = Math.max(0, F.energie - R.zauberKosten);
      if (akt.z === T.schwaeche) {
        // Betäuben nur mit etwas Glück und nie zwei Runden hintereinander
        ziel.erkannt = true;
        const betaeubt = !ziel.immun && rnd() < R.betaeubChance;
        if (betaeubt) ziel.aus = Math.max(ziel.aus, 1);
        hit(ziel, schadenStark(F), Z.name + '! ' + fill(T.treffer, ziel) + (betaeubt ? ' ' + fill(T.betaeubt, ziel) : ''), 'zauber_' + akt.z);
      } else if (T.ausweichen && rnd() < T.ausweichen) {
        ev.push({ wer: 'charly', text: Z.name + '! ' + fill(T.ausgewichen, ziel), fx: 'zauber_' + akt.z, ziel: ziel.nr, dmg: 0, vorbei: true });
      } else hit(ziel, schadenSchwach(F), Z.name + '! ' + fill(K.texte.zauber_schwach, ziel), 'zauber_' + akt.z);
      break;
    }
    case 'schneeball': {
      const T = K.gegner[ziel.id];
      if (T.ausweichen && rnd() < T.ausweichen) ev.push({ wer: 'charly', text: fill(T.ausgewichen, ziel), fx: 'schneeball', ziel: ziel.nr, dmg: 0, vorbei: true });
      else hit(ziel, schadenSchwach(F), fill(K.texte.schneeball, ziel), 'schneeball');
      break;
    }
    case 'kakao': {
      F.kakao--;
      const w = Math.min(R.kakaoWaerme, F.max - F.waerme), e = Math.min(R.kakaoEnergie, F.emax - F.energie);
      F.waerme += w; F.energie += e;
      ev.push({ wer: 'joern', text: K.texte.kakao.replace('{w}', String(w)).replace('{e}', String(e)), fx: 'kakao', heil: w, energie: e });
      break;
    }
    case 'kochen': F.kochen = R.kochRunden; ev.push({ wer: 'joern', text: K.texte.kochen, fx: 'kochen' }); break;
    case 'mut': F.mut = R.mutRunden; ev.push({ wer: 'joern', text: K.texte.mut, fx: 'mut' }); break;
    case 'bellen':
      if (ziel.immun) { ev.push({ wer: 'diego', text: fill(K.texte.bellen_immun, ziel), fx: 'bellen', ziel: ziel.nr }); break; }
      ziel.aus = Math.max(ziel.aus, 1); ev.push({ wer: 'diego', text: fill(K.texte.bellen, ziel), fx: 'bellen', ziel: ziel.nr }); break;
    case 'schnueffeln': {
      lebend.forEach(e => {
        e.erkannt = true;
        const z = K.gegner[e.id].schwaeche, Z = DATA.zauber[z];
        const kann = F.zauber.indexOf(z) >= 0;
        ev.push({ wer: 'diego', text: fill(K.gegner[e.id].hinweis, e) + (kann ? ' ' + K.texte.hinweis_kann.replace('{z}', Z.name) : ' ' + K.texte.hinweis_fehlt), fx: 'schnueffeln', ziel: e.nr });
      });
      break;
    }
    case 'flucht': F.ende = 'flucht'; ev.push({ wer: '', text: K.texte.flucht, fx: 'flucht' }); return ev;
    default: return ev;
  }
  F.eingefroren = false;
  if (!kampfLebend(F).length) { F.ende = 'sieg'; kochFertig(F, ev, true); return ev; }
  // Gegner sind dran
  kampfLebend(F).forEach(e => {
    if (F.ende) return;
    const T = K.gegner[e.id];
    if (e.aus > 0) { e.aus--; e.immun = true; ev.push({ wer: '', text: fill(T.aussetzen, e), fx: 'aus', ziel: e.nr }); return; }
    e.immun = false;
    // Frost-Angriff: Charly friert fest und muss eine Runde aussetzen
    if (T.frieren && !F.eingefroren && rnd() < T.frieren) {
      const dmg = 1; F.waerme = Math.max(0, F.waerme - dmg); F.eingefroren = true;
      ev.push({ wer: '', text: fill(T.frost, e) + ' ' + K.texte.kalt.replace('{n}', String(dmg)), fx: 'angriff', frost: true, von: e.nr, schaden: dmg });
    } else {
      let dmg = pickOne(T.angriff, rnd);
      const geschuetzt = F.mut > 0 && dmg > 0;
      if (geschuetzt) dmg = Math.max(0, dmg - R.mutSchutz);
      F.waerme = Math.max(0, F.waerme - dmg);
      ev.push({ wer: '', text: fill(pickOne(T.angriffe, rnd), e) + (geschuetzt ? ' ' + K.texte.geschuetzt : '') + (dmg ? ' ' + K.texte.kalt.replace('{n}', String(dmg)) : ''), fx: 'angriff', von: e.nr, schaden: dmg });
    }
    if (F.waerme <= 0) { F.ende = 'kalt'; ev.push({ wer: '', text: K.texte.erfroren, fx: 'kalt' }); }
  });
  if (F.mut > 0) F.mut--;
  if (!F.ende) kochFertig(F, ev, false);
  F.runde++;
  return ev;
}
// Jörns Kakao am Feuer: nach drei Runden 2 Becher mehr (bei Kampfende sofort fertig)
function kochFertig(F, ev, sofort) {
  if (!F.kochen) return;
  F.kochen = sofort ? 0 : F.kochen - 1;
  if (F.kochen) return;
  const plus = Math.min(DATA.kampf.regeln.kochMenge, KAKAO_MAX - F.kakao); F.kakao += plus;
  ev.push({ wer: 'joern', text: DATA.kampf.texte.kakao_fertig.replace('{n}', String(plus)), fx: 'kakao_fertig', kakaoPlus: plus });
}

// Zufällige Begegnung für eine Karte und einen Tag (gewichtete Auswahl)
function kampfGruppeWaehlen(kampf, day, rnd, stufe) {
  const list = (kampf.gruppen || []).filter(g => day >= g.ab && (stufe || 1) >= (g.stufe || 1));
  const sum = list.reduce((s, g) => s + (g.w || 1), 0);
  if (!sum) return null;
  let r = (rnd || Math.random)() * sum;
  for (const g of list) { r -= g.w || 1; if (r < 0) return g.g; }
  return list[list.length - 1].g;
}
