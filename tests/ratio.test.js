import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPECTED, countBlocks, ratioPct, problemsFor } from '../js/ratio.js';

const mk = (c, e, x) => [
  ...Array(c).fill({ type: 'concept' }),
  ...Array(e).fill({ type: 'experiment' }),
  ...Array(x).fill({ type: 'exercise' }),
];

test('EXPECTED covers w1..w6 and each sums to 20', () => {
  assert.deepEqual(Object.keys(EXPECTED), ['w1', 'w2', 'w3', 'w4', 'w5', 'w6']);
  for (const v of Object.values(EXPECTED)) {
    assert.equal(v.concept + v.experiment + v.exercise, 20);
  }
});

test('countBlocks counts by type', () => {
  assert.deepEqual(countBlocks(mk(12, 5, 3)), { concept: 12, experiment: 5, exercise: 3 });
});

test('ratioPct returns percentages', () => {
  assert.deepEqual(ratioPct({ concept: 12, experiment: 5, exercise: 3 }), { concept: 60, experiment: 25, exercise: 15 });
});

test('problemsFor is empty when counts match', () => {
  assert.deepEqual(problemsFor('w1', mk(12, 5, 3)), []);
});

test('problemsFor reports mismatch and unknown type', () => {
  const p = problemsFor('w1', [...mk(11, 5, 3), { type: 'bogus' }]);
  assert.ok(p.some((s) => s.includes('concept')));
  assert.ok(p.some((s) => s.includes('bogus')));
});
