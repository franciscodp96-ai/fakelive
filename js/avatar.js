// Avatares de fans. Si existe avatars/index.json (lista de rutas a fotos), se usan esas fotos;
// si no, se alternan la silueta gris por defecto de Instagram y círculos de color abstractos.
import { pick } from './format.js';

let photos = [];

export async function loadAvatarPack() {
  try {
    const r = await fetch('avatars/index.json', { cache: 'no-cache' });
    if (r.ok) photos = (await r.json()).map(p => 'avatars/' + p);
  } catch { /* sin pack: se usan los generados */ }
  return photos.length;
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const SILHOUETTE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#dbdbdb"/><circle cx="32" cy="25" r="11" fill="#fff"/><path d="M10 56c3-12 12-18 22-18s19 6 22 18a32 32 0 0 1-44 0z" fill="#fff"/></svg>`);

const PALETTES = [
  ['#f58529', '#dd2a7b'], ['#8134af', '#515bd4'], ['#1f8a70', '#bedb39'], ['#ff6f61', '#6b5b95'],
  ['#2b2d42', '#ef233c'], ['#06d6a0', '#118ab2'], ['#ffd166', '#ef476f'], ['#3a86ff', '#8338ec'],
  ['#e07a5f', '#3d405b'], ['#f4a261', '#2a9d8f'], ['#577590', '#f3722c'], ['#9b5de5', '#00bbf9'],
];

function abstractAvatar(seed) {
  const [a, b] = PALETTES[seed % PALETTES.length];
  const cx = 20 + (seed >> 4) % 24, cy = 18 + (seed >> 9) % 26, r = 10 + (seed >> 13) % 12;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><circle cx="32" cy="32" r="32" fill="url(#g)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(255,255,255,.35)"/><circle cx="${64 - cx}" cy="${64 - cy + 6}" r="${r + 8}" fill="rgba(0,0,0,.18)"/></svg>`);
}

export function avatarFor(username) {
  const h = hash(username);
  if (photos.length) return photos[h % photos.length];
  return (h % 100) < 32 ? SILHOUETTE : abstractAvatar(h);
}

export const hostFallbackAvatar = SILHOUETTE;
