// Arranque: ajustes persistentes, cambio de pantallas y ciclo de vida del Live.
import { Live } from './live.js';
import { fmtViewers } from './format.js';
import { avatarFor, loadAvatarPack } from './avatar.js';

const KEY = 'fakelive.settings.v1';
const $ = id => document.getElementById(id);
const form = $('settings-form');
let live = null;

const DEFAULTS = { handle: '', name: '', famousFor: '', avatar: '', pinnedText: '', targetViewers: 2400000, rampMinutes: 9, intensity: 1, llmEnabled: true, apiKey: '', model: 'claude-haiku-5-5', camRes: '720' };

function loadSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULTS }; }
}
function saveSettings(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { } }

function fillForm(s) {
  for (const el of form.elements) {
    if (!el.name || el.type === 'file' || el.type === 'submit') continue;
    if (el.type === 'checkbox') el.checked = !!s[el.name]; else el.value = s[el.name] ?? '';
  }
  if (s.avatar) $('avatar-preview').src = s.avatar;
}

function readForm(prev) {
  const s = { ...prev };
  for (const el of form.elements) {
    if (!el.name || el.type === 'file' || el.type === 'submit') continue;
    if (el.type === 'checkbox') s[el.name] = el.checked;
    else if (el.type === 'number' || (el.tagName === 'SELECT' && el.name !== 'camRes')) s[el.name] = Number(el.value);
    else s[el.name] = el.value.trim();
  }
  s.handle = s.handle.replace(/^@/, '');
  s.model = s.model || DEFAULTS.model;
  return s;
}

// Foto de perfil: se reduce a 160 px y se guarda como data URL.
form.elements.avatarFile.addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return;
  const bmp = await createImageBitmap(f);
  const c = document.createElement('canvas'); c.width = c.height = 160;
  const ctx = c.getContext('2d');
  const side = Math.min(bmp.width, bmp.height);
  ctx.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, 160, 160);
  settings.avatar = c.toDataURL('image/jpeg', 0.85);
  $('avatar-preview').src = settings.avatar;
  saveSettings(settings);
});

function show(id) {
  for (const sc of document.querySelectorAll('.screen')) sc.classList.toggle('hidden', sc.id !== id);
}

async function goFullscreen() {
  try { await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }); } catch { }
  try { await screen.orientation?.lock?.('portrait'); } catch { }
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  settings = readForm(settings);
  saveSettings(settings);
  await goFullscreen();
  show('screen-live');
  live = new Live(settings);
  live.onEnd = endLive;
  await live.start();
});

function endLive() {
  if (!live) return;
  const r = live.stop(); live = null;
  $('end-viewers').textContent = `${fmtViewers(r.peak)} espectadores`;
  $('end-grid').innerHTML = r.seen.slice(0, 32).map(u => `<img src="${avatarFor(u)}" alt="">`).join('');
  show('screen-end');
  console.log('[fakelive] resumen', r);
}

$('btn-done').addEventListener('click', () => { document.exitFullscreen?.().catch?.(() => { }); show('screen-settings'); });

// Avisos de entorno en la pantalla de ajustes.
function envWarnings() {
  const w = [];
  if (!window.isSecureContext) w.push('Esta página no es HTTPS: la cámara y el micrófono no funcionarán.');
  if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) w.push('Este navegador no reconoce voz: los fans no podrán responder a lo que digas (usa Chrome).');
  $('env-warn').textContent = w.join(' ');
}

let settings = loadSettings();
fillForm(settings);
envWarnings();
loadAvatarPack();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
