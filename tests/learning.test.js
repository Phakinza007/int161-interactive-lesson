import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../js/store.js';
import { runTests } from '../engine/test-runner.js';

test('resume position persists without losing legacy code and completion', () => {
  let raw = JSON.stringify({ done: { w2: { intro: true } }, code: { 'w2/task': { 'app.js': 'saved' } } });
  const storage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  const store = createStore(storage);
  assert.equal(typeof store.setLastVisited, 'function');
  store.setLastVisited('w2', 'task');
  const reloaded = createStore(storage);
  assert.deepEqual(reloaded.getLastVisited(), { moduleId: 'w2', blockId: 'task' });
  assert.equal(reloaded.isDone('w2', 'intro'), true);
  assert.equal(reloaded.getCode('w2', 'task')['app.js'], 'saved');
  reloaded.markDone('w2', 'task');
  assert.deepEqual(reloaded.getLastVisited(), { moduleId: 'w2', blockId: 'task' });
});

test('HTTP checks expose expected and actual even on success', async () => {
  const session = { request: async () => ({ status: 200, text: 'Hello', headers: {} }) };
  const [result] = await runTests(session, [{ name: 'hello', steps: [{ request: { path: '/' }, expect: { status: 200, text: 'World' } }] }]);
  assert.equal(result.passed, false);
  assert.equal(result.checks[0].actual, 200);
  assert.equal(result.checks[0].expected, 200);
  assert.equal(result.checks[1].actual, '"Hello"');
  assert.equal(result.checks[1].expected, '"World"');
});
