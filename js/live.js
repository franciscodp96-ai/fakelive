// Controlador de un Live: cámara, espectadores, chat, corazones, voz y tandas reactivas.
import { ViewerCurve } from './viewers.js';
import { Stream } from './scheduler.js';
import { Hearts } from './hearts.js';
import { Listener } from './stt.js';
import { generateTanda } from './llm.js';
import { fmtViewers, rand } from './format.js';
import { avatarFor } from './avatar.js';

const $ = id => document.getElementById(id);

export class Live {
  constructor(settings) {
    this.s = settings;
    this.seen = [];            // fans vistos (para la pantalla final)
    this.recentTexts = [];     // últimos textos mostrados (para no repetir)
    this.facing = 'user';
    this.debugLines = [];
    this.stats = { llmCalls: 0, llmErrors: 0, reactive: 0 };
  }

  async start() {
    const s = this.s;
    $('host-handle').textContent = s.handle;
    $('host-avatar').src = s.avatar || avatarFor(s.handle);
    $('comments').innerHTML = '';
    if (s.pinnedText) {
      $('pinned').innerHTML = `<img class="avatar" src="${s.avatar || avatarFor(s.handle)}" alt=""><div><span class="label">Fijado por ${esc(s.handle)}</span>${esc(s.pinnedText)}</div>`;
      $('pinned').classList.remove('hidden');
    } else $('pinned').classList.add('hidden');

    // La cámara puede tardar (permiso pendiente); el chat y el contador no la esperan.
    this.startCamera();
    navigator.wakeLock?.request('screen').then(w => { this.wakeLock = w; }).catch(() => { });

    this.curve = new ViewerCurve({ target: s.targetViewers, rampMinutes: s.rampMinutes });
    this.hearts = new Hearts($('hearts'));
    this.stream = new Stream({ emit: it => this.render(it), intensity: s.intensity, ctx: { name: s.name } });
    this.stream.start();
    this.hearts.start();
    this.viewerTimer = setInterval(() => this.tickViewers(), 900);
    this.tickViewers();

    if (s.llmEnabled && s.apiKey) {
      this.stt = new Listener({ lang: 'es-CL', onStatus: m => this.debug(m) });
      if (!this.stt.start()) this.debug('stt: no soportado en este navegador');
      this.lastTake = Date.now();
      this.llmTimer = setInterval(() => this.reactiveTick(), 6500);
    } else this.debug('reactivo: desactivado (sin clave o apagado)');

    this.bindGestures();
  }

  async startCamera() {
    this.stopCamera();
    try {
      this.media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.facing, width: { ideal: 1080 }, height: { ideal: 1920 } }, audio: false,
      });
      const v = $('cam');
      v.srcObject = this.media;
      v.classList.toggle('rear', this.facing !== 'user');
      await v.play().catch(() => { });
    } catch (e) { this.debug('cámara: ' + e.message); }
  }
  stopCamera() { this.media?.getTracks().forEach(t => t.stop()); this.media = null; }

  tickViewers() {
    const v = this.curve.tick();
    $('viewer-count').textContent = fmtViewers(v);
    this.stream.setViewers(v);
    this.hearts.setRate(Math.min(4.5, 0.4 + Math.log10(Math.max(100, v) / 100) * 0.9) * this.s.intensity);
  }

  render(it) {
    const ol = $('comments');
    const li = document.createElement('li');
    li.className = 'comment' + (it.notice ? ' notice' : '');
    const ver = it.fan.verified ? '<svg viewBox="0 0 24 24"><use href="#i-verified"/></svg>' : '';
    li.innerHTML = `<img class="avatar" src="${avatarFor(it.fan.u)}" alt=""><div class="body"><span class="u">${esc(it.fan.u)}${ver}</span><span class="t">${esc(it.text)}</span></div>`;
    ol.appendChild(li);
    while (ol.childElementCount > 9) ol.firstElementChild.remove();
    if (!it.notice) {
      this.recentTexts.push(it.text);
      if (this.recentTexts.length > 24) this.recentTexts.shift();
    }
    if (it.reactive) this.stats.reactive++;
    if (this.seen.length < 64 && !this.seen.includes(it.fan.u)) this.seen.push(it.fan.u);
  }

  async reactiveTick() {
    if (this.busy || !this.stt) return;
    const { text, interim, words } = this.stt.takeSince(this.lastTake);
    if (words < 3) return;
    this.lastTake = Date.now();
    this.busy = true;
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 9000);
    try {
      this.stats.llmCalls++;
      const tanda = await generateTanda({
        settings: this.s, transcript: text, interim, recent: this.recentTexts.slice(-16),
        viewers: fmtViewers(this.curve.value), signal: ctrl.signal,
      });
      this.stream.pushTanda(tanda);
      this.debug(`tanda ${tanda.length} ← "${text.slice(0, 50)}"`);
    } catch (e) {
      this.stats.llmErrors++;
      this.debug('llm: ' + (e.name === 'AbortError' ? 'timeout' : e.message));
    } finally { clearTimeout(to); this.busy = false; }
  }

  // Gestos ocultos: doble toque arriba = ráfaga; toque largo en comentarios = famoso; toque largo en X = fin.
  bindGestures() {
    const scr = $('screen-live');
    let lastTap = 0, pressTimer = null;
    scr.addEventListener('pointerdown', e => {
      const y = e.clientY / innerHeight;
      const now = Date.now();
      if (y < 0.5 && now - lastTap < 320) { this.burst(); lastTap = 0; } else lastTap = now;
      clearTimeout(pressTimer);
      if (e.target.closest('#btn-close')) pressTimer = setTimeout(() => this.onEnd?.(), 700);
      else if (e.target.closest('.bottom')) pressTimer = setTimeout(() => this.stream.famous(), 650);
    });
    const cancel = () => clearTimeout(pressTimer);
    scr.addEventListener('pointerup', cancel); scr.addEventListener('pointercancel', cancel); scr.addEventListener('pointermove', e => { if (e.movementX ** 2 + e.movementY ** 2 > 36) cancel(); });
    $('btn-flip').addEventListener('click', () => { this.facing = this.facing === 'user' ? 'environment' : 'user'; this.startCamera(); });
    let countTaps = 0;
    $('viewer-count').parentElement.addEventListener('click', () => { if (++countTaps % 5 === 0) $('debug').classList.toggle('hidden'); });
  }

  burst() {
    this.curve.burst();
    this.stream.burst();
    this.hearts.burst(Math.round(rand(35, 60)));
  }

  debug(m) {
    this.debugLines.push(new Date().toLocaleTimeString('es-CL') + ' ' + m);
    if (this.debugLines.length > 10) this.debugLines.shift();
    $('debug').textContent = this.debugLines.join('\n');
    console.log('[fakelive]', m);
  }

  stop() {
    clearInterval(this.viewerTimer); clearInterval(this.llmTimer);
    this.stream?.stop(); this.hearts?.stop(); this.stt?.stop();
    this.stopCamera();
    this.wakeLock?.release?.();
    return { peak: this.curve?.peak || 0, seen: this.seen, ...this.stats };
  }
}

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
