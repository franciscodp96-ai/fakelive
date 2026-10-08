// Controlador de un Live: cámara, espectadores, chat, corazones, voz, tandas reactivas y controles del anfitrión.
import { ViewerCurve } from './viewers.js';
import { Stream } from './scheduler.js';
import { Hearts } from './hearts.js';
import { Listener } from './stt.js';
import { generateTanda } from './llm.js';
import { fmtViewers, rand, pick, randInt } from './format.js';
import { avatarFor } from './avatar.js';
import { makeFan, fanName, questions, SYSTEM_NOTES } from './bank.js';
import { sheet, menu, confirmEnd, toast, closeSheet, esc } from './ui.js';

const $ = id => document.getElementById(id);

const FILTERS = [
  { n: 'Normal', f: 'none', bg: 'linear-gradient(135deg,#999,#444)' },
  { n: 'Cálido', f: 'sepia(.25) saturate(1.25) contrast(1.05)', bg: 'linear-gradient(135deg,#f6b26b,#c27c2c)' },
  { n: 'Frío', f: 'hue-rotate(-12deg) saturate(1.1) brightness(1.05) contrast(1.05)', bg: 'linear-gradient(135deg,#8fd3ff,#2e74b5)' },
  { n: 'Suave', f: 'brightness(1.08) contrast(.92) saturate(.9)', bg: 'linear-gradient(135deg,#ffd6e0,#c9a0dc)' },
  { n: 'Vivo', f: 'saturate(1.45) contrast(1.1)', bg: 'linear-gradient(135deg,#ff6a00,#ee0979)' },
  { n: 'B/N', f: 'grayscale(1) contrast(1.1)', bg: 'linear-gradient(135deg,#eee,#333)' },
  { n: 'Noche', f: 'brightness(1.25) contrast(1.1) saturate(.8)', bg: 'linear-gradient(135deg,#243b55,#141e30)' },
];

export class Live {
  constructor(settings) {
    this.s = settings;
    this.seen = [];            // fans vistos (para la pantalla final)
    this.recentTexts = [];     // últimos textos mostrados (para no repetir)
    this.facing = 'user';
    this.debugLines = [];
    this.stats = { llmCalls: 0, llmErrors: 0, reactive: 0 };
    this.muted = false; this.camOff = false; this.commentsOff = false;
    this.filter = 0;
    this.questions = [];       // { fan, text }
    this.viewerFans = [];      // lista estable para la hoja "Espectadores"
    this.invited = new Set(); this.shared = new Set(); this.mods = new Set();
  }

  async start() {
    const s = this.s;
    this.hostAvatar = s.avatar || avatarFor(s.handle);
    $('host-handle').textContent = s.handle;
    $('host-avatar').src = this.hostAvatar;
    $('cam-off-avatar').src = this.hostAvatar;
    $('comments').innerHTML = '';
    if (s.pinnedText) {
      $('pinned').innerHTML = `<img class="avatar" src="${this.hostAvatar}" alt=""><div><span class="label">Fijado por ${esc(s.handle)}</span>${esc(s.pinnedText)}</div>`;
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
    this.questions = questions(randInt(5, 9), { name: s.name });

    // Avisos del sistema que Instagram muestra al anfitrión al empezar.
    this.render({ sys: true, text: SYSTEM_NOTES[0] });
    this.sysTimer = setTimeout(() => this.render({ sys: true, text: SYSTEM_NOTES[1] }), 7000);

    if (s.llmEnabled && s.apiKey) {
      this.stt = new Listener({ lang: 'es-CL', onStatus: m => this.debug(m) });
      if (!this.stt.start()) this.debug('stt: no soportado en este navegador');
      this.lastTake = Date.now();
      this.llmTimer = setInterval(() => this.reactiveTick(), 6500);
    } else this.debug('reactivo: desactivado (sin clave o apagado)');

    this.bindGestures();
    this.bindControls();
  }

  // ── Cámara ──────────────────────────────────────────────────────────────
  async startCamera() {
    this.stopCamera();
    const res = String(this.s.camRes || '720');
    const size = res === '1080' ? { width: { ideal: 1920 }, height: { ideal: 1080 } }
      : res === '720' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : {};
    try {
      this.media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: this.facing, ...size }, audio: false });
      const track = this.media.getVideoTracks()[0];
      // Zoom óptico/digital al mínimo cuando el dispositivo lo expone: evita el recorte extra de algunos Android.
      try {
        const caps = track.getCapabilities?.();
        if (caps?.zoom && track.getSettings().zoom > caps.zoom.min) await track.applyConstraints({ advanced: [{ zoom: caps.zoom.min }] });
        const st = track.getSettings();
        this.debug(`cámara ${st.width}×${st.height} zoom=${st.zoom ?? '-'} (${caps?.zoom ? caps.zoom.min + '–' + caps.zoom.max : 'sin zoom'})`);
      } catch (e) { this.debug('zoom: ' + e.message); }
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

  // ── Chat ────────────────────────────────────────────────────────────────
  render(it) {
    if (this.commentsOff && !it.sys && !it.host) return;
    const ol = $('comments');
    const li = document.createElement('li');
    if (it.sys) {
      li.className = 'comment sys';
      li.innerHTML = `<span class="info"><svg viewBox="0 0 24 24"><use href="#i-info"/></svg></span><span class="t">${esc(it.text)}</span>`;
    } else {
      const fan = it.host ? { u: this.s.handle, verified: true } : it.fan;
      li.className = 'comment' + (it.notice ? ' notice' : '') + (it.host ? ' host' : '');
      const ver = fan.verified ? '<svg viewBox="0 0 24 24"><use href="#i-verified"/></svg>' : '';
      const av = it.host ? this.hostAvatar : avatarFor(fan.u);
      li.innerHTML = `<img class="avatar" src="${av}" alt=""><div class="body"><span class="u">${esc(fan.u)}${ver}</span><span class="t">${esc(it.text)}</span></div>`;
      if (!it.notice && !it.host) {
        this.recentTexts.push(it.text);
        if (this.recentTexts.length > 24) this.recentTexts.shift();
      }
      if (it.reactive) this.stats.reactive++;
      if (!it.host && this.seen.length < 64 && !this.seen.includes(fan.u)) this.seen.push(fan.u);
    }
    ol.appendChild(li);
    while (ol.childElementCount > 9) ol.firstElementChild.remove();
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
      // Las preguntas de la tanda alimentan la hoja "Preguntas".
      for (const q of tanda.filter(x => /\?/.test(x.t)).slice(0, 3)) this.questions.unshift({ fan: makeFan(q.l), text: q.t });
      this.questions = this.questions.slice(0, 30);
      this.debug(`tanda ${tanda.length} ← "${text.slice(0, 50)}"`);
    } catch (e) {
      this.stats.llmErrors++;
      this.debug('llm: ' + (e.name === 'AbortError' ? 'timeout' : e.message));
    } finally { clearTimeout(to); this.busy = false; }
  }

  // ── Gestos ocultos: doble toque en el video = ráfaga; toque largo en comentarios = famoso; 5 toques en la foto = debug.
  bindGestures() {
    const scr = $('screen-live');
    let lastTap = 0, pressTimer = null;
    scr.addEventListener('pointerdown', e => {
      if (e.target.closest('button, input, .sheet-root, .confirm-root, .bar, .rail, .top')) return;
      const y = e.clientY / innerHeight;
      const now = Date.now();
      if (y < 0.5 && now - lastTap < 320) { this.burst(); lastTap = 0; } else lastTap = now;
      clearTimeout(pressTimer);
      if (e.target.closest('.comments')) pressTimer = setTimeout(() => this.stream.famous(), 650);
    });
    const cancel = () => clearTimeout(pressTimer);
    scr.addEventListener('pointerup', cancel); scr.addEventListener('pointercancel', cancel);
    scr.addEventListener('pointermove', e => { if (e.movementX ** 2 + e.movementY ** 2 > 36) cancel(); });
    let avatarTaps = 0;
    $('host-avatar').addEventListener('click', () => { if (++avatarTaps % 5 === 0) $('debug').classList.toggle('hidden'); });
  }

  // ── Controles visibles: todos hacen algo, como en Instagram.
  bindControls() {
    const scr = $('screen-live');
    const on = (id, fn) => $(id).addEventListener('click', fn);

    on('btn-close', () => confirmEnd({
      text: '¿Confirmas que quieres finalizar tu video en vivo?', ok: 'Finalizar ahora', cancel: 'Cancelar', onOk: () => this.onEnd?.(),
    }));
    on('btn-mic', () => {
      this.muted = !this.muted;
      $('btn-mic').classList.toggle('off', this.muted);
      toast(this.muted ? 'Micrófono silenciado' : 'Micrófono activado');
    });
    on('btn-video', () => {
      this.camOff = !this.camOff;
      $('btn-video').classList.toggle('off', this.camOff);
      scr.classList.toggle('cam-off', this.camOff);
      $('cam-off').classList.toggle('hidden', !this.camOff);
    });
    on('btn-flip', () => { this.facing = this.facing === 'user' ? 'environment' : 'user'; this.startCamera(); });
    on('btn-fx', () => this.toggleFx());
    on('btn-options', () => this.openOptions());
    on('btn-media', () => $('media-file').click());
    $('media-file').addEventListener('change', e => this.shareMedia(e.target.files[0]));
    on('shared-close', () => { scr.classList.remove('sharing'); $('shared').classList.add('hidden'); });
    on('btn-invite', () => this.openInvite());
    on('btn-question', () => this.openQuestions());
    on('btn-send', () => this.openShare());
    $('viewer-count').parentElement.addEventListener('click', () => this.openViewers());

    const form = $('comment-form'), input = $('comment-input');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const t = input.value.trim(); if (!t) return;
      input.value = ''; input.blur();
      this.render({ host: true, text: t });
    });
  }

  toggleFx() {
    const tray = $('fx-tray');
    if (!tray.classList.contains('hidden')) { tray.classList.add('hidden'); return; }
    tray.innerHTML = FILTERS.map((f, i) => `<button class="fx ${i === this.filter ? 'on' : ''}" data-i="${i}"><span class="thumb" style="background:${f.bg}"></span><span class="n">${f.n}</span></button>`).join('') +
      `<button class="fx close" aria-label="Cerrar"><span class="thumb x"><svg viewBox="0 0 24 24"><use href="#i-close"/></svg></span><span class="n">Cerrar</span></button>`;
    tray.classList.remove('hidden');
    tray.onclick = e => {
      const b = e.target.closest('.fx'); if (!b) return;
      if (b.classList.contains('close')) { tray.classList.add('hidden'); return; }
      this.filter = +b.dataset.i;
      $('cam').style.filter = FILTERS[this.filter].f;
      tray.querySelectorAll('.fx').forEach(x => x.classList.toggle('on', x === b));
    };
  }

  openOptions() {
    menu([
      { label: 'Agregar moderador', onTap: () => this.openPeople({ title: 'Agregar moderador', action: 'Agregar', done: 'Moderador', set: this.mods }) },
      { label: this.commentsOff ? 'Activar comentarios' : 'Desactivar comentarios', onTap: () => { this.commentsOff = !this.commentsOff; $('comments').classList.toggle('hidden', this.commentsOff); toast(this.commentsOff ? 'Comentarios desactivados' : 'Comentarios activados'); } },
      { label: 'Desactivar solicitudes para transmitir en vivo', onTap: () => toast('Solicitudes desactivadas') },
      { label: 'Desactivar preguntas', onTap: () => toast('Preguntas desactivadas') },
      { label: 'Copiar enlace', onTap: () => toast('Enlace copiado') },
      { label: 'Compartir en…', onTap: () => this.openShare() },
    ]);
  }

  // Lista estable de "espectadores" con nombre visible, reutilizada por varias hojas.
  people(n = 24) {
    while (this.viewerFans.length < n) {
      const u = this.seen[this.viewerFans.length];
      const fan = u ? { u, lang: 'cl', verified: false } : makeFan();
      this.viewerFans.push({ ...fan, name: fanName(fan) });
    }
    return this.viewerFans.slice(0, n);
  }

  openPeople({ title, action, done, set, search = true, footer = '' }) {
    const rows = this.people().map((p, i) => `<li><img class="avatar" src="${avatarFor(p.u)}" alt=""><div class="who"><b>${esc(p.u)}</b><span>${esc(p.name)}</span></div><button class="pill ${set.has(p.u) ? 'done' : ''}" data-u="${esc(p.u)}">${set.has(p.u) ? done : action}</button></li>`).join('');
    const root = sheet({ title, tall: true, html: `${search ? `<label class="search"><svg viewBox="0 0 24 24"><use href="#i-search"/></svg><input placeholder="Buscar" autocomplete="off"></label>` : ''}<ul class="people">${rows}</ul>${footer}` });
    root.querySelector('.people').addEventListener('click', e => {
      const b = e.target.closest('.pill'); if (!b || b.classList.contains('done')) return;
      set.add(b.dataset.u); b.classList.add('done'); b.textContent = done;
    });
    const inp = root.querySelector('.search input');
    inp?.addEventListener('input', () => {
      const q = inp.value.trim().toLowerCase();
      root.querySelectorAll('.people li').forEach(li => { li.style.display = li.textContent.toLowerCase().includes(q) ? '' : 'none'; });
    });
    return root;
  }

  openInvite() {
    const root = this.openPeople({ title: 'Invitar', action: 'Invitar', done: 'Enviada', set: this.invited });
    root.querySelector('.sheet-body').insertAdjacentHTML('afterbegin', `<div class="tabs"><button class="tab">Solicitudes</button><button class="tab on">Invitar</button></div><p class="req hidden">Cuando alguien solicite unirse a tu video en vivo, aparecerá aquí.</p>`);
    const tabs = root.querySelectorAll('.tab'), req = root.querySelector('.req'), rest = [root.querySelector('.search'), root.querySelector('.people')];
    tabs.forEach((t, i) => t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.toggle('on', x === t));
      req.classList.toggle('hidden', i !== 0); rest.forEach(x => x.classList.toggle('hidden', i === 0));
    }));
  }

  openShare() {
    const root = this.openPeople({ title: 'Compartir', action: 'Enviar', done: 'Enviado', set: this.shared });
    root.querySelector('.people').insertAdjacentHTML('afterend', `<ul class="sheet-menu small"><li data-a="story">Agregar a tu historia</li><li data-a="link">Copiar enlace</li></ul>`);
    root.querySelector('.sheet-menu').addEventListener('click', e => {
      const li = e.target.closest('li'); if (!li) return;
      closeSheet(); toast(li.dataset.a === 'link' ? 'Enlace copiado' : 'Se agregó a tu historia');
    });
  }

  openViewers() {
    const v = this.curve.value;
    const more = Math.max(0, Math.round(v) - 24);
    const root = this.openPeople({ title: `Espectadores · ${fmtViewers(v)}`, action: 'Invitar', done: 'Enviada', set: this.invited, footer: more ? `<p class="more">y ${fmtViewers(more)} personas más están mirando</p>` : '' });
    return root;
  }

  openQuestions() {
    if (!this.questions.length) this.questions = questions(randInt(5, 9), { name: this.s.name });
    const rows = this.questions.map((q, i) => `<li data-i="${i}"><img class="avatar" src="${avatarFor(q.fan.u)}" alt=""><div class="who"><b>${esc(q.fan.u)}</b><span class="q">${esc(q.text)}</span></div></li>`).join('');
    const root = sheet({ title: 'Preguntas', tall: true, html: `<p class="hint-sheet">Toca una pregunta para mostrarla en el video.</p><ul class="people qs">${rows}</ul>` });
    root.querySelector('.qs').addEventListener('click', e => {
      const li = e.target.closest('li'); if (!li) return;
      const q = this.questions.splice(+li.dataset.i, 1)[0];
      closeSheet(); this.showQuestion(q);
    });
  }

  showQuestion(q) {
    const c = $('qcard');
    c.innerHTML = `<img class="avatar" src="${avatarFor(q.fan.u)}" alt=""><div><span class="label">${esc(q.fan.u)} preguntó</span>${esc(q.text)}</div><button class="qx" aria-label="Quitar"><svg viewBox="0 0 24 24"><use href="#i-close"/></svg></button>`;
    c.classList.remove('hidden');
    c.querySelector('.qx').addEventListener('click', () => c.classList.add('hidden'));
  }

  async shareMedia(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    $('shared-img').src = url;
    $('shared').classList.remove('hidden');
    $('screen-live').classList.add('sharing');
    $('media-file').value = '';
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
    clearInterval(this.viewerTimer); clearInterval(this.llmTimer); clearTimeout(this.sysTimer);
    this.stream?.stop(); this.hearts?.stop(); this.stt?.stop();
    this.stopCamera();
    this.wakeLock?.release?.();
    closeSheet();
    document.querySelectorAll('.confirm-root').forEach(x => x.remove());
    $('screen-live').classList.remove('cam-off', 'sharing');
    $('cam-off').classList.add('hidden'); $('shared').classList.add('hidden'); $('qcard').classList.add('hidden'); $('fx-tray').classList.add('hidden');
    $('cam').style.filter = '';
    return { peak: this.curve?.peak || 0, seen: this.seen, ...this.stats };
  }
}
