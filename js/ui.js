// Hojas inferiores, confirmaciones y avisos breves con el aspecto de Instagram (tema claro/oscuro del sistema).
const $ = id => document.getElementById(id);
let openSheet = null;

export function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

export function closeSheet() {
  if (!openSheet) return;
  const el = openSheet; openSheet = null;
  el.classList.add('closing');
  setTimeout(() => el.remove(), 220);
}

// sheet({ title, html, tall }) → elemento de la hoja (para enganchar eventos dentro).
export function sheet({ title = '', html = '', tall = false, cls = '' }) {
  closeSheet();
  const root = document.createElement('div');
  root.className = 'sheet-root';
  root.innerHTML = `<div class="sheet-backdrop"></div><div class="sheet ${tall ? 'tall' : ''} ${cls}"><div class="sheet-handle"></div>${title ? `<div class="sheet-title">${esc(title)}</div>` : ''}<div class="sheet-body">${html}</div></div>`;
  root.querySelector('.sheet-backdrop').addEventListener('click', closeSheet);
  $('screen-live').appendChild(root);
  openSheet = root;
  return root;
}

// Menú de filas (como "Desactivar comentarios"). items: [{ label, danger?, onTap }]
export function menu(items, title) {
  const root = sheet({ title, html: `<ul class="sheet-menu">${items.map((it, i) => `<li data-i="${i}" class="${it.danger ? 'danger' : ''}">${esc(it.label)}</li>`).join('')}</ul>` });
  root.querySelector('.sheet-menu').addEventListener('click', e => {
    const li = e.target.closest('li'); if (!li) return;
    closeSheet();
    items[+li.dataset.i].onTap?.();
  });
  return root;
}

// Confirmación de pantalla completa sobre el video difuminado (fin del live).
export function confirmEnd({ text, ok, cancel, onOk }) {
  const root = document.createElement('div');
  root.className = 'confirm-root';
  root.innerHTML = `<p>${esc(text)}</p><div class="confirm-btns"><button class="confirm-ok">${esc(ok)}</button><button class="confirm-cancel">${esc(cancel)}</button></div>`;
  root.querySelector('.confirm-ok').addEventListener('click', () => { root.remove(); onOk(); });
  root.querySelector('.confirm-cancel').addEventListener('click', () => root.remove());
  $('screen-live').appendChild(root);
}

let toastTimer = null;
export function toast(msg) {
  let t = $('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; $('screen-live').appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
