import { h, ratioBar } from './dom.js';
import { EXPECTED, countBlocks } from './ratio.js';
import { createStore } from './store.js';
import { renderBlock } from './render.js';

const app = document.getElementById('app');
const id = new URLSearchParams(location.search).get('m');
const store = createStore();

async function main() {
  if (!id || !(id in EXPECTED)) { app.append(h('p', {}, 'ไม่พบโมดูลนี้')); return; }
  let mod;
  try { mod = (await import(`../content/${id}.js`)).default; } catch { app.append(h('p', {}, 'โมดูลนี้ยังไม่พร้อมใช้งาน')); return; }
  document.title = `INT161 ${id.toUpperCase()} — ${mod.title}`;
  const total = mod.blocks.length;
  const update = () => {
    const n = store.doneCount(id);
    document.getElementById('progress-fill').style.width = `${(n / total) * 100}%`;
    document.getElementById('progress-text').textContent = `${n}/${total}`;
  };
  app.append(h('h1', {}, `${id.toUpperCase()} — ${mod.title}`), ratioBar(countBlocks(mod.blocks)));
  for (const b of mod.blocks) app.append(renderBlock(b, { moduleId: id, store, onDone: update }));
  update();
}
main();
