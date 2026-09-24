import test from 'node:test';
import assert from 'node:assert/strict';
import { createNetwork } from '../engine/net-sim.js';
import { createNodeModules } from '../engine/node-sim.js';

const setup = (files = {}) => {
  const network = createNetwork();
  return { network, m: createNodeModules({ network, files }) };
};

test('http.createServer(handler).listen registers on the network', async () => {
  const { network, m } = setup();
  let listening = false;
  const server = m.http.createServer((req, res) => res.end('Hello World'));
  server.listen(3000, () => { listening = true; });
  const r = await network.request({ path: '/' });
  assert.equal(r.text, 'Hello World');
  await new Promise((r2) => setTimeout(r2, 5));
  assert.equal(listening, true);
  assert.equal(server.listening, true);
});

test('server.on("request") works when created without a handler', async () => {
  const { network, m } = setup();
  const server = m.http.createServer();
  server.on('request', (req, res) => res.end('via event'));
  server.listen(3000);
  assert.equal((await network.request({})).text, 'via event');
});

test('server.close removes the listener', async () => {
  const { network, m } = setup();
  const server = m.http.createServer((q, s) => s.end('x'));
  server.listen(3000);
  server.close();
  await assert.rejects(network.request({}), /listen/);
});

test('fs.readFileSync returns virtual file content', () => {
  const { m } = setup({ 'data.txt': 'hello' });
  assert.equal(m.fs.readFileSync('data.txt', 'utf8'), 'hello');
});

test('fs.readFileSync on a missing file throws ENOENT', () => {
  const { m } = setup();
  assert.throws(() => m.fs.readFileSync('test.txt'), (e) => {
    assert.equal(e.code, 'ENOENT');
    assert.equal(e.errno, -2);
    assert.equal(e.syscall, 'open');
    assert.equal(e.message, "ENOENT: no such file or directory, open 'test.txt'");
    return true;
  });
});

test('fs.promises.readFile and fs/promises.readFile', async () => {
  const { m } = setup({ 'data.txt': 'abc' });
  assert.equal(await m.fs.promises.readFile('data.txt', 'utf8'), 'abc');
  assert.equal(await m['fs/promises'].readFile('data.txt', 'utf8'), 'abc');
  await assert.rejects(m['fs/promises'].readFile('nope.txt'), (e) => e.code === 'ENOENT');
});

test('process.env exists and process.exit throws ProcessExit', () => {
  const { m } = setup();
  assert.deepEqual(m.process.env, {});
  assert.throws(() => m.process.exit(1), (e) => e.name === 'ProcessExit' && e.code === 1);
});

test('createServer(h1) then server.on("request", h2): both listeners run, h1 answers', async () => {
  const { network, m } = setup();
  const seen = [];
  const server = m.http.createServer((req, res) => { seen.push('h1'); res.end('from h1'); });
  server.on('request', () => { seen.push('h2'); });
  server.listen(3000);
  const r = await network.request({ path: '/' });
  assert.equal(r.text, 'from h1');
  assert.deepEqual(seen, ['h1', 'h2']);
});

test('async rejection from h1 still rejects the request when h2 exists', async () => {
  const network = createNetwork({ onError() {} });
  const m = createNodeModules({ network });
  const server = m.http.createServer(async () => { throw new Error('async boom'); });
  server.on('request', () => {});
  server.listen(3000);
  await assert.rejects(network.request({}), /async boom/);
});

test('ENOENT errors carry a short Node-like stack (no simulator internals)', () => {
  const { m } = setup();
  try { m.fs.readFileSync('test.txt'); } catch (e) {
    assert.match(e.stack, /^Error: ENOENT: no such file or directory, open 'test\.txt'\n    at Object\.readFileSync \(node:fs\)/);
    assert.ok(!/engine\/|node-sim/.test(e.stack));
  }
});
