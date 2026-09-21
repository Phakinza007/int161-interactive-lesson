const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

const IMPORT_RE = /^[ \t]*import\s+(?:([^'";]+?)\s+from\s+)?(['"])([^'"\n]+)\2[ \t]*;?/gm;

function importToCode(clause, spec, n) {
  const load = `await __import(${JSON.stringify(spec)})`;
  if (!clause) return `${load};`;
  const tmp = `__m${n}`;
  const out = [`const ${tmp} = ${load};`];
  let rest = clause.trim();
  if (!rest.startsWith('{') && !rest.startsWith('*')) {
    const d = rest.match(/^([\w$]+)\s*(?:,\s*)?([\s\S]*)$/);
    out.push(`const ${d[1]} = ${tmp}.default;`);
    rest = d[2].trim();
  }
  if (rest.startsWith('*')) {
    const nm = rest.match(/^\*\s+as\s+([\w$]+)$/);
    if (!nm) throw new Error(`simulator ยังไม่รองรับ import รูปแบบนี้: ${clause}`);
    out.push(`const ${nm[1]} = ${tmp};`);
  } else if (rest.startsWith('{')) {
    const inner = rest.slice(1, rest.lastIndexOf('}'));
    const names = inner.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
      const [a, b] = s.split(/\s+as\s+/);
      return b ? `${a}: ${b}` : a;
    });
    out.push(`const { ${names.join(', ')} } = ${tmp};`);
  }
  return out.join(' ');
}

export function transformModule(source) {
  if (!/^[ \t]*(import|export)\s/m.test(source)) return { code: source, isESM: false };
  let n = 0;
  let code = source.replace(IMPORT_RE, (m, clause, _q, spec) =>
    importToCode(clause, spec, n++) + '\n'.repeat((m.match(/\n/g) || []).length));

  const tail = [];
  code = code
    .replace(/^[ \t]*export\s+default\s+(async\s+function|function|class)\s+([\w$]+)/gm, (m, kw, name) => {
      tail.push(`__exports.default = ${name};`);
      return `${kw} ${name}`;
    })
    .replace(/^[ \t]*export\s+default\s+/gm, '__exports.default = ')
    .replace(/^[ \t]*export\s+(async\s+function|function|class)\s+([\w$]+)/gm, (m, kw, name) => {
      tail.push(`__exports.${name} = ${name};`);
      return `${kw} ${name}`;
    })
    .replace(/^[ \t]*export\s+(const|let|var)\s+([\w$]+)/gm, (m, kw, name) => {
      tail.push(`__exports.${name} = ${name};`);
      return `${kw} ${name}`;
    })
    .replace(/^[ \t]*export\s*\{([^}]*)\}[ \t]*;?/gm, (m, inner) => {
      for (const part of inner.split(',').map((s) => s.trim()).filter(Boolean)) {
        const [a, b] = part.split(/\s+as\s+/);
        tail.push(`__exports.${b || a} = ${a};`);
      }
      return '\n'.repeat((m.match(/\n/g) || []).length);
    });

  const left = code.match(/^[ \t]*export\s.*$/m);
  if (left) throw new Error(`simulator ยังไม่รองรับ export รูปแบบนี้: ${left[0].trim()}`);
  return { code: code + '\n' + tail.join('\n'), isESM: true };
}

export function createLoader({ files, builtins = {}, globals = {} }) {
  const cache = new Map();
  const gNames = Object.keys(globals);
  const gVals = Object.values(globals);

  const isRelative = (s) => s.startsWith('./') || s.startsWith('../');
  const dirname = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
  const normalize = (p) => {
    const out = [];
    for (const seg of p.split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') out.pop(); else out.push(seg);
    }
    return out.join('/');
  };
  const withDefault = (o) => ({ ...o, default: 'default' in o ? o.default : o });

  function builtin(spec) {
    const b = builtins[spec.replace(/^node:/, '')];
    if (!b) throw new Error(`simulator ยังไม่รองรับโมดูล '${spec}'`);
    return b;
  }

  function resolveUser(from, spec) {
    const base = normalize(dirname(from) + '/' + spec);
    for (const c of [base, base + '.js', base + '/index.js']) if (c in files) return c;
    throw new Error(`ไม่พบไฟล์ '${spec}' (import จาก ${from})`);
  }

  function record(path) {
    if (cache.has(path)) return cache.get(path);
    const { code, isESM } = transformModule(files[path]);
    const entry = { isESM, exports: {}, done: null };
    cache.set(path, entry);
    try {
      if (isESM) {
        const fn = new AsyncFunction(...gNames, '__import', '__exports', code);
        entry.done = fn(...gVals, (spec) => importSpec(path, spec), entry.exports).then(() => entry.exports);
      } else {
        const module = { exports: {} };
        const fn = new Function(...gNames, 'require', 'module', 'exports', code);
        fn(...gVals, (spec) => requireSync(path, spec), module, module.exports);
        entry.exports = module.exports;
        entry.done = Promise.resolve(entry.exports);
      }
    } catch (e) {
      cache.delete(path);
      throw e;
    }
    return entry;
  }

  async function importSpec(from, spec) {
    if (!isRelative(spec)) return withDefault(builtin(spec));
    const e = record(resolveUser(from, spec));
    const ex = await e.done;
    return e.isESM ? ex : withDefault(ex);
  }

  function requireSync(from, spec) {
    if (!isRelative(spec)) return builtin(spec);
    const e = record(resolveUser(from, spec));
    if (e.isESM) throw new Error('require() ใช้โหลดไฟล์ ESM ไม่ได้ — ให้ใช้ import แทน');
    return e.exports;
  }

  return {
    async runEntry(path) {
      if (!(path in files)) throw new Error(`ไม่พบไฟล์เริ่มต้น '${path}'`);
      const e = record(path);
      await e.done;
      return e.exports;
    },
  };
}
