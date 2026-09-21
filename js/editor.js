let cmPromise = null;
function loadCodeMirror() {
  cmPromise ||= Promise.all([
    import('https://esm.sh/codemirror@6.0.2'),
    import('https://esm.sh/@codemirror/lang-javascript@6'),
    import('https://esm.sh/@codemirror/theme-one-dark@6'),
  ]).then(([cm, js, dark]) => ({ cm, js, dark })).catch(() => null);
  return cmPromise;
}

function createTextarea(host, value, onChange) {
  const ta = document.createElement('textarea');
  ta.className = 'code-input';
  ta.spellcheck = false;
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
    if (!m) return; // CDN unavailable: keep the textarea
    const { EditorView, basicSetup } = m.cm;
    view = new EditorView({
      doc: ta.value,
      parent: host,
      extensions: [
        basicSetup,
        m.js.javascript(),
        m.dark.oneDark,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) { ta.value = u.state.doc.toString(); onChange(ta.value); }
        }),
      ],
    });
    ta.style.display = 'none';
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
