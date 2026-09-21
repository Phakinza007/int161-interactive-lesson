import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EXPECTED, problemsFor } from '../js/ratio.js';
import { runProject } from '../engine/runner.js';
import { runTests } from '../engine/test-runner.js';

const firstFile = (b) => Object.keys(b.files)[0];

for (const id of Object.keys(EXPECTED)) {
  const url = new URL(`../content/${id}.js`, import.meta.url);
  if (!fs.existsSync(url)) continue;
  const mod = (await import(url.href)).default;

  test(`${id}: block counts match the spec table`, () => {
    assert.deepEqual(problemsFor(id, mod.blocks), []);
  });

  test(`${id}: ids are unique and every block has title + source`, () => {
    const ids = mod.blocks.map((b) => b.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const b of mod.blocks) {
      assert.ok(b.title, `${b.id} needs a title`);
      assert.ok(b.source, `${b.id} needs a source`);
    }
  });

  for (const b of mod.blocks.filter((x) => x.type === 'experiment' && x.files)) {
    test(`${id}/${b.id}: experiment code runs without crashing`, async () => {
      const r = await runProject({ files: b.files, entry: b.entry || firstFile(b), fixtures: b.fixtures });
      assert.equal(r.ok, true, r.error && r.error.message);
    });
  }

  for (const b of mod.blocks.filter((x) => x.type === 'exercise')) {
    const run = (files) => runProject({ files, entry: b.entry || firstFile(b), fixtures: b.fixtures });

    test(`${id}/${b.id}: starter code does NOT pass its own tests`, async () => {
      const r = await run(b.files);
      const results = r.ok ? await runTests(r.session, b.tests) : [];
      assert.ok(!results.length || results.some((t) => !t.passed), 'starter must fail at least one test');
    });

    if (b.solution) {
      test(`${id}/${b.id}: solution passes all tests`, async () => {
        const r = await run({ ...b.files, [firstFile(b)]: b.solution });
        assert.equal(r.ok, true, r.error && r.error.message);
        const results = await runTests(r.session, b.tests);
        for (const t of results) assert.ok(t.passed, `${t.name}: ${t.checks.filter((c) => !c.ok).map((c) => c.message).join('; ')}`);
      });
    }
  }
}
