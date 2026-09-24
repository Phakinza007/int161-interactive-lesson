import test from 'node:test';
import assert from 'node:assert/strict';
import { createNetwork } from '../engine/net-sim.js';

test('request reaches listening handler and returns status/text/json', async () => {
  const net = createNetwork();
  net.listen(3000, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ name: 'John Doe', url: req.url, method: req.method }));
  });
  const r = await net.request({ path: '/user' });
  assert.equal(r.status, 200);
  assert.equal(r.headers['content-type'], 'application/json');
  assert.deepEqual(r.json, { name: 'John Doe', url: '/user', method: 'GET' });
});

test('statusCode/setHeader/write/end accumulate', async () => {
  const net = createNetwork();
  net.listen(3000, (req, res) => {
    res.statusCode = 404;
    res.setHeader('X-A', '1');
    res.write('Not ');
    res.end('Found');
  });
  const r = await net.request({});
  assert.equal(r.status, 404);
  assert.equal(r.statusText, 'Not Found');
  assert.equal(r.text, 'Not Found');
  assert.equal(r.headers['x-a'], '1');
  assert.equal(r.json, undefined);
});

test('request body is streamed via data/end events', async () => {
  const net = createNetwork();
  net.listen(3000, (req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => res.end(raw));
  });
  const r = await net.request({ method: 'POST', path: '/x', body: { a: 1 } });
  assert.equal(r.text, '{"a":1}');
});

test('rejects when nothing is listening', async () => {
  const net = createNetwork();
  await assert.rejects(net.request({}), /listen/);
});

test('handler that throws rejects and reports via onError', async () => {
  const seen = [];
  const net = createNetwork({ onError: (e) => seen.push(e.message) });
  net.listen(3000, () => { throw new Error('boom'); });
  await assert.rejects(net.request({}), /boom/);
  assert.deepEqual(seen, ['boom']);
});

test('async handler rejection rejects the request', async () => {
  const net = createNetwork({ onError() {} });
  net.listen(3000, async () => { throw new Error('async boom'); });
  await assert.rejects(net.request({}), /async boom/);
});

test('handler that never ends times out', async () => {
  const net = createNetwork({ responseTimeoutMs: 20 });
  net.listen(3000, () => {});
  await assert.rejects(net.request({}), /res\.end/);
});

test('port option selects a specific server', async () => {
  const net = createNetwork();
  net.listen(3000, (q, s) => s.end('a'));
  net.listen(4000, (q, s) => s.end('b'));
  assert.equal((await net.request({ port: 3000 })).text, 'a');
  assert.equal((await net.request({ port: 4000 })).text, 'b');
  assert.equal((await net.request({})).text, 'b'); // last listener wins
});

test('request host header is localhost:<port> of the listening server', async () => {
  const net = createNetwork();
  net.listen(3000, (req, res) => res.end(req.headers.host));
  net.listen(4000, (req, res) => res.end(req.headers.host));
  assert.equal((await net.request({ port: 3000 })).text, 'localhost:3000');
  assert.equal((await net.request({})).text, 'localhost:4000');
});

test('after the first response timeout, later timeouts are much shorter (many unanswered tests stay fast)', async () => {
  const net = createNetwork({ responseTimeoutMs: 200 });
  net.listen(3000, () => {});
  const t0 = Date.now();
  await assert.rejects(net.request({}), /res\.end/);
  const first = Date.now() - t0;
  const t1 = Date.now();
  for (let i = 0; i < 5; i++) await assert.rejects(net.request({}), /res\.end/);
  const rest = Date.now() - t1;
  assert.ok(first >= 190, `first took ${first}ms`);
  assert.ok(rest < 400, `5 follow-ups took ${rest}ms`);
});
