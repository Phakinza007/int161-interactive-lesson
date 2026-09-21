export function createEditor(host, { value = '', onChange = () => {} } = {}) {
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
  return {
    getValue: () => ta.value,
    setValue(v) { ta.value = v; onChange(v); },
    focus: () => ta.focus(),
  };
}
