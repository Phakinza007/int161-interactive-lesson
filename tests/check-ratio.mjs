import fs from 'node:fs';
import { EXPECTED, countBlocks, ratioPct, problemsFor } from '../js/ratio.js';

const requireAll = process.argv.includes('--all');
let failed = false;
for (const id of Object.keys(EXPECTED)) {
  const file = new URL(`../content/${id}.js`, import.meta.url);
  if (!fs.existsSync(file)) {
    console.log(`${id}: (not built yet)`);
    if (requireAll) failed = true;
    continue;
  }
  const mod = (await import(file.href)).default;
  const problems = problemsFor(id, mod.blocks);
  const pct = ratioPct(countBlocks(mod.blocks));
  console.log(`${id}: ${pct.concept}:${pct.experiment}:${pct.exercise}${problems.length ? '  FAIL' : '  ok'}`);
  for (const p of problems) console.log('  - ' + p);
  if (problems.length) failed = true;
}
process.exit(failed ? 1 : 0);
