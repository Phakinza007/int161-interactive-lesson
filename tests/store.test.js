import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../js/store.js';

const fakeStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

test('markDone / isDone / doneCount', () => {
  const s = createStore(fakeStorage());
  assert.equal(s.isDone('w1', 'c1'), false);
  s.markDone('w1', 'c1');
  s.markDone('w1', 'c2');
  s.markDone('w2', 'c1');
  assert.equal(s.isDone('w1', 'c1'), true);
  assert.equal(s.doneCount('w1'), 2);
});

test('code save / get / reset', () => {
  const s = createStore(fakeStorage());
  assert.equal(s.getCode('w1', 'x1'), null);
  s.setCode('w1', 'x1', { 'app.js': 'a' });
  assert.deepEqual(s.getCode('w1', 'x1'), { 'app.js': 'a' });
  s.reset('w1', 'x1');
  assert.equal(s.getCode('w1', 'x1'), null);
});

test('persists across store instances sharing storage', () => {
  const st = fakeStorage();
  createStore(st).markDone('w1', 'c1');
  assert.equal(createStore(st).isDone('w1', 'c1'), true);
});

test('works with no storage at all (memory only)', () => {
  const s = createStore(null);
  s.markDone('w1', 'c1');
  assert.equal(s.isDone('w1', 'c1'), true);
});

test('never throws when storage throws or holds garbage', () => {
  const bad = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() {} };
  const s = createStore(bad);
  s.markDone('w1', 'c1');
  assert.equal(s.isDone('w1', 'c1'), true);
  const junk = fakeStorage();
  junk.setItem('int161-progress-v1', '{not json');
  assert.equal(createStore(junk).isDone('w1', 'c1'), false);
});
