import test from 'node:test';
import assert from 'node:assert/strict';
import * as completions from '../js/completions.js';

test('completion source suggests response APIs for res and response aliases', () => {
  assert.equal(typeof completions.backendCompletions, 'function');
  for (const receiver of ['res', 'response']) {
    const text = receiver + '.sta';
    const context = { pos: text.length, explicit: false, matchBefore: (re) => {
      const match = text.match(new RegExp(re.source + '$'));
      return match ? { from: match.index, to: text.length, text: match[0] } : null;
    } };
    const result = completions.backendCompletions(context);
    assert.equal(result.from, receiver.length + 1);
    assert.ok(result.options.some((o) => o.label === 'status'));
    assert.ok(!result.options.some((o) => o.label === 'readFileSync'));
  }
});

test('unknown object receives no misleading backend members', () => {
  const text = 'anything.';
  const result = completions.backendCompletions({ pos: text.length, explicit: true, matchBefore: (re) => {
    const match = text.match(new RegExp(re.source + '$'));
    return match ? { from: match.index, text: match[0] } : null;
  } });
  assert.equal(result, null);
});
