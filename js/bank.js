// Banco local: fans ficticios y comentarios de fondo. 90 % chileno, 5 % latino, 5 % inglés.
import { pick, chance, randInt } from './format.js';

const CL_NOMBRES = ['cata', 'javi', 'fran', 'anto', 'vale', 'martu', 'feña', 'cony', 'cami', 'isi', 'flo', 'jose', 'benja', 'mati', 'vicho', 'joaco', 'nico', 'tomi', 'nacho', 'seba', 'diego', 'pipe', 'cris', 'basti', 'maxi', 'agus', 'lucas', 'kevin', 'brayan', 'yastin', 'gene', 'scar', 'kiara', 'naya', 'yesi', 'pancho', 'lalo', 'coté', 'pili', 'trini', 'rochi', 'maca', 'dani', 'pato', 'ale', 'gabi', 'emi', 'ro', 'ceci', 'rorro', 'koke', 'paula', 'daniela', 'ignacia', 'renata', 'amanda', 'sofi', 'cristobal', 'felipe', 'alonso', 'claudio', 'marcelo', 'jorge', 'carlos', 'luis', 'andres', 'pablo', 'rodrigo', 'ivan', 'mauro', 'camilo'];
const CL_APELLIDOS = ['gonzalez', 'munoz', 'rojas', 'diaz', 'perez', 'soto', 'contreras', 'silva', 'martinez', 'sepulveda', 'morales', 'rodriguez', 'lopez', 'fuentes', 'hernandez', 'torres', 'araya', 'flores', 'espinoza', 'valenzuela', 'castillo', 'tapia', 'reyes', 'gutierrez', 'castro', 'pizarro', 'alvarez', 'vasquez', 'sanchez', 'fernandez', 'ramirez', 'carrasco', 'gomez', 'cortes', 'herrera', 'nunez', 'jara', 'vergara', 'rivera', 'figueroa', 'riquelme', 'garcia', 'miranda', 'bravo', 'vera', 'molina', 'vega', 'campos', 'sandoval', 'orellana', 'zuniga', 'olivares', 'alarcon', 'leiva', 'vidal', 'salazar', 'henriquez', 'ortiz', 'aguilera', 'saavedra', 'lagos', 'caceres', 'navarro', 'garrido', 'parra', 'pena', 'vargas', 'ramos', 'escobar', 'poblete', 'mardones', 'bustos', 'toro', 'cardenas', 'palma', 'yanez', 'guzman', 'ponce', 'lara', 'osorio', 'carvajal', 'maldonado', 'ruiz', 'farias', 'donoso', 'acuna', 'riveros', 'villarroel', 'godoy', 'avila', 'barrera', 'pacheco', 'medina', 'quezada', 'cerda', 'venegas', 'arancibia', 'astudillo', 'burgos', 'cornejo', 'ibarra', 'inostroza', 'gallardo', 'troncoso', 'urrutia', 'paredes', 'moreno', 'ulloa', 'aravena'];
const LATAM_NOMBRES = ['andrea', 'valeria', 'santiago', 'mateo', 'luciana', 'juanpa', 'ximena', 'dani', 'majo', 'nico', 'caro', 'pao', 'brenda', 'thiago', 'lu', 'mariana', 'kevin', 'yeison', 'jhon', 'alejo'];
const EN_NOMBRES = ['emily', 'jake', 'ash', 'liam', 'mia', 'noah', 'zoe', 'tyler', 'maddie', 'chris', 'sam', 'ava', 'kai', 'jess', 'ryan'];

export const CIUDADES = ['Santiago', 'Valpo', 'Viña', 'Conce', 'Temuco', 'Antofa', 'La Serena', 'Puerto Montt', 'Rancagua', 'Iquique', 'Talca', 'Chillán', 'Arica', 'Copiapó', 'Osorno', 'Valdivia', 'Punta Arenas', 'Calama', 'Curicó', 'Los Ángeles', 'Quilpué', 'Coquimbo', 'San Antonio', 'Linares', 'Ovalle'];
export const COMUNAS = ['Maipú', 'Puente Alto', 'La Florida', 'Ñuñoa', 'Providencia', 'Las Condes', 'San Bernardo', 'Quilicura', 'La Pintana', 'Peñalolén', 'Pudahuel', 'Renca', 'Macul', 'Estación Central', 'Recoleta', 'Independencia', 'Cerrillos', 'El Bosque', 'Lo Prado', 'Conchalí', 'Huechuraba', 'La Reina', 'Lampa', 'Colina', 'Melipilla', 'Buin', 'Talagante'];
const LATAM_LUGARES = ['Bogotá 🇨🇴', 'Medellín 🇨🇴', 'Lima 🇵🇪', 'CDMX 🇲🇽', 'Guadalajara 🇲🇽', 'Buenos Aires 🇦🇷', 'Córdoba 🇦🇷', 'Quito 🇪🇨', 'Guayaquil 🇪🇨', 'Montevideo 🇺🇾', 'Caracas 🇻🇪', 'La Paz 🇧🇴', 'Asunción 🇵🇾', 'San José 🇨🇷', 'Panamá 🇵🇦', 'Santo Domingo 🇩🇴', 'Madrid 🇪🇸', 'Miami 🇺🇸'];
const EN_LUGARES = ['Toronto 🇨🇦', 'NYC 🇺🇸', 'London 🇬🇧', 'LA', 'Sydney 🇦🇺', 'Texas', 'Dublin 🇮🇪', 'Melbourne', 'Chicago', 'Vancouver 🇨🇦'];

const SUFIJOS = ['', '', '', '_', '__', '.', 'x', 'xx', '22', '07', '01', '13', '99', '_cl', '.cl', '_ok', 'ok', '2', '3', '_oficial', 'tv', '.g', '_g'];

function username(lang) {
  let n, a;
  if (lang === 'en') { n = pick(EN_NOMBRES); a = pick(['', 'smith', 'j', 'lee', 'k', 'brown', 'm', 'wilson']); }
  else if (lang === 'latam') { n = pick(LATAM_NOMBRES); a = pick(CL_APELLIDOS); }
  else { n = pick(CL_NOMBRES); a = pick(CL_APELLIDOS); }
  const sep = pick(['.', '_', '', '.', '_']);
  const forms = [
    () => `${n}${sep}${a}${pick(SUFIJOS)}`,
    () => `${n}${sep}${a.slice(0, randInt(3, a.length))}${pick(SUFIJOS)}`,
    () => `${pick(['la', 'el', 'soy', 'its', 'xx', ''])}${pick(['.', '_', ''])}${n}${pick(SUFIJOS)}`,
    () => `${n}${randInt(1990, 2011)}`,
    () => `${a}.${n}${pick(['', '_', '.'])}`,
    () => `${n}${n.slice(-1)}${pick(['', '_', 'uwu', '.'])}`,
    () => `${n}${sep}${a}`,
  ];
  let u = pick(forms)().replace(/[^a-z0-9._]/g, '').replace(/[._]{3,}/g, '_');
  if (chance(0.3)) u = u.replace(/i/g, 'y').replace(/ck/g, 'k');
  return u.slice(0, 24);
}

export function makeFan(lang = rollLang()) {
  const u = username(lang);
  return { u, lang, verified: chance(0.012), place: lang === 'en' ? pick(EN_LUGARES) : lang === 'latam' ? pick(LATAM_LUGARES) : pick(chance(0.6) ? CIUDADES : COMUNAS) };
}

export function rollLang() {
  const r = Math.random();
  return r < 0.90 ? 'cl' : r < 0.95 ? 'latam' : 'en';
}

// ── Plantillas de fondo. {ciudad} {comuna} {lugar} {nombre} se reemplazan al emitir.
const CL = [
  'weeena', 'wenaaaa', 'holaaaa', 'holi', 'al fin un live', 'llegué temprano por fin', 'primera vez que llego a tiempo 😭',
  'saludos desde {ciudad} 🇨🇱', 'saludos de {comuna}', 'desde {ciudad} presente', '{ciudad} te ama ❤️', 'aquí desde {comuna} con frío',
  'saludameee', 'saluda a mi mamá porfa', 'saluda a {comuna} 🙏', 'oe saludame soy fan desde el principio', 'saluda a mi pololo que no cree que te veo',
  'te amo rey 👑', 'te amo reina 👑', 'eres seco', 'seca ❤️', 'crack', 'el más grande', 'la más grande 😍', 'bacán', 'la raja', 'ql bacán',
  'jajajaja', 'jajajajaj no', 'jsjsjsjs', 'ajajaja', 'me muero 😭😭', 'nooooo jajaja', 'estoy llorando 😭', 'qué fome jajaja',
  'oe qué onda el pelo', 'me gusta tu polera', 'de dónde es ese polerón', 'qué linda la luz', 'se ve bacán el fondo',
  'cuándo vienes a {ciudad}?', 'ven a {ciudad} porfa 🙏', 'cuándo concierto en {ciudad}', 'por qué nunca vienes al sur 😢', 'ven a {comuna} jaja',
  'dale like a mi comentario 🥺', 'likeame el comentario', 'me respondes? 🥺', 'contesta porfa', 'léeme porfaaa',
  'eres mi ídolo desde chico', 'mi hija te ama', 'mi abuela te ve conmigo jaja', 'estamos viendo en familia', 'en la pega escondido viendo jaja',
  'cachai que te vi en el mall', 'te vi en el aeropuerto y no te saludé 😭', 'una vez te crucé en {comuna}', 'mi prima te conoce',
  'temazooo', 'suelta música', 'canta algo porfa', 'cuándo sale lo nuevo?', 'spoiler porfa', 'adelanto adelanto', 'danos una fecha',
  '2 millones de personas wn', 'cuánta gente ql', 'esto está lleno', 'somos muchos jaja', 'récord', 'puro chile acá 🇨🇱',
  'desde el micro viendo', 'en la micro sin audífonos sorry', 'viendo con 2% de batería 😭', 'se me va a acabar la batería', 'me pillaron en clases',
  'sí po', 'obvio po', 'no po', 'ya po', 'ya pues saluda', 'oe', 'oe weon', 'ctm qué lindo', 'wn qué lindo', 'qué linda 😍', 'qué guapo',
  '❤️❤️❤️', '🔥🔥🔥', '😍😍', '🇨🇱🇨🇱🇨🇱', '👑', '🙌🙌', '💯', '😭❤️', '🫶🫶', '👏👏👏',
  'un saludo pa mi curso 4to b', 'saluda al colegio {comuna}', 'saludos a la pega', 'saluda a los de la u',
  'te sigo desde que tenías 1000 seguidores', 'fan número 1', 'desde el día uno', 'la mejor comunidad', 'te amamos',
  'está lagueado?', 'se pegó un poquito', 'se escucha bajito', 'sube el volumen', 'ahora sí se escucha',
  'es verdad lo del rumor?', 'responde las preguntas', 'haz un q&a', 'hagamos sorteo', 'sortea algo porfa',
  'compraste el iphone?', 'qué celular usas?', 'cuál es tu comida favorita', 'equipo? colo colo o la u', 'colo colo 🤍🖤', 'la u ❤️💙', 'la roja 🇨🇱',
  'completo o sushi?', 'sopaipillas con pebre 😋', 'qué calor en {ciudad}', 'qué frío en {ciudad}', 'llueve en {ciudad} y yo acá',
  'quiero ser como tú', 'me inspiras', 'gracias por todo', 'gracias por existir', 'eres luz', 'nunca cambies',
];
const LATAM = [
  'saludos desde {lugar}', 'desde {lugar} 🙌', 'hola desde {lugar}', 'te amo desde {lugar}', '{lugar} presente 🙋', 'un saludo pa {lugar} porfa',
  'ven a {lugar} 🙏', 'cuándo gira por {lugar}?', 'eres lo máximo', 'grande', 'crack', 'qué chévere', 'qué chimba', 'qué padre', 'ídolo ❤️',
  'jajaja', 'no manches jaja', 'che saludame', 'parcero saludame', 'wey te amo', 'saludos a toda la gente de Chile 🇨🇱',
];
const EN = [
  'hi from {lugar}', 'love from {lugar} ❤️', 'omg hiii', 'we love you', 'love u sm', 'greetings from {lugar}', 'say hi pls 🥺', 'my fav 😭',
  'king 👑', 'queen 👑', 'come to {lugar}!!', 'can’t believe i made it live', 'lol', 'so pretty', 'the vibes', 'translate pls 😭',
];

export function backgroundText(fan, ctx) {
  const t = fan.lang === 'en' ? pick(EN) : fan.lang === 'latam' ? pick(LATAM) : pick(CL);
  return fill(t, fan, ctx);
}

export function fill(t, fan, ctx = {}) {
  return t.replaceAll('{ciudad}', pick(CIUDADES)).replaceAll('{comuna}', pick(COMUNAS))
    .replaceAll('{lugar}', fan.place).replaceAll('{nombre}', ctx.name || '');
}

// Avisos del sistema dentro del chat.
const NOTICES = ['se unió', 'se unió', 'se unió', 'se unió', 'empezó a seguirte', 'compartió este video'];
export function notice() {
  const fan = makeFan();
  return { fan, text: pick(NOTICES), notice: true };
}

// Cuentas verificadas ficticias que aparecen con un gesto oculto.
const FAMOUS = [
  { u: 'ignaciaa.oficial', t: ['😍😍😍', 'lo máximooo', 'te amo amigo 🫶', 'grande!! 🔥'] },
  { u: 'djpancho_cl', t: ['🔥🔥🔥', 'vamos con todo', 'colab cuándo?? 👀', 'ídolo'] },
  { u: 'lakathyoficial', t: ['te amooo', 'jajajaja me muero', 'saludame pooo', '👑👑'] },
  { u: 'teamfutbolcl', t: ['grande crack ⚽', 'saludos del equipo 🇨🇱', '🔥🔥'] },
  { u: 'martin.music', t: ['tremendo 🙌', 'hermano!! 🔥', 'ya sabes lo que viene 👀'] },
  { u: 'camila.tv', t: ['hola!!! 😍', 'te veo desde el camarín jaja', 'la rompes'] },
  { u: 'elnicolive', t: ['jajajaja no puede ser', 'wena wena', 'avisa cuando termines 👀'] },
  { u: 'valentina.oficial', t: ['😍🔥', 'ídolo total', 'nos vemos el finde 🫶'] },
];
export function famousComment() {
  const f = pick(FAMOUS);
  return { fan: { u: f.u, lang: 'cl', verified: true, place: 'Santiago' }, text: pick(f.t), famous: true };
}

// Nombre visible estable para un fan (lista de espectadores, invitaciones).
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
export function fanName(fan) {
  const h = hash(fan.u);
  const nombres = fan.lang === 'en' ? EN_NOMBRES : fan.lang === 'latam' ? LATAM_NOMBRES : CL_NOMBRES;
  const n = nombres[h % nombres.length];
  const a = CL_APELLIDOS[(h >>> 8) % CL_APELLIDOS.length];
  return fan.lang === 'en' ? cap(n) : `${cap(n)} ${cap(a)}`;
}

// Preguntas del público (hoja "Preguntas").
const PREGUNTAS = [
  '¿Cuándo vienes a {ciudad}?', '¿Vas a sacar algo nuevo pronto?', '¿Cuál fue el momento más difícil de tu carrera?',
  '¿Un consejo pa los que recién empiezan?', '¿Con quién te gustaría colaborar?', '¿Qué estás escuchando ahora?',
  '¿Cómo manejas el hate?', '¿Qué haces en un día normal?', '¿Vas a hacer meet & greet?', '¿Cuál es tu comida favorita?',
  '¿Me saludas? es mi cumple 🥺', '¿Cuál es tu mayor sueño ahora?', '¿Te acuerdas de cuando recién empezabas?',
  '¿Qué le dirías a tu yo de hace 5 años?', '¿Vas a venir al sur? {ciudad} te espera', '¿Cuál ha sido tu mejor show?',
  '¿Cómo es un día de gira?', '¿Qué opinas de la escena chilena hoy?', '¿Habrá merch nueva?', '¿Cuándo entrevista con {nombre}?',
];
export function questions(n = 8, ctx = {}) {
  const pool = [...PREGUNTAS].sort(() => Math.random() - 0.5).slice(0, n);
  return pool.map(t => { const fan = makeFan('cl'); return { fan, text: fill(t, fan, ctx) }; });
}

// Avisos del sistema al iniciar (como los muestra Instagram al anfitrión).
export const SYSTEM_NOTES = [
  'Estamos avisando a tus seguidores que iniciaste un video en vivo.',
  'Espera un momento. Estamos avisando a más seguidores para que se unan a tu video.',
];
