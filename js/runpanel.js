import { h } from './dom.js';
import { createEditor } from './editor.js';
import { createSandbox } from '../engine/sandbox.js';

export function createRunPanel({ block, moduleId, store, onDone }) {
  const sandbox = createSandbox();
  const names = Object.keys(block.files);
  const saved = store.getCode(moduleId, block.id) || {};
  const files = Object.fromEntries(names.map((n) => [n, saved[n] ?? block.files[n]]));
  let active = names[0];

  const editorHost = h('div', { class: 'editor-host' });
  const output = h('div', { class: 'output', 'aria-live': 'polite' });
  const reqBox = h('div', { class: 'reqbox', hidden: true });
  const testBox = h('div', { class: 'testbox' });
  const tabs = h('div', { class: 'filetabs', hidden: names.length < 2 });

  const editor = createEditor(editorHost, {
    value: files[active],
    onChange: (v) => { files[active] = v; store.setCode(moduleId, block.id, files); },
  });

  function renderTabs() {
    tabs.replaceChildren(...names.map((n) => h('button', {
      class: 'tab' + (n === active ? ' on' : ''),
      onclick: () => { active = n; editor.setValue(files[n]); renderTabs(); },
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

  const fail = (e) => output.replaceChildren(h('div', { class: 'log log-error' }, e.message));

  async function run() {
    reqBox.hidden = true;
    try {
      const r = await sandbox.run(payload());
      showLogs(r.logs, r.error);
      if (r.ok) {
        if (r.listening) buildRequestBox(); // only programs that started a server can be sent requests
        if (block.type === 'experiment') onDone();
      }
    } catch (e) { fail(e); }
  }

  function buildRequestBox() {
    const method = h('select', {}, ['GET', 'POST', 'PUT', 'DELETE'].map((m) => h('option', { value: m }, m)));
    const path = h('input', { type: 'text', value: '/', 'aria-label': 'path' });
    const body = h('textarea', { rows: 2, placeholder: 'request body (JSON) — ใช้กับ POST/PUT', spellcheck: 'false' });
    const result = h('pre', { class: 'response' });
    const send = h('button', { class: 'btn', onclick: async () => {
      let b;
      if (body.value.trim()) { try { b = JSON.parse(body.value); } catch { b = body.value; } }
      try {
        const r = await sandbox.request({ method: method.value, path: path.value, body: b });
        if (r.error) result.textContent = `Error: ${r.error}`;
        else {
          const { status, statusText, headers, text } = r.response;
          const head = Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n');
          result.textContent = `HTTP ${status} ${statusText}\n${head}${head ? '\n' : ''}\n${text}`;
        }
        if (r.logs) showLogs(r.logs);
      } catch (e) { result.textContent = e.message; }
    } }, 'ส่ง request');
    reqBox.replaceChildren(h('div', { class: 'muted' }, 'ตัวยิง request (จำลอง browser/Postman)'),
      h('div', { class: 'reqrow' }, method, path, send), body, result);
    reqBox.hidden = false;
  }

  async function check() {
    reqBox.hidden = true;
    try {
      const r = await sandbox.check(payload(), block.tests, block.codeChecks || []);
      showLogs(r.run.logs, r.run.error);
      const all = r.run.ok && r.results.length > 0 && r.results.every((t) => t.passed);
      const rows = r.results.map((t) => h('div', { class: 'test ' + (t.passed ? 'pass' : 'failed') },
        h('strong', {}, (t.passed ? '✓ ' : '✗ ') + t.name),
        t.checks.filter((c) => !c.ok).map((c) => h('div', { class: 'why' }, `${c.label}: ${c.message}`))));
      if (all) rows.push(h('div', { class: 'celebrate' }, 'ผ่านครบทุกข้อ 🎉'));
      testBox.replaceChildren(...rows);
      if (all) onDone();
    } catch (e) { fail(e); }
  }

  const solution = block.solution
    ? h('details', { class: 'solution' }, h('summary', {}, 'ดูเฉลย'), h('pre', {}, block.solution))
    : null;
  const hint = block.hint ? h('details', { class: 'hint' }, h('summary', {}, 'Hint'), h('div', { html: block.hint })) : null;

  return h('div', { class: 'runpanel' },
    tabs, editorHost,
    h('div', { class: 'actions' },
      h('button', { class: 'btn primary', onclick: run }, '▶ Run'),
      block.type === 'exercise' ? h('button', { class: 'btn primary', onclick: check }, '✓ ตรวจคำตอบ') : null,
      h('button', { class: 'btn', onclick: () => {
        store.reset(moduleId, block.id);
        for (const n of names) files[n] = block.files[n];
        editor.setValue(files[active]);
        output.replaceChildren(); testBox.replaceChildren(); reqBox.hidden = true;
      } }, 'Reset')),
    output, reqBox, testBox, hint, solution);
}
