export function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => k in b && deepEqual(a[k], b[k]));
}

const show = (v) => {
  try { return JSON.stringify(v); } catch { return String(v); }
};

export async function runTests(session, tests) {
  const results = [];
  for (const t of tests) {
    const checks = [];
    for (const step of t.steps) {
      const label = `${step.request.method || 'GET'} ${step.request.path || '/'}`;
      const add = (what, ok, got, want) =>
        checks.push({ label: `${label} → ${what}`, ok, message: ok ? '' : `ได้ ${got} คาดหวัง ${want}` });
      let res;
      try {
        res = await session.request(step.request);
      } catch (e) {
        checks.push({ label, ok: false, message: `ยิง request ไม่สำเร็จ: ${e.message}` });
        continue;
      }
      const ex = step.expect || {};
      if ('status' in ex) add('status', res.status === ex.status, res.status, ex.status);
      if ('json' in ex) add('json', deepEqual(res.json, ex.json), show(res.json), show(ex.json));
      if ('text' in ex) add('text', res.text === ex.text, show(res.text), show(ex.text));
      if ('textIncludes' in ex) {
        add('text includes', res.text.includes(ex.textIncludes), show(res.text), `มีคำว่า ${show(ex.textIncludes)}`);
      }
      if ('textExcludes' in ex) {
        add('text excludes', !res.text.includes(ex.textExcludes), show(res.text), `ต้องไม่มีคำว่า ${show(ex.textExcludes)}`);
      }
      for (const [k, v] of Object.entries(ex.headers || {})) {
        const got = res.headers[k.toLowerCase()];
        add(`header ${k}`, got === v, show(got), show(v));
      }
    }
    if (t.logIncludes) {
      const lines = (session.logs || []).map((l) => l.text);
      for (const want of t.logIncludes) {
        const ok = lines.some((l) => l.includes(want));
        checks.push({ label: `console → ${want}`, ok, message: ok ? '' : `ไม่พบบรรทัดที่มี ${show(want)} ใน output (ได้: ${show(lines)})` });
      }
    }
    results.push({ name: t.name, passed: checks.every((c) => c.ok), checks });
  }
  return results;
}

const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

export function runCodeChecks(files, checks) {
  return checks.map((c) => {
    const sources = c.file ? [files[c.file] ?? ''] : Object.values(files);
    const re = new RegExp(c.pattern);
    const found = sources.some((src) => re.test(stripComments(src)));
    const mustMatch = c.mustMatch !== false;
    const ok = found === mustMatch;
    const fallback = mustMatch ? `ไม่พบ ${c.pattern} ในโค้ด` : `ไม่ควรมี ${c.pattern} ในโค้ด`;
    return { name: c.name, passed: ok, checks: [{ label: c.name, ok, message: ok ? '' : (c.message || fallback) }] };
  });
}
