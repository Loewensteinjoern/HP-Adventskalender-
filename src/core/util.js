// ===== Grundlagen (ohne DOM, in Node testbar) =====
const SAVE_VERSION = 4;
const SAVE_KEY = 'winterphoenix_save';
const TEST_KEY = 'winterphoenix_test';
const SOUND_KEY = 'winterphoenix_ton';
const WATERMARK = 'Entwickelt und erstellt von Jörn Löwenstein mit Hilfe von künstlicher Intelligenz (Claude)';
const TILE = 32;
const VIEW_W = 512, VIEW_H = 384;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNum = v => typeof v === 'number' && isFinite(v);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pickOne = (arr, rnd) => arr[Math.floor((rnd || Math.random)() * arr.length) % arr.length];

// Kleiner, stabiler Prüfwert für Export-Codes
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
function utf8ToB64(s) {
  const bytes = new TextEncoder().encode(s); let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64ToUtf8(b) {
  const bin = atob(b); const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
