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

  'event-loop'(host) {
    let seq = 0;
    let queue = [];
    let loop = null;
    let threads = [];
    let done = [];
    let log = [];
    const lanes = h('div', { class: 'lanes' });
    const logBox = h('div', { class: 'output' });
    const say = (t) => { log.push(t); if (log.length > 8) log.shift(); };
    const label = (r) => `#${r.id} ${r.kind === 'blocking' ? 'blocking' : 'non-blocking'}`;
    const chips = (list) => list.map((r) => h('span', { class: `node ${r.kind}` }, label(r)));
    const lane = (title, list, note) => h('div', { class: 'lane' }, h('h4', {}, title), h('div', { class: 'chain' }, ...chips(list)), h('div', { class: 'muted' }, note));
    const paint = () => {
      lanes.replaceChildren(
        lane('Event Queue', queue, 'request เข้าคิวรอ'),
        lane('Event Loop', loop ? [loop] : [], 'ประมวลผลทีละตัว'),
        lane('Work Threads', threads, 'งาน blocking (file system, network, process)'),
        lane('ตอบกลับแล้ว', done.slice(-4), 'response ส่งกลับ client'));
      logBox.replaceChildren(...log.map((t) => h('div', { class: 'log' }, t)));
      if (!log.length) logBox.replaceChildren();
    };
    const add = (kind) => { const r = { id: ++seq, kind }; queue.push(r); say(`request ${label(r)} เข้า Event Queue`); paint(); };
    const tick = () => {
      if (loop) {
        const r = loop;
        if (r.kind === 'non-blocking' || r.phase === 'callback') {
          done.push(r); say(`Event Loop ส่ง response ของ ${label(r)} กลับ client`);
        } else {
          r.phase = 'threads'; threads.push(r); say(`${label(r)} เป็นงาน blocking → ส่งให้ Work Threads`);
        }
        loop = null;
      } else if (threads.length) {
        loop = threads.shift(); loop.phase = 'callback';
        say(`Work Thread ทำ ${label(loop)} เสร็จ → callback กลับเข้า Event Loop`);
      } else if (queue.length) {
        loop = queue.shift(); loop.phase = 'first';
        say(loop.kind === 'non-blocking'
          ? `Event Loop รับ ${label(loop)} — ง่ายพอ ประมวลผลเอง (เช่น I/O polling)`
          : `Event Loop รับ ${label(loop)} — ต้องใช้ทรัพยากรภายนอก`);
      } else {
        say('ไม่มี request ค้างอยู่');
      }
      if (log.length > 8) log.shift();
      paint();
    };
    host.append(
      h('div', { class: 'actions' },
        h('button', { class: 'btn', onclick: () => add('non-blocking') }, 'ส่ง request แบบ non-blocking'),
        h('button', { class: 'btn', onclick: () => add('blocking') }, 'ส่ง request แบบ blocking'),
        h('button', { class: 'btn primary', onclick: tick }, 'ขั้นถัดไป'),
        h('button', { class: 'btn', onclick: () => { queue = []; loop = null; threads = []; done = []; log = []; seq = 0; paint(); } }, 'เริ่มใหม่')),
      lanes, logBox);
    paint();
  },

  'url-anatomy'(host) {
    const PARTS = ['Protocol', 'Host (domain name)', 'Port', 'Application Context', 'Version', 'Resource', 'Parameter'];
    const RE = /^(\w+:\/\/)([^:/\s]+)(?::(\d+))?\/([^/\s]+)\/(v\d+)\/([^/\s]+)(?:\/(\S*))?$/;
    const input = h('input', { type: 'text', value: 'http://localhost:9999/restfulservices/v1/users/5', 'aria-label': 'URL', class: 'urlinput' });
    const out = h('div', {});
    const paint = () => {
      const m = RE.exec(input.value.trim());
      if (!m) {
        out.replaceChildren(h('p', { class: 'muted' }, 'รูปแบบที่ใช้: http://host:port/context/v1/resource/parameter เช่น http://localhost:9999/restfulservices/v1/users/5'));
        return;
      }
      const vals = m.slice(1, 8).map((v) => v ?? '');
      const rows = PARTS.map((p, i) => h('tr', { class: i >= 3 ? 'in-endpoint' : '' }, h('td', {}, p), h('td', {}, h('code', {}, vals[i] || '—'))));
      out.replaceChildren(
        h('table', { class: 'urltable' }, ...rows),
        h('p', { class: 'muted' }, `Restful Endpoint = ${vals.slice(3).filter(Boolean).join('/')} (ตั้งแต่ Application Context ไปจนจบ)`));
    };
    input.addEventListener('input', paint);
    host.append(input, out);
    paint();
  },

  'verb-quiz'(host, block) {
    const rows = block.data;
    const pick = (i) => {
      const others = rows.filter((_, j) => j !== i).map((r) => r.meaning);
      const opts = [rows[i].meaning, others[i % others.length], others[(i + 2) % others.length]];
      return [...new Set(opts)].sort((a, b) => (a < b ? -1 : 1));
    };
    let correct = 0;
    const answered = new Set();
    const score = h('div', { class: 'muted' });
    const paintScore = () => { score.textContent = `ตอบถูก ${correct}/${rows.length}`; };
    const list = rows.map((r, i) => {
      const fb = h('span', { class: 'fb' });
      const opts = pick(i).map((m) => h('button', { class: 'chip', onclick: () => {
        if (answered.has(i)) return;
        answered.add(i);
        const ok = m === r.meaning;
        if (ok) correct++;
        fb.textContent = ok ? '✓ ถูก' : `✗ ที่ถูกคือ: ${r.meaning}`;
        fb.className = 'fb ' + (ok ? 'ok' : 'bad');
        paintScore();
      } }, m));
      return h('div', { class: 'quizrow' }, h('div', {}, h('code', {}, `${r.verb} ${r.uri}`)), h('div', { class: 'chips' }, ...opts), fb);
    });
    paintScore();
    host.append(...list, score);
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
