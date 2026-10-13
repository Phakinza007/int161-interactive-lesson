import { createHintPanel } from './learning.js';
import { h } from './dom.js';
import { createEditor } from './editor.js';
import { createSandbox } from '../engine/sandbox.js';

export function createRunPanel({ block, moduleId, store, onDone }) {
  const sandbox = createSandbox();
  const names = Object.keys(block.files);
  const saved = store.getCode(moduleId, block.id) || {};
  const files = Object.fromEntries(names.map((n) => [n, saved[n] ?? block.files[n]]));
  let active = names[0];
  let busy = false;
  let switchingFile = false;
  let revision = 0;
  const state = h('div', { class: 'run-state muted', role: 'status' }, 'ยังไม่ได้ Run · แก้โค้ดแล้วกด Run');
  const consoleTitle = h('h3', { class: 'panel-title' }, 'Console');

  const editorHost = h('div', { class: 'editor-host' });
  const output = h('div', { class: 'output', 'aria-live': 'polite' });
  const reqBox = h('div', { class: 'reqbox', hidden: true });
  const testBox = h('div', { class: 'testbox', 'aria-live': 'polite' });
  const tabs = h('div', { class: 'filetabs', hidden: names.length < 2 });

  const editor = createEditor(editorHost, {
    value: files[active],
    onChange: (v) => { if (switchingFile) return; revision++; files[active] = v; store.setCode(moduleId, block.id, files);
      state.textContent = 'โค้ดเปลี่ยนแล้ว · กด Run ใหม่ก่อนส่ง request';
      reqBox.hidden = true;
      testBox.replaceChildren();
    },
  });

  function renderTabs() {
    tabs.replaceChildren(...names.map((n) => h('button', {
      class: 'tab' + (n === active ? ' on' : ''),
      onclick: () => { active = n; switchingFile = true; editor.setValue(files[n]); switchingFile = false; renderTabs(); },
    }, n)));
  }
  renderTabs();

  const payload = () => ({ files: { ...files }, entry: block.entry || names[0], fixtures: block.fixtures || {} });

  function showLogs(logs, error) {
    const lines = logs.map((l) => h('div', { class: `log log-${l.level}` }, l.text));
    if (error) lines.push(h('div', { class: 'log log-error' }, `${error.name}: ${error.message}`));
    output.replaceChildren(...lines);
    if (!logs.length && !error) output.append(h('div', { class: 'muted' }, '(ไม่มี output)'));
  }

  const fail = (e) => {
    state.textContent = 'รันไม่สำเร็จ · ดูข้อผิดพลาดใน Console';
    output.replaceChildren(h('div', { class: 'log log-error' }, e.message));
  };
  function setBusy(value, message) {
    busy = value;
    for (const button of actions.querySelectorAll('button')) button.disabled = value;
    if (message) state.textContent = message;
  }
  function showState(r) {
    state.textContent = !r.ok ? 'รันไม่สำเร็จ · ดูข้อผิดพลาดใน Console' : r.listening
      ? '● Server พร้อมแล้ว · ส่ง request เพื่อดู HTTP Response'
      : 'รันเสร็จแล้ว · โปรแกรมนี้ไม่ได้เปิด server';
  }

  async function run() {
    if (busy) return;
    setBusy(true, 'กำลังรัน…');
    const startedRevision = revision;
    testBox.replaceChildren();
    reqBox.hidden = true;
    try {
      const r = await sandbox.run(payload());
      showLogs(r.logs, r.error);
      if (revision !== startedRevision) { state.textContent = 'โค้ดเปลี่ยนระหว่างรัน · กด Run ใหม่'; return; }
      showState(r);
      if (r.ok) {
        if (r.listening) buildRequestBox(); // only programs that started a server can be sent requests
        if (block.type === 'experiment') onDone();
      }
    } catch (e) { fail(e); } finally { setBusy(false); }
  }

  function buildRequestBox() {
    const method = h('select', { 'aria-label': 'HTTP method' }, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => h('option', { value: m }, m)));
    const path = h('input', { type: 'text', value: '/', 'aria-label': 'path' });
    const body = h('textarea', { 'aria-label': 'Request body JSON', rows: 2, placeholder: 'request body (JSON) — ใช้กับ POST/PUT', spellcheck: 'false' });
    const result = h('pre', { class: 'response', 'aria-live': 'polite' }, 'ยังไม่มี response · กดส่ง request');
    const send = h('button', { class: 'btn', onclick: async () => {
      if (busy) return;
      let b;
      if (body.value.trim()) { try { b = JSON.parse(body.value); } catch { result.textContent = 'JSON ไม่ถูกต้อง · ตรวจเครื่องหมาย quote และ comma ใน request body'; return; } }
      setBusy(true, 'กำลังส่ง request…'); send.disabled = true;
      const startedRevision = revision;
      let requestFailed = false;
      try {
        const r = await sandbox.request({ method: method.value, path: path.value, body: b });
        if (r.error) result.textContent = `Error: ${r.error}`;
        else {
          const { status, statusText, headers, text } = r.response;
          const head = Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n');
          result.textContent = `HTTP ${status} ${statusText}\n${head}${head ? '\n' : ''}\n${text}`;
        }
        if (r.logs) showLogs(r.logs);
      } catch (e) { requestFailed = true; result.textContent = e.message; reqBox.hidden = true; } finally { setBusy(false); send.disabled = false; state.textContent = requestFailed ? 'ส่ง request ไม่สำเร็จ · กด Run เพื่อเริ่ม server ใหม่' : revision !== startedRevision ? 'โค้ดเปลี่ยนแล้ว · กด Run ใหม่ก่อนส่ง request' : 'Server พร้อมรับ request · แก้โค้ดแล้วต้อง Run ใหม่'; }
    } }, 'ส่ง request');
    reqBox.replaceChildren(h('h3', { class: 'panel-title' }, '2. ส่ง request'), h('p', { class: 'muted' }, 'จำลอง browser/Postman · เลือก method และ path'),
      h('div', { class: 'reqrow' }, method, path, send), body, h('h3', { class: 'panel-title' }, 'HTTP Response'), result);
    reqBox.hidden = false;
  }

  async function check() {
    if (busy) return;
    setBusy(true, 'กำลังตรวจคำตอบ…');
    const startedRevision = revision;
    testBox.replaceChildren();
    reqBox.hidden = true;
    try {
      const r = await sandbox.check(payload(), block.tests, block.codeChecks || [], block.vars || {});
      showLogs(r.run.logs, r.run.error);
      if (revision !== startedRevision) { state.textContent = 'โค้ดเปลี่ยนระหว่างตรวจ · ตรวจคำตอบใหม่อีกครั้ง'; return; }
      showState(r.run);
      if (r.run.ok && r.run.listening) buildRequestBox();
      const all = r.run.ok && r.results.length > 0 && r.results.every((t) => t.passed);
      const rows = r.results.map((t) => h('div', { class: 'test ' + (t.passed ? 'pass' : 'failed') },
        h('strong', {}, (t.passed ? '✓ ' : '✗ ') + t.name),
        t.checks.map((c) => h('div', { class: 'why' },
          h('div', {}, `${c.ok ? '✓' : '✗'} ${c.label}`),
          'expected' in c ? h('div', { class: 'comparison' },
            h('pre', {}, `Expected: ${c.expected}`), h('pre', {}, `Actual: ${c.actual}`)) : null,
          !c.ok && !('expected' in c) ? h('div', {}, c.message) : null))));
      if (!r.run.ok) rows.push(h('p', { class: 'why' }, 'โค้ดยังรันไม่สำเร็จ · แก้ข้อผิดพลาดใน Console แล้วตรวจอีกครั้ง'));
      else if (!all) rows.push(h('p', { class: 'why' }, 'ยังไม่ผ่านครบ · เปรียบเทียบ Expected/Actual และเปิดคำใบ้ด้านล่าง'));
      if (all) rows.push(h('div', { class: 'celebrate' }, 'ผ่านครบทุกข้อ 🎉'));
      testBox.replaceChildren(...rows);
      if (all) onDone();
    } catch (e) { fail(e); } finally { setBusy(false); }
  }

  const solution = block.solution
    ? h('details', { class: 'solution' }, h('summary', {}, 'ดูเฉลย'), h('pre', {}, block.solution))
    : null;
  const hint = createHintPanel(block);

  const actions = h('div', { class: 'actions' },
      h('button', { class: 'btn primary', onclick: run }, '▶ Run'),
      block.type === 'exercise' ? h('button', { class: 'btn primary', onclick: check }, '✓ ตรวจคำตอบ') : null,
      h('button', { class: 'btn', onclick: () => {
        store.reset(moduleId, block.id);
        for (const n of names) files[n] = block.files[n];
        editor.setValue(files[active]);
        sandbox.dispose();
        state.textContent = 'รีเซ็ตแล้ว · กด Run เพื่อเริ่มใหม่';
        output.replaceChildren(); testBox.replaceChildren(); reqBox.hidden = true;
      } }, 'Reset'));
  return h('div', { class: 'runpanel' },
    h('h3', { class: 'panel-title' }, '1. เขียนโค้ดและ Run'),
    h('p', { class: 'muted' }, 'Autocomplete: Ctrl+Space · Enter/Tab เลือก · Esc ปิด · ลองพิมพ์ res. หรือ app.'),
    tabs, editorHost, actions, state, consoleTitle, output, reqBox, testBox, hint, solution);
}
