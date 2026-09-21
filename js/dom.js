export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

const LABELS = { concept: 'แนวคิด', experiment: 'ทดลอง', exercise: 'เขียนเอง' };

export function ratioBar(counts) {
  const total = counts.concept + counts.experiment + counts.exercise || 1;
  const pct = (n) => Math.round((n / total) * 100);
  const bar = h('div', { class: 'ratio-bar', role: 'img',
    'aria-label': Object.keys(LABELS).map((t) => `${LABELS[t]} ${pct(counts[t])}%`).join(' ') });
  for (const t of Object.keys(LABELS)) {
    bar.append(h('span', { class: `seg seg-${t}`, style: `flex-grow:${counts[t]}` }));
  }
  const legend = h('div', { class: 'ratio-legend' },
    Object.keys(LABELS).map((t) => h('span', { class: `dot-${t}` }, `${LABELS[t]} ${pct(counts[t])}%`)));
  return h('div', { class: 'ratio' }, bar, legend);
}
