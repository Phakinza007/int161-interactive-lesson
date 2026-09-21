const KEY = 'int161-progress-v1';

function defaultStorage() {
  try {
    const s = globalThis.localStorage;
    s.setItem('__t', '1');
    s.removeItem('__t');
    return s;
  } catch {
    return null;
  }
}

export function createStore(storage = defaultStorage()) {
  let mem = { done: {}, code: {} };

  function read() {
    if (!storage) return mem;
    try {
      const raw = storage.getItem(KEY);
      const v = raw ? JSON.parse(raw) : null;
      if (v && typeof v === 'object') return { done: v.done || {}, code: v.code || {} };
    } catch { /* fall through */ }
    return mem;
  }

  function write(data) {
    mem = data;
    if (!storage) return;
    try { storage.setItem(KEY, JSON.stringify(data)); } catch { /* memory only */ }
  }

  return {
    isDone: (m, b) => !!read().done[m]?.[b],
    markDone(m, b) {
      const d = read();
      (d.done[m] ||= {})[b] = true;
      write(d);
    },
    doneCount: (m) => Object.keys(read().done[m] || {}).length,
    getCode: (m, b) => read().code[`${m}/${b}`] || null,
    setCode(m, b, files) {
      const d = read();
      d.code[`${m}/${b}`] = files;
      write(d);
    },
    reset(m, b) {
      const d = read();
      delete d.code[`${m}/${b}`];
      write(d);
    },
  };
}
