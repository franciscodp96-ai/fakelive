// Curva de espectadores: arranca en cientos, llega al objetivo en rampMinutes con forma de S,
// y después oscila alrededor del objetivo con ruido lento y micro-jitter.
import { rand, chance } from './format.js';

export class ViewerCurve {
  constructor({ target, rampMinutes }) {
    this.target = target;
    this.rampSec = rampMinutes * 60;
    this.start = Math.round(rand(180, 900));
    this.t0 = performance.now();
    this.drift = 0;       // ruido lento, con reversión a la media
    this.peak = this.start;
    this.value = this.start;
    this.lastTick = this.t0;
  }

  tick() {
    const now = performance.now();
    const dt = Math.min(5, (now - this.lastTick) / 1000);
    this.lastTick = now;
    const t = (now - this.t0) / 1000;

    // S-curve logística que llega al ~99 % del objetivo en rampSec.
    const p = Math.min(1, t / this.rampSec);
    const k = 9.2;
    const s = (1 / (1 + Math.exp(-k * (p - 0.5))) - 1 / (1 + Math.exp(k / 2))) / (1 - 2 / (1 + Math.exp(k / 2)));
    const base = this.start + (this.target - this.start) * Math.max(0, Math.min(1, s));

    // Deriva lenta: random walk con reversión, ±3 % en régimen estable.
    this.drift += (rand(-1, 1) * 0.004 - this.drift * 0.03) * dt * 10;
    this.drift = Math.max(-0.035, Math.min(0.035, this.drift));
    // Caída/subida ocasional breve (alguien famoso lo compartió, o se cayó la red de muchos).
    if (chance(0.004 * dt)) this.drift += rand(-0.02, 0.025);

    const micro = rand(-0.0025, 0.0025);

    this.value = Math.max(this.start, Math.round(base * (1 + this.drift + micro)));
    if (this.value > this.peak) this.peak = this.value;
    return this.value;
  }
}
