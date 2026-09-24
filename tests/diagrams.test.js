import test from 'node:test';
import assert from 'node:assert/strict';
import { flow, sequence, stack } from '../js/diagrams.js';

const count = (s, re) => (s.match(re) || []).length;
const balanced = (svg) => ['svg', 'g', 'text', 'defs', 'marker'].every((t) => count(svg, new RegExp(`<${t}[\\s>]`, 'g')) === count(svg, new RegExp(`</${t}>`, 'g')));
const viewBox = (svg) => svg.match(/viewBox="0 0 (\d+) (\d+)"/).slice(1).map(Number);
const sane = (svg) => {
  assert.ok(svg.startsWith('<svg'), 'starts with <svg');
  assert.ok(balanced(svg), 'balanced tags');
  assert.ok(!/NaN|undefined|null/.test(svg), 'no NaN/undefined/null leaks');
  const [w, h] = viewBox(svg);
  assert.ok(w > 0 && h > 0);
};

test('flow: nodes, labelled edges, dashed edges, tones; text is HTML-escaped', () => {
  const svg = flow({
    title: 'Request cycle',
    nodes: [
      { id: 'a', label: 'Client', sub: 'Browser', col: 0, row: 0 },
      { id: 'b', label: 'Server <Node>', col: 1, row: 0, tone: 'concept' },
      { id: 'c', label: 'DB\nMySQL', col: 1, row: 1, tone: 'danger' },
    ],
    edges: [
      { from: 'a', to: 'b', label: 'GET /x?a=1&b=2' },
      { from: 'b', to: 'c' },
      { from: 'c', to: 'a', dashed: true, label: 'rows' },
    ],
  });
  sane(svg);
  assert.equal(count(svg, /class="dg-node/g), 3);
  assert.equal(count(svg, /class="dg-edge/g), 3);
  assert.match(svg, /dashed/);
  assert.match(svg, /Server &lt;Node&gt;/);
  assert.match(svg, /a=1&amp;b=2/);
  assert.match(svg, /<title>Request cycle<\/title>/);
  assert.match(svg, /t-danger/);
});

test('flow: opposite edges between the same two nodes do not overlap (offset lines)', () => {
  const svg = flow({
    nodes: [{ id: 'a', label: 'A', col: 0, row: 0 }, { id: 'b', label: 'B', col: 1, row: 0 }],
    edges: [{ from: 'a', to: 'b', label: 'req' }, { from: 'b', to: 'a', label: 'res', dashed: true }],
  });
  sane(svg);
  const ys = [...svg.matchAll(/class="dg-edge[^"]*" d="M[\d.]+ ([\d.]+) L/g)].map((m) => m[1]);
  assert.equal(ys.length, 2);
  assert.notEqual(ys[0], ys[1]);
});

test('flow: an edge that references an unknown node is an authoring error', () => {
  assert.throws(() => flow({ nodes: [{ id: 'a', label: 'A', col: 0, row: 0 }], edges: [{ from: 'a', to: 'zzz' }] }), /zzz/);
});

test('flow: elbow edges for nodes on different rows and columns', () => {
  const svg = flow({
    nodes: [{ id: 'a', label: 'A', col: 0, row: 0 }, { id: 'b', label: 'B', col: 2, row: 1 }],
    edges: [{ from: 'a', to: 'b', label: 'elbow' }],
  });
  sane(svg);
  assert.match(svg, /class="dg-edge[^"]*" d="M[\d.]+ [\d.]+ L[\d.]+ [\d.]+ L[\d.]+ [\d.]+"/); // 3 points
});

test('sequence: actors with lifelines and request/response arrows', () => {
  const svg = sequence({
    title: 'HTTP cycle',
    actors: [{ id: 'c', label: 'Browser' }, { id: 's', label: 'Server' }],
    steps: [
      { from: 'c', to: 's', label: 'GET /user HTTP/1.1' },
      { from: 's', to: 'c', label: '200 OK', dashed: true },
      { note: 'Browser renders the response', at: 'c' },
    ],
  });
  sane(svg);
  assert.equal(count(svg, /class="dg-life"/g), 2);
  assert.equal(count(svg, /class="dg-edge/g), 2);
  assert.match(svg, /GET \/user HTTP\/1\.1/);
  assert.match(svg, /Browser renders the response/);
  assert.throws(() => sequence({ actors: [{ id: 'c', label: 'C' }], steps: [{ from: 'c', to: 'x', label: 'm' }] }), /x/);
});

test('stack: layers with arrows and labels between them', () => {
  const svg = stack({
    title: 'Layers',
    layers: [
      { label: 'Controller', sub: 'HTTP', tone: 'concept' },
      { label: 'Service', sub: 'Business logic' },
      { label: 'Repository', tone: 'danger' },
    ],
    between: [{ down: 'call', up: 'error' }, { down: 'call', up: 'error', tone: 'danger' }],
  });
  sane(svg);
  assert.equal(count(svg, /class="dg-node/g), 3);
  assert.equal(count(svg, /class="dg-edge/g), 4); // two arrows per gap
  assert.match(svg, /Business logic/);
  assert.match(svg, />error</);
});

test('stack: side-by-side variants share the same builder (no between labels)', () => {
  const svg = stack({ layers: [{ label: 'Only' }] });
  sane(svg);
  assert.equal(count(svg, /class="dg-edge/g), 0);
});

test('sequence: a long note under an actor near the edge stays inside the canvas', () => {
  const svg = sequence({
    actors: [{ id: 'c', label: 'Client' }, { id: 's', label: 'Server' }],
    steps: [{ from: 'c', to: 's', label: 'x' }, { note: 'ข้อความโน้ตที่ยาวมากกว่าครึ่งความกว้างของ actor ซ้ายสุด', at: 'c' }],
  });
  const [w] = viewBox(svg);
  const m = svg.match(/class="dg-note" x="([\d.]+)"/);
  const x = Number(m[1]);
  const len = 'ข้อความโน้ตที่ยาวมากกว่าครึ่งความกว้างของ actor ซ้ายสุด'.length;
  assert.ok(x - (len * 6.2) / 2 >= 0, `note starts at ${x - (len * 6.2) / 2}`);
  assert.ok(x + (len * 6.2) / 2 <= w);
});

test('diagram svg keeps a readable minimum width (scrolls instead of shrinking to unreadable text)', () => {
  const big = flow({ nodes: [0, 1, 2, 3, 4].map((i) => ({ id: `n${i}`, label: `N${i}`, col: i, row: 0 })), edges: [] });
  const small = flow({ nodes: [{ id: 'a', label: 'A', col: 0, row: 0 }], edges: [] });
  assert.match(big, /min-width:520px/);
  assert.match(small, /min-width:\d+px/);
  assert.ok(Number(small.match(/min-width:(\d+)px/)[1]) < 520);
});
