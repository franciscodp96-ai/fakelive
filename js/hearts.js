// Corazones flotantes que nacen abajo a la derecha y suben serpenteando.
import { rand, pick } from './format.js';

const COLORS = ['#ff3040', '#ff3040', '#ff3040', '#ff6b81', '#ff2d95', '#ff8a5c', '#c13584', '#7b61ff', '#ffd600', '#f77737'];

export class Hearts {
  constructor(container) {
    this.el = container;
    this.rate = 0.8;       // corazones por segundo
    this.timer = null;
    this.extra = 0;        // ráfaga pendiente
  }

  start() { this.stop(); this.active = true; this.loop(); }
  stop() { this.active = false; clearTimeout(this.timer); }
  setRate(r) { this.rate = r; }
  burst(n = 40) { this.extra += n; }

  loop() {
    if (!this.active) return;
    this.spawn();
    let wait = 1000 / Math.max(0.2, this.rate) * rand(0.4, 1.6);
    if (this.extra > 0) { this.extra--; wait = rand(40, 120); }
    this.timer = setTimeout(() => this.loop(), wait);
  }

  spawn() {
    if (this.el.childElementCount > 60) return;
    const h = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    h.setAttribute('viewBox', '0 0 24 24');
    h.setAttribute('class', 'heart');
    h.innerHTML = '<use href="#i-heart"/>';
    const dir = Math.random() < 0.5 ? -1 : 1;
    h.style.setProperty('--x1', (dir * rand(2, 14)).toFixed(0));
    h.style.setProperty('--x2', (-dir * rand(6, 26)).toFixed(0));
    h.style.setProperty('--x3', (dir * rand(0, 30) - 10).toFixed(0));
    h.style.setProperty('--dur', rand(2.2, 3.2).toFixed(2) + 's');
    h.style.setProperty('--c', pick(COLORS));
    h.style.right = rand(8, 34).toFixed(0) + 'px';
    h.style.width = h.style.height = rand(20, 30).toFixed(0) + 'px';
    h.addEventListener('animationend', () => h.remove());
    this.el.appendChild(h);
  }
}
