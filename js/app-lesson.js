import { h, ratioBar } from './dom.js';
import { EXPECTED, countBlocks } from './ratio.js';
import { createStore } from './store.js';
import { renderBlock } from './render.js';

const app = document.getElementById('app');
const id = new URLSearchParams(location.search).get('m');
const store = createStore();
const statusLabel = { concept: 'อ่านแล้ว', experiment: 'ทดลองแล้ว', exercise: 'โจทย์ผ่าน' };

async function main() {
  if (!id || !(id in EXPECTED)) { app.append(h('p', {}, 'ไม่พบโมดูลนี้')); return; }
  let mod;
  try { mod = (await import(`../content/${id}.js`)).default; } catch { app.append(h('p', {}, 'โมดูลนี้ยังไม่พร้อมใช้งาน')); return; }
  document.title = `INT161 ${id.toUpperCase()} — ${mod.title}`;
  const total = mod.blocks.length;
  const links = new Map();
  const nav = h('nav', { 'aria-label': 'หัวข้อในบทเรียน' });
  const toc = h('details', { class: 'lesson-toc' }, h('summary', {}, 'สารบัญบทเรียน · เลือกหัวข้อ'), nav);
  document.querySelector('.topbar').append(h('button', { class: 'btn toc-button', onclick: () => {
    toc.open = true;
    toc.scrollIntoView({ behavior: 'auto', block: 'start' });
    toc.querySelector('summary').focus();
  } }, 'สารบัญ'));
  app.append(h('h1', {}, `${id.toUpperCase()} — ${mod.title}`),
    h('details', {}, h('summary', {}, 'รูปแบบกิจกรรมในบทนี้'), ratioBar(countBlocks(mod.blocks))), toc);
  const update = () => {
    const n = mod.blocks.filter((b) => store.isDone(id, b.id)).length;
    document.getElementById('progress-fill').style.width = `${n / total * 100}%`;
    document.getElementById('progress-text').textContent = `${n}/${total}`;
    for (const b of mod.blocks) {
      const done = store.isDone(id, b.id);
      links.get(b.id).querySelector('.toc-status').textContent = done ? statusLabel[b.type] + ' ✓' : 'ยังไม่เสร็จ';
      document.getElementById(b.id).querySelector('.check').textContent = statusLabel[b.type] + ' ✓';
    }
  };
  for (const [i, b] of mod.blocks.entries()) {
    const link = h('a', { href: `#${b.id}`, onclick: () => { if (matchMedia('(max-width: 700px)').matches) toc.open = false; } },
      h('span', {}, `${i + 1}. ${b.title}`), h('span', { class: 'toc-status' }));
    links.set(b.id, link); nav.append(link);
    const section = renderBlock(b, { moduleId: id, store, onDone: update });
    const previous = mod.blocks[i - 1], next = mod.blocks[i + 1];
    section.append(h('nav', { class: 'block-nav', 'aria-label': `เปลี่ยนหัวข้อจาก ${b.title}` },
      previous ? h('a', { href: `#${previous.id}` }, '← ก่อนหน้า') : h('a', { href: 'index.html' }, '← หน้ารวม'),
      next ? h('a', { href: `#${next.id}` }, 'หัวข้อถัดไป →') : h('a', { href: 'index.html' }, 'กลับหน้ารวม →')));
    app.append(section);
  }
  function activate(blockId, scroll = false) {
    if (!links.has(blockId)) return;
    store.setLastVisited(id, blockId);
    for (const [key, link] of links) {
      if (key === blockId) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    if (scroll) document.getElementById(blockId).scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  const hashId = () => { try { return decodeURIComponent(location.hash.slice(1)); } catch { return ''; } };
  window.addEventListener('hashchange', () => activate(hashId(), true));
  const target = links.has(hashId()) ? hashId() : mod.blocks.find((b) => !store.isDone(id, b.id))?.id || mod.blocks[0].id;
  activate(target, true);
  // Save a settled reading position, not intermediate blocks crossed by anchor navigation.
  let scrollTimer;
  function rememberVisible() {
    const tocRect = toc.getBoundingClientRect();
    if (tocRect.bottom > 76 && tocRect.top < innerHeight) return;
    const sections = mod.blocks.map((b) => ({ id: b.id, rect: document.getElementById(b.id).getBoundingClientRect() }));
    const current = sections.find((b) => b.rect.top <= 120 && b.rect.bottom > 120)
      || sections.find((b) => b.rect.top >= 76 && b.rect.top < innerHeight * .6);
    if (current) activate(current.id);
  }
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(rememberVisible, 200);
  }, { passive: true });
  update();
}
main();
