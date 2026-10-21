import { h, ratioBar } from './dom.js';
import { EXPECTED, countBlocks } from './ratio.js';
import { createStore } from './store.js';
import { MODULES } from './modules.js';

const store = createStore();
const cards = document.getElementById('cards');
const modules = [];
for (const m of MODULES) {
  let blocks = [];
  if (m.ready) {
    try { blocks = (await import(`../content/${m.id}.js`)).default.blocks; } catch { /* unavailable */ }
  }
  modules.push({ ...m, blocks });
  const counts = blocks.length ? countBlocks(blocks) : EXPECTED[m.id];
  const done = blocks.filter((b) => store.isDone(m.id, b.id)).length;
  const total = counts.concept + counts.experiment + counts.exercise;
  const exercises = blocks.filter((b) => b.type === 'exercise');
  const passed = exercises.filter((b) => store.isDone(m.id, b.id)).length;
  const next = blocks.find((b) => !store.isDone(m.id, b.id)) || blocks[0];
  cards.append(h(m.ready ? 'a' : 'div', {
    class: 'card' + (m.ready ? '' : ' soon'),
    href: m.ready ? `lesson.html?m=${m.id}${next ? '#' + next.id : ''}` : null,
  }, h('div', { class: 'card-id' }, m.id.toUpperCase()), h('h3', {}, m.title),
  h('strong', {}, m.ready ? `${Math.round(done / total * 100)}% · ทำแล้ว ${done}/${total}` : 'เร็ว ๆ นี้'),
  h('progress', { class: 'course-progress', max: total, value: done, 'aria-label': `ความคืบหน้า ${m.id}` }),
  h('p', { class: 'muted' }, exercises.length ? `โจทย์ผ่าน ${passed}/${exercises.length} · ${done === total ? 'เรียนครบแล้ว ✓' : 'เรียนต่อ →'}` : `อ่านทฤษฎี ${done}/${total} หัวข้อ · ${done === total ? 'อ่านครบแล้ว ✓' : 'อ่านต่อ →'}`),
  h('div', { class: 'card-ratio' }, h('span', { class: 'muted' }, 'รูปแบบกิจกรรม'), ratioBar(counts))));
}
const last = store.getLastVisited();
const chosen = modules.find((m) => m.id === last?.moduleId && m.blocks.some((b) => b.id === last.blockId))
  || modules.find((m) => m.blocks.some((b) => !store.isDone(m.id, b.id))) || modules[0];
const block = chosen?.blocks.find((b) => b.id === last?.blockId) || chosen?.blocks.find((b) => !store.isDone(chosen.id, b.id)) || chosen?.blocks[0];
if (block) cards.before(h('section', { class: 'resume-card' },
  h('div', {}, h('div', { class: 'muted' }, 'พร้อมเรียนต่อ'), h('h2', {}, `${chosen.id.toUpperCase()} · ${block.title}`)),
  h('a', { class: 'btn primary', href: `lesson.html?m=${chosen.id}#${block.id}` }, last ? 'เรียนต่อจากครั้งล่าสุด →' : 'เริ่มเรียน →')));
