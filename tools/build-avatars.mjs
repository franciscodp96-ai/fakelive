// Genera avatars/index.json con las imágenes presentes en avatars/.
import { readdir, writeFile } from 'node:fs/promises';
const dir = new URL('../avatars/', import.meta.url);
const files = (await readdir(dir).catch(() => [])).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort();
await writeFile(new URL('index.json', dir), JSON.stringify(files));
console.log(`${files.length} avatares indexados`);
