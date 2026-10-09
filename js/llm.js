// Comentarios reactivos: llamada directa a la API de Anthropic desde el navegador.
// La clave vive solo en este dispositivo (localStorage). Devuelve [{t, l, b?}] o lanza.
import { PERMANENTES, WINGMAN } from './consignas.js';

const API = 'https://api.anthropic.com/v1/messages';

function systemPrompt(s, viewers, { n, frame, wingman }) {
  const consignas = [...PERMANENTES, ...(s.consigna || '').split('\n')].map(c => c.trim()).filter(Boolean);
  return `Eres el generador del chat de un live de Instagram con ${viewers} espectadores en vivo.
El anfitrión es ${s.name || s.handle} (@${s.handle}). Quién es: ${s.famousFor || 'una celebridad chilena muy querida'}.
Escribes comentarios de fans reaccionando a lo que el anfitrión ACABA de decir (transcripción automática en español de Chile; puede traer errores, interprétala con sentido común)${frame ? ' y a lo que se ve en el video' : ''}.

Reglas:
- Mezcla: 90 % chilenos (modismos naturales: wena, bacán, la raja, cachai, po, ya po, oe, wn, ctm con moderación, "saluda a…", comunas y ciudades de Chile), 5 % de otros países latinos (dicen su ciudad o país, a veces bandera), 5 % en inglés.
- Si el anfitrión preguntó algo al chat, la mayoría responde la pregunta directamente, con opiniones distintas y concretas. Si contó algo, reaccionan a eso (sorpresa, risa, apoyo, chiste, pedir detalles).
${frame ? `- La imagen es lo que los fans ven ahora en el video. Algunos comentan lo que se ve (el lugar, quién aparece, lo que pasa, un gesto) como lo haría un espectador, sin describir la imagen ni enumerar detalles. No identifiques a nadie por su cara.
` : ''}- Cortos: 1 a 12 palabras. Mayoría en minúsculas, puntuación relajada, a veces letras repetidas (wenaaa, siiii), emojis en ~40 %, algún error de tipeo.
- Variedad real: nadie repite lo mismo; evita frases ya usadas que te paso, y tampoco repitas su tema: si ya comentaron su cara, su pose o el fondo, habla de otra cosa (piden saludos, le preguntan algo, cuentan desde dónde miran, reaccionan entre ellos).
- Sin fórmulas: no más de dos comentarios parten con "jajaja", y los de otros países no siempre saludan con "hola desde…".
- Nunca digas ni insinúes que esto es simulado. Nunca nombres personas reales ni marcas de competencia. Sin odio ni sexualidad explícita.
${consignas.length ? `
Consignas del anfitrión (mandan sobre el estilo anterior, pero no sobre la regla de no insinuar que es simulado ni la de sin odio ni sexualidad explícita):
${consignas.map(c => '- ' + c).join('\n')}
` : ''}${wingman ? `
${WINGMAN}
` : ''}
Responde SOLO con un JSON array de ${n} objetos {"t": "texto", "l": "cl"|"latam"|"en"${wingman ? ', "b": 0|1|2|3' : ''}}. Nada antes ni después.`;
}

export async function generateTanda({ settings, transcript, interim, recent, viewers, frame, wingman, signal }) {
  // Sin voz, la tanda reacciona solo al cuadro y es más corta para no tapar el chat de fondo.
  const n = transcript ? 12 : 6;
  const said = transcript
    ? `Lo que acaba de decir el anfitrión (últimos segundos):\n«${transcript}»${interim ? `\n(aún hablando: «${interim}»)` : ''}`
    : `El anfitrión no ha dicho nada en los últimos segundos. Reacciona solo a lo que se ve en el video.${wingman ? ' El modo wingman sigue activo.' : ''}`;
  const text = `${said}\n\nComentarios ya mostrados (no repetir):\n${recent.map(r => '- ' + r).join('\n') || '- (ninguno)'}\n\nJSON:`;
  const body = {
    model: settings.model || 'claude-haiku-5-5',
    max_tokens: 900,
    thinking: { type: 'disabled' },
    output_config: { effort: 'low' },
    system: systemPrompt(settings, viewers, { n, frame: !!frame, wingman }),
    messages: [{
      role: 'user',
      content: frame
        ? [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: frame } }, { type: 'text', text }]
        : text,
    }],
  };
  let res = await call(settings.apiKey, body, signal);
  if (res.status === 400) {
    // Compatibilidad: si el modelo rechaza thinking/output_config, reintenta sin ellos.
    delete body.thinking; delete body.output_config;
    res = await call(settings.apiKey, body, signal);
  }
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${err.slice(0, 160)}`);
  }
  const data = await res.json();
  if (data.stop_reason === 'refusal') throw new Error('refusal');
  const out = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  return parseTanda(out);
}

function call(apiKey, body, signal) {
  return fetch(API, {
    method: 'POST', signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });
}

export function parseTanda(text) {
  const a = text.indexOf('['), b = text.lastIndexOf(']');
  if (a < 0 || b < a) throw new Error('sin JSON');
  const arr = JSON.parse(text.slice(a, b + 1));
  return arr.filter(x => x && typeof x.t === 'string' && x.t.trim()).map(x => {
    // A veces el modelo escribe la insignia dentro del texto ("b: 2 pa los tragos…") en vez de en su campo.
    const m = x.t.trim().match(/^"?b"?\s*[:=]\s*([123])[\s,.-]+(.*)$/is);
    const t = (m ? m[2] : x.t).trim().slice(0, 120);
    return { t, l: ['cl', 'latam', 'en'].includes(x.l) ? x.l : 'cl', b: m ? +m[1] : [1, 2, 3].includes(x.b) ? x.b : 0 };
  }).filter(x => x.t);
}
