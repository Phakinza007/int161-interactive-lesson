import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const inventory = JSON.parse(fs.readFileSync(new URL('../docs/reviews/transcript-sources.json', import.meta.url), 'utf8'));
import { runProject } from '../engine/runner.js';
import { runTests } from '../engine/test-runner.js';

for (const id of ['w1', 'w2', 'w3', 'w4', 'w5', 'w6']) {
  const mod = (await import(`../content/${id}.js`)).default;
  test(`${id}: transcript activities have traceable sources and valid prediction choices`, () => {
    const enriched = mod.blocks.filter((b) => b.learning);
    assert.ok(enriched.length >= 3, 'at least three useful transcript activities per module');
    for (const b of enriched) {
      assert.ok(b.learning.context && b.learning.emphasis && b.learning.takeaway);
      assert.ok(b.learning.references.length);
      for (const ref of b.learning.references) {
        const source = inventory.sources.find((s) => s.file === ref.file);
        assert.ok(source, ref.file);
        assert.equal(ref.date, source.date);
        assert.ok(source.mappedModules.includes(id));
        assert.ok(ref.date && ref.locator);
      }
      const p = b.learning.prediction;
      if (p) {
        assert.ok(p.choices.length >= 2);
        assert.ok(Number.isInteger(p.answer) && p.answer >= 0 && p.answer < p.choices.length);
        assert.ok(p.explanation);
      }
    }
  });
}

test('W4 duplicate exercise proves server still handles a following request', async () => {
  const mod = (await import('../content/w4.js')).default;
  const b = mod.blocks.find((b) => b.id === 'x-business-dup');
  assert.ok(b.tests.some((t) => t.steps[0]?.expect.status === 409 && t.steps.length > 1));
  const files = { ...b.files, [Object.keys(b.files)[0]]: b.solution };
  const r = await runProject({ files, entry: b.entry, fixtures: b.fixtures });
  const results = await runTests(r.session, b.tests);
  assert.ok(results.every((t) => t.passed));
});
