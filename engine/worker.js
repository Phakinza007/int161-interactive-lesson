import { runProject } from './runner.js';
import { runTests, runCodeChecks } from './test-runner.js';

let session = null;

const reply = (id, result) => self.postMessage({ id, ok: true, result });
const fail = (id, e) => self.postMessage({ id, ok: false, error: { name: e.name, message: e.message } });
const snapshot = (r) => ({ ok: r.ok, logs: r.logs.slice(), error: r.error });

self.onmessage = async ({ data }) => {
  const { id, type } = data;
  try {
    if (type === 'run') {
      const r = await runProject(data.payload);
      session = r.session;
      reply(id, snapshot(r));
    } else if (type === 'check') {
      const r = await runProject(data.payload);
      session = r.session;
      const codeResults = runCodeChecks(data.payload.files, data.codeChecks || []);
      const testResults = r.ok ? await runTests(session, data.tests) : [];
      const results = [...codeResults, ...testResults];
      reply(id, { run: snapshot(r), results });
    } else if (type === 'request') {
      if (!session) throw new Error('ยังไม่ได้ Run โค้ด');
      try {
        const response = await session.request(data.req);
        reply(id, { response, logs: session.logs.slice() });
      } catch (e) {
        reply(id, { error: e.message, logs: session.logs.slice() });
      }
    }
  } catch (e) {
    fail(id, e);
  }
};
