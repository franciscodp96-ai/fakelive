# HANDOFF — fakelive v4: subir el parecido con Instagram Live

Plan paso a paso para una sesión nueva. Sigue los pasos en orden, sin saltarte la verificación de cada uno.
No rediseñes nada: cada paso dice exactamente qué archivo tocar y con qué texto.

## 0. Contexto mínimo

- Proyecto: PWA en `C:\Users\Usuario\fakelive` (vanilla HTML/CSS/JS, sin bundler). Simula un live de Instagram
  para grabar pantalla en un Redmi 13C (pantalla de 360 CSS px de ancho).
- Publicación: GitHub Pages desde la rama `main` del repo `franciscodp96-ai/fakelive`.
  URL: https://franciscodp96-ai.github.io/fakelive/ . Tarda ~60 s en reflejar un push.
- Tres evaluadores independientes miraron una captura real del celular y la puntuaron 5, 6 y 6 sobre 10.
  Este plan corrige lo que los tres señalaron. Lo que ya se corrigió antes (insignia y contador en dos líneas,
  placeholder cortado) NO se toca.
- Reglas de la sesión:
  - Responder en español, conclusión primero.
  - Nunca usar `git stash`, `checkout`, `reset`, `restore` ni `clean`.
  - Antes de cualquier `git push` o `gh` que escriba, ejecutar la skill `/wall-check C:\Users\Usuario\fakelive personal-cloud`
    (un hook local bloquea el push si no corrió en esta sesión). Debe dar PASA.
  - Mensajes de commit en español. Terminar cada mensaje con las dos líneas de atribución que indique el system-reminder de la sesión.
  - No existen claves ni datos sensibles en el repo; no agregues ninguno.

## 1. Preparación

```powershell
cd C:\Users\Usuario\fakelive
git status --short      # debe estar vacío
git log --oneline -1    # debe ser 7d2c1ce o posterior
```

Si `git status` no está vacío, detente y repórtalo.

## 2. Barra de estado visible (la app deja de ir a pantalla completa)

Motivo: Instagram muestra la barra de estado de Android (hora, batería). La app la ocultaba y quedaba solo el punto verde de la cámara flotando.

2.1 En `manifest.webmanifest` cambia `"display": "fullscreen"` por `"display": "standalone"`.

2.2 En `js/app.js` reemplaza la función `goFullscreen` completa por:

```js
async function goFullscreen() {
  try { await screen.orientation?.lock?.('portrait'); } catch { }
}
```

2.3 En `js/app.js`, en la línea del botón `btn-done`, deja solo el cambio de pantalla:

```js
$('btn-done').addEventListener('click', () => show('screen-settings'));
```

Verificación: `node --check js/app.js` sin salida y `grep -n standalone manifest.webmanifest` muestra la línea.

## 3. Iconos con el trazo de Instagram

Motivo: los tres evaluadores reconocieron los iconos como Material Design de Android. Instagram usa trazo fino (1.5) y formas propias.

En `index.html`, dentro del `<svg style="display:none">`, reemplaza COMPLETOS los símbolos indicados por estos (busca cada `<symbol id="...">` y sustituye la línea entera):

```html
  <symbol id="i-close" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M5.5 5.5l13 13M18.5 5.5l-13 13"/></symbol>
  <symbol id="i-mic" viewBox="0 0 24 24"><rect fill="none" stroke="currentColor" stroke-width="1.5" x="9" y="2.5" width="6" height="12" rx="3"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5"/></symbol>
  <symbol id="i-video" viewBox="0 0 24 24"><rect fill="none" stroke="currentColor" stroke-width="1.5" x="2.5" y="6.5" width="13" height="11" rx="2.5"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" d="M15.5 10.5l5.5-2.8v8.6l-5.5-2.8z"/></symbol>
  <symbol id="i-flip" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M19.5 12a7.5 7.5 0 0 1-13.2 4.8M4.5 12a7.5 7.5 0 0 1 13.2-4.8M17.7 3.6v3.7H14M6.3 20.4v-3.7H10"/></symbol>
  <symbol id="i-sparkle" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" d="M9.5 3.5l1.7 4.6 4.6 1.7-4.6 1.7-1.7 4.6-1.7-4.6-4.6-1.7 4.6-1.7zM17.5 13l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"/></symbol>
  <symbol id="i-media" viewBox="0 0 24 24"><rect fill="none" stroke="currentColor" stroke-width="1.5" x="2.5" y="6.5" width="13" height="11" rx="2.5"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" d="M15.5 10.5l5.5-2.8v8.6l-5.5-2.8zM9 9.5v5M6.5 12h5"/></symbol>
  <symbol id="i-invite" viewBox="0 0 24 24"><circle fill="none" stroke="currentColor" stroke-width="1.5" cx="14.5" cy="8" r="3.5"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" d="M8.5 20.5a6 6 0 0 1 12 0M2.5 12h6M6.3 9.6l2.4 2.4-2.4 2.4"/></symbol>
  <symbol id="i-question" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" d="M12 3.5c-4.7 0-8.5 3.3-8.5 7.4 0 2.3 1.2 4.3 3 5.7l-1 3.9 4.2-1.9c.7.2 1.5.3 2.3.3 4.7 0 8.5-3.3 8.5-7.4S16.7 3.5 12 3.5z"/><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M10 9.4a2.1 2.1 0 1 1 2.9 1.9c-.6.3-.9.8-.9 1.4"/><circle fill="currentColor" cx="12" cy="15.4" r=".7"/></symbol>
  <symbol id="i-send" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" d="M21.5 2.5L2.5 10.2l8 3.1 3.1 8.2zM21.5 2.5L10.5 13.3"/></symbol>
```

No toques `i-verified`, `i-eye`, `i-more`, `i-heart`, `i-info` ni `i-search`.

Verificación: `grep -c 'stroke-width="1.5"' index.html` debe dar 8 o más, y `grep -c "<symbol id=" index.html` debe seguir dando 15.

## 4. Sello de verificado más visible

Motivo: a 14 px el sello dentado se ve como un círculo liso.

En `css/style.css`:
- Cambia `.verified { width: 14px; height: 14px; flex: none; }` por `.verified { width: 17px; height: 17px; flex: none; }`.
- Cambia `.comment .u svg { width: 12px; height: 12px; }` por `.comment .u svg { width: 14px; height: 14px; }`.

## 5. Avatares sin degradados

Motivo: Instagram solo muestra foto real o silueta gris. Los círculos de color delatan.

En `js/avatar.js`, dentro de `avatarFor`, cambia la línea
`return (h % 100) < 32 ? SILHOUETTE : abstractAvatar(h);`
por
`return SILHOUETTE;`

No borres `abstractAvatar` (queda sin uso, no importa).

Nota para el informe final: el parecido real sube cuando hay fotos en `avatars/` (ver `README.md`, sección avatares,
y `node tools/build-avatars.mjs`). Eso lo decide el usuario; no busques ni descargues fotos.

## 6. Entrada de comentarios sin desvanecido y lista más corta

Motivo: la captura mostró el comentario más nuevo medio transparente (animación de entrada lenta) y la lista ocupaba el 40 % de la pantalla.

En `css/style.css`:
- En la regla `.comment { ... animation: rise .28s ease-out; }` cambia `rise .28s` por `rise .14s`.
- Reemplaza la línea `@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }` por
  `@keyframes rise { from { opacity: .6; transform: translateY(6px); } to { opacity: 1; transform: none; } }`.
- En la regla `.comments { ... max-height: 34vh; ... }` cambia `34vh` por `27vh`.

En `js/live.js`, dentro de `render`, cambia `while (ol.childElementCount > 9) ol.firstElementChild.remove();` por
`while (ol.childElementCount > 7) ol.firstElementChild.remove();`.

## 7. Más densidad de chat y corazones con muchos espectadores

Motivo: 190 mil espectadores con 7 comentarios tranquilos es incoherente.

7.1 En `js/scheduler.js`, función `perMinute`, cambia `return Math.min(78, base) * this.intensity;` por
`return Math.min(120, base * 1.35) * this.intensity;`.

7.2 En `js/scheduler.js`, función `loop`, cambia `Math.max(220, wait)` por `Math.max(150, wait)`.

7.3 En `js/live.js`, función `tickViewers`, cambia
`this.hearts.setRate(Math.min(4.5, 0.4 + Math.log10(Math.max(100, v) / 100) * 0.9) * this.s.intensity);`
por
`this.hearts.setRate(Math.min(8, 0.6 + Math.log10(Math.max(100, v) / 100) * 1.5) * this.s.intensity);`.

7.4 En `js/hearts.js`, reemplaza la constante `COLORS` completa por:
`const COLORS = ['#ff3040', '#ff3040', '#ff3040', '#ff6b81', '#ff2d95', '#ff8a5c', '#c13584', '#7b61ff', '#ffd600', '#f77737'];`

## 8. Nombres de usuario válidos

Motivo: apareció `.marcelo2`; Instagram no permite usuarios que empiecen o terminen con punto.

En `js/bank.js`, función `username`, justo antes de `return u.slice(0, 24);` agrega la línea:
`u = u.replace(/^[._]+|[._]+$/g, '');`

Verificación:
```powershell
node -e "import('./js/bank.js').then(b=>{let bad=0;for(let i=0;i<5000;i++){const u=b.makeFan().u;if(/^[._]|[._]$/.test(u))bad++;}console.log('malos',bad)})"
```
Debe imprimir `malos 0`.

## 9. Service worker

En `sw.js` cambia `const CACHE = 'fakelive-v3';` por `const CACHE = 'fakelive-v4';` (si no, el celular sigue con la versión vieja).

## 10. Verificación local de sintaxis

```powershell
node --check js/app.js; node --check js/live.js; node --check js/scheduler.js; node --check js/hearts.js; node --check js/bank.js; node --check js/avatar.js
git diff --stat
```
Ningún `node --check` debe imprimir error. `git diff --stat` debe listar exactamente: `manifest.webmanifest`, `js/app.js`, `index.html`, `css/style.css`, `js/avatar.js`, `js/live.js`, `js/scheduler.js`, `js/hearts.js`, `js/bank.js`, `sw.js`. Si aparece otro archivo, revisa qué pasó antes de seguir.

## 11. Commit, wall-check y push

```powershell
git add -A
git commit -m "<mensaje en español que resuma los pasos 2-9, más las líneas de atribución>"
```
Luego ejecuta la skill `/wall-check C:\Users\Usuario\fakelive personal-cloud`. Solo si el veredicto es PASA:
```powershell
git push origin main
```

## 12. Confirmar publicación

```powershell
Start-Sleep 70; (Invoke-WebRequest "https://franciscodp96-ai.github.io/fakelive/sw.js?x=1").Content -match 'fakelive-v4'
```
Debe imprimir `True`. Si es `False`, espera 30 s y repite hasta tres veces.

## 13. Qué pedirle al usuario y cómo cerrar

Pide al usuario:
1. Cerrar la app del todo en el celular, abrirla de nuevo e iniciar un live.
2. Una captura de pantalla del live tras un minuto.

Cuando entregue la captura (guárdala con la ruta que él indique), lanza TRES subagentes `general-purpose` en paralelo con
este prompt exacto, cambiando solo la ruta de la imagen, y sin darles ningún otro contexto:

> Lee la imagen <RUTA> con la herramienta Read. Es una captura de pantalla de un celular. Evalúa qué tan parecida es a la
> pantalla real de un live de Instagram visto por quien transmite. Responde en español: una nota de 0 a 10 de parecido,
> qué elementos coinciden con Instagram, y una lista concreta de todo lo que delata que podría no ser Instagram
> (posición, tamaños, textos, iconos, colores, tipografía, comportamiento visible). No uses otras herramientas ni busques
> nada; solo tu criterio sobre la imagen.

Informe final al usuario: las tres notas nuevas frente a las anteriores (5, 6, 6), los delatores en que coincidan dos o
más evaluadores, y nada más. No apliques correcciones nuevas sin que el usuario lo pida.
