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
