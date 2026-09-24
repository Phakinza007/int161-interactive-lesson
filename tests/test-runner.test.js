import test from 'node:test';
import assert from 'node:assert/strict';
import { runTests, runCodeChecks, deepEqual } from '../engine/test-runner.js';

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
