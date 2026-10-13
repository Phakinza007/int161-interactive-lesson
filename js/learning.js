import { h } from './dom.js';

export function createLearningIntro(learning) {
  const host = h('div', { class: 'learning-intro' },
    h('p', { class: 'learning-context' }, h('strong', {}, 'เริ่มจากปัญหา · '), learning.context),
    h('aside', { class: 'teacher-note' }, h('strong', {}, 'อาจารย์เน้น'), h('p', {}, learning.emphasis),
      h('span', { class: 'muted' }, 'สรุปจากคาบเรียน · กิจกรรมและคำถามดัดแปลงเพื่อฝึก')));
  if (learning.misconception) host.append(h('details', { class: 'misconception' },
    h('summary', {}, 'จุดที่มักเข้าใจผิด'), h('p', {}, learning.misconception)));
  if (learning.prediction) {
    const p = learning.prediction;
    const feedback = h('p', { class: 'prediction-feedback', role: 'status' });
    const choices = h('div', { class: 'prediction-choices' });
    p.choices.forEach((choice, i) => {
      const button = h('button', { class: 'btn', type: 'button', 'aria-pressed': 'false', onclick: () => {
        for (const b of choices.children) b.setAttribute('aria-pressed', b === button ? 'true' : 'false');
        feedback.textContent = `${i === p.answer ? '✓ ทายถูก' : 'ลองทบทวน · คำตอบคือ ' + p.choices[p.answer]} — ${p.explanation}`;
      } }, choice);
      choices.append(button);
    });
    host.append(h('fieldset', { class: 'prediction' }, h('legend', {}, 'ก่อนลอง · ทายผล'), h('p', {}, p.question), choices, feedback,
      h('span', { class: 'muted' }, 'คำถามฝึกคิด ไม่รวมคะแนนความคืบหน้า · ลองรันเพื่อเทียบกับผลจริง')));
  }
  return host;
}

export function createLearningSteps(learning) {
  if (!learning.steps?.length) return null;
  return h('div', { class: 'learning-steps' }, h('h3', {}, 'ลองทีละขั้น'), h('ol', {}, learning.steps.map((s) => h('li', {}, s))));
}

export function createLearningReview(learning) {
  return h('div', { class: 'learning-review' },
    h('details', {}, h('summary', {}, 'หลังลอง · อธิบายสิ่งที่เกิดขึ้น'), h('p', {}, learning.takeaway)),
    h('details', { class: 'transcript-source' }, h('summary', {}, 'ที่มาจากคาบเรียน'),
      h('p', { class: 'muted' }, 'สรุปใจความจาก transcript และเทียบเนื้อหาเดิม ข้อความถอดเสียงที่คลาดเคลื่อนไม่ใช้เป็นคำอ้างตรง'),
      h('ul', {}, learning.references.map((r) => h('li', {}, `${r.date} · ${r.file} · ${r.locator}`)))));
}

export function createHintPanel(block) {
  const hints = [...(block.learning?.hints || []).map((text) => ({ text }))];
  if (block.hint) hints.push({ html: block.hint });
  if (!hints.length) return null;
  const content = h('div', { class: 'hint-steps' });
  let shown = 0;
  const reveal = h('button', { class: 'btn', type: 'button', onclick: () => {
    const hint = hints[shown++];
    content.append(h('div', { class: 'hint-step' }, h('strong', {}, `ขั้น ${shown} · `),
      hint.html ? h('span', { html: hint.html }) : hint.text));
    reveal.textContent = shown === hints.length ? 'เปิดคำใบ้ครบแล้ว' : `ขอคำใบ้ขั้น ${shown + 1}`;
    reveal.disabled = shown === hints.length;
  } }, 'ขอคำใบ้ขั้น 1');
  return h('details', { class: 'hint' }, h('summary', {}, 'คำใบ้ · เปิดทีละขั้น'), content, reveal);
}
