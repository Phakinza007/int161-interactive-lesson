import { h, ratioBar } from './dom.js';
import { EXPECTED, countBlocks } from './ratio.js';
import { createStore } from './store.js';
import { MODULES } from './modules.js';

const store = createStore();
const cards = document.getElementById('cards');

for (const m of MODULES) {
  let counts = EXPECTED[m.id];
  if (m.ready) {
    try { counts = countBlocks((await import(`../content/${m.id}.js`)).default.blocks); } catch { /* keep expected */ }
  }
  const total = counts.concept + counts.experiment + counts.exercise;
  const card = h(m.ready ? 'a' : 'div', { class: 'card' + (m.ready ? '' : ' soon'), href: m.ready ? `lesson.html?m=${m.id}` : null },
    h('div', { class: 'card-id' }, m.id.toUpperCase()),
    h('h3', {}, m.title),
    ratioBar(counts),
    h('div', { class: 'muted' }, m.ready ? `ทำแล้ว ${store.doneCount(m.id)}/${total} บล็อก` : 'เร็ว ๆ นี้'));
  cards.append(card);
}
