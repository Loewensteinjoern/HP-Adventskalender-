// Gemeinsame Helfer für Build und Tests (Node, ohne Pakete)
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const CORE_FILES = ['util', 'unlock', 'conditions', 'save', 'world', 'quests', 'validate'].map(n => 'src/core/' + n + '.js');
const ENGINE_FILES = ['pixel', 'paint_tiles', 'paint_objects', 'paint_schloss', 'paint_chars', 'audio', 'input', 'render', 'dialog', 'ui', 'game', 'main'].map(n => 'src/engine/' + n + '.js');
const CORE_EXPORTS = ['SAVE_VERSION', 'SAVE_KEY', 'TEST_KEY', 'berlinDate', 'unlockedDay', 'daysUntilStart', 'parseTestDay',
  'checkCond', 'condsOk', 'pickTalk', 'newSave', 'migrateSave', 'storeLoad', 'storeWrite', 'exportCode', 'importCode',
  'blockedAt', 'findPath', 'updateQuests', 'questComplete', 'allSecretIds', 'validateData'];

const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const readJson = p => {
  try { return JSON.parse(read(p)); } catch (e) { throw new Error('JSON-Fehler in ' + p + ': ' + e.message); }
};

function loadData() {
  const D = {
    welt: readJson('data/welt.json'), tiles: readJson('data/tiles.json'), objects: readJson('data/objects.json'),
    characters: readJson('data/characters.json'), dialogs: readJson('data/dialogs.json'), quests: readJson('data/quests.json'),
    musik: readJson('data/musik.json'), puzzles: readJson('data/puzzles.json'), maps: {},
  };
  fs.readdirSync(path.join(ROOT, 'data/maps')).filter(f => f.endsWith('.json')).sort()
    .forEach(f => { D.maps[f.replace(/\.json$/, '')] = readJson('data/maps/' + f); });
  return D;
}

// Kern im Sandkasten laden; liefert die exportierten Funktionen
function loadCore(DATA) {
  const src = 'const DATA = ' + JSON.stringify(DATA) + ';\n' + CORE_FILES.map(read).join('\n') +
    '\n;({' + CORE_EXPORTS.join(',') + '})';
  const ctx = vm.createContext({ Intl, TextEncoder, TextDecoder, btoa, atob, Math, JSON, Date, console });
  return vm.runInContext(src, ctx, { filename: 'core.js' });
}

module.exports = { ROOT, CORE_FILES, ENGINE_FILES, read, loadData, loadCore };
