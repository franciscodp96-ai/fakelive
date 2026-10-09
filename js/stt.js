// Transcripción continua con la Web Speech API de Chrome. Se reinicia sola cuando el motor se detiene.
export class Listener {
  constructor({ lang = 'es-CL', onStatus = () => {} } = {}) {
    this.lang = lang;
    this.onStatus = onStatus;
    this.segments = [];      // { t: ms, text }
    this.interim = '';
    this.active = false;
    this.restarts = 0;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.supported = !!SR;
    if (!SR) return;
    const r = this.rec = new SR();
    r.lang = lang; r.continuous = true; r.interimResults = true; r.maxAlternatives = 1;
    r.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) this.segments.push({ t: Date.now(), text: res[0].transcript.trim() });
        else interim += res[0].transcript;
      }
      this.interim = interim.trim();
      if (this.segments.length > 200) this.segments.splice(0, 100);
    };
    r.onerror = e => {
      this.lastError = e.error;
      this.onStatus('stt:error:' + e.error);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') this.active = false;
    };
    r.onend = () => {
      // Si Chrome corta con palabras a medio reconocer, se conservan en vez de perderse.
      if (this.interim) { this.segments.push({ t: Date.now(), text: this.interim }); this.interim = ''; }
      this.onStatus('stt:end');
      if (!this.active) return;
      // Chrome corta el reconocimiento tras silencios; se reinicia casi de inmediato, salvo tras un error real.
      this.restarts++;
      setTimeout(() => { if (this.active) this.safeStart(); }, this.lastError && this.lastError !== 'no-speech' ? 600 : 50);
      this.lastError = null;
    };
  }

  safeStart() { try { this.rec.start(); this.onStatus('stt:start'); } catch { /* ya estaba iniciado */ } }
  start() { if (!this.supported) return false; this.active = true; this.safeStart(); return true; }
  stop() { this.active = false; try { this.rec?.stop(); } catch { } }

  // Texto final reconocido desde `sinceMs`, más lo provisional si lleva tiempo sin cerrarse.
  takeSince(sinceMs) {
    const finals = this.segments.filter(s => s.t > sinceMs).map(s => s.text);
    const text = finals.join(' ').trim();
    return { text, interim: this.interim, words: text ? text.split(/\s+/).length : 0 };
  }
}
