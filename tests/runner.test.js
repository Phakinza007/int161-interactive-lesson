import test from 'node:test';
import assert from 'node:assert/strict';
import { runProject, formatArgs } from '../engine/runner.js';

const HELLO = `
const http = require('node:http');
const server = http.createServer((req, res) => {
  if (req.url === '/user') { res.writeHead(200, {'Content-Type': 'application/json'}); res.end(JSON.stringify({ name: 'John Doe' })); }
  else if (req.url === '/') { res.writeHead(200); res.end('Hello World'); }
  else { res.writeHead(404); res.end('Not Found'); }
});
server.listen(3000);
console.log('Server running at http://127.0.0.1:3000/');
`;

test('runs a CJS hello server and answers requests', async () => {
  const r = await runProject({ files: { 'app.js': HELLO }, entry: 'app.js' });
  assert.equal(r.ok, true);
  assert.equal(r.error, null);
  assert.deepEqual(r.logs, [{ level: 'log', text: 'Server running at http://127.0.0.1:3000/' }]);
  assert.equal((await r.session.request({ path: '/' })).text, 'Hello World');
  assert.deepEqual((await r.session.request({ path: '/user' })).json, { name: 'John Doe' });
  assert.equal((await r.session.request({ path: '/x' })).status, 404);
});

test('captures console levels', async () => {
  const r = await runProject({ files: { 'a.js': "console.info('i'); console.warn('w'); console.error('e'); console.log('l');" }, entry: 'a.js' });
  assert.deepEqual(r.logs.map((l) => l.level), ['info', 'warn', 'error', 'log']);
});

test('formatArgs: strings raw, objects as JSON, errors as name: message', () => {
  assert.equal(formatArgs(['a', 1, { x: 1 }]), 'a 1 {"x":1}');
  assert.equal(formatArgs([new TypeError('bad')]), 'TypeError: bad');
  assert.equal(formatArgs([undefined, null]), 'undefined null');
});

test('syntax error → ok false with SyntaxError', async () => {
  const r = await runProject({ files: { 'a.js': 'const = ;' }, entry: 'a.js' });
  assert.equal(r.ok, false);
  assert.equal(r.error.name, 'SyntaxError');
});

test('unsupported module → error message', async () => {
  const r = await runProject({ files: { 'a.js': "require('left-pad')" }, entry: 'a.js' });
  assert.equal(r.ok, false);
  assert.match(r.error.message, /ยังไม่รองรับโมดูล 'left-pad'/);
});

test('process.exit is not an error', async () => {
  const r = await runProject({ files: { 'a.js': 'process.exit(0);' }, entry: 'a.js' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.logs, [{ level: 'info', text: 'process.exit(0)' }]);
});

test('handler exception is logged as Uncaught and the request rejects', async () => {
  const src = "require('http').createServer(() => { throw new Error('boom'); }).listen(3000);";
  const r = await runProject({ files: { 'a.js': src }, entry: 'a.js' });
  await assert.rejects(r.session.request({}), /boom/);
  assert.deepEqual(r.logs, [{ level: 'error', text: 'Uncaught Error: boom' }]);
});

test('fixtures.fs feeds fs.readFileSync; missing file has code ENOENT', async () => {
  const src = "const fs = require('fs'); console.log(fs.readFileSync('a.txt','utf8')); try { fs.readFileSync('b.txt'); } catch (e) { console.log(e.code); }";
  const r = await runProject({ files: { 'a.js': src }, entry: 'a.js', fixtures: { fs: { 'a.txt': 'hi' } } });
  assert.deepEqual(r.logs.map((l) => l.text), ['hi', 'ENOENT']);
});

test('buildModules adds builtins', async () => {
  const r = await runProject({
    files: { 'a.js': "console.log(require('extra').v);" }, entry: 'a.js',
    buildModules: () => ({ extra: { v: 'ok' } }),
  });
  assert.deepEqual(r.logs.map((l) => l.text), ['ok']);
});
