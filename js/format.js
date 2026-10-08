// Formato de cifras como las muestra Instagram en español: "9.850", "12,3 mil", "259 mil", "2,4 M".
// Propio y no Intl compact: Chrome móvil no trae todos los locales y cae a "259.1 k".
const full = new Intl.NumberFormat('es-CL');

function dec(n, digits) {
  return n.toFixed(digits).replace('.', ',').replace(/,0$/, '');
}

export function fmtViewers(n) {
  n = Math.max(0, Math.round(n));
  if (n < 10000) return full.format(n);
  if (n < 100000) return dec(n / 1000, 1) + ' mil';
  if (n < 999500) return dec(n / 1000, 0) + ' mil';
  if (n < 10000000) return dec(n / 1e6, 1) + ' M';
  return dec(n / 1e6, 0) + ' M';
}

export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const chance = p => Math.random() < p;
