# INT161 Interactive Lesson — Plan 1: Foundation + W1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the in-browser Node simulator core (network, `http`, `fs`, module loader, sandbox, test runner), the lesson UI shell + hub, and the complete W1 module (20 blocks: 12 concept / 5 experiment / 3 exercise).

**Architecture:** Static site (HTML + ES modules, no build step). User code runs inside a module Web Worker; the engine transforms ES-module/CommonJS source into async functions (no blob-URL imports, so the same loader is unit-testable under `node --test`). An in-memory network replaces real sockets. Lesson content is plain data in `content/wN.js`.

**Tech Stack:** Vanilla JS (ES modules), Web Workers, `node --test` (Node 26) for engine tests, CodeMirror 6 from a CDN (textarea fallback).

**Spec:** `docs/specs/2026-09-20-int161-interactive-lesson-design.md`

**Plan series:** Plan 1 (this) → Plan 2 W2+W3 → Plan 3 W4 (mysql-sim) → Plan 4 W5 (express-sim) → Plan 5 W6 (constraints + assignment self-check) → Plan 6 deploy. Each plan yields working software.

## Global Constraints

- Content uses only material from the W1–W6 slides/notes; no outside concepts, methods or commands (`files/CLAUDE.md`).
- Thai primary; technical terms stay English. No English mode.
- Every content block has a `source` (file + section).
- Each module has exactly 20 blocks; W1 = 12 concept / 5 experiment / 3 exercise (`js/ratio.js` `EXPECTED`, enforced by `tests/check-ratio.mjs`).
- Run timeout 3000 ms per sandbox call; unsupported modules/SQL fail with a clear Thai message, never silently.
- `localStorage` access always wrapped in try/catch; page must work without it.
- No student ID, password, or slide/video file is ever placed inside `interactive-lesson/`.
- Layout must work at phone width, no horizontal page scroll.
- Commit messages end with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

## Deviations from the spec (apply in Task 1, Step 6)

1. **Loader:** source-transform loader instead of blob-URL ES modules (blob imports are not supported by Node, so they cannot be unit-tested; one implementation serves browser and tests).
2. **Opening the site:** module workers and module scripts do not load from `file://`; the site is served by any static server (`python3 -m http.server`) or GitHub Pages. Spec §3 and §4.1 are amended.
3. **Git:** `git init` happens locally in `interactive-lesson/` at Task 1 (push still only at deploy, with confirmation).

## File Structure (Plan 1)

```
interactive-lesson/
  package.json  .gitignore
  index.html  lesson.html
  css/app.css
  js/ratio.js        block counting + expected table
  js/store.js        progress persistence (safe localStorage)
  js/app-hub.js      hub page controller
  js/app-lesson.js   lesson page controller (renders blocks, wires sandbox)
  js/render.js       block renderers (concept/experiment/exercise)
  js/editor.js       createEditor() textarea (+ CodeMirror in Task 10)
  engine/events.js       tiny EventEmitter
  engine/net-sim.js      in-memory network: listen() / request()
  engine/node-sim.js     http + fs modules
  engine/loader.js       transform + module loader (ESM/CJS)
  engine/runner.js       runProject() -> session
  engine/test-runner.js  runTests(session, tests)
  engine/worker.js       module worker wrapper
  engine/sandbox.js      main-thread Worker manager with timeout
  content/w1.js
  tests/*.test.js  tests/check-ratio.mjs
  docs/specs  docs/plans
```

---

### Task 1: Scaffold, ratio table, spec amendments

**Files:**
- Create: `package.json`, `.gitignore`, `js/ratio.js`, `tests/ratio.test.js`, `tests/check-ratio.mjs`
- Modify: `docs/specs/2026-09-20-int161-interactive-lesson-design.md` (§3, §4.1, §12)

**Interfaces:**
- Produces: `EXPECTED: Record<'w1'..'w6', {concept:number, experiment:number, exercise:number}>`, `countBlocks(blocks): {concept, experiment, exercise}`, `ratioPct(counts): {concept, experiment, exercise}` (percent numbers), `problemsFor(id, blocks): string[]` (empty = OK).

- [ ] **Step 1: Init repo and package files**

```bash
cd /Users/chawanpunya/Documents/School/sem1/INT161/interactive-lesson
git init -b main
```

`package.json`:
```json
{
  "name": "int161-interactive-lesson",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.js",
    "check-ratio": "node tests/check-ratio.mjs",
    "serve": "python3 -m http.server 8161"
  }
}
```

`.gitignore`:
```
node_modules/
.DS_Store
```

- [ ] **Step 2: Write the failing test** — `tests/ratio.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPECTED, countBlocks, ratioPct, problemsFor } from '../js/ratio.js';

const mk = (c, e, x) => [
  ...Array(c).fill({ type: 'concept' }),
  ...Array(e).fill({ type: 'experiment' }),
  ...Array(x).fill({ type: 'exercise' }),
];

test('EXPECTED covers w1..w6 and each sums to 20', () => {
  assert.deepEqual(Object.keys(EXPECTED), ['w1', 'w2', 'w3', 'w4', 'w5', 'w6']);
  for (const v of Object.values(EXPECTED)) {
    assert.equal(v.concept + v.experiment + v.exercise, 20);
  }
});

test('countBlocks counts by type', () => {
  assert.deepEqual(countBlocks(mk(12, 5, 3)), { concept: 12, experiment: 5, exercise: 3 });
});

test('ratioPct returns percentages', () => {
  assert.deepEqual(ratioPct({ concept: 12, experiment: 5, exercise: 3 }), { concept: 60, experiment: 25, exercise: 15 });
});

test('problemsFor is empty when counts match', () => {
  assert.deepEqual(problemsFor('w1', mk(12, 5, 3)), []);
});

test('problemsFor reports mismatch and unknown type', () => {
  const p = problemsFor('w1', [...mk(11, 5, 3), { type: 'bogus' }]);
  assert.ok(p.some((s) => s.includes('concept')));
  assert.ok(p.some((s) => s.includes('bogus')));
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test tests/ratio.test.js`
Expected: FAIL — `Cannot find module '../js/ratio.js'`

- [ ] **Step 4: Implement** — `js/ratio.js`

```js
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
```

- [ ] **Step 5: Run test, then add the CLI check**

Run: `node --test tests/ratio.test.js` → Expected: PASS (5 tests).

`tests/check-ratio.mjs`:
```js
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
```

Run: `node tests/check-ratio.mjs` → Expected: six `(not built yet)` lines, exit 0.

- [ ] **Step 6: Amend the spec**

In `docs/specs/2026-09-20-int161-interactive-lesson-design.md`:
- §3 first paragraph: replace "เปิดไฟล์ตรง ๆ หรือขึ้น GitHub Pages ได้" with "เสิร์ฟด้วย static server (`python3 -m http.server`) หรือ GitHub Pages (เปิดจาก `file://` ไม่ได้เพราะ module worker)".
- §4.1 bullet 1: replace "โหลดเป็น ES module ผ่าน blob URL" with "แปลงซอร์ส ESM/CJS เป็นฟังก์ชัน async ด้วย loader ของเรา (ไม่ใช้ blob URL เพื่อให้เทสต์ใน Node ได้)".
- §12: replace "`git init` → push" with "(git init ในเครื่องทำไว้แล้วตั้งแต่ Plan 1) → push".

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold project, ratio table and amend spec" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: EventEmitter and in-memory network

**Files:**
- Create: `engine/events.js`, `engine/net-sim.js`, `tests/net-sim.test.js`

**Interfaces:**
- Produces:
  - `EventEmitter` with `on/once/off/emit` (same names as Node)
  - `createNetwork({onError?, responseTimeoutMs?}): { listen(port, handler), close(port), request(req): Promise<Response> }`
  - `req` argument: `{method?='GET', path?='/', headers?={}, body?, port?}`; object `body` is JSON-stringified and `content-type: application/json` set unless provided
  - `Response`: `{status:number, statusText:string, headers:Record<string,string>, text:string, json:any|undefined}`
  - handler is Node-style `(req, res)`; `req` is an EventEmitter with `method,url,headers` emitting `'data'` (string) then `'end'`; `res` has `statusCode, setHeader, getHeader, writeHead, write, end`

- [ ] **Step 1: Write the failing test** — `tests/net-sim.test.js`

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/net-sim.test.js`
Expected: FAIL — `Cannot find module '../engine/net-sim.js'`

- [ ] **Step 3: Implement** — `engine/events.js`

```js
export class EventEmitter {
  #h = new Map();
  on(name, fn) {
    if (!this.#h.has(name)) this.#h.set(name, []);
    this.#h.get(name).push(fn);
    return this;
  }
  once(name, fn) {
    const w = (...a) => { this.off(name, w); fn(...a); };
    return this.on(name, w);
  }
  off(name, fn) {
    this.#h.set(name, (this.#h.get(name) || []).filter((f) => f !== fn));
    return this;
  }
  emit(name, ...args) {
    const list = this.#h.get(name) || [];
    for (const f of [...list]) f(...args);
    return list.length > 0;
  }
}
```

`engine/net-sim.js`:
```js
import { EventEmitter } from './events.js';

const STATUS_TEXT = {
  200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized',
  403: 'Forbidden', 404: 'Not Found', 409: 'Conflict', 412: 'Precondition Failed',
  500: 'Internal Server Error', 503: 'Service Unavailable',
};

function createResponse(resolve, onEnd) {
  const res = new EventEmitter();
  const headers = {};
  const chunks = [];
  let ended = false;
  res.statusCode = 200;
  res.headersSent = false;
  res.setHeader = (k, v) => { headers[String(k).toLowerCase()] = String(v); return res; };
  res.getHeader = (k) => headers[String(k).toLowerCase()];
  res.writeHead = (code, h) => {
    res.statusCode = code;
    if (h) for (const [k, v] of Object.entries(h)) res.setHeader(k, v);
    return res;
  };
  res.write = (c) => { chunks.push(String(c)); return true; };
  res.end = (c) => {
    if (ended) return res;
    if (c !== undefined && c !== null) chunks.push(String(c));
    ended = true;
    res.headersSent = true;
    const text = chunks.join('');
    let json;
    try { json = JSON.parse(text); } catch { json = undefined; }
    onEnd();
    resolve({ status: res.statusCode, statusText: STATUS_TEXT[res.statusCode] || '', headers: { ...headers }, text, json });
    res.emit('finish');
    return res;
  };
  return res;
}

export function createNetwork({ onError = () => {}, responseTimeoutMs = 1500 } = {}) {
  const servers = new Map();
  return {
    listen(port, handler) { servers.set(port, handler); },
    close(port) { servers.delete(port); },
    request({ method = 'GET', path = '/', headers = {}, body, port } = {}) {
      const handler = port !== undefined ? servers.get(port) : [...servers.values()].pop();
      if (!handler) {
        return Promise.reject(new Error('ยังไม่มี server ที่ listen อยู่ (ต้องเรียก server.listen(...) ก่อน)'));
      }
      const reqHeaders = { host: 'localhost' };
      for (const [k, v] of Object.entries(headers)) reqHeaders[k.toLowerCase()] = String(v);
      let payload = body;
      if (payload !== undefined && typeof payload !== 'string') {
        payload = JSON.stringify(payload);
        if (!reqHeaders['content-type']) reqHeaders['content-type'] = 'application/json';
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('handler ไม่ได้เรียก res.end() ภายในเวลาที่กำหนด')),
          responseTimeoutMs,
        );
        const fail = (err) => { clearTimeout(timer); onError(err); reject(err); };
        const req = new EventEmitter();
        req.method = String(method).toUpperCase();
        req.url = path;
        req.headers = reqHeaders;
        const res = createResponse(resolve, () => clearTimeout(timer));
        try {
          const r = handler(req, res);
          if (r && typeof r.then === 'function') r.catch(fail);
        } catch (e) { fail(e); return; }
        setTimeout(() => {
          if (payload) req.emit('data', payload);
          req.emit('end');
        }, 0);
      });
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/net-sim.test.js`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(engine): in-memory network and event emitter" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

### Task 3: Node built-in simulation (`http`, `fs`, `process`)

**Files:**
- Create: `engine/node-sim.js`, `tests/node-sim.test.js`

**Interfaces:**
- Consumes: `createNetwork()` from Task 2 (`network.listen(port, handler)`, `network.close(port)`), `EventEmitter`.
- Produces: `createNodeModules({ network, files?: Record<string,string> }): Record<string, object>` whose keys are builtin specifiers **without** the `node:` prefix: `http`, `fs`, `fs/promises`, `process`. The loader (Task 4) strips `node:` before lookup.
  - `http.createServer(handler?) → server` with `server.listen(port, ...rest)` (calls the function argument, if any, asynchronously), `server.close(cb?)`, `server.on('request', fn)`, `server.listening`
  - `fs.readFileSync(path, enc?)`, `fs.promises.readFile(path, enc?)`, `fs/promises.readFile`: return the string from `files`; missing path throws an Error with `code:'ENOENT'`, `errno:-2`, `syscall:'open'`, `path`, message `ENOENT: no such file or directory, open '<path>'`. Buffers are not simulated (strings only).
  - `process`: `{ env: {}, argv: ['node','app.js'], exit(code) }`; `exit` throws an Error named `ProcessExit` with `.code`.

- [ ] **Step 1: Write the failing test** — `tests/node-sim.test.js`

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/node-sim.test.js`
Expected: FAIL — `Cannot find module '../engine/node-sim.js'`

- [ ] **Step 3: Implement** — `engine/node-sim.js`

```js
import { EventEmitter } from './events.js';

class Server extends EventEmitter {
  #handler = null;
  #port = null;
  #network;
  listening = false;
  constructor(network, handler) {
    super();
    this.#network = network;
    this.#handler = handler || null;
  }
  on(name, fn) {
    if (name === 'request') { this.#handler = fn; return this; }
    return super.on(name, fn);
  }
  listen(port, ...rest) {
    this.#port = port;
    this.#network.listen(port, (req, res) => this.#handler && this.#handler(req, res));
    this.listening = true;
    const cb = rest.find((a) => typeof a === 'function');
    if (cb) setTimeout(cb, 0);
    return this;
  }
  close(cb) {
    if (this.#port !== null) this.#network.close(this.#port);
    this.listening = false;
    if (typeof cb === 'function') setTimeout(cb, 0);
    return this;
  }
}

function enoent(path) {
  const e = new Error(`ENOENT: no such file or directory, open '${path}'`);
  e.code = 'ENOENT';
  e.errno = -2;
  e.syscall = 'open';
  e.path = path;
  return e;
}

export function createNodeModules({ network, files = {} }) {
  const readFileSync = (path) => {
    if (!(path in files)) throw enoent(path);
    return files[path];
  };
  const readFile = async (path) => readFileSync(path);
  return {
    http: { createServer: (handler) => new Server(network, handler) },
    fs: { readFileSync, promises: { readFile } },
    'fs/promises': { readFile },
    process: {
      env: {},
      argv: ['node', 'app.js'],
      exit(code) {
        const e = new Error(`process.exit(${code ?? 0})`);
        e.name = 'ProcessExit';
        e.code = code ?? 0;
        throw e;
      },
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/node-sim.test.js`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(engine): simulate http, fs and process modules" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Module loader (ESM + CommonJS from a virtual file map)

**Files:**
- Create: `engine/loader.js`, `tests/loader.test.js`

**Interfaces:**
- Consumes: builtin map shape from Task 3 (plain objects keyed without `node:`).
- Produces:
  - `transformModule(source): { code: string, isESM: boolean }` — throws `Error('simulator ยังไม่รองรับ export รูปแบบนี้: …')` for unsupported export forms
  - `createLoader({ files, builtins?, globals? }): { runEntry(path): Promise<exports> }`
    - `files`: `{ 'src/app.js': '<source>' }` (no leading `./`)
    - `globals`: names injected as function parameters into every module (e.g. `{ console, process }`)
  - Supported import forms: `import x from`, `import * as n from`, `import {a, b as c} from`, `import x, {a} from`, `import 'm'` (multi-line allowed). Supported exports: `export default <expr|function|class>`, `export function|async function|class|const|let|var <name>`, `export { a, b as c }`. Live bindings and re-exports (`export … from`) are not supported.
  - Errors: unknown bare module → `simulator ยังไม่รองรับโมดูล '<spec>'`; missing relative file → `ไม่พบไฟล์ '<spec>' (import จาก <path>)`; `require()` of an ESM file → `require() ใช้โหลดไฟล์ ESM ไม่ได้ — ให้ใช้ import แทน`

- [ ] **Step 1: Write the failing test** — `tests/loader.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createLoader, transformModule } from '../engine/loader.js';

const mk = (files, builtins = {}) => {
  const logs = [];
  const console = { log: (...a) => logs.push(a.join(' ')) };
  const loader = createLoader({ files, builtins, globals: { console, process: { env: {} } } });
  return { loader, logs };
};

test('CJS entry can require a builtin (node: prefix stripped)', async () => {
  const { loader, logs } = mk({ 'app.js': "const t = require('node:thing'); console.log(t.x);" }, { thing: { x: 42 } });
  await loader.runEntry('app.js');
  assert.deepEqual(logs, ['42']);
});

test('CJS assigns to a global-style variable without declaration (slides style)', async () => {
  const { loader, logs } = mk({ 'app.js': "http = require('node:http'); console.log(typeof http.createServer);" }, { http: { createServer() {} } });
  await loader.runEntry('app.js');
  assert.deepEqual(logs, ['function']);
});

test('ESM default, named and namespace imports between user files', async () => {
  const { loader, logs } = mk({
    'main.js': "import def, { a, b as c } from './lib.js';\nimport * as ns from './lib.js';\nconsole.log(def(), a, c, ns.a);",
    'lib.js': "export default function hi() { return 'hi'; }\nexport const a = 1;\nconst b = 2;\nexport { b };",
  });
  await loader.runEntry('main.js');
  assert.deepEqual(logs, ['hi 1 2 1']);
});

test('multi-line import and anonymous default export', async () => {
  const { loader, logs } = mk({
    'main.js': "import v, {\n  x,\n  y as z\n} from './m.js';\nconsole.log(v.n, x, z);",
    'm.js': 'export default { n: 5 };\nexport let x = 1;\nexport var y = 2;',
  });
  await loader.runEntry('main.js');
  assert.deepEqual(logs, ['5 1 2']);
});

test('top-level await works in ESM', async () => {
  const { loader, logs } = mk({ 'main.js': "import 'node:x';\nconst v = await Promise.resolve(7);\nconsole.log(v);" }, { x: {} });
  await loader.runEntry('main.js');
  assert.deepEqual(logs, ['7']);
});

test('relative resolution: .. , implicit .js and /index.js', async () => {
  const { loader, logs } = mk({
    'src/app.js': "import u from '../lib/util';\nimport s from './services';\nconsole.log(u, s);",
    'lib/util.js': "export default 'util';",
    'src/services/index.js': "export default 'services';",
  });
  await loader.runEntry('src/app.js');
  assert.deepEqual(logs, ['util services']);
});

test('ESM can import a CJS file (default = module.exports, named available)', async () => {
  const { loader, logs } = mk({
    'main.js': "import cjs, { k } from './c.js';\nconsole.log(cjs.k, k);",
    'c.js': 'module.exports = { k: 9 };',
  });
  await loader.runEntry('main.js');
  assert.deepEqual(logs, ['9 9']);
});

test('builtin imported by ESM: default is the module object, names are destructurable', async () => {
  const { loader, logs } = mk({ 'main.js': "import fs from 'node:fs';\nimport { readFileSync } from 'fs';\nconsole.log(fs.readFileSync === readFileSync);" }, { fs: { readFileSync() {} } });
  await loader.runEntry('main.js');
  assert.deepEqual(logs, ['true']);
});

test('unknown bare module gives a clear Thai message', async () => {
  const { loader } = mk({ 'main.js': "import x from 'left-pad';" });
  await assert.rejects(loader.runEntry('main.js'), /simulator ยังไม่รองรับโมดูล 'left-pad'/);
});

test('missing relative file gives a clear message', async () => {
  const { loader } = mk({ 'main.js': "import x from './nope.js';" });
  await assert.rejects(loader.runEntry('main.js'), /ไม่พบไฟล์ '\.\/nope\.js' \(import จาก main\.js\)/);
});

test('require() of an ESM file is rejected', async () => {
  const { loader } = mk({ 'a.js': "require('./b.js');", 'b.js': 'export const x = 1;' });
  await assert.rejects(loader.runEntry('a.js'), /require\(\) ใช้โหลดไฟล์ ESM ไม่ได้/);
});

test('unsupported export shape throws from transformModule', () => {
  assert.throws(() => transformModule('export const { a } = obj;'), /ยังไม่รองรับ export/);
});

test('plain script is not treated as ESM', () => {
  assert.equal(transformModule('const s = "import x from y";').isESM, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/loader.test.js`
Expected: FAIL — `Cannot find module '../engine/loader.js'`

- [ ] **Step 3: Implement** — `engine/loader.js`

```js
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

const IMPORT_RE = /^[ \t]*import\s+(?:([^'";]+?)\s+from\s+)?(['"])([^'"\n]+)\2[ \t]*;?/gm;

function importToCode(clause, spec, n) {
  const load = `await __import(${JSON.stringify(spec)})`;
  if (!clause) return `${load};`;
  const tmp = `__m${n}`;
  const out = [`const ${tmp} = ${load};`];
  let rest = clause.trim();
  if (!rest.startsWith('{') && !rest.startsWith('*')) {
    const d = rest.match(/^([\w$]+)\s*(?:,\s*)?([\s\S]*)$/);
    out.push(`const ${d[1]} = ${tmp}.default;`);
    rest = d[2].trim();
  }
  if (rest.startsWith('*')) {
    const nm = rest.match(/^\*\s+as\s+([\w$]+)$/);
    if (!nm) throw new Error(`simulator ยังไม่รองรับ import รูปแบบนี้: ${clause}`);
    out.push(`const ${nm[1]} = ${tmp};`);
  } else if (rest.startsWith('{')) {
    const inner = rest.slice(1, rest.lastIndexOf('}'));
    const names = inner.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
      const [a, b] = s.split(/\s+as\s+/);
      return b ? `${a}: ${b}` : a;
    });
    out.push(`const { ${names.join(', ')} } = ${tmp};`);
  }
  return out.join(' ');
}

export function transformModule(source) {
  if (!/^[ \t]*(import|export)\s/m.test(source)) return { code: source, isESM: false };
  let n = 0;
  let code = source.replace(IMPORT_RE, (m, clause, _q, spec) =>
    importToCode(clause, spec, n++) + '\n'.repeat((m.match(/\n/g) || []).length));

  const tail = [];
  code = code
    .replace(/^[ \t]*export\s+default\s+(async\s+function|function|class)\s+([\w$]+)/gm, (m, kw, name) => {
      tail.push(`__exports.default = ${name};`);
      return `${kw} ${name}`;
    })
    .replace(/^[ \t]*export\s+default\s+/gm, '__exports.default = ')
    .replace(/^[ \t]*export\s+(async\s+function|function|class)\s+([\w$]+)/gm, (m, kw, name) => {
      tail.push(`__exports.${name} = ${name};`);
      return `${kw} ${name}`;
    })
    .replace(/^[ \t]*export\s+(const|let|var)\s+([\w$]+)/gm, (m, kw, name) => {
      tail.push(`__exports.${name} = ${name};`);
      return `${kw} ${name}`;
    })
    .replace(/^[ \t]*export\s*\{([^}]*)\}[ \t]*;?/gm, (m, inner) => {
      for (const part of inner.split(',').map((s) => s.trim()).filter(Boolean)) {
        const [a, b] = part.split(/\s+as\s+/);
        tail.push(`__exports.${b || a} = ${a};`);
      }
      return '\n'.repeat((m.match(/\n/g) || []).length);
    });

  const left = code.match(/^[ \t]*export\s.*$/m);
  if (left) throw new Error(`simulator ยังไม่รองรับ export รูปแบบนี้: ${left[0].trim()}`);
  return { code: code + '\n' + tail.join('\n'), isESM: true };
}

export function createLoader({ files, builtins = {}, globals = {} }) {
  const cache = new Map();
  const gNames = Object.keys(globals);
  const gVals = Object.values(globals);

  const isRelative = (s) => s.startsWith('./') || s.startsWith('../');
  const dirname = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
  const normalize = (p) => {
    const out = [];
    for (const seg of p.split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') out.pop(); else out.push(seg);
    }
    return out.join('/');
  };
  const withDefault = (o) => ({ ...o, default: 'default' in o ? o.default : o });

  function builtin(spec) {
    const b = builtins[spec.replace(/^node:/, '')];
    if (!b) throw new Error(`simulator ยังไม่รองรับโมดูล '${spec}'`);
    return b;
  }

  function resolveUser(from, spec) {
    const base = normalize(dirname(from) + '/' + spec);
    for (const c of [base, base + '.js', base + '/index.js']) if (c in files) return c;
    throw new Error(`ไม่พบไฟล์ '${spec}' (import จาก ${from})`);
  }

  function record(path) {
    if (cache.has(path)) return cache.get(path);
    const { code, isESM } = transformModule(files[path]);
    const entry = { isESM, exports: {}, done: null };
    cache.set(path, entry);
    try {
      if (isESM) {
        const fn = new AsyncFunction(...gNames, '__import', '__exports', code);
        entry.done = fn(...gVals, (spec) => importSpec(path, spec), entry.exports).then(() => entry.exports);
      } else {
        const module = { exports: {} };
        const fn = new Function(...gNames, 'require', 'module', 'exports', code);
        fn(...gVals, (spec) => requireSync(path, spec), module, module.exports);
        entry.exports = module.exports;
        entry.done = Promise.resolve(entry.exports);
      }
    } catch (e) {
      cache.delete(path);
      throw e;
    }
    return entry;
  }

  async function importSpec(from, spec) {
    if (!isRelative(spec)) return withDefault(builtin(spec));
    const e = record(resolveUser(from, spec));
    const ex = await e.done;
    return e.isESM ? ex : withDefault(ex);
  }

  function requireSync(from, spec) {
    if (!isRelative(spec)) return builtin(spec);
    const e = record(resolveUser(from, spec));
    if (e.isESM) throw new Error('require() ใช้โหลดไฟล์ ESM ไม่ได้ — ให้ใช้ import แทน');
    return e.exports;
  }

  return {
    async runEntry(path) {
      if (!(path in files)) throw new Error(`ไม่พบไฟล์เริ่มต้น '${path}'`);
      const e = record(path);
      await e.done;
      return e.exports;
    },
  };
}
```

Note for the test "CJS assigns to a global-style variable": the slides write `http = require(...)` with no declaration. The CJS wrapper is a non-strict `new Function`, so the implicit global assignment works.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/loader.test.js`
Expected: PASS (13 tests). If "multi-line import" fails, check that the `IMPORT_RE` `[^'";]+?` clause spans newlines (it does, since `[^…]` matches `\n`).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(engine): ESM/CJS module loader over a virtual file map" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

### Task 5: Runner and test runner

**Files:**
- Create: `engine/runner.js`, `engine/test-runner.js`, `tests/runner.test.js`, `tests/test-runner.test.js`

**Interfaces:**
- Consumes: `createNetwork`, `createNodeModules`, `createLoader` (Tasks 2–4).
- Produces:
  - `runProject({ files, entry, fixtures?, buildModules? }): Promise<{ ok, logs, error, session }>`
    - `fixtures`: `{ fs?: Record<string,string> }` (later plans add `tables`)
    - `buildModules?: ({ network, fixtures, console }) => Record<string,object>` — extra builtins merged over the Node ones (used by later plans for `express` / `mysql2`)
    - `logs`: `Array<{ level:'log'|'info'|'warn'|'error', text:string }>` (same array instance is mutated by later activity, e.g. handler errors)
    - `error`: `null | { name, message, stack }`; a `process.exit()` is **not** an error (logs `process.exit(<code>)` at level `info`)
    - `session`: `{ request(req): Promise<Response>, network, logs }`
  - `formatArgs(args: any[]): string`
  - `runTests(session, tests): Promise<Array<{ name, passed, checks: Array<{ label, ok, message }> }>>`
    - test = `{ name, steps: [{ request: {method?,path?,headers?,body?}, expect?: { status?, json?, text?, textIncludes?, headers? } }] }`
  - `deepEqual(a, b): boolean` (key-order-insensitive)

- [ ] **Step 1: Write the failing tests**

`tests/runner.test.js`:
```js
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
```

`tests/test-runner.test.js`:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { runTests, deepEqual } from '../engine/test-runner.js';

const sessionOf = (routes) => ({
  request: async ({ method = 'GET', path = '/' }) => {
    const r = routes[`${method} ${path}`];
    if (!r) throw new Error('no route');
    return { headers: {}, text: '', json: undefined, ...r };
  },
});

test('deepEqual ignores key order', () => {
  assert.equal(deepEqual({ a: 1, b: [1, { c: 2 }] }, { b: [1, { c: 2 }], a: 1 }), true);
  assert.equal(deepEqual({ a: 1 }, { a: 1, b: 2 }), false);
  assert.equal(deepEqual([1], { 0: 1 }), false);
});

test('passing test: status, json, text, textIncludes, headers', async () => {
  const s = sessionOf({
    'GET /': { status: 200, text: 'Hello World', headers: { 'content-type': 'text/html' } },
    'GET /user': { status: 200, json: { name: 'John Doe' } },
  });
  const res = await runTests(s, [
    { name: 'root', steps: [{ request: { path: '/' }, expect: { status: 200, text: 'Hello World', textIncludes: 'World', headers: { 'Content-Type': 'text/html' } } }] },
    { name: 'user', steps: [{ request: { path: '/user' }, expect: { status: 200, json: { name: 'John Doe' } } }] },
  ]);
  assert.deepEqual(res.map((r) => r.passed), [true, true]);
});

test('failing checks explain got vs expected', async () => {
  const s = sessionOf({ 'GET /': { status: 500, text: 'oops', json: undefined } });
  const [r] = await runTests(s, [{ name: 't', steps: [{ request: { path: '/' }, expect: { status: 200, text: 'Hello' } }] }]);
  assert.equal(r.passed, false);
  const st = r.checks.find((c) => c.label.includes('status'));
  assert.equal(st.ok, false);
  assert.match(st.message, /ได้ 500 คาดหวัง 200/);
  assert.match(r.checks.find((c) => c.label.includes('text')).message, /oops/);
});

test('request failure is reported as a failed check, not a throw', async () => {
  const [r] = await runTests(sessionOf({}), [{ name: 't', steps: [{ request: { path: '/x' }, expect: { status: 200 } }] }]);
  assert.equal(r.passed, false);
  assert.match(r.checks[0].message, /ยิง request ไม่สำเร็จ: no route/);
});

test('multiple steps run in order and all must pass', async () => {
  const s = sessionOf({ 'GET /a': { status: 200 }, 'GET /b': { status: 404 } });
  const [r] = await runTests(s, [{ name: 'two', steps: [
    { request: { path: '/a' }, expect: { status: 200 } },
    { request: { path: '/b' }, expect: { status: 200 } },
  ] }]);
  assert.equal(r.passed, false);
  assert.deepEqual(r.checks.map((c) => c.ok), [true, false]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/runner.test.js tests/test-runner.test.js`
Expected: FAIL — cannot find `../engine/runner.js` / `../engine/test-runner.js`

- [ ] **Step 3: Implement** — `engine/test-runner.js`

```js
export function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => k in b && deepEqual(a[k], b[k]));
}

const show = (v) => {
  try { return JSON.stringify(v); } catch { return String(v); }
};

export async function runTests(session, tests) {
  const results = [];
  for (const t of tests) {
    const checks = [];
    for (const step of t.steps) {
      const label = `${step.request.method || 'GET'} ${step.request.path || '/'}`;
      const add = (what, ok, got, want) =>
        checks.push({ label: `${label} → ${what}`, ok, message: ok ? '' : `ได้ ${got} คาดหวัง ${want}` });
      let res;
      try {
        res = await session.request(step.request);
      } catch (e) {
        checks.push({ label, ok: false, message: `ยิง request ไม่สำเร็จ: ${e.message}` });
        continue;
      }
      const ex = step.expect || {};
      if ('status' in ex) add('status', res.status === ex.status, res.status, ex.status);
      if ('json' in ex) add('json', deepEqual(res.json, ex.json), show(res.json), show(ex.json));
      if ('text' in ex) add('text', res.text === ex.text, show(res.text), show(ex.text));
      if ('textIncludes' in ex) {
        add('text includes', res.text.includes(ex.textIncludes), show(res.text), `มีคำว่า ${show(ex.textIncludes)}`);
      }
      for (const [k, v] of Object.entries(ex.headers || {})) {
        const got = res.headers[k.toLowerCase()];
        add(`header ${k}`, got === v, show(got), show(v));
      }
    }
    results.push({ name: t.name, passed: checks.every((c) => c.ok), checks });
  }
  return results;
}
```

`engine/runner.js`:
```js
import { createNetwork } from './net-sim.js';
import { createNodeModules } from './node-sim.js';
import { createLoader } from './loader.js';

export function formatArgs(args) {
  return args.map((a) => {
    if (typeof a === 'string') return a;
    if (a instanceof Error) return `${a.name}: ${a.message}`;
    if (a !== null && typeof a === 'object') {
      try { return JSON.stringify(a); } catch { return String(a); }
    }
    return String(a);
  }).join(' ');
}

const describe = (e) => `${e.name}: ${e.message}`;

export async function runProject({ files, entry, fixtures = {}, buildModules }) {
  const logs = [];
  const level = (l) => (...args) => logs.push({ level: l, text: formatArgs(args) });
  const console = { log: level('log'), info: level('info'), warn: level('warn'), error: level('error'), debug: level('log') };
  const network = createNetwork({ onError: (e) => level('error')('Uncaught ' + describe(e)) });
  const node = createNodeModules({ network, files: fixtures.fs || {} });
  const builtins = { ...node, ...(buildModules ? buildModules({ network, fixtures, console }) : {}) };
  const session = { request: (req) => network.request(req), network, logs };
  const loader = createLoader({ files, builtins, globals: { console, process: node.process } });
  try {
    await loader.runEntry(entry);
    return { ok: true, logs, error: null, session };
  } catch (e) {
    if (e && e.name === 'ProcessExit') {
      level('info')(`process.exit(${e.code})`);
      return { ok: true, logs, error: null, session };
    }
    return { ok: false, logs, error: { name: e.name, message: e.message, stack: e.stack }, session };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all suites: ratio, net-sim, node-sim, loader, runner, test-runner)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(engine): project runner and request-based test runner" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Web Worker + sandbox with timeout (browser-verified)

**Files:**
- Create: `engine/worker.js`, `engine/sandbox.js`, `tests/sandbox-smoke.html`
- Modify: `/Users/chawanpunya/Documents/School/sem1/.claude/launch.json` (add a preview server)

**Interfaces:**
- Consumes: `runProject`, `runTests` (Task 5).
- Produces (`engine/sandbox.js`):
  - `createSandbox({ timeoutMs?=3000, workerUrl? }): { run(payload), request(req), check(payload, tests), dispose() }`
    - `payload` = the `runProject` argument object (`{files, entry, fixtures?}`; `buildModules` is chosen inside the worker by later plans via `payload.preset`)
    - `run(payload) → { ok, logs, error }` (starts a **fresh** worker each time)
    - `request(req) → { response?: Response, error?: string, logs }`
    - `check(payload, tests) → { run: {ok,logs,error}, results }` (fresh worker; runs code then tests)
    - all reject with `SandboxTimeoutError` (message `โค้ดรันนานเกินไป (อาจมี loop ไม่จบ) — หยุดการทำงานแล้ว`) when a call exceeds `timeoutMs`; the worker is terminated
  - Worker protocol: main → worker `{ id, type: 'run'|'request'|'check', ... }`; worker → main `{ id, ok:true, result }` or `{ id, ok:false, error:{ name, message } }`
- Note: worker `payload.preset` is reserved (unused in Plan 1) so later plans can select `buildModules` (`'express'`, `'mysql'`).

- [ ] **Step 1: Implement the worker** — `engine/worker.js`

```js
import { runProject } from './runner.js';
import { runTests } from './test-runner.js';

let session = null;

const reply = (id, result) => self.postMessage({ id, ok: true, result });
const fail = (id, e) => self.postMessage({ id, ok: false, error: { name: e.name, message: e.message } });
const snapshot = (r) => ({ ok: r.ok, logs: r.logs.slice(), error: r.error });

self.onmessage = async ({ data }) => {
  const { id, type } = data;
  try {
    if (type === 'run') {
      const r = await runProject(data.payload);
      session = r.session;
      reply(id, snapshot(r));
    } else if (type === 'check') {
      const r = await runProject(data.payload);
      session = r.session;
      const results = r.ok ? await runTests(session, data.tests) : [];
      reply(id, { run: snapshot(r), results });
    } else if (type === 'request') {
      if (!session) throw new Error('ยังไม่ได้ Run โค้ด');
      try {
        const response = await session.request(data.req);
        reply(id, { response, logs: session.logs.slice() });
      } catch (e) {
        reply(id, { error: e.message, logs: session.logs.slice() });
      }
    }
  } catch (e) {
    fail(id, e);
  }
};
```

- [ ] **Step 2: Implement the sandbox** — `engine/sandbox.js`

```js
export class SandboxTimeoutError extends Error {
  constructor() {
    super('โค้ดรันนานเกินไป (อาจมี loop ไม่จบ) — หยุดการทำงานแล้ว');
    this.name = 'SandboxTimeoutError';
  }
}

export function createSandbox({ timeoutMs = 3000, workerUrl = new URL('./worker.js', import.meta.url) } = {}) {
  let worker = null;
  let seq = 0;
  const pending = new Map();

  function terminate() {
    if (worker) worker.terminate();
    worker = null;
    for (const p of pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error('sandbox ถูกหยุดก่อนทำงานเสร็จ'));
    }
    pending.clear();
  }

  function spawn() {
    worker = new Worker(workerUrl, { type: 'module' });
    worker.onmessage = ({ data }) => {
      const p = pending.get(data.id);
      if (!p) return;
      clearTimeout(p.timer);
      pending.delete(data.id);
      if (data.ok) p.resolve(data.result);
      else p.reject(Object.assign(new Error(data.error.message), { name: data.error.name }));
    };
    worker.onerror = (ev) => {
      const msg = ev.message || 'worker error';
      for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error(msg)); }
      pending.clear();
    };
  }

  function call(type, body) {
    if (!worker) spawn();
    const id = ++seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new SandboxTimeoutError());
        terminate();
      }, timeoutMs);
      pending.set(id, { resolve, reject, timer });
      worker.postMessage({ id, type, ...body });
    });
  }

  return {
    run(payload) { terminate(); return call('run', { payload }); },
    check(payload, tests) { terminate(); return call('check', { payload, tests }); },
    request(req) { return call('request', { req }); },
    dispose: terminate,
  };
}
```

- [ ] **Step 3: Add the preview server** — edit `/Users/chawanpunya/Documents/School/sem1/.claude/launch.json`, appending to `configurations`:

```json
    {
      "name": "int161-lesson",
      "runtimeExecutable": "python3",
      "runtimeArgs": ["-m", "http.server", "8161", "--directory", "INT161/interactive-lesson"],
      "port": 8161
    }
```
(keep the existing `js-review` entry; add a comma after it)

- [ ] **Step 4: Write the smoke page** — `tests/sandbox-smoke.html`

```html
<!doctype html>
<meta charset="utf-8">
<title>sandbox smoke</title>
<pre id="out">running…</pre>
<script type="module">
import { createSandbox, SandboxTimeoutError } from '../engine/sandbox.js';

const lines = [];
const out = document.getElementById('out');
const say = (ok, msg) => { lines.push((ok ? 'PASS ' : 'FAIL ') + msg); out.textContent = lines.join('\n'); };

const sb = createSandbox({ timeoutMs: 1000 });
const hello = {
  entry: 'app.js',
  files: { 'app.js': "const http = require('node:http');\nhttp.createServer((q, s) => { s.writeHead(200); s.end('Hello World'); }).listen(3000);\nconsole.log('up');" },
};

try {
  const r = await sb.run(hello);
  say(r.ok && r.logs[0].text === 'up', 'run + console.log');

  const q = await sb.request({ path: '/' });
  say(q.response && q.response.text === 'Hello World', 'request through worker');

  const c = await sb.check(hello, [{ name: 'root', steps: [{ request: { path: '/' }, expect: { status: 200, text: 'Hello World' } }] }]);
  say(c.results[0].passed === true, 'check() passes');

  const c2 = await sb.check(hello, [{ name: 'root', steps: [{ request: { path: '/' }, expect: { status: 404 } }] }]);
  say(c2.results[0].passed === false, 'check() fails wrong expectation');

  const esm = await sb.run({ entry: 'm.js', files: { 'm.js': "import { x } from './l.js';\nconsole.log(x);", 'l.js': 'export const x = 5;' } });
  say(esm.ok && esm.logs[0].text === '5', 'ESM imports in worker');

  try {
    await sb.run({ entry: 'loop.js', files: { 'loop.js': 'while (true) {}' } });
    say(false, 'infinite loop should time out');
  } catch (e) {
    say(e instanceof SandboxTimeoutError, 'infinite loop times out');
  }

  const after = await sb.run(hello);
  say(after.ok, 'sandbox recovers after a timeout');
} catch (e) {
  say(false, 'unexpected: ' + e.message);
}
lines.push(lines.some((l) => l.startsWith('FAIL')) ? 'RESULT: FAIL' : 'RESULT: ALL PASS');
out.textContent = lines.join('\n');
sb.dispose();
</script>
```

- [ ] **Step 5: Verify in the browser**

Start the `int161-lesson` preview server (`preview_start` name `int161-lesson`), navigate to `http://localhost:8161/tests/sandbox-smoke.html`, wait ~3 s, and read the page text.
Expected: seven `PASS` lines and `RESULT: ALL PASS`; no console errors (`read_console_messages`). If a `FAIL`/error appears, fix the engine (not the smoke page) and re-run `npm test`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(engine): worker sandbox with timeout and browser smoke test" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

### Task 7: UI shell — store, hub, lesson page, run panel

**Files:**
- Create: `js/store.js`, `js/dom.js`, `js/editor.js`, `js/widgets.js`, `js/render.js`, `js/runpanel.js`, `js/modules.js`, `js/app-hub.js`, `js/app-lesson.js`, `css/app.css`, `index.html`, `lesson.html`, `content/w1.js` (temporary 3-block scaffold, replaced in Tasks 9–10), `tests/store.test.js`

**Interfaces:**
- Consumes: `createSandbox` (Task 6), `EXPECTED/countBlocks/ratioPct` (Task 1).
- Produces:
  - `createStore(storage?): { isDone(m,b), markDone(m,b), doneCount(m), getCode(m,b), setCode(m,b,files), reset(m,b) }` — never throws; falls back to memory if `localStorage` is unavailable
  - `h(tag, attrs, ...children): HTMLElement` (attrs: `class`, `html`, `onclick`-style handlers, plain attributes), `ratioBar(counts): HTMLElement`
  - `createEditor(host, {value, onChange}): { getValue(), setValue(v), focus() }`
  - `WIDGETS: Record<string, (container: HTMLElement, block) => void>` (filled in Task 8)
  - `renderBlock(block, ctx): HTMLElement` with `ctx = { moduleId, store, onDone() }`
  - `createRunPanel({ block, moduleId, store, onDone }): HTMLElement`
  - Content block contract (all types): `{ type, id, title, source, body?: html, widget?: name }`; code blocks add `files: {name: source}`, `entry?: name` (default first file), `fixtures?`, `hint?`, `solution?: string` (single-file exercises: solution text for the first file), `tests?: [...]` (exercise only). A module default-exports `{ id, title, sources, blocks }`.

- [ ] **Step 1: Write the failing store test** — `tests/store.test.js`

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../js/store.js';

const fakeStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

test('markDone / isDone / doneCount', () => {
  const s = createStore(fakeStorage());
  assert.equal(s.isDone('w1', 'c1'), false);
  s.markDone('w1', 'c1');
  s.markDone('w1', 'c2');
  s.markDone('w2', 'c1');
  assert.equal(s.isDone('w1', 'c1'), true);
  assert.equal(s.doneCount('w1'), 2);
});

test('code save / get / reset', () => {
  const s = createStore(fakeStorage());
  assert.equal(s.getCode('w1', 'x1'), null);
  s.setCode('w1', 'x1', { 'app.js': 'a' });
  assert.deepEqual(s.getCode('w1', 'x1'), { 'app.js': 'a' });
  s.reset('w1', 'x1');
  assert.equal(s.getCode('w1', 'x1'), null);
});

test('persists across store instances sharing storage', () => {
  const st = fakeStorage();
  createStore(st).markDone('w1', 'c1');
  assert.equal(createStore(st).isDone('w1', 'c1'), true);
});

test('works with no storage at all (memory only)', () => {
  const s = createStore(null);
  s.markDone('w1', 'c1');
  assert.equal(s.isDone('w1', 'c1'), true);
});

test('never throws when storage throws or holds garbage', () => {
  const bad = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() {} };
  const s = createStore(bad);
  s.markDone('w1', 'c1');
  assert.equal(s.isDone('w1', 'c1'), true);
  const junk = fakeStorage();
  junk.setItem('int161-progress-v1', '{not json');
  assert.equal(createStore(junk).isDone('w1', 'c1'), false);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/store.test.js`
Expected: FAIL — cannot find `../js/store.js`

- [ ] **Step 3: Implement the store** — `js/store.js`

```js
const KEY = 'int161-progress-v1';

function defaultStorage() {
  try {
    const s = globalThis.localStorage;
    s.setItem('__t', '1');
    s.removeItem('__t');
    return s;
  } catch {
    return null;
  }
}

export function createStore(storage = defaultStorage()) {
  let mem = { done: {}, code: {} };

  function read() {
    if (!storage) return mem;
    try {
      const raw = storage.getItem(KEY);
      const v = raw ? JSON.parse(raw) : null;
      if (v && typeof v === 'object') return { done: v.done || {}, code: v.code || {} };
    } catch { /* fall through */ }
    return mem;
  }

  function write(data) {
    mem = data;
    if (!storage) return;
    try { storage.setItem(KEY, JSON.stringify(data)); } catch { /* memory only */ }
  }

  return {
    isDone: (m, b) => !!read().done[m]?.[b],
    markDone(m, b) {
      const d = read();
      (d.done[m] ||= {})[b] = true;
      write(d);
    },
    doneCount: (m) => Object.keys(read().done[m] || {}).length,
    getCode: (m, b) => read().code[`${m}/${b}`] || null,
    setCode(m, b, files) {
      const d = read();
      d.code[`${m}/${b}`] = files;
      write(d);
    },
    reset(m, b) {
      const d = read();
      delete d.code[`${m}/${b}`];
      write(d);
    },
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/store.test.js` → Expected: PASS (5 tests).

- [ ] **Step 5: DOM helpers and editor** — `js/dom.js`

```js
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

const LABELS = { concept: 'แนวคิด', experiment: 'ทดลอง', exercise: 'เขียนเอง' };

export function ratioBar(counts) {
  const total = counts.concept + counts.experiment + counts.exercise || 1;
  const pct = (n) => Math.round((n / total) * 100);
  const bar = h('div', { class: 'ratio-bar', role: 'img',
    'aria-label': Object.keys(LABELS).map((t) => `${LABELS[t]} ${pct(counts[t])}%`).join(' ') });
  for (const t of Object.keys(LABELS)) {
    bar.append(h('span', { class: `seg seg-${t}`, style: `flex-grow:${counts[t]}` }));
  }
  const legend = h('div', { class: 'ratio-legend' },
    Object.keys(LABELS).map((t) => h('span', { class: `dot-${t}` }, `${LABELS[t]} ${pct(counts[t])}%`)));
  return h('div', { class: 'ratio' }, bar, legend);
}
```

`js/editor.js` (textarea; CodeMirror is added in Task 11):
```js
export function createEditor(host, { value = '', onChange = () => {} } = {}) {
  const ta = document.createElement('textarea');
  ta.className = 'code-input';
  ta.spellcheck = false;
  ta.setAttribute('autocapitalize', 'off');
  ta.value = value;
  ta.rows = Math.min(26, Math.max(6, value.split('\n').length + 1));
  ta.addEventListener('input', () => onChange(ta.value));
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
      onChange(ta.value);
    }
  });
  host.append(ta);
  return {
    getValue: () => ta.value,
    setValue(v) { ta.value = v; onChange(v); },
    focus: () => ta.focus(),
  };
}
```

`js/widgets.js`:
```js
// Interactive widgets keyed by name; filled in Task 8.
export const WIDGETS = {};
```

`js/modules.js`:
```js
export const MODULES = [
  { id: 'w1', title: 'Introduction to Web Application & Node.js', ready: true },
  { id: 'w2', title: 'HTTP Programming Basics', ready: false },
  { id: 'w3', title: 'Introduction to RESTful API', ready: false },
  { id: 'w4', title: 'Database Connection', ready: false },
  { id: 'w5', title: 'Express.js Framework', ready: false },
  { id: 'w6', title: 'Error Handling', ready: false },
];
```

- [ ] **Step 6: Run panel** — `js/runpanel.js`

```js
import { h } from './dom.js';
import { createEditor } from './editor.js';
import { createSandbox } from '../engine/sandbox.js';

export function createRunPanel({ block, moduleId, store, onDone }) {
  const sandbox = createSandbox();
  const names = Object.keys(block.files);
  const saved = store.getCode(moduleId, block.id) || {};
  const files = Object.fromEntries(names.map((n) => [n, saved[n] ?? block.files[n]]));
  let active = names[0];

  const editorHost = h('div', { class: 'editor-host' });
  const output = h('div', { class: 'output', 'aria-live': 'polite' });
  const reqBox = h('div', { class: 'reqbox', hidden: true });
  const testBox = h('div', { class: 'testbox' });
  const tabs = h('div', { class: 'filetabs', hidden: names.length < 2 });

  const editor = createEditor(editorHost, {
    value: files[active],
    onChange: (v) => { files[active] = v; store.setCode(moduleId, block.id, files); },
  });

  function renderTabs() {
    tabs.replaceChildren(...names.map((n) => h('button', {
      class: 'tab' + (n === active ? ' on' : ''),
      onclick: () => { active = n; editor.setValue(files[n]); renderTabs(); },
    }, n)));
  }
  renderTabs();

  const payload = () => ({ files: { ...files }, entry: block.entry || names[0], fixtures: block.fixtures || {} });

  function showLogs(logs, error) {
    output.replaceChildren(
      ...logs.map((l) => h('div', { class: `log log-${l.level}` }, l.text)),
      error ? h('div', { class: 'log log-error' }, `${error.name}: ${error.message}`) : null,
    );
    if (!logs.length && !error) output.append(h('div', { class: 'muted' }, '(ไม่มี output)'));
  }

  const fail = (e) => output.replaceChildren(h('div', { class: 'log log-error' }, e.message));

  async function run() {
    reqBox.hidden = true;
    try {
      const r = await sandbox.run(payload());
      showLogs(r.logs, r.error);
      if (r.ok) {
        buildRequestBox();
        if (block.type === 'experiment') onDone();
      }
    } catch (e) { fail(e); }
  }

  function buildRequestBox() {
    const method = h('select', {}, ['GET', 'POST', 'PUT', 'DELETE'].map((m) => h('option', { value: m }, m)));
    const path = h('input', { type: 'text', value: '/', 'aria-label': 'path' });
    const body = h('textarea', { rows: 2, placeholder: 'request body (JSON) — ใช้กับ POST/PUT', spellcheck: 'false' });
    const result = h('pre', { class: 'response' });
    const send = h('button', { class: 'btn', onclick: async () => {
      let b;
      if (body.value.trim()) { try { b = JSON.parse(body.value); } catch { b = body.value; } }
      try {
        const r = await sandbox.request({ method: method.value, path: path.value, body: b });
        if (r.error) result.textContent = `Error: ${r.error}`;
        else {
          const { status, statusText, headers, text } = r.response;
          const head = Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n');
          result.textContent = `HTTP ${status} ${statusText}\n${head}${head ? '\n' : ''}\n${text}`;
        }
        if (r.logs) showLogs(r.logs);
      } catch (e) { result.textContent = e.message; }
    } }, 'ส่ง request');
    reqBox.replaceChildren(h('div', { class: 'muted' }, 'ตัวยิง request (จำลอง browser/Postman)'),
      h('div', { class: 'reqrow' }, method, path, send), body, result);
    reqBox.hidden = false;
  }

  async function check() {
    reqBox.hidden = true;
    try {
      const r = await sandbox.check(payload(), block.tests);
      showLogs(r.run.logs, r.run.error);
      const all = r.run.ok && r.results.length > 0 && r.results.every((t) => t.passed);
      testBox.replaceChildren(
        ...r.results.map((t) => h('div', { class: 'test ' + (t.passed ? 'pass' : 'failed') },
          h('strong', {}, (t.passed ? '✓ ' : '✗ ') + t.name),
          t.checks.filter((c) => !c.ok).map((c) => h('div', { class: 'why' }, `${c.label}: ${c.message}`)))),
        all ? h('div', { class: 'celebrate' }, 'ผ่านครบทุกข้อ 🎉') : null,
      );
      if (all) onDone();
    } catch (e) { fail(e); }
  }

  const solution = block.solution
    ? h('details', { class: 'solution' }, h('summary', {}, 'ดูเฉลย'), h('pre', {}, block.solution))
    : null;
  const hint = block.hint ? h('details', { class: 'hint' }, h('summary', {}, 'Hint'), h('div', { html: block.hint })) : null;

  return h('div', { class: 'runpanel' },
    tabs, editorHost,
    h('div', { class: 'actions' },
      h('button', { class: 'btn primary', onclick: run }, '▶ Run'),
      block.type === 'exercise' ? h('button', { class: 'btn primary', onclick: check }, '✓ ตรวจคำตอบ') : null,
      h('button', { class: 'btn', onclick: () => {
        store.reset(moduleId, block.id);
        for (const n of names) files[n] = block.files[n];
        editor.setValue(files[active]);
        output.replaceChildren(); testBox.replaceChildren(); reqBox.hidden = true;
      } }, 'Reset')),
    output, reqBox, testBox, hint, solution);
}
```

- [ ] **Step 7: Block renderer** — `js/render.js`

```js
import { h } from './dom.js';
import { WIDGETS } from './widgets.js';
import { createRunPanel } from './runpanel.js';

const BADGE = { concept: '📖 แนวคิด', experiment: '🔬 ทดลอง', exercise: '⌨️ เขียนเอง' };

export function renderBlock(block, ctx) {
  const { moduleId, store, onDone } = ctx;
  const el = h('section', { class: `block block-${block.type}`, id: block.id });
  const done = () => { store.markDone(moduleId, block.id); el.classList.add('done'); onDone(); };
  if (store.isDone(moduleId, block.id)) el.classList.add('done');

  el.append(
    h('div', { class: 'block-head' },
      h('span', { class: `badge badge-${block.type}` }, BADGE[block.type]),
      h('h2', {}, block.title),
      h('span', { class: 'check', 'aria-label': 'เสร็จแล้ว' }, '✓')),
    block.body ? h('div', { class: 'prose', html: block.body }) : null);

  if (block.widget) {
    const host = h('div', { class: 'widget' });
    const build = WIDGETS[block.widget];
    if (build) build(host, block); else host.textContent = `(widget '${block.widget}' ยังไม่พร้อม)`;
    el.append(host);
  }
  if (block.files) el.append(createRunPanel({ block, moduleId, store, onDone: done }));
  if (block.type === 'concept') {
    el.append(h('button', { class: 'btn read', onclick: done }, 'อ่านแล้ว ✓'));
  } else if (block.widget && !block.files) {
    el.append(h('button', { class: 'btn read', onclick: done }, 'ลองแล้ว ✓'));
  }
  if (block.source) el.append(h('div', { class: 'source' }, `ที่มา: ${block.source}`));
  return el;
}
```

- [ ] **Step 8: Pages** — `index.html`

```html
<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>INT161 Interactive</title>
  <link rel="stylesheet" href="css/app.css">
</head>
<body>
  <main class="wrap">
    <h1>INT161 — Basic Backend Development</h1>
    <p class="muted">เขียนโค้ดแบบ Node.js/Express แล้วกด Run ในเบราว์เซอร์ได้เลย (รันบน simulator ไม่ใช่ Node จริง — รองรับเฉพาะสิ่งที่อยู่ในสไลด์)</p>
    <div id="cards" class="cards"></div>
  </main>
  <script type="module" src="js/app-hub.js"></script>
</body>
</html>
```

`lesson.html`:
```html
<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>INT161 — บทเรียน</title>
  <link rel="stylesheet" href="css/app.css">
</head>
<body>
  <header class="topbar">
    <a href="index.html">← INT161</a>
    <div class="progress"><div id="progress-fill"></div></div>
    <span id="progress-text" class="muted"></span>
  </header>
  <main id="app" class="wrap"></main>
  <script type="module" src="js/app-lesson.js"></script>
</body>
</html>
```

`js/app-hub.js`:
```js
import { h, ratioBar } from './dom.js';
import { EXPECTED, countBlocks } from './ratio.js';
import { createStore } from './store.js';
import { MODULES } from './modules.js';

const store = createStore();
const cards = document.getElementById('cards');

for (const m of MODULES) {
  let counts = EXPECTED[m.id];
  if (m.ready) {
    try { counts = countBlocks((await import(`../content/${m.id}.js`)).default.blocks); } catch { /* keep expected */ }
  }
  const total = counts.concept + counts.experiment + counts.exercise;
  const card = h(m.ready ? 'a' : 'div', { class: 'card' + (m.ready ? '' : ' soon'), href: m.ready ? `lesson.html?m=${m.id}` : null },
    h('div', { class: 'card-id' }, m.id.toUpperCase()),
    h('h3', {}, m.title),
    ratioBar(counts),
    h('div', { class: 'muted' }, m.ready ? `ทำแล้ว ${store.doneCount(m.id)}/${total} บล็อก` : 'เร็ว ๆ นี้'));
  cards.append(card);
}
```

`js/app-lesson.js`:
```js
import { h, ratioBar } from './dom.js';
import { EXPECTED, countBlocks } from './ratio.js';
import { createStore } from './store.js';
import { renderBlock } from './render.js';

const app = document.getElementById('app');
const id = new URLSearchParams(location.search).get('m');
const store = createStore();

async function main() {
  if (!id || !(id in EXPECTED)) { app.append(h('p', {}, 'ไม่พบโมดูลนี้')); return; }
  let mod;
  try { mod = (await import(`../content/${id}.js`)).default; } catch { app.append(h('p', {}, 'โมดูลนี้ยังไม่พร้อมใช้งาน')); return; }
  document.title = `INT161 ${id.toUpperCase()} — ${mod.title}`;
  const total = mod.blocks.length;
  const update = () => {
    const n = store.doneCount(id);
    document.getElementById('progress-fill').style.width = `${(n / total) * 100}%`;
    document.getElementById('progress-text').textContent = `${n}/${total}`;
  };
  app.append(h('h1', {}, `${id.toUpperCase()} — ${mod.title}`), ratioBar(countBlocks(mod.blocks)));
  for (const b of mod.blocks) app.append(renderBlock(b, { moduleId: id, store, onDone: update }));
  update();
}
main();
```

- [ ] **Step 9: Stylesheet** — `css/app.css`

```css
:root {
  --bg:#f7f7f4; --surface:#fff; --surface2:#efeee9; --text:#15171c; --muted:#6a6f7a; --border:#dcdbd4;
  --concept:#2f6fed; --experiment:#d98a00; --exercise:#159a5a; --danger:#d03b3b; --code-bg:#12151c; --code-fg:#e6e9f2;
}
@media (prefers-color-scheme: dark) {
  :root { --bg:#0f1420; --surface:#161d2e; --surface2:#1c2540; --text:#e8ecf6; --muted:#9aa5c0; --border:#2a3454;
    --concept:#6ea8fe; --experiment:#f0b84a; --exercise:#43c46a; --danger:#ef6b6b; }
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { margin:0; background:var(--bg); color:var(--text); line-height:1.7;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans Thai",sans-serif; }
a { color: var(--concept); }
.wrap { max-width: 900px; margin: 0 auto; padding: 24px 16px 96px; }
.muted { color: var(--muted); font-size: 14px; }
h1 { font-size: 26px; line-height: 1.35; margin: 8px 0 12px; }

.topbar { position: sticky; top: 0; z-index: 10; display:flex; align-items:center; gap:12px; padding:10px 16px;
  background: var(--surface); border-bottom: 1px solid var(--border); }
.progress { flex:1; height:8px; background:var(--surface2); border-radius:999px; overflow:hidden; }
#progress-fill { height:100%; width:0; background:var(--exercise); transition:width .2s; }

.ratio-bar { display:flex; height:10px; border-radius:999px; overflow:hidden; background:var(--surface2); gap:2px; }
.seg-concept { background:var(--concept); } .seg-experiment { background:var(--experiment); } .seg-exercise { background:var(--exercise); }
.ratio-legend { display:flex; flex-wrap:wrap; gap:4px 14px; font-size:13px; color:var(--muted); margin-top:6px; }
.ratio-legend span::before { content:''; display:inline-block; width:9px; height:9px; border-radius:50%; margin-right:6px; background:currentColor; }
.dot-concept::before { color:var(--concept); } .dot-experiment::before { color:var(--experiment); } .dot-exercise::before { color:var(--exercise); }

.cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:14px; margin-top:20px; }
.card { display:block; padding:16px; background:var(--surface); border:1px solid var(--border); border-radius:14px; color:inherit; text-decoration:none; }
.card:hover:not(.soon) { border-color: var(--concept); }
.card.soon { opacity:.55; }
.card h3 { margin:2px 0 12px; font-size:17px; line-height:1.4; }
.card-id { color:var(--muted); font-weight:700; font-size:12px; letter-spacing:.08em; }

.block { background:var(--surface); border:1px solid var(--border); border-left:5px solid var(--concept); border-radius:12px;
  padding:16px; margin:18px 0; }
.block-experiment { border-left-color: var(--experiment); } .block-exercise { border-left-color: var(--exercise); }
.block-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.block-head h2 { font-size:19px; margin:0; flex:1; min-width:180px; }
.badge { font-size:12px; font-weight:700; padding:2px 10px; border-radius:999px; background:var(--surface2); }
.badge-concept { color:var(--concept); } .badge-experiment { color:var(--experiment); } .badge-exercise { color:var(--exercise); }
.check { visibility:hidden; color:var(--exercise); font-weight:700; }
.block.done .check { visibility:visible; }
.prose table { border-collapse:collapse; width:100%; display:block; overflow-x:auto; }
.prose th, .prose td { border:1px solid var(--border); padding:6px 10px; text-align:left; vertical-align:top; }
.prose code, .prose pre { font-family:ui-monospace,Menlo,Consolas,monospace; font-size:13.5px; }
.prose pre { background:var(--code-bg); color:var(--code-fg); padding:12px; border-radius:8px; overflow-x:auto; }
.source { margin-top:12px; font-size:12px; color:var(--muted); }

.btn { font:inherit; font-size:14px; padding:6px 14px; border-radius:8px; border:1px solid var(--border);
  background:var(--surface2); color:var(--text); cursor:pointer; }
.btn.primary { background:var(--concept); border-color:var(--concept); color:#fff; }
.btn.read { margin-top:10px; }
.actions { display:flex; gap:8px; flex-wrap:wrap; margin:10px 0; }

.code-input { width:100%; font-family:ui-monospace,Menlo,Consolas,monospace; font-size:13.5px; line-height:1.55;
  background:var(--code-bg); color:var(--code-fg); border:1px solid var(--border); border-radius:8px; padding:12px; resize:vertical; tab-size:2; }
.filetabs { display:flex; gap:6px; margin-bottom:6px; overflow-x:auto; }
.tab { font:inherit; font-size:13px; padding:3px 10px; border:1px solid var(--border); border-radius:6px 6px 0 0; background:var(--surface2); color:var(--text); cursor:pointer; }
.tab.on { background:var(--code-bg); color:var(--code-fg); }

.output, .response { font-family:ui-monospace,Menlo,Consolas,monospace; font-size:13px; background:var(--code-bg); color:var(--code-fg);
  border-radius:8px; padding:10px 12px; margin-top:8px; white-space:pre-wrap; word-break:break-word; }
.output:empty { display:none; }
.log-error { color:#ff8b8b; } .log-warn { color:#f0c674; } .log-info { color:#8ab4ff; }
.reqbox { margin-top:10px; padding:10px; border:1px dashed var(--border); border-radius:8px; }
.reqrow { display:flex; gap:6px; margin:6px 0; flex-wrap:wrap; }
.reqrow input { flex:1; min-width:120px; }
.reqrow select, .reqrow input, .reqbox textarea { font:inherit; font-size:14px; padding:5px 8px; border:1px solid var(--border); border-radius:6px; background:var(--surface); color:var(--text); }
.reqbox textarea { width:100%; font-family:ui-monospace,Menlo,monospace; }
.test { margin:8px 0; padding:8px 12px; border-radius:8px; background:var(--surface2); }
.test.pass strong { color:var(--exercise); } .test.failed strong { color:var(--danger); }
.why { font-size:13px; color:var(--muted); margin-top:4px; }
.celebrate { font-weight:700; color:var(--exercise); margin-top:8px; }
details { margin-top:10px; } summary { cursor:pointer; color:var(--muted); }
.solution pre { background:var(--code-bg); color:var(--code-fg); padding:12px; border-radius:8px; overflow-x:auto; }
.widget { margin:12px 0; }
@media (max-width: 600px) { h1 { font-size:22px; } .block { padding:12px; } }
```

- [ ] **Step 10: Temporary scaffold content** — `content/w1.js` (replaced in Tasks 9–10; `npm run check-ratio` is expected to FAIL until then)

```js
export default {
  id: 'w1',
  title: 'Introduction to Web Application & Node.js',
  sources: ['week1/W01-Introduction.md'],
  blocks: [
    { type: 'concept', id: 'c-scaffold', title: 'ตัวอย่างบล็อกแนวคิด', source: 'scaffold',
      body: '<p>บล็อกนี้เป็นตัวอย่างชั่วคราว</p>' },
    { type: 'experiment', id: 'e-scaffold', title: 'ตัวอย่างบล็อกทดลอง', source: 'scaffold',
      body: '<p>กด Run แล้วลองส่ง request</p>',
      files: { 'app.js': "const http = require('node:http');\nhttp.createServer((req, res) => {\n  res.writeHead(200);\n  res.end('Hello World');\n}).listen(3000);\nconsole.log('Server running');\n" } },
    { type: 'exercise', id: 'x-scaffold', title: 'ตัวอย่างบล็อกเขียนเอง', source: 'scaffold',
      body: '<p>ทำให้ <code>/</code> ตอบ <code>Hello World</code></p>',
      files: { 'app.js': "const http = require('node:http');\nhttp.createServer((req, res) => {\n  // เขียนโค้ดตรงนี้\n  res.end('');\n}).listen(3000);\n" },
      solution: "const http = require('node:http');\nhttp.createServer((req, res) => {\n  res.writeHead(200);\n  res.end('Hello World');\n}).listen(3000);\n",
      tests: [{ name: 'GET / → Hello World', steps: [{ request: { path: '/' }, expect: { status: 200, text: 'Hello World' } }] }] },
  ],
};
```

- [ ] **Step 11: Verify in the browser**

With the `int161-lesson` preview running, open `http://localhost:8161/index.html`:
- Expected: 6 cards; W1 clickable (ratio bar from the 3 scaffold blocks), W2–W6 dimmed "เร็ว ๆ นี้".
- Open `lesson.html?m=w1`. Click **▶ Run** on the experiment → output shows `Server running`, request box appears; send `GET /` → `HTTP 200 OK … Hello World`; the block gets ✓ and the top progress advances.
- On the exercise click **✓ ตรวจคำตอบ** with the starter code → a red ✗ test with `ได้ 200 คาดหวัง …`/text mismatch; paste the solution into the editor → green ✓ and "ผ่านครบทุกข้อ 🎉".
- Reload the page: edited code and ✓ marks persist.
- `resize_window` to `mobile` and evaluate `document.documentElement.scrollWidth <= window.innerWidth` → `true`; then reset with preset `desktop`.
- `read_console_messages` with `onlyErrors: true` → none.

- [ ] **Step 12: Commit**

```bash
npm test
git add -A
git commit -m "feat(ui): hub, lesson page, run panel, progress store" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

### Task 8: Interactive widgets + W1 concept blocks (12)

**Files:**
- Modify: `js/widgets.js` (replace the empty registry), `css/app.css` (append widget styles)
- Create: `content/w1-concepts.js`

**Interfaces:**
- Consumes: `h` (Task 7); the block contract (`block.data` is widget-specific).
- Produces:
  - `WIDGETS['eval-bars'](host, block)` — `block.data: [{label, pct}]`
  - `WIDGETS['http-parts'](host)` — no data
  - `WIDGETS['arch-tabs'](host, block)` — `block.data: [{name, note, chain: string[]}]`
  - `WIDGETS['arch-flow'](host)` — no data (used by experiment `e-arch-flow`, Task 9)
  - `WIDGETS['translator-sim'](host)` — no data (used by experiment `e-translator`, Task 9)
  - `content/w1-concepts.js`: `export const concepts = { agreements, courseEval, schedule, http, architecture, json, fullstack, webservice, nodejs, translators, installFile, backendSummary }` — each a complete concept block (12 total)
- Content rules: text comes only from `week1/W01-Introduction.md`; slide screenshots are not copied; transcript-derived items are labeled "(จาก transcript)".

- [ ] **Step 1: Implement the widgets** — replace `js/widgets.js`

```js
import { h } from './dom.js';

export const WIDGETS = {
  'eval-bars'(host, block) {
    const max = Math.max(...block.data.map((d) => d.pct));
    host.append(...block.data.map((d) => h('div', { class: 'evalrow' },
      h('span', { class: 'evallabel' }, d.label),
      h('span', { class: 'evalbar' }, h('span', { class: 'evalfill', style: `width:${(d.pct / max) * 100}%` })),
      h('strong', {}, `${d.pct}%`))));
  },

  'http-parts'(host) {
    const MSGS = {
      Request: [
        { part: 'Methods', text: 'GET /user HTTP/1.1' },
        { part: 'Headers', text: 'Host: localhost:3000' },
        { part: '', text: '' },
        { part: 'Body', text: '(ข้อมูลที่ส่งไปกับ request)' },
      ],
      Response: [
        { part: 'Status Line', text: 'HTTP/1.1 200 OK' },
        { part: 'Header', text: 'Content-Type: application/json' },
        { part: '', text: '' },
        { part: 'Message Body (Payload)', text: '{"name":"John Doe"}' },
      ],
    };
    const caption = h('div', { class: 'muted' }, 'กดชื่อส่วนเพื่อดูว่าอยู่ตรงไหนของข้อความ');
    const boxes = {};
    const chips = h('div', { class: 'chips' });
    for (const [kind, lines] of Object.entries(MSGS)) {
      const box = h('pre', { class: 'msg' }, h('div', { class: 'msg-title' }, `HTTP ${kind}`),
        lines.map((l) => h('div', { class: 'msgline', 'data-part': l.part }, l.text || ' ')));
      boxes[kind] = box;
      for (const l of lines.filter((x) => x.part)) {
        chips.append(h('button', { class: 'chip', onclick: () => {
          host.querySelectorAll('.msgline.hl').forEach((e) => e.classList.remove('hl'));
          box.querySelector(`[data-part="${l.part}"]`).classList.add('hl');
          caption.textContent = `${l.part} — ส่วนหนึ่งของ HTTP ${kind}; ในตัวอย่างนี้คือ: ${l.text}`;
        } }, `${kind}: ${l.part}`));
      }
    }
    host.append(chips, h('div', { class: 'msgs' }, boxes.Request, boxes.Response), caption);
  },

  'arch-tabs'(host, block) {
    const note = h('p', { class: 'muted' });
    const chain = h('div', { class: 'chain' });
    const tabs = h('div', { class: 'chips' });
    const show = (t, btn) => {
      tabs.querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', b === btn));
      note.textContent = t.note;
      chain.replaceChildren(...t.chain.flatMap((n, i) => [i ? h('span', { class: 'arrow' }, '→') : null, h('span', { class: 'node' }, n)]));
    };
    block.data.forEach((t, i) => {
      const btn = h('button', { class: 'chip', onclick: (e) => show(t, e.currentTarget) }, t.name);
      tabs.append(btn);
      if (i === 0) show(t, btn);
    });
    host.append(tabs, note, chain);
  },

  'arch-flow'(host) {
    let mpa = 1;
    let ajax = 0;
    const mpaBox = h('div', { class: 'flowcol' });
    const spaBox = h('div', { class: 'flowcol' });
    const paint = () => {
      mpaBox.replaceChildren(h('h4', {}, 'MPA'), h('div', { class: 'big' }, mpa),
        h('div', { class: 'muted' }, 'ครั้งที่โหลดทั้งหน้าจาก server'));
      spaBox.replaceChildren(h('h4', {}, 'SPA'), h('div', { class: 'big' }, ajax),
        h('div', { class: 'muted' }, 'ครั้งที่ขอเฉพาะ JSON ผ่าน AJAX'),
        h('div', { class: 'muted' }, 'โหลด HTML/CSS/JS ครั้งแรก: 1 ครั้ง'));
    };
    paint();
    host.append(
      h('div', { class: 'actions' },
        h('button', { class: 'btn primary', onclick: () => { mpa++; ajax++; paint(); } }, 'คลิกลิงก์ไปหน้าอื่น'),
        h('button', { class: 'btn', onclick: () => { mpa = 1; ajax = 0; paint(); } }, 'เริ่มใหม่')),
      h('div', { class: 'flowgrid' }, mpaBox, spaBox));
  },

  'translator-sim'(host) {
    let mode = 'compile';
    let bad = false;
    let shown = 0;
    const PROGRAM = ['พิมพ์ "A"', 'พิมพ์ "B"', 'พิมพ์ "C"', 'พิมพ์ "D"'];
    const log = h('div', { class: 'output' });
    const code = h('pre', { class: 'msg' });
    const steps = () => {
      const out = [];
      const line = (i) => (bad && i === 2 ? 'พิมพ์ "C" +' : PROGRAM[i]);
      if (mode === 'compile') {
        out.push({ t: 'แปลทั้งโปรแกรมเป็น machine code ก่อนรัน' });
        if (bad) out.push({ t: '❌ แปลไม่ผ่านที่บรรทัด 3 — ยังไม่ได้รันอะไรเลย', err: true });
        else {
          out.push({ t: '✓ แปลสำเร็จ' });
          PROGRAM.forEach((_, i) => out.push({ t: `รัน → ${line(i)}` }));
        }
      } else {
        for (let i = 0; i < PROGRAM.length; i++) {
          out.push({ t: `แปลบรรทัด ${i + 1}: ${line(i)}` });
          if (bad && i === 2) { out.push({ t: '❌ error ที่บรรทัด 3 — หยุด (บรรทัด 1–2 รันไปแล้ว)', err: true }); break; }
          out.push({ t: `รัน → ${line(i)}` });
        }
      }
      return out;
    };
    const paint = () => {
      code.replaceChildren(...PROGRAM.map((_, i) => h('div', {}, `${i + 1}  ${bad && i === 2 ? 'พิมพ์ "C" +' : PROGRAM[i]}`)));
      log.replaceChildren(...steps().slice(0, shown).map((s) => h('div', { class: s.err ? 'log log-error' : 'log' }, s.t)));
    };
    const setMode = (m) => { mode = m; shown = 0; paint(); };
    host.append(
      h('div', { class: 'actions' },
        h('label', {}, h('input', { type: 'radio', name: 'tmode', checked: true, onchange: () => setMode('compile') }), ' Compilation  '),
        h('label', {}, h('input', { type: 'radio', name: 'tmode', onchange: () => setMode('interpret') }), ' Interpretation  '),
        h('label', {}, h('input', { type: 'checkbox', onchange: (e) => { bad = e.target.checked; shown = 0; paint(); } }), ' บรรทัด 3 มีข้อผิดพลาด')),
      code,
      h('div', { class: 'actions' },
        h('button', { class: 'btn primary', onclick: () => { if (shown < steps().length) { shown++; paint(); } } }, 'ขั้นถัดไป'),
        h('button', { class: 'btn', onclick: () => { shown = 0; paint(); } }, 'เริ่มใหม่')),
      log);
    paint();
  },
};
```

- [ ] **Step 2: Append widget styles** to `css/app.css`

```css
.evalrow { display:flex; align-items:center; gap:10px; margin:6px 0; }
.evallabel { flex:0 0 230px; font-size:14px; }
.evalbar { flex:1; height:12px; background:var(--surface2); border-radius:999px; overflow:hidden; }
.evalfill { display:block; height:100%; background:var(--concept); }
.chips { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; }
.chip { font:inherit; font-size:13px; padding:3px 12px; border-radius:999px; border:1px solid var(--border); background:var(--surface2); color:var(--text); cursor:pointer; }
.chip.on { background:var(--concept); border-color:var(--concept); color:#fff; }
.msgs { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:10px; }
.msg { background:var(--code-bg); color:var(--code-fg); border-radius:8px; padding:10px 12px; margin:0; font-family:ui-monospace,Menlo,monospace; font-size:13px; overflow-x:auto; }
.msg-title { color:#8ab4ff; margin-bottom:4px; }
.msgline { padding:0 4px; border-radius:4px; white-space:pre-wrap; }
.msgline.hl { background:#3b4a1f; color:#fff; outline:1px solid var(--experiment); }
.chain { display:flex; flex-wrap:wrap; align-items:center; gap:6px; }
.node { padding:6px 10px; border:1px solid var(--border); border-radius:8px; background:var(--surface2); font-size:13.5px; }
.arrow { color:var(--muted); }
.flowgrid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.flowcol { padding:12px; border:1px solid var(--border); border-radius:10px; text-align:center; }
.flowcol h4 { margin:0; } .big { font-size:40px; font-weight:800; color:var(--experiment); line-height:1.2; }
@media (max-width: 600px) { .evallabel { flex-basis:120px; font-size:13px; } }
```

- [ ] **Step 3: Write the concept blocks** — `content/w1-concepts.js`

```js
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const code = (s) => `<pre><code>${esc(s)}</code></pre>`;
const SRC = 'week1/W01-Introduction.md';

export const concepts = {
  agreements: {
    type: 'concept', id: 'c-agreements', title: 'ข้อตกลงในการเรียน (จาก transcript)',
    source: `${SRC} §ประกาศ/ข้อตกลงในการเรียน`,
    body: `<ul>
      <li>ผู้สอน: อาจารย์พิเชษฐ์</li>
      <li>เรียนแบบผู้ใหญ่ระดับอุดมศึกษา ต่างคนต่างดูแลรับผิดชอบตัวเอง แต่ขอให้เคารพกฎเกณฑ์ในสังคม (เช่น ไม่ส่งเสียงดังรบกวนเพื่อน)</li>
      <li>คาบเรียนมีทั้งทฤษฎีและปฏิบัติสลับกัน — ถ้ามีปัญหาระหว่างทำแล็บให้ <b>ยกมือเรียกอาจารย์</b> ถ้าไม่เรียก อาจารย์จะไม่เข้าไปช่วย</li>
      <li>คำเตือนเรื่องเกรด: อาจารย์เคยให้เกรด F มากที่สุดถึง 121 คน จากนักเรียนประมาณ 300 คน — "เอฟก็แค่เกรด" แต่เกิดขึ้นจริง</li>
    </ul>`,
  },

  courseEval: {
    type: 'concept', id: 'c-course-eval', title: 'Course Description และการประเมินผล',
    source: `${SRC} §Course Description, §Evaluation`, widget: 'eval-bars',
    body: `<p>ความรู้เบื้องต้นเกี่ยวกับ RESTful API, การเชื่อมต่อฐานข้อมูล, API authentication และความปลอดภัย, การเรียงลำดับ/แบ่งหน้า/กรองข้อมูล</p>
      <p class="muted">PLO: 2C-I, 2D-E, 2F-E, 5BE-I, 5FS-I · สไลด์ระบุสัดส่วนเฉพาะ 2nd/3rd Exam รวม 100% ไม่มีสัดส่วนของ 1st Exam</p>`,
    data: [
      { label: '2nd Exam — Theory (choice/describe)', pct: 30 },
      { label: '2nd Exam — Practice (เขียนโปรแกรมแก้โจทย์)', pct: 20 },
      { label: '3rd Exam — Theory', pct: 30 },
      { label: '3rd Exam — Practice', pct: 20 },
    ],
  },

  schedule: {
    type: 'concept', id: 'c-schedule', title: 'ตารางเรียน Group B / Group 2 (พฤหัสบดี)',
    source: `${SRC} §ตารางเรียน`,
    body: `<table><tr><th>สัปดาห์</th><th>วันที่</th><th>หัวข้อ (ตามสไลด์ W1)</th></tr>
      <tr><td>1</td><td>6 Aug 2026</td><td>Introduction</td></tr>
      <tr><td>2</td><td>13 Aug 2026</td><td>Node.js vs Bun</td></tr>
      <tr><td>3</td><td>20 Aug 2026</td><td>RESTful API</td></tr>
      <tr><td>4</td><td>27 Aug 2026</td><td>Express framework</td></tr>
      <tr><td>5</td><td>3 Sep 2026</td><td>Connection to Database</td></tr>
      <tr><td>—</td><td>7–11 Sep 2026</td><td><b>1st Examination</b></td></tr>
      <tr><td>6</td><td>17 Sep 2026</td><td>Relationship Modeling/ORM</td></tr>
      <tr><td>7</td><td>24 Sep 2026</td><td>Prisma ORM</td></tr>
      <tr><td>8</td><td>1 Oct 2026</td><td>Validation &amp; Error Handling</td></tr>
      <tr><td>9</td><td>8 Oct 2026</td><td>Data Transfer Object (DTO)</td></tr>
      <tr><td>10</td><td>15 Oct 2026</td><td>Filtering, Sorting &amp; Pagination</td></tr>
      <tr><td>—</td><td>19–26 Oct 2026</td><td><b>2nd Examination</b></td></tr>
      <tr><td>11</td><td>5 Nov 2026</td><td>JWT: JSON Web Tokens</td></tr>
      <tr><td>12</td><td>12 Nov 2026</td><td>Authentication/Authorization</td></tr>
      <tr><td>13–14</td><td>19, 26 Nov 2026</td><td>Integrated Project Support Topic</td></tr>
      <tr><td>—</td><td>30 Nov–11 Dec 2026</td><td><b>3rd Examination</b></td></tr></table>
      <p class="muted">Group A เรียนวันศุกร์ หัวข้อเดียวกัน เลื่อนช้ากว่า Group B 1 วัน · ลำดับหัวข้อจริงในคาบอาจสลับจากตารางนี้ (บทเรียนนี้ W4 = Database, W5 = Express)</p>`,
  },

  http: {
    type: 'concept', id: 'c-http', title: 'HTTP Protocol: Request และ Response',
    source: `${SRC} §01 HTTP Protocol & Web Application พื้นฐาน`, widget: 'http-parts',
    body: `<ul>
      <li>HTTP = <b>HyperText Transfer Protocol</b> — การสื่อสารระหว่าง client (browser) กับ server ผ่าน <b>HTTP Request</b> และ <b>HTTP Response</b></li>
      <li>HTTP Request มี 3 ส่วนที่เก็บ/ส่งข้อมูลได้: <b>Headers, Methods, Body</b></li>
      <li>HTTP Response มี 3 ส่วนหลัก: <b>Status Line, Header, Message Body (Payload)</b></li></ul>`,
  },

  architecture: {
    type: 'concept', id: 'c-architecture', title: 'Web Application Architecture: MPA, MVC modern, SPA',
    source: `${SRC} §Web Application Architecture`, widget: 'arch-tabs',
    body: '<p>เลือกแต่ละแบบเพื่อดูเส้นทางของข้อมูลระหว่าง client กับ server</p>',
    data: [
      { name: 'MPA', note: 'Multi-Page Application: สถาปัตยกรรมดั้งเดิม แต่ละหน้าโหลดใหม่ทั้งหน้าจาก server',
        chain: ['Client', 'url mapping / router', 'controller', 'view (template engine)', 'data access engine', 'database'] },
      { name: 'MVC modern', note: 'client ใช้ XMLHttpRequest คุยกับ server ผ่าน router → controller → model → data access engine',
        chain: ['Client (XMLHttpRequest)', 'router', 'controller', 'model', 'data access engine', 'database'] },
      { name: 'SPA', note: 'Single Page Application: client โหลด HTML/CSS/JS ครั้งแรก จากนั้นคุยกับ back-end ผ่าน RESTful API/Microservice ด้วย AJAX แลกข้อมูลเป็น JSON',
        chain: ['Client (โหลด HTML/CSS/JS ครั้งแรก)', 'AJAX แลก JSON', 'Back-end: RESTful API / Microservice'] },
    ],
  },

  json: {
    type: 'concept', id: 'c-json', title: 'JSON (JavaScript Object Notation)',
    source: `${SRC} §JSON`,
    body: `<ul><li>รูปแบบข้อมูลน้ำหนักเบา อ่าน/เขียนง่ายทั้งคนและเครื่อง</li>
      <li>มาจากส่วนหนึ่งของ JavaScript (ECMA-262 3rd Edition, ธ.ค. 1999) แต่เป็น <b>text format</b> ที่ independent จากภาษาใด ๆ</li></ul>
      ${code('{ "name": "John Doe" }')}`,
  },

  fullstack: {
    type: 'concept', id: 'c-fullstack', title: 'Full Stack Developer และ Web Development Roadmap',
    source: `${SRC} §Full Stack Developer, §Web Development Roadmap`,
    body: `<p>Full Stack Developer คือคนที่พัฒนาได้ทั้ง <b>client-side</b> (เช่น JavaScript/jQuery/Angular/Vue), <b>server-side</b> (เช่น Java/PHP/ASP/Python/Node.js) และ <b>database</b> (SQL/SQLite/MongoDB)</p>
      <table><tr><th>ด้าน</th><th>สิ่งที่ต้องรู้</th></tr>
      <tr><td>Front-End</td><td>HTML, CSS, JavaScript, Responsive Design, CSS framework (Bootstrap/Material/Tailwind), JS framework (React/Angular/Vue)</td></tr>
      <tr><td>Back-End</td><td>SQL/NoSQL, ภาษา (Java/PHP/C#/Python/Node.js), Framework (Spring Boot/Laravel/.NET/Django/Express+Prisma), Web Service, Microservice</td></tr></table>`,
  },

  webservice: {
    type: 'concept', id: 'c-webservice', title: 'Web Services: SOAP vs RESTful',
    source: `${SRC} §Web Services: SOAP vs RESTful`,
    body: `<table><tr><th></th><th>SOAP</th><th>RESTful</th></tr>
      <tr><td>คืออะไร</td><td>Simple Object Access Protocol — มาตรฐาน XML format</td><td>design approach ไม่ใช่ protocol</td></tr>
      <tr><td>รายละเอียด</td><td>กำหนดด้วย WSDL</td><td>สร้างโดย Roy Thomas Fielding (ผู้สร้าง HTTP เดียวกัน) เน้นประสิทธิภาพของ web service โดยใช้หลักการที่มีอยู่แล้วใน HTTP</td></tr></table>`,
  },

  nodejs: {
    type: 'concept', id: 'c-nodejs', title: 'Node.js คืออะไร และทำไมต้องเรียน',
    source: `${SRC} §02 Node.js คืออะไร, §ทำไมต้องเรียน Node.js`,
    body: `<ul><li>Node.js <b>ไม่ใช่ภาษาโปรแกรม</b> แต่เป็น <b>runtime</b> ที่แปลง JavaScript เป็น machine code — open source, ฟรี, รันได้หลายแพลตฟอร์ม, ใช้ JavaScript ฝั่ง server</li></ul>
      <p><b>ทำไมต้องเรียน:</b></p>
      <ul><li>ใช้ JavaScript ภาษาเดียวได้ทั้ง front-end และ back-end</li>
      <li>รองรับ asynchronous execution แบบ single thread ด้วย async/await — เร็วกว่าแบบ multi-threaded ในหลายกรณี</li>
      <li>สร้างได้ทั้ง command line app, web app, real-time chat, REST API</li></ul>`,
  },

  translators: {
    type: 'concept', id: 'c-translators', title: 'Compilation vs Interpretation vs Hybrid',
    source: `${SRC} §Compiler vs Interpreter vs Hybrid`,
    body: `<table><tr><th>แบบ</th><th>วิธีทำงาน</th><th>ตัวอย่างภาษา</th></tr>
      <tr><td>Compilation</td><td>แปลทั้งโปรแกรมเป็น binary ล่วงหน้า ก่อนรัน — เร็วตอนรัน แต่ portability ต่ำ, source code เป็นความลับ</td><td>C, C++, Go</td></tr>
      <tr><td>Interpretation</td><td>แปลทีละบรรทัดตอนรันจริง — dev เร็ว debug ง่าย แต่ช้ากว่า, ต้องแจก source code</td><td>(สไลด์ยกตัวอย่าง Python-style)</td></tr>
      <tr><td>Hybrid (byte code + VM/JIT)</td><td>compile เป็น byte code ก่อน แล้วรันผ่าน VM/Runtime (interpreter+JIT)</td><td>Java, Kotlin, Groovy, C# (.NET)</td></tr></table>`,
  },

  installFile: {
    type: 'concept', id: 'c-install-file', title: 'ติดตั้ง Node.js (nvm) และไฟล์ Node.js',
    source: `${SRC} §ติดตั้ง Node.js, §ไฟล์ Node.js คืออะไร`,
    body: `<p>ติดตั้งผ่าน nvm:</p>
      ${code('curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash\n\\. "$HOME/.nvm/nvm.sh"\nnvm install 22\nnode -v      # v22.14.0\nnpm -v       # 10.9.2')}
      <p>ไฟล์ Node.js คือไฟล์ <code>.js</code> (หรือ <code>.ts</code> สำหรับ TypeScript) ที่รันด้วยคำสั่ง <code>node</code> บน server ทำงานเมื่อมี event เกิดขึ้น (เช่น web request)</p>
      ${code("// myfirst.js — ตัวอย่าง interactive script\nconst readline = require('node:readline/promises');\nconst { stdin: input, stdout: output } = require('node:process');\n\nasync function askQuestion() {\n  const rl = readline.createInterface({ input, output });\n  try {\n    const name = await rl.question('What is your name? ');\n    const birthyear = await rl.question('What is your birth year in B.E.? ');\n    const age = new Date().getFullYear() - birthyear + 543;\n    console.log(`Thank you ${name}, aged ${age}!`);\n  } finally {\n    rl.close();\n  }\n}\naskQuestion();")}
      <p class="muted">สคริปต์นี้รับค่าจากคีย์บอร์ด (readline) ซึ่ง simulator ไม่รองรับ — ให้รันบนเครื่องตัวเองด้วย <code>node myfirst.js</code></p>`,
  },

  backendSummary: {
    type: 'concept', id: 'c-backend-summary', title: 'แนวคิด Backend เบื้องต้น และสรุปท้ายบท',
    source: `${SRC} §แนวคิด Backend เบื้องต้น (จาก transcript), §ตารางสรุปท้ายบท`,
    body: `<ul><li>Backend ต้อง provide การจัดการข้อมูล (data) ที่มักเก็บอยู่ใน database ให้ front-end ไปแสดงผลบน DOM ในเบราว์เซอร์ <i>(จาก transcript)</i></li>
      <li>การเขียน backend แบบสมัยใหม่ = การเขียน <b>RESTful API</b> <i>(จาก transcript)</i></li>
      <li>การจัดการข้อมูลมี 4 อย่างหลัก — อาจารย์เริ่มอธิบายด้วยตัวอักษร "C..." (น่าจะหมายถึง CRUD แต่ transcript ตัดก่อนอธิบายจบ จึงยังไม่ยืนยัน)</li></ul>
      <table><tr><th>หัวข้อ</th><th>ประเด็นสำคัญ</th></tr>
      <tr><td>HTTP</td><td>Request (Header/Method/Body) ↔ Response (Status/Header/Body)</td></tr>
      <tr><td>Web Architecture</td><td>MPA vs MVC (modern) vs SPA</td></tr>
      <tr><td>JSON</td><td>data format เบา อ่านง่าย มาจาก JS subset</td></tr>
      <tr><td>Full Stack</td><td>client + server + database</td></tr>
      <tr><td>Web Service</td><td>SOAP (XML/WSDL) vs RESTful (ใช้หลัก HTTP)</td></tr>
      <tr><td>Node.js</td><td>runtime แปลง JS → machine code, ไม่ใช่ภาษา</td></tr>
      <tr><td>Translator</td><td>Compilation vs Interpretation vs Hybrid (VM/JIT)</td></tr>
      <tr><td>Hello World App</td><td>require → createServer → listen</td></tr>
      <tr><td>Backend core</td><td>provide data management (CRUD) ผ่าน RESTful API</td></tr></table>`,
  },
};
```

- [ ] **Step 4: Verify in the browser (concepts + widgets)**

Temporarily point the scaffold at real concepts: in `content/w1.js` set `blocks: Object.values((await import('./w1-concepts.js')).concepts)` (Task 9 replaces this). Reload `lesson.html?m=w1` and confirm:
- `c-course-eval` shows four bars (30/20/30/20); `c-http` chips highlight the right line and update the caption; `c-architecture` tabs switch chains (MPA 6 nodes, MVC 6, SPA 3).
- Table blocks scroll horizontally *inside* the block at phone width (page itself does not: `document.documentElement.scrollWidth <= innerWidth`).
- `read_console_messages` with `onlyErrors: true` → none.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(w1): interactive widgets and 12 concept blocks" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

### Task 9: W1 experiments (5) + exercises (3), assembly, content tests

**Files:**
- Create: `content/w1-labs.js`, `tests/content.test.js`
- Modify: `content/w1.js` (replace the scaffold with the real 20-block assembly)

**Interfaces:**
- Consumes: `concepts` (Task 8); `WIDGETS['arch-flow'|'translator-sim']` (Task 8); block contract (Task 7); `runProject`, `runTests` (Task 5).
- Produces: `content/w1-labs.js` exports `experiments = { httpServer, contentType, archFlow, json, translator }` and `exercises = { hello, user, notFound }`; `content/w1.js` default export `{ id:'w1', title, sources, blocks }` with 20 blocks in this order: `c-agreements, c-course-eval, c-schedule, c-http, e-http-server, e-content-type, c-architecture, e-arch-flow, c-json, e-json, c-fullstack, c-webservice, c-nodejs, c-translators, e-translator, c-install-file, x-hello, x-user, x-404, c-backend-summary`.
- `tests/content.test.js` is generic: it covers every `content/wN.js` that exists (reused by Plans 2–5).

- [ ] **Step 1: Write the content test first** — `tests/content.test.js`

```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — the scaffold `content/w1.js` has 3 blocks, so `w1: block counts match the spec table` fails (concept 1 vs 12, …).

- [ ] **Step 3: Write the labs** — `content/w1-labs.js`

```js
const SRC = 'week1/W01-Introduction.md';

const HELLO_STARTER = `const http = require('node:http');

const listener = function (request, response) {
  // เขียนโค้ดตรงนี้: ตอบ status 200 พร้อมข้อความ Hello World
};

const server = http.createServer(listener);
server.listen(3000);
console.log('Server running at http://127.0.0.1:3000/');
`;

const HELLO_SOLUTION = `const http = require('node:http');

const listener = function (request, response) {
  response.writeHead(200);
  response.end('Hello World');
};

const server = http.createServer(listener);
server.listen(3000);
console.log('Server running at http://127.0.0.1:3000/');
`;

const USER_STARTER = `const http = require('node:http');

const listener = function (request, response) {
  if (request.url === '/') {
    response.writeHead(200);
    response.end('Hello World');
  }
  // เขียนโค้ดตรงนี้: ถ้า request.url === '/user' ตอบ JSON { name: 'John Doe' }
  // (อย่าลืมตั้ง Content-Type เป็น application/json)
};

const server = http.createServer(listener);
server.listen(3000);
`;

const USER_SOLUTION = `const http = require('node:http');

const listener = function (request, response) {
  if (request.url === '/user') {
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({ name: 'John Doe' }));
  } else if (request.url === '/') {
    response.writeHead(200);
    response.end('Hello World');
  }
};

const server = http.createServer(listener);
server.listen(3000);
`;

const NOTFOUND_STARTER = `const http = require('node:http');

const listener = function (request, response) {
  if (request.url === '/user') {
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({ name: 'John Doe' }));
  } else if (request.url === '/') {
    response.writeHead(200);
    response.end('Hello World');
  }
  // เขียนโค้ดตรงนี้: path อื่น ๆ ทั้งหมดต้องตอบ 404
};

const server = http.createServer(listener);
server.listen(3000);
`;

const NOTFOUND_SOLUTION = `const http = require('node:http');

const listener = function (request, response) {
  if (request.url === '/user') {
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({ name: 'John Doe' }));
  } else if (request.url === '/') {
    response.writeHead(200);
    response.end('Hello World');
  } else {
    response.writeHead(404);
    response.end('<Error: Page Not Found');
  }
};

const server = http.createServer(listener);
server.listen(3000);
`;

const rootTest = { name: 'GET / → 200 Hello World', steps: [{ request: { path: '/' }, expect: { status: 200, text: 'Hello World' } }] };
const userTest = {
  name: 'GET /user → 200 JSON { name: "John Doe" }',
  steps: [{ request: { path: '/user' }, expect: { status: 200, headers: { 'Content-Type': 'application/json' }, json: { name: 'John Doe' } } }],
};

export const experiments = {
  httpServer: {
    type: 'experiment', id: 'e-http-server', title: 'Hello World server แรก + ตัวยิง request',
    source: `${SRC} §สร้าง Node.js Web Application (Hello World)`,
    body: `<p>ขั้นตอนหลัก 3 อย่าง: import module (<code>require</code>) → create server → อ่าน request/ส่ง response</p>
      <p>กด <b>Run</b> แล้วใช้ตัวยิง request ส่ง <code>GET /</code> สังเกต status, header และ body ที่ได้ จากนั้นลองเปลี่ยน <code>200</code> เป็น <code>404</code> แล้ว Run ใหม่</p>`,
    files: {
      'my-first-app.js': `http = require('node:http');
listener = function (request, response) {
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.end('<h2 style="text-align: center;">Hello World</h2>');
};
server = http.createServer(listener);
server.listen(3000);
console.log('Server running at http://127.0.0.1:3000/');
`,
    },
  },

  contentType: {
    type: 'experiment', id: 'e-content-type', title: 'Routing ด้วย request.url และ Content-Type',
    source: `${SRC} §สร้าง Node.js Web Application (my-third-app.js)`,
    body: '<p>ส่ง request ไปที่ <code>/user</code>, <code>/</code> และ <code>/abc</code> เทียบ status กับ Content-Type ที่ได้ แล้วลองแก้ชื่อ <code>John Doe</code> เป็นชื่อของคุณ</p>',
    files: {
      'my-third-app.js': `http = require('node:http');
listener = function (request, response) {
  if (request.url === '/user') {
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({ name: 'John Doe' }));
  } else if (request.url === '/') {
    response.writeHead(200);
    response.end('Hello World');
  } else {
    response.writeHead(404);
    response.end('<Error: Page Not Found');
  }
};
server = http.createServer(listener);
server.listen(3000);
`,
    },
  },

  archFlow: {
    type: 'experiment', id: 'e-arch-flow', title: 'MPA vs SPA: คลิกลิงก์แล้วเกิดอะไรขึ้น',
    source: `${SRC} §Web Application Architecture (นิยาม MPA และ SPA)`, widget: 'arch-flow',
    body: '<p>กด "คลิกลิงก์ไปหน้าอื่น" หลาย ๆ ครั้ง เทียบว่า MPA โหลดทั้งหน้าใหม่ทุกครั้ง ส่วน SPA โหลด HTML/CSS/JS ครั้งแรกแล้วขอเฉพาะ JSON ผ่าน AJAX</p>',
  },

  json: {
    type: 'experiment', id: 'e-json', title: 'JSON คือข้อความ (text format)',
    source: `${SRC} §JSON, §สร้าง Node.js Web Application`,
    body: '<p>Run แล้วดูผลของ <code>JSON.stringify</code> และ <code>typeof</code> จากนั้นเพิ่ม property ใน object แล้ว Run ใหม่</p>',
    files: {
      'json.js': `const user = { name: 'John Doe' };
const text = JSON.stringify(user);
console.log(text);
console.log(typeof user);
console.log(typeof text);
`,
    },
  },

  translator: {
    type: 'experiment', id: 'e-translator', title: 'Compilation vs Interpretation ทีละขั้น',
    source: `${SRC} §Compiler vs Interpreter vs Hybrid (Compilation = แปลก่อนรัน, Interpretation = แปลทีละบรรทัดตอนรัน — ภาพประกอบด้วยโปรแกรมสมมติ)`,
    widget: 'translator-sim',
    body: '<p>เลือกวิธีแปล กด "ขั้นถัดไป" ดูลำดับ แล้วติ๊ก "บรรทัด 3 มีข้อผิดพลาด" เทียบว่าสองวิธีต่างกันตรงไหน</p>',
  },
};

export const exercises = {
  hello: {
    type: 'exercise', id: 'x-hello', title: 'โจทย์ 1: GET / ตอบ Hello World',
    source: `${SRC} §สร้าง Node.js Web Application (Hello World)`,
    body: '<p>เขียน <code>listener</code> ให้ตอบ status <b>200</b> พร้อมข้อความ <code>Hello World</code></p>',
    hint: 'ใช้ <code>response.writeHead(200)</code> แล้วจบด้วย <code>response.end(...)</code>',
    files: { 'app.js': HELLO_STARTER }, solution: HELLO_SOLUTION, tests: [rootTest],
  },
  user: {
    type: 'exercise', id: 'x-user', title: 'โจทย์ 2: GET /user ตอบ JSON',
    source: `${SRC} §สร้าง Node.js Web Application (my-third-app.js)`,
    body: '<p>เพิ่ม route <code>/user</code> ให้ตอบ JSON <code>{ "name": "John Doe" }</code> พร้อม <code>Content-Type: application/json</code> (route <code>/</code> ต้องยังทำงานเหมือนเดิม)</p>',
    hint: 'แปลง object เป็นข้อความด้วย <code>JSON.stringify({...})</code> และส่ง header ผ่านอาร์กิวเมนต์ที่สองของ <code>writeHead</code>',
    files: { 'app.js': USER_STARTER }, solution: USER_SOLUTION, tests: [rootTest, userTest],
  },
  notFound: {
    type: 'exercise', id: 'x-404', title: 'โจทย์ 3: path อื่น ๆ ตอบ 404',
    source: `${SRC} §สร้าง Node.js Web Application (my-third-app.js)`,
    body: '<p>path ที่ไม่ใช่ <code>/</code> และ <code>/user</code> ต้องตอบ status <b>404</b></p>',
    hint: 'ใช้ <code>else</code> ท้ายสุดของ <code>if … else if</code>',
    files: { 'app.js': NOTFOUND_STARTER }, solution: NOTFOUND_SOLUTION,
    tests: [
      rootTest, userTest,
      { name: 'GET /nothing → 404', steps: [{ request: { path: '/nothing' }, expect: { status: 404 } }] },
      { name: 'GET /abc → 404', steps: [{ request: { path: '/abc' }, expect: { status: 404 } }] },
    ],
  },
};
```

- [ ] **Step 4: Assemble the module** — replace `content/w1.js`

```js
import { concepts as C } from './w1-concepts.js';
import { experiments as E, exercises as X } from './w1-labs.js';

export default {
  id: 'w1',
  title: 'Introduction to Web Application & Node.js',
  sources: ['week1/W01-Introduction.md'],
  blocks: [
    C.agreements, C.courseEval, C.schedule, C.http,
    E.httpServer, E.contentType,
    C.architecture, E.archFlow,
    C.json, E.json,
    C.fullstack, C.webservice, C.nodejs, C.translators, E.translator,
    C.installFile,
    X.hello, X.user, X.notFound,
    C.backendSummary,
  ],
};
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test && npm run check-ratio`
Expected: all tests PASS (incl. `w1: block counts…`, three `starter code does NOT pass`, three `solution passes all tests`, five experiment-runs where applicable); `check-ratio` prints `w1: 60:25:15  ok` and five `(not built yet)` lines, exit 0.
If `e-http-server` fails with an "is not defined" style error, the loader's CJS wrapper is not sloppy-mode — fix `engine/loader.js` (`new Function` is sloppy by default; make sure no `'use strict'` was added).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(w1): 5 experiments, 3 exercises, assembled module and content tests" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 10: CodeMirror editor, end-to-end verification, wrap-up

**Files:**
- Modify: `js/editor.js`, `docs/specs/2026-09-20-int161-interactive-lesson-design.md` (§3 note about split content files)

**Interfaces:**
- Consumes/Produces: `createEditor(host, {value, onChange}): { getValue, setValue, focus }` — unchanged contract. CodeMirror 6 loads lazily from esm.sh; the textarea is shown immediately and stays as the fallback if the CDN import fails.

- [ ] **Step 1: Upgrade the editor** — replace `js/editor.js`

```js
let cmPromise = null;
function loadCodeMirror() {
  cmPromise ||= Promise.all([
    import('https://esm.sh/codemirror@6'),
    import('https://esm.sh/@codemirror/lang-javascript@6'),
    import('https://esm.sh/@codemirror/theme-one-dark@6'),
  ]).then(([cm, js, dark]) => ({ cm, js, dark })).catch(() => null);
  return cmPromise;
}

function createTextarea(host, value, onChange) {
  const ta = document.createElement('textarea');
  ta.className = 'code-input';
  ta.spellcheck = false;
  ta.setAttribute('autocapitalize', 'off');
  ta.value = value;
  ta.rows = Math.min(26, Math.max(6, value.split('\n').length + 1));
  ta.addEventListener('input', () => onChange(ta.value));
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
      onChange(ta.value);
    }
  });
  host.append(ta);
  return ta;
}

export function createEditor(host, { value = '', onChange = () => {} } = {}) {
  const ta = createTextarea(host, value, onChange);
  let view = null;

  loadCodeMirror().then((m) => {
    if (!m) return; // CDN unavailable: keep the textarea
    const { EditorView, basicSetup } = m.cm;
    view = new EditorView({
      doc: ta.value,
      parent: host,
      extensions: [
        basicSetup,
        m.js.javascript(),
        m.dark.oneDark,
        EditorView.updateListener.of((u) => {
          if (u.docChanged) { ta.value = u.state.doc.toString(); onChange(ta.value); }
        }),
      ],
    });
    ta.style.display = 'none';
  });

  return {
    getValue: () => (view ? view.state.doc.toString() : ta.value),
    setValue(v) {
      ta.value = v;
      if (view) view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: v } });
      else onChange(v);
    },
    focus: () => (view ? view.focus() : ta.focus()),
  };
}
```

- [ ] **Step 2: Amend the spec** — in `docs/specs/2026-09-20-int161-interactive-lesson-design.md` §3 tree, change `content/w1..w6.js   เนื้อหาแต่ละสัปดาห์` to `content/wN.js (+ wN-*.js ไฟล์ย่อยที่ wN.js นำมาประกอบ)   เนื้อหาแต่ละสัปดาห์`.

- [ ] **Step 3: Run the automated checks**

Run: `npm test && npm run check-ratio`
Expected: all PASS; `w1: 60:25:15  ok`.

- [ ] **Step 4: Full walkthrough in the browser** (`int161-lesson` preview, `http://localhost:8161/`)

1. Hub: W1 card shows the 3-colour bar `แนวคิด 60% · ทดลอง 25% · เขียนเอง 15%` and `ทำแล้ว 0/20 บล็อก`; W2–W6 dimmed.
2. `lesson.html?m=w1`: 20 blocks in the order listed in Task 9; after ~3 s `.cm-editor` exists in code blocks (`document.querySelectorAll('.cm-editor').length > 0`). If it does not (CDN blocked) the textarea must still work — say so in the report instead of treating it as a failure.
3. `e-http-server`: Run → `Server running at http://127.0.0.1:3000/`; send `GET /` → `HTTP 200 OK`, `content-type: text/html`, body with `<h2 …>Hello World</h2>`. Edit `200` → `404`, Run, send again → `HTTP 404 Not Found`.
4. `e-json`: Run → output lines `{"name":"John Doe"}`, `object`, `string`.
5. `e-arch-flow`: click "คลิกลิงก์ไปหน้าอื่น" 3× → MPA `4`, SPA AJAX `3`. `e-translator`: with the error box ticked, Compilation shows ❌ before any "รัน →", Interpretation shows the two "รัน →" lines before ❌.
6. Exercises: each starter → ✗ with a readable reason; paste each solution (open "ดูเฉลย" and copy) → ✓ "ผ่านครบทุกข้อ 🎉". Exercise 3 must fail while `/abc` still returns 200/no response.
7. Timeout: in `e-json` replace the code with `while (true) {}` → Run → after ~3 s the output says `โค้ดรันนานเกินไป (อาจมี loop ไม่จบ) — หยุดการทำงานแล้ว`; restore code → Run works again.
8. Unsupported module: replace with `require('left-pad')` → Run → `simulator ยังไม่รองรับโมดูล 'left-pad'`.
9. Reload: ✓ marks and edited code persist; top progress bar matches `n/20`; hub shows the new count.
10. `resize_window` mobile (375×812): `document.documentElement.scrollWidth <= window.innerWidth`; tables scroll inside their block. Then `colorScheme: 'dark'` screenshot for a concept, an experiment and an exercise block; reset with preset `desktop`.
11. `read_console_messages` with `onlyErrors: true` → none (CDN fetch failures excepted, if any).

Fix any failure at its cause (engine/content/UI), re-run `npm test`, and repeat the affected step.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ui): CodeMirror editor with textarea fallback; verify W1 end to end" -m "Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

## Plan 1 done when

- `npm test` passes; `npm run check-ratio` shows `w1: 60:25:15 ok`.
- Every step of Task 10 Step 4 passes in a real browser.
- `git log` shows one commit per task and the working tree is clean.
- Nothing under `interactive-lesson/` contains slides, recordings, credentials or a student ID (`git ls-files | grep -Ei '\.(pdf|pptx|mp4|m4a|docx)$'` prints nothing).

## Next plans (each gets its own plan file before work starts)

| Plan | Scope | Key new engine work |
|---|---|---|
| 2 | W2 + W3 | event-loop widget, `URL` routing exercises, layered-project multi-file exercises, bug-hunt block for W3 |
| 3 | W4 | `engine/mysql-sim.js` (query/execute, pool/connection, callback + promise APIs) and the `preset: 'mysql'` hook in `worker.js` |
| 4 | W5 | `engine/express-sim.js` (Router, middleware, Express 5 async errors) and `preset: 'express'` |
| 5 | W6 | PK/unique/FK constraints in mysql-sim, three error-shape lessons, assignment self-check (no solutions) |
| 6 | Deploy | confirm repo name + visibility with the user, create repo, enable GitHub Pages, verify the live URL |

