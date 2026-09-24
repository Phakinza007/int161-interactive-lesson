export class SandboxTimeoutError extends Error {
  constructor() {
    super('โค้ดรันนานเกินไป (อาจมี loop ไม่จบ) — หยุดการทำงานแล้ว');
    this.name = 'SandboxTimeoutError';
  }
}

export function createSandbox({ timeoutMs = 3000, workerUrl = new URL('./worker.js', import.meta.url) } = {}) {
  let worker = null;
  let seq = 0;
  const pending = new Map();

  function terminate() {
    if (worker) worker.terminate();
    worker = null;
    for (const p of pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error('sandbox ถูกหยุดก่อนทำงานเสร็จ'));
    }
    pending.clear();
  }

  function spawn() {
    worker = new Worker(workerUrl, { type: 'module' });
    worker.onmessage = ({ data }) => {
      const p = pending.get(data.id);
      if (!p) return;
      clearTimeout(p.timer);
      pending.delete(data.id);
      if (data.ok) p.resolve(data.result);
      else p.reject(Object.assign(new Error(data.error.message), { name: data.error.name }));
    };
    worker.onerror = (ev) => {
      const msg = ev.message || 'worker error';
      for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error(msg)); }
      pending.clear();
    };
  }

  function call(type, body) {
    if (!worker) spawn();
    const id = ++seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new SandboxTimeoutError());
        terminate();
      }, timeoutMs);
      pending.set(id, { resolve, reject, timer });
      worker.postMessage({ id, type, ...body });
    });
  }

  return {
    run(payload) { terminate(); return call('run', { payload }); },
    check(payload, tests, codeChecks = []) { terminate(); return call('check', { payload, tests, codeChecks }); },
    request(req) { return call('request', { req }); },
    dispose: terminate,
  };
}
