import test from 'node:test';
import assert from 'node:assert/strict';
import { runProject } from '../engine/runner.js';

const run = async (src, extraFiles = {}, fixtures = { responseTimeoutMs: 60 }) => {
  const r = await runProject({ files: { 'app.js': src, ...extraFiles }, entry: 'app.js', fixtures });
  assert.equal(r.ok, true, r.error && `${r.error.name}: ${r.error.message}`);
  return r;
};
const HEAD = "import express from 'express';\nconst app = express();\n";
const req = (r, method, path, body, headers) => r.session.request({ method, path, body, headers });

test('basic route: res.json sets status 200, JSON content-type (charset), x-powered-by and content-length', async () => {
  const r = await run(HEAD + "app.get('/hello', (req, res) => { res.json({ message: 'hi' }); });\napp.listen(3000);");
  const x = await req(r, 'GET', '/hello');
  assert.equal(x.status, 200);
  assert.deepEqual(x.json, { message: 'hi' });
  assert.equal(x.headers['content-type'], 'application/json; charset=utf-8');
  assert.equal(x.headers['x-powered-by'], 'Express');
  assert.equal(x.headers['content-length'], String(Buffer.byteLength('{"message":"hi"}')));
});

test('the slide example: params, query, body via express.json()', async () => {
  const r = await run(HEAD + `app.use(express.json()); //midle-ware
app.put('/api/subjects/:id', (req, res) => {
    const {filter, page, size} = req.query;
    const id = req.params.id;
    const subject = req.body;
    subject.id = id;
    res.json([subject, {filter: filter, page: page, size: size}]);
});
app.listen(3000);`);
  const x = await req(r, 'PUT', '/api/subjects/5?filter=web&page=2&size=10', { code: 'INT 100' });
  assert.deepEqual(x.json, [{ code: 'INT 100', id: '5' }, { filter: 'web', page: '2', size: '10' }]);
});

test('req.query: repeated keys become arrays; req.params are URL-decoded', async () => {
  const r = await run(HEAD + "app.get('/u/:name', (req, res) => res.json({ q: req.query, name: req.params.name }));\napp.listen(3000);");
  const x = await req(r, 'GET', '/u/John%20Doe?a=1&a=2&b=x');
  assert.deepEqual(x.json, { q: { a: ['1', '2'], b: 'x' }, name: 'John Doe' });
});

test('res.send: string → text/html, object → JSON; res.sendStatus; res.set', async () => {
  const r = await run(HEAD + `app.get('/s', (req, res) => res.send('Welcome to the homepage!'));
app.get('/o', (req, res) => res.send({ a: 1 }));
app.get('/n', (req, res) => res.sendStatus(404));
app.get('/h', (req, res) => { res.set('X-Test', 'yes'); res.status(202).send('ok'); });
app.listen(3000);`);
  const s = await req(r, 'GET', '/s');
  assert.equal(s.text, 'Welcome to the homepage!');
  assert.equal(s.headers['content-type'], 'text/html; charset=utf-8');
  assert.deepEqual((await req(r, 'GET', '/o')).json, { a: 1 });
  const n = await req(r, 'GET', '/n');
  assert.equal(n.status, 404);
  assert.equal(n.text, 'Not Found');
  const h = await req(r, 'GET', '/h');
  assert.equal(h.status, 202);
  assert.equal(h.headers['x-test'], 'yes');
});

test('res.status(201) alone does not send (the request hangs); chaining .json() does', async () => {
  const r = await run(HEAD + "app.post('/a', (req, res) => { res.status(201); });\napp.post('/b', (req, res) => { res.status(201).json({ ok: true }); });\napp.listen(3000);");
  await assert.rejects(req(r, 'POST', '/a'), /res\.end/);
  const b = await req(r, 'POST', '/b');
  assert.equal(b.status, 201);
  assert.deepEqual(b.json, { ok: true });
});

test('Router mounted with app.use(path, router): params, baseUrl, originalUrl, "/" matches with or without trailing slash', async () => {
  const r = await run(HEAD + `const router = express.Router();
router.get('/', (req, res) => res.json({ list: true, base: req.baseUrl, url: req.url, original: req.originalUrl }));
router.get('/:id', (req, res) => res.json({ id: req.params.id, base: req.baseUrl, original: req.originalUrl }));
app.use('/api/subjects', router);
app.listen(3000);`);
  assert.deepEqual((await req(r, 'GET', '/api/subjects')).json, { list: true, base: '/api/subjects', url: '/', original: '/api/subjects' });
  assert.equal((await req(r, 'GET', '/api/subjects/')).json.list, true);
  assert.deepEqual((await req(r, 'GET', '/api/subjects/7')).json, { id: '7', base: '/api/subjects', original: '/api/subjects/7' });
  assert.equal((await req(r, 'GET', '/api/other')).status, 404);
});

test('paths are case-insensitive and ignore a trailing slash', async () => {
  const r = await run(HEAD + "app.get('/Subjects', (req, res) => res.send('ok'));\napp.listen(3000);");
  assert.equal((await req(r, 'GET', '/subjects')).text, 'ok');
  assert.equal((await req(r, 'GET', '/SUBJECTS/')).text, 'ok');
});

test('unmatched route → default 404 HTML "Cannot GET /nope"', async () => {
  const r = await run(HEAD + "app.get('/x', (req, res) => res.send('x'));\napp.listen(3000);");
  const g = await req(r, 'GET', '/nope?q=1');
  assert.equal(g.status, 404);
  assert.equal(g.headers['content-type'], 'text/html; charset=utf-8');
  assert.match(g.text, /<pre>Cannot GET \/nope<\/pre>/);
  assert.match((await req(r, 'POST', '/x')).text, /Cannot POST \/x/);
});

test('middleware order: runs before routes, next() continues, ending the response stops the chain', async () => {
  const r = await run(HEAD + `app.use((req, res, next) => { console.log(req.method, req.url); next(); });
app.use('/blocked', (req, res) => { res.status(403).json({ message: 'no' }); });
app.get('/blocked', (req, res) => res.send('never'));
app.get('/open', (req, res) => res.send('open'));
app.listen(3000);`);
  assert.equal((await req(r, 'GET', '/open')).text, 'open');
  assert.equal((await req(r, 'GET', '/blocked')).status, 403);
  assert.deepEqual(r.logs.map((l) => l.text), ['GET /open', 'GET /blocked']);
});

test('route with several handlers and arrays of handlers', async () => {
  const r = await run(HEAD + `const a = (req, res, next) => { req.tag = 'a'; next(); };
const b = (req, res, next) => { req.tag += 'b'; next(); };
app.get('/multi', [a, b], (req, res) => res.send(req.tag));
app.listen(3000);`);
  assert.equal((await req(r, 'GET', '/multi')).text, 'ab');
});

test('express.json: req.body is undefined without the parser or without a JSON body; invalid JSON → 400', async () => {
  const r = await run(HEAD + `app.post('/raw', (req, res) => res.json({ body: req.body === undefined ? 'undefined' : req.body }));
app.use(express.json());
app.post('/parsed', (req, res) => res.json({ body: req.body === undefined ? 'undefined' : req.body }));
app.listen(3000);`);
  assert.equal((await req(r, 'POST', '/raw', { a: 1 })).json.body, 'undefined'); // parser registered after this route
  assert.deepEqual((await req(r, 'POST', '/parsed', { a: 1 })).json.body, { a: 1 });
  assert.equal((await req(r, 'POST', '/parsed')).json.body, 'undefined');
  const bad = await req(r, 'POST', '/parsed', '{oops', { 'Content-Type': 'application/json' });
  assert.equal(bad.status, 400);
  assert.match(bad.text, /<pre>/);
});

test('errors: sync throw, next(err) and async rejection reach a 4-argument error handler (Express 5)', async () => {
  const r = await run(HEAD + `app.get('/sync', () => { throw new Error('sync boom'); });
app.get('/next', (req, res, next) => { const e = new Error('via next'); e.status = 409; next(e); });
app.get('/async', async () => { throw new Error('async boom'); });
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message, path: req.originalUrl });
});
app.listen(3000);`);
  assert.deepEqual((await req(r, 'GET', '/sync')).json, { error: 'sync boom', path: '/sync' });
  const n = await req(r, 'GET', '/next');
  assert.equal(n.status, 409);
  assert.deepEqual((await req(r, 'GET', '/async')).json, { error: 'async boom', path: '/async' });
});

test('an error handler declared BEFORE the routes does not catch their errors → default 500 page', async () => {
  const r = await run(HEAD + `app.use((err, req, res, next) => { res.status(500).json({ handled: true }); });
app.get('/boom', () => { throw new Error('kaboom'); });
app.listen(3000);`);
  const x = await req(r, 'GET', '/boom');
  assert.equal(x.status, 500);
  assert.match(x.text, /<pre>Error: kaboom/);
  assert.equal(x.headers['content-type'], 'text/html; charset=utf-8');
});

test('default error page uses err.status / err.statusCode; normal middleware is skipped after an error; error handlers are skipped without one', async () => {
  const r = await run(HEAD + `app.get('/a', () => { const e = new Error('nf'); e.statusCode = 404; throw e; });
app.get('/b', (req, res, next) => next(new Error('x')), (req, res) => res.send('skipped'));
app.get('/ok', (req, res) => res.send('fine'));
app.use((err, req, res, next) => { console.log('handler ran:', err.message); res.status(500).send('handled'); });
app.listen(3000);`);
  assert.equal((await req(r, 'GET', '/b')).text, 'handled');
  assert.equal((await req(r, 'GET', '/ok')).text, 'fine');
  assert.deepEqual(r.logs.map((l) => l.text), ['handler ran: x']);
  const r2 = await run(HEAD + "app.get('/a', () => { const e = new Error('nf'); e.statusCode = 404; throw e; });\napp.listen(3000);");
  assert.equal((await req(r2, 'GET', '/a')).status, 404);
});

test('an error handler that throws falls through to the next error handler / default page', async () => {
  const r = await run(HEAD + `app.get('/x', () => { throw new Error('first'); });
app.use((err, req, res, next) => { throw new Error('second'); });
app.use((err, req, res, next) => { res.status(500).json({ msg: err.message }); });
app.listen(3000);`);
  assert.deepEqual((await req(r, 'GET', '/x')).json, { msg: 'second' });
});

test('RegExp paths, all(), patch(), and req.get()', async () => {
  const r = await run(HEAD + `app.get(/^\\/ab+c$/, (req, res) => res.send('regex'));
app.all('/any', (req, res) => res.send(req.method));
app.patch('/p', (req, res) => res.send(req.get('x-token')));
app.listen(3000);`);
  assert.equal((await req(r, 'GET', '/abbbc')).text, 'regex');
  assert.equal((await req(r, 'DELETE', '/any')).text, 'DELETE');
  assert.equal((await req(r, 'PATCH', '/p', undefined, { 'X-Token': 'abc' })).text, 'abc');
});

test('listen callback runs before the run resolves; CommonJS require and named imports work', async () => {
  const r = await run(`const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('cjs'));
app.listen(3000, () => { console.log(\`Running at http://localhost:3000\`); });`);
  assert.deepEqual(r.logs.map((l) => l.text), ['Running at http://localhost:3000']);
  assert.equal((await req(r, 'GET', '/')).text, 'cjs');
  const r2 = await run("import express, { Router, json } from 'express';\nconsole.log(typeof Router, typeof json, typeof express);");
  assert.deepEqual(r2.logs.map((l) => l.text), ['function function function']);
});

test('unsupported features fail loudly', async () => {
  const r = await run(HEAD + "app.get('/x', (req, res, next) => next('route'));\napp.listen(3000);");
  const x = await req(r, 'GET', '/x');
  assert.equal(x.status, 500);
  assert.match(x.text, /next\(&#39;route&#39;\)/); // escaped like real Express error pages
  const r2 = await runProject({ files: { 'a.js': HEAD + "app.set('view engine', 'ejs');" }, entry: 'a.js' });
  assert.equal(r2.ok, false);
  assert.match(r2.error.message, /app\.set is not a function/);
});
