// Comentarios reactivos: llamada directa a la API de Anthropic desde el navegador.
// La clave vive solo en este dispositivo (localStorage). Devuelve [{t, l}] o lanza.
const API = 'https://api.anthropic.com/v1/messages';

function systemPrompt(s, viewers) {
  return `Eres el generador del chat de un live de Instagram con ${viewers} espectadores en vivo.
El anfitrión es ${s.name || s.handle} (@${s.handle}). Quién es: ${s.famousFor || 'una celebridad chilena muy querida'}.
Escribes comentarios de fans reaccionando a lo que el anfitrión ACABA de decir (transcripción automática en español de Chile; puede traer errores, interprétala con sentido común).

Reglas:
- Mezcla: 90 % chilenos (modismos naturales: wena, bacán, la raja, cachai, po, ya po, oe, wn, ctm con moderación, "saluda a…", comunas y ciudades de Chile), 5 % de otros países latinos (dicen su ciudad o país, a veces bandera), 5 % en inglés.
- Si el anfitrión preguntó algo al chat, la mayoría responde la pregunta directamente, con opiniones distintas y concretas. Si contó algo, reaccionan a eso (sorpresa, risa, apoyo, chiste, pedir detalles).
- Cortos: 1 a 12 palabras. Mayoría en minúsculas, puntuación relajada, a veces letras repetidas (wenaaa, siiii), emojis en ~40 %, algún error de tipeo.
- Variedad real: nadie repite lo mismo; evita frases ya usadas que te paso.
- Nunca digas ni insinúes que esto es simulado. Nunca nombres personas reales ni marcas de competencia. Sin odio ni sexualidad explícita.
- Responde SOLO con un JSON array de 12 objetos {"t": "texto", "l": "cl"|"latam"|"en"}. Nada antes ni después.`;
}

export async function generateTanda({ settings, transcript, interim, recent, viewers, signal }) {
  const body = {
    model: settings.model || 'claude-haiku-5-5',
    max_tokens: 900,
    thinking: { type: 'disabled' },
    output_config: { effort: 'low' },
    system: systemPrompt(settings, viewers),
    messages: [{
      role: 'user',
      content: `Lo que acaba de decir el anfitrión (últimos segundos):\n«${transcript}»${interim ? `\n(aún hablando: «${interim}»)` : ''}\n\nComentarios ya mostrados (no repetir):\n${recent.map(r => '- ' + r).join('\n') || '- (ninguno)'}\n\nJSON:`,
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
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  return parseTanda(text);
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

function parseTanda(text) {
  const a = text.indexOf('['), b = text.lastIndexOf(']');
  if (a < 0 || b < a) throw new Error('sin JSON');
  const arr = JSON.parse(text.slice(a, b + 1));
  return arr.filter(x => x && typeof x.t === 'string' && x.t.trim())
    .map(x => ({ t: x.t.trim().slice(0, 120), l: ['cl', 'latam', 'en'].includes(x.l) ? x.l : 'cl' }));
}
