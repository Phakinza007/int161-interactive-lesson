export const EXPECTED = {
  w1: { concept: 12, experiment: 5, exercise: 3 },
  w2: { concept: 6, experiment: 6, exercise: 8 },
  w3: { concept: 7, experiment: 5, exercise: 8 },
  w4: { concept: 4, experiment: 5, exercise: 11 },
  w5: { concept: 6, experiment: 5, exercise: 9 },
  w6: { concept: 5, experiment: 5, exercise: 10 },
};

const TYPES = ['concept', 'experiment', 'exercise'];

export function countBlocks(blocks) {
  const c = { concept: 0, experiment: 0, exercise: 0 };
  for (const b of blocks) if (b.type in c) c[b.type]++;
  return c;
}

export function ratioPct(counts) {
  const total = TYPES.reduce((n, t) => n + counts[t], 0) || 1;
  return Object.fromEntries(TYPES.map((t) => [t, (counts[t] / total) * 100]));
}

export function problemsFor(id, blocks) {
  const problems = [];
  for (const b of blocks) {
    if (!TYPES.includes(b.type)) problems.push(`${id}: unknown block type '${b.type}'`);
  }
  const want = EXPECTED[id];
  if (!want) return [...problems, `${id}: no expected ratio defined`];
  const got = countBlocks(blocks);
  for (const t of TYPES) {
    if (got[t] !== want[t]) problems.push(`${id}: ${t} = ${got[t]}, expected ${want[t]}`);
  }
  return problems;
}
