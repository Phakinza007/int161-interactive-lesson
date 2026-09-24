import { h } from './dom.js';
import { WIDGETS } from './widgets.js';
import { createRunPanel } from './runpanel.js';

const BADGE = { concept: '📖 แนวคิด', experiment: '🔬 ทดลอง', exercise: '⌨️ เขียนเอง' };

export function renderBlock(block, ctx) {
  const { moduleId, store, onDone } = ctx;
  const el = h('section', { class: `block block-${block.type}`, id: block.id });
  const done = () => { store.markDone(moduleId, block.id); el.classList.add('done'); onDone(); };
  if (store.isDone(moduleId, block.id)) el.classList.add('done');

  // never pass null/false to append(): it would print the text "null"
  el.append(...[
    h('div', { class: 'block-head' },
      h('span', { class: `badge badge-${block.type}` }, BADGE[block.type]),
      h('h2', {}, block.title),
      h('span', { class: 'check', 'aria-label': 'เสร็จแล้ว' }, '✓')),
    block.body && h('div', { class: 'prose', html: block.body }),
    block.diagram && h('figure', { class: 'diagram' },
      h('div', { class: 'diagram-svg', html: block.diagram }),
      block.diagramCaption && h('figcaption', {}, block.diagramCaption)),
  ].filter(Boolean));

  if (block.widget) {
    const host = h('div', { class: 'widget' });
    const build = WIDGETS[block.widget];
    if (build) build(host, block); else host.textContent = `(widget '${block.widget}' ยังไม่พร้อม)`;
    el.append(host);
  }
  if (block.files) el.append(createRunPanel({ block, moduleId, store, onDone: done }));
  if (block.type === 'concept') {
    el.append(h('button', { class: 'btn read', onclick: done }, 'อ่านแล้ว ✓'));
  } else if (block.widget && !block.files) {
    el.append(h('button', { class: 'btn read', onclick: done }, 'ลองแล้ว ✓'));
  }
  if (block.source) el.append(h('div', { class: 'source' }, `ที่มา: ${block.source}`));
  return el;
}
