import test from 'node:test';
import assert from 'node:assert/strict';
import { runTests, runCodeChecks, resolveVars, deepEqual } from '../engine/test-runner.js';

const sessionOf = (routes) => ({
  request: async ({ method = 'GET', path = '/' }) => {
    const r = routes[`${method} ${path}`];
    if (!r) throw new Error('no route');
    return { headers: {}, text: '', json: undefined, ...r };
  },
});

test('deepEqual ignores key order', () => {
  assert.equal(deepEqual({ a: 1, b: [1, { c: 2 }] }, { b: [1, { c: 2 }], a: 1 }), true);
  assert.equal(deepEqual({ a: 1 }, { a: 1, b: 2 }), false);
  assert.equal(deepEqual([1], { 0: 1 }), false);
});

test('passing test: status, json, text, textIncludes, headers', async () => {
  const s = sessionOf({
    'GET /': { status: 200, text: 'Hello World', headers: { 'content-type': 'text/html' } },
    'GET /user': { status: 200, json: { name: 'John Doe' } },
  });
  const res = await runTests(s, [
    { name: 'root', steps: [{ request: { path: '/' }, expect: { status: 200, text: 'Hello World', textIncludes: 'World', headers: { 'Content-Type': 'text/html' } } }] },
    { name: 'user', steps: [{ request: { path: '/user' }, expect: { status: 200, json: { name: 'John Doe' } } }] },
  ]);
  assert.deepEqual(res.map((r) => r.passed), [true, true]);
});

test('failing checks explain got vs expected', async () => {
  const s = sessionOf({ 'GET /': { status: 500, text: 'oops', json: undefined } });
  const [r] = await runTests(s, [{ name: 't', steps: [{ request: { path: '/' }, expect: { status: 200, text: 'Hello' } }] }]);
  assert.equal(r.passed, false);
  const st = r.checks.find((c) => c.label.includes('status'));
  assert.equal(st.ok, false);
  assert.match(st.message, /ได้ 500 คาดหวัง 200/);
  assert.match(r.checks.find((c) => c.label.includes('text')).message, /oops/);
});

test('request failure is reported as a failed check, not a throw', async () => {
  const [r] = await runTests(sessionOf({}), [{ name: 't', steps: [{ request: { path: '/x' }, expect: { status: 200 } }] }]);
  assert.equal(r.passed, false);
  assert.match(r.checks[0].message, /ยิง request ไม่สำเร็จ: no route/);
});

test('multiple steps run in order and all must pass', async () => {
  const s = sessionOf({ 'GET /a': { status: 200 }, 'GET /b': { status: 404 } });
  const [r] = await runTests(s, [{ name: 'two', steps: [
    { request: { path: '/a' }, expect: { status: 200 } },
    { request: { path: '/b' }, expect: { status: 200 } },
  ] }]);
  assert.equal(r.passed, false);
  assert.deepEqual(r.checks.map((c) => c.ok), [true, false]);
});

test('textExcludes passes when the text lacks the word and fails when it has it', async () => {
  const s = sessionOf({ 'GET /': { status: 200, text: 'INT101 INT102' } });
  const [ok] = await runTests(s, [{ name: 'a', steps: [{ request: { path: '/' }, expect: { textExcludes: 'INT100' } }] }]);
  const [bad] = await runTests(s, [{ name: 'b', steps: [{ request: { path: '/' }, expect: { textExcludes: 'INT101' } }] }]);
  assert.equal(ok.passed, true);
  assert.equal(bad.passed, false);
  assert.match(bad.checks[0].message, /INT101/);
});

test('logIncludes checks console output; a test may have no steps', async () => {
  const s = { ...sessionOf({}), logs: [{ level: 'log', text: 'duplicate: false' }, { level: 'log', text: 'fresh: {"id":"X"}' }] };
  const [ok, bad] = await runTests(s, [
    { name: 'logs ok', steps: [], logIncludes: ['duplicate: false', 'fresh: {"id":"X"}'] },
    { name: 'logs bad', steps: [], logIncludes: ['duplicate: true'] },
  ]);
  assert.equal(ok.passed, true);
  assert.equal(bad.passed, false);
  assert.match(bad.checks[0].message, /duplicate: true/);
});

test('runCodeChecks: mustMatch default, mustMatch:false, comments ignored, file scoping', () => {
  const files = {
    'router.js': "// import * as repo from './repositories/x.js'\nimport * as service from './services/s.js';\n/* require('x') */",
    'other.js': "import * as repo from './repositories/x.js';",
  };
  const results = runCodeChecks(files, [
    { name: 'uses service', file: 'router.js', pattern: 'services/s\\.js' },
    { name: 'no repo in router', file: 'router.js', pattern: 'repositories/', mustMatch: false },
    { name: 'no require in router', file: 'router.js', pattern: 'require\\(', mustMatch: false },
  ]);
  assert.equal(results.length, 3); // one result row per check
  assert.deepEqual(results.map((r) => r.passed), [true, true, true]);
  const [bad] = runCodeChecks(files, [{ name: 'no repo in other', file: 'other.js', pattern: 'repositories/', mustMatch: false }]);
  assert.equal(bad.passed, false);
});

test('runCodeChecks without file searches every file; result shape matches runTests', () => {
  const [r] = runCodeChecks({ 'a.js': 'x.searchParams', 'b.js': '' }, [{ name: 'uses searchParams', pattern: 'searchParams' }]);
  assert.deepEqual(Object.keys(r), ['name', 'passed', 'checks']);
  assert.equal(r.passed, true);
  const [miss] = runCodeChecks({ 'a.js': '' }, [{ name: 'needs it', pattern: 'searchParams', message: 'ต้องใช้ searchParams' }]);
  assert.equal(miss.passed, false);
  assert.equal(miss.checks[0].message, 'ต้องใช้ searchParams');
});

test('jsonMatch is a subset match; jsonHasKeys checks presence; both fail on non-JSON bodies', async () => {
  const s = sessionOf({
    'GET /ok': { status: 200, json: { status: 'error', error: { code: 'X', message: 'm' }, timestamp: '2026' } },
    'GET /html': { status: 500, text: '<pre>x</pre>' },
  });
  const [a] = await runTests(s, [{ name: 'a', steps: [{ request: { path: '/ok' }, expect: { jsonMatch: { status: 'error', error: { code: 'X', message: 'm' } }, jsonHasKeys: ['timestamp'] } }] }]);
  assert.equal(a.passed, true);
  const [b] = await runTests(s, [{ name: 'b', steps: [{ request: { path: '/ok' }, expect: { jsonMatch: { status: 'success' }, jsonHasKeys: ['nope'] } }] }]);
  assert.equal(b.passed, false);
  assert.equal(b.checks.filter((c) => !c.ok).length, 2);
  const [c] = await runTests(s, [{ name: 'c', steps: [{ request: { path: '/html' }, expect: { jsonMatch: { a: 1 } } }] }]);
  assert.equal(c.passed, false);
  assert.match(c.checks[0].message, /ไม่ใช่ JSON/);
});

test('{{var}} in request path and body strings is filled from vars', async () => {
  const seen = [];
  const s = { request: async (r) => { seen.push(r); return { status: 200, headers: {}, text: '', json: undefined }; } };
  await runTests(s, [{ name: 't', steps: [{ request: { method: 'POST', path: '/api/{{studentId}}/x', body: { note: 'id={{studentId}}', n: 5 } }, expect: { status: 200 } }] }], { studentId: '123' });
  assert.equal(seen[0].path, '/api/123/x');
  assert.deepEqual(seen[0].body, { note: 'id=123', n: 5 });
});

test('a test that needs a missing var returns ONE failing result with the hint and sends no requests', async () => {
  let sent = 0;
  const s = { request: async () => { sent++; return { status: 200, headers: {}, text: '' }; } };
  const res = await runTests(s, [{ name: 't1', steps: [{ request: { path: '/api/{{studentId}}/x' }, expect: { status: 200 } }] }], {}, { studentId: 'ใส่รหัสนักศึกษาใน app.js' });
  assert.equal(res.length, 1);
  assert.equal(res[0].passed, false);
  assert.match(res[0].checks[0].message, /ใส่รหัสนักศึกษาใน app\.js/);
  assert.equal(sent, 0);
  // vars that no test uses do not block anything
  const ok = await runTests({ request: async () => ({ status: 200, headers: {}, text: '' }) }, [{ name: 't', steps: [{ request: { path: '/x' }, expect: { status: 200 } }] }], {}, {});
  assert.equal(ok[0].passed, true);
});

test('resolveVars reads the learner\'s own value with a regex, ignoring comments; empty or missing → undefined', () => {
  const spec = { studentId: { file: 'app.js', pattern: "STUDENT_ID\\s*=\\s*['\"](\\d+)['\"]" } };
  assert.deepEqual(resolveVars({ 'app.js': "const STUDENT_ID = '66011234';" }, spec), { studentId: '66011234' });
  assert.deepEqual(resolveVars({ 'app.js': "// const STUDENT_ID = '11111111';\nconst STUDENT_ID = '';" }, spec), { studentId: undefined });
  assert.deepEqual(resolveVars({ 'other.js': "const STUDENT_ID = '5';" }, spec), { studentId: undefined });
});

test('jsonMatch / jsonHasKeys accept dotted paths for nested values', async () => {
  const s = sessionOf({ 'GET /e': { status: 404, json: { status: 'error', error: { code: 'OFFICE_NOT_FOUND', message: "Office with code '99' was not found" }, data: { list: [1] } } } });
  const [ok] = await runTests(s, [{ name: 'ok', steps: [{ request: { path: '/e' }, expect: { jsonMatch: { status: 'error', 'error.code': 'OFFICE_NOT_FOUND' }, jsonHasKeys: ['error.message', 'data.list'] } }] }]);
  assert.equal(ok.passed, true);
  const [bad] = await runTests(s, [{ name: 'bad', steps: [{ request: { path: '/e' }, expect: { jsonMatch: { 'error.code': 'OTHER' }, jsonHasKeys: ['error.nope'] } }] }]);
  assert.equal(bad.passed, false);
  assert.equal(bad.checks.filter((c) => !c.ok).length, 2);
});
