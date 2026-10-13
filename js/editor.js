import { backendCompletions } from './completions.js';
let cmPromise = null;
function loadCodeMirror() {
  cmPromise ||= Promise.all([
    import('https://esm.sh/codemirror@6.0.2'),
    import('https://esm.sh/@codemirror/lang-javascript@6'),
    import('https://esm.sh/@codemirror/theme-one-dark@6'),
    import('https://esm.sh/@codemirror/autocomplete@6'),
  ]).then(([cm, js, dark, completion]) => ({ cm, js, dark, completion })).catch(() => null);
  return cmPromise;
}

function createTextarea(host, value, onChange) {
  const ta = document.createElement('textarea');
  ta.className = 'code-input';
  ta.spellcheck = false;
  ta.setAttribute('aria-label', 'โค้ด JavaScript');
  ta.setAttribute('autocapitalize', 'off');
  ta.value = value;
  ta.rows = Math.min(26, Math.max(6, value.split('\n').length + 1));
  ta.addEventListener('input', () => onChange(ta.value));
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
      onChange(ta.value);
    }
  });
  host.append(ta);
  return ta;
}

export function createEditor(host, { value = '', onChange = () => {} } = {}) {
  const ta = createTextarea(host, value, onChange);
  let view = null;

  loadCodeMirror().then((m) => {
    if (!m) { host.dataset.editor = 'fallback'; const note = document.createElement('p'); note.className = 'muted'; note.textContent = 'โหลด autocomplete ไม่สำเร็จ · ยังเขียนและ Run ได้ ลองรีโหลดเมื่อเชื่อมต่ออินเทอร์เน็ต'; host.append(note); return; } // CDN unavailable: keep the textarea
    const { EditorView, basicSetup } = m.cm;
    view = new EditorView({
      doc: ta.value,
      parent: host,
      extensions: [
        basicSetup,
        m.js.javascript(),
        m.js.javascriptLanguage.data.of({ autocomplete: backendCompletions }),
        m.js.javascriptLanguage.data.of({ autocomplete: m.completion.completeFromList([
          m.completion.snippetCompletion("app.get('${path}', (req, res) => {\n  res.json(${data});\n});", { label: 'express-route', type: 'function', detail: 'GET route' }),
          m.completion.snippetCompletion("import * as http from 'node:http';\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { 'Content-Type': 'text/plain' });\n  res.end('${Hello}');\n});\nserver.listen(3000);", { label: 'http-server', type: 'function', detail: 'HTTP server' }),
          m.completion.snippetCompletion("console.log(${value});", { label: 'clg', type: 'function', detail: 'console.log' }),
        ]) }),
        m.completion.autocompletion({ activateOnTyping: true }),
        EditorView.domEventHandlers({ keydown: (event, view) => {
          if (event.key === 'Tab' && m.completion.completionStatus(view.state) === 'active') {
            return m.completion.acceptCompletion(view);
          }
          return false;
        } }),
        EditorView.contentAttributes.of({ 'aria-label': 'โค้ด JavaScript', 'aria-description': 'Ctrl+Space แนะนำโค้ด Enter หรือ Tab เลือก Esc ปิด' }),
        m.dark.oneDark,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) { ta.value = u.state.doc.toString(); onChange(ta.value); }
        }),
      ],
    });
    ta.style.display = 'none';
    host.dataset.editor = 'codemirror';
  });

  return {
    getValue: () => (view ? view.state.doc.toString() : ta.value),
    setValue(v) {
      ta.value = v;
      if (view) view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: v } });
      else onChange(v);
    },
    focus: () => (view ? view.focus() : ta.focus()),
  };
}
