// ===== Quests =====
function questIds() {
  return Object.keys(DATA.quests).sort((a, b) => DATA.quests[a].day - DATA.quests[b].day || (a < b ? -1 : 1));
}
function stepDone(st, flags) { return !!flags[st.flag]; }
function questComplete(q, flags) {
  return !q.teilweise && q.steps.every(st => stepDone(st, flags));
}
// Prüft offene Quests; gibt neu abgeschlossene IDs zurück und trägt Fragmente ein
function updateQuests(save, day) {
  const neu = [];
  questIds().forEach(id => {
    const q = DATA.quests[id];
    if (q.day > day || save.done.indexOf(id) >= 0) return;
    if (questComplete(q, save.flags)) {
      save.done.push(id);
      if (save.fragments.indexOf(id) < 0) save.fragments.push(id);
      neu.push(id);
    }
  });
  return neu;
}
function allSecretIds() {
  const ids = [];
  Object.keys(DATA.maps).forEach(mid => (DATA.maps[mid].secrets || []).forEach(s => { if (s.count !== false) ids.push(s.id); }));
  return ids;
}
