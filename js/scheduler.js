// Flujo del chat: mezcla comentarios de fondo, avisos y tandas reactivas con un ritmo que depende
// de cuánta gente "mira". Emite un item cada vez: { fan, text, notice?, reactive?, badge?, famous? }.
import { makeFan, backgroundText, notice, famousComment } from './bank.js';
import { rand, chance, randInt } from './format.js';

export class Stream {
  constructor({ emit, intensity = 1, ctx = {} }) {
    this.emit = emit;
    this.intensity = intensity;
    this.ctx = ctx;
    this.viewers = 300;
    this.reactive = [];        // cola de { fan, text, reactive: true, exp }
    this.timer = null;
    this.sinceNotice = 0;
  }

  start() { this.active = true; this.loop(); }
  stop() { this.active = false; clearTimeout(this.timer); }
  setViewers(v) { this.viewers = v; }

  // comentarios por minuto según espectadores (log), con tope para que se puedan leer.
  perMinute() {
    const v = Math.max(100, this.viewers);
    const base = 6 + 14 * Math.log10(v / 100);
    return Math.min(120, base * 1.35) * this.intensity;
  }

  pushTanda(items) {
    const exp = Date.now() + 45000;
    for (const it of items) this.reactive.push({ fan: makeFan(it.l), text: it.t, badge: it.b || 0, reactive: true, exp });
    if (this.reactive.length > 30) this.reactive.splice(0, this.reactive.length - 30);
  }

  famous() { this.emit(famousComment()); }

  loop() {
    if (!this.active) return;
    this.emit(this.next());
    let wait = 60000 / this.perMinute() * rand(0.45, 1.7);
    if (this.reactive.length > 6) wait *= 0.7;
    this.timer = setTimeout(() => this.loop(), Math.max(150, wait));
  }

  next() {
    this.sinceNotice++;
    const now = Date.now();
    this.reactive = this.reactive.filter(r => r.exp > now);
    if (this.sinceNotice > randInt(6, 12) && !chance(0.3)) { this.sinceNotice = 0; return notice(); }
    if (this.reactive.length && chance(0.7)) return this.reactive.shift();
    const fan = makeFan();
    return { fan, text: backgroundText(fan, this.ctx) };
  }
}
