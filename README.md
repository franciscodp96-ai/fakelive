# fakelive

PWA personal que simula un live de Instagram con espectadores ficticios que reaccionan a la voz del anfitrión.
Solo para uso propio; no se publica en tiendas. Vocabulario en `CONTEXT.md`.

## Desarrollo

```
npm run serve      # http://localhost:8787 (localhost es contexto seguro: cámara y micrófono funcionan)
```

Sin build. HTML/CSS/JS plano; `js/` son módulos ES.

## Avatares con foto (opcional)

Copia imágenes a `avatars/` y genera el índice:

```
node tools/build-avatars.mjs
```

Sin `avatars/index.json` se usan la silueta por defecto de Instagram y círculos de color.

## Despliegue

GitHub Pages desde la rama `main`, carpeta raíz. La clave de API nunca va al repo: se escribe en la pantalla de ajustes y queda en `localStorage` del celular.
