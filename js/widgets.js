import { h } from './dom.js';

export const WIDGETS = {
  'eval-bars'(host, block) {
    const max = Math.max(...block.data.map((d) => d.pct));
    host.append(...block.data.map((d) => h('div', { class: 'evalrow' },
      h('span', { class: 'evallabel' }, d.label),
      h('span', { class: 'evalbar' }, h('span', { class: 'evalfill', style: `width:${(d.pct / max) * 100}%` })),
      h('strong', {}, `${d.pct}%`))));
  },

  'http-parts'(host) {
    const MSGS = {
      Request: [
        { part: 'Methods', text: 'GET /user HTTP/1.1' },
        { part: 'Headers', text: 'Host: localhost:3000' },
        { part: '', text: '' },
        { part: 'Body', text: '(ข้อมูลที่ส่งไปกับ request)' },
      ],
      Response: [
        { part: 'Status Line', text: 'HTTP/1.1 200 OK' },
        { part: 'Header', text: 'Content-Type: application/json' },
        { part: '', text: '' },
        { part: 'Message Body (Payload)', text: '{"name":"John Doe"}' },
      ],
    };
    const caption = h('div', { class: 'muted' }, 'กดชื่อส่วนเพื่อดูว่าอยู่ตรงไหนของข้อความ');
    const boxes = {};
    const chips = h('div', { class: 'chips' });
    for (const [kind, lines] of Object.entries(MSGS)) {
      const box = h('pre', { class: 'msg' }, h('div', { class: 'msg-title' }, `HTTP ${kind}`),
        lines.map((l) => h('div', { class: 'msgline', 'data-part': l.part }, l.text || ' ')));
      boxes[kind] = box;
      for (const l of lines.filter((x) => x.part)) {
        chips.append(h('button', { class: 'chip', onclick: () => {
          host.querySelectorAll('.msgline.hl').forEach((e) => e.classList.remove('hl'));
          box.querySelector(`[data-part="${l.part}"]`).classList.add('hl');
          caption.textContent = `${l.part} — ส่วนหนึ่งของ HTTP ${kind}; ในตัวอย่างนี้คือ: ${l.text}`;
        } }, `${kind}: ${l.part}`));
      }
    }
    host.append(chips, h('div', { class: 'msgs' }, boxes.Request, boxes.Response), caption);
  },

  'arch-tabs'(host, block) {
    const note = h('p', { class: 'muted' });
    const chain = h('div', { class: 'chain' });
    const tabs = h('div', { class: 'chips' });
    const show = (t, btn) => {
      tabs.querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', b === btn));
      note.textContent = t.note;
      chain.replaceChildren(...t.chain.flatMap((n, i) => {
        const node = h('span', { class: 'node' }, n);
        return i ? [h('span', { class: 'arrow' }, '→'), node] : [node];
      }));
    };
    block.data.forEach((t, i) => {
      const btn = h('button', { class: 'chip', onclick: (e) => show(t, e.currentTarget) }, t.name);
      tabs.append(btn);
      if (i === 0) show(t, btn);
    });
    host.append(tabs, note, chain);
  },

  'arch-flow'(host) {
    let mpa = 1;
    let ajax = 0;
    const mpaBox = h('div', { class: 'flowcol' });
    const spaBox = h('div', { class: 'flowcol' });
    const paint = () => {
      mpaBox.replaceChildren(h('h4', {}, 'MPA'), h('div', { class: 'big' }, mpa),
        h('div', { class: 'muted' }, 'ครั้งที่โหลดทั้งหน้าจาก server'));
      spaBox.replaceChildren(h('h4', {}, 'SPA'), h('div', { class: 'big' }, ajax),
        h('div', { class: 'muted' }, 'ครั้งที่ขอเฉพาะ JSON ผ่าน AJAX'),
        h('div', { class: 'muted' }, 'โหลด HTML/CSS/JS ครั้งแรก: 1 ครั้ง'));
    };
    paint();
    host.append(
      h('div', { class: 'actions' },
        h('button', { class: 'btn primary', onclick: () => { mpa++; ajax++; paint(); } }, 'คลิกลิงก์ไปหน้าอื่น'),
        h('button', { class: 'btn', onclick: () => { mpa = 1; ajax = 0; paint(); } }, 'เริ่มใหม่')),
      h('div', { class: 'flowgrid' }, mpaBox, spaBox));
  },

  'translator-sim'(host) {
    let mode = 'compile';
    let bad = false;
    let shown = 0;
    const PROGRAM = ['พิมพ์ "A"', 'พิมพ์ "B"', 'พิมพ์ "C"', 'พิมพ์ "D"'];
    const log = h('div', { class: 'output' });
    const code = h('pre', { class: 'msg' });
    const line = (i) => (bad && i === 2 ? 'พิมพ์ "C" +' : PROGRAM[i]);
    const steps = () => {
      const out = [];
      if (mode === 'compile') {
        out.push({ t: 'แปลทั้งโปรแกรมเป็น machine code ก่อนรัน' });
        if (bad) out.push({ t: '❌ แปลไม่ผ่านที่บรรทัด 3 — ยังไม่ได้รันอะไรเลย', err: true });
        else {
          out.push({ t: '✓ แปลสำเร็จ' });
          PROGRAM.forEach((_, i) => out.push({ t: `รัน → ${line(i)}` }));
        }
      } else {
        for (let i = 0; i < PROGRAM.length; i++) {
          out.push({ t: `แปลบรรทัด ${i + 1}: ${line(i)}` });
          if (bad && i === 2) { out.push({ t: '❌ error ที่บรรทัด 3 — หยุด (บรรทัด 1–2 รันไปแล้ว)', err: true }); break; }
          out.push({ t: `รัน → ${line(i)}` });
        }
      }
      return out;
    };
    const paint = () => {
      code.replaceChildren(...PROGRAM.map((_, i) => h('div', {}, `${i + 1}  ${line(i)}`)));
      log.replaceChildren(...steps().slice(0, shown).map((s) => h('div', { class: s.err ? 'log log-error' : 'log' }, s.t)));
    };
    const setMode = (m) => { mode = m; shown = 0; paint(); };
    host.append(
      h('div', { class: 'actions' },
        h('label', {}, h('input', { type: 'radio', name: 'tmode', checked: true, onchange: () => setMode('compile') }), ' Compilation  '),
        h('label', {}, h('input', { type: 'radio', name: 'tmode', onchange: () => setMode('interpret') }), ' Interpretation  '),
        h('label', {}, h('input', { type: 'checkbox', onchange: (e) => { bad = e.target.checked; shown = 0; paint(); } }), ' บรรทัด 3 มีข้อผิดพลาด')),
      code,
      h('div', { class: 'actions' },
        h('button', { class: 'btn primary', onclick: () => { if (shown < steps().length) { shown++; paint(); } } }, 'ขั้นถัดไป'),
        h('button', { class: 'btn', onclick: () => { shown = 0; paint(); } }, 'เริ่มใหม่')),
      log);
    paint();
  },
};
