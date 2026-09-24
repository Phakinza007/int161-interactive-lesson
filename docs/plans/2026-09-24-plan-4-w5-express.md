# INT161 Interactive Lesson — Plan 4: W5 (Express.js) + Express simulator

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline, task by task).

**Goal:** Add an Express 5 simulator (`engine/express-sim.js`) and module W5 (6 concept / 5 experiment / 9 exercise = 20 blocks). The simulator is also the foundation of W6 (error-handling middleware).

**Architecture:** `express-sim` builds on the in-memory network: `app.listen()` registers a Node-style `(req, res)` handler; a small router core matches `:param` paths and mounts (`app.use(path, router)`); `req`/`res` are augmented (`params`, `query`, `body`, `res.status().json()`); errors flow through `next(err)` to 4-argument handlers, and async handler rejections are forwarded automatically (Express 5). `runProject` registers `express` automatically alongside the MySQL modules.

**Spec:** §4.3 · **Builds on:** Plans 1–3 (+ Execution notes).

**Sources:** `week5/05-INT161-Express-Framework.pdf` (slide text) and, for the project layout/CRUD style, `week6/express-template` (its DB password is **not** copied — placeholder only).

## Global Constraints

- Content only from the W5 slides (+ the ESM project template layout); no outside Express features in lessons. The simulator may implement more than the lessons use, but unsupported calls must fail loudly (TypeError / clear message), never silently.
- W5 = exactly 6 concept / 5 experiment / 9 exercise. Starters fail, solutions pass (`tests/content.test.js`).
- Fidelity the lessons rely on: `res.json()` → `Content-Type: application/json; charset=utf-8`; `res.status(n)` alone does **not** send (request hangs → our "res.end() not called" message); `res.send(string)` → `text/html; charset=utf-8`; `req.query` repeated keys become arrays; `req.body` is `undefined` unless `express.json()` ran; path matching is case-insensitive with optional trailing slash; unmatched route → status 404, HTML `Cannot <METHOD> <path>`; unhandled error → status `err.status || err.statusCode || 500`, HTML `<pre>` message (dev-mode style); `X-Powered-By: Express` header present.
- No password/secret anywhere. Nothing is pushed without asking the user.

## Task 1: `engine/express-sim.js`

**Interface:** default export function `express()` (also `require('express')`, `import express from 'express'`, `import * as express from 'express'`), with `express.Router()`, `express.json()`.
- `app.use([path], ...handlers)`, `app.get/post/put/delete/patch/all(path, ...handlers)`, `app.listen(port, cb?) → server{close,on}`; handlers/arrays flattened; router objects are callable middleware; `app.handle(req, res)`.
- Handler signatures: `(req,res,next)` normal, `(err,req,res,next)` (arity 4) error handler. `next()` continues, `next(err)` jumps to the next error handler, `next('route')` is not supported (loud error).
- Errors: sync `throw` → `next(err)`; a returned promise that rejects → `next(err)` (Express 5); an error handler that itself throws → next error handler / default handler.
- `req`: `method, url, originalUrl, baseUrl, path, params, query, body, headers, get(name), header(name)`; `res`: `status(n)`, `json`, `send`, `end`, `set/header/setHeader`, `sendStatus`, `type`? (not supported), `headersSent`.
- Paths: static segments (case-insensitive), `:name` params (decoded), RegExp paths, `'/'`; trailing slash optional; `use(path)` matches a prefix at segment boundaries and strips it from `req.url` while `req.originalUrl` keeps the full URL.
- `express.json()`: parses when `Content-Type` includes `application/json` and a body exists; invalid JSON → `err.status = 400` (SyntaxError message) via `next(err)`; otherwise `req.body` stays `undefined`.
- Defaults as in Global Constraints (404 HTML, error HTML, `X-Powered-By`).

- [ ] Tests first (`tests/express-sim.test.js`) through `runProject` + `session.request`; each behaviour above; then implement; auto-register `express` in `runProject`; commit.

## Task 2: W5 content

**Files:** `content/w5-concepts.js`, `content/w5-labs.js`, `content/w5.js`, `js/modules.js` (`w5.ready`).

Concepts (6): `c-express-what` (objectives, what Express is, MEAN/MERN, key concepts, raw Node vs Express), `c-install-project` (npm install, `@version`, `import`, ESM template: `"type": "module"`, folders `configs/ repositories/ services/ routes/`), `c-req-res` (`req.params/query/body`, `res.json`, `res.status()` chain), `c-layers-express` (Controller / Service / Repository table + hospital analogy), `c-routing` (`router.METHOD(PATH, HANDLER)`, string/regex paths, the Router example), `c-middleware` (definition, `next()`, 5 categories, `app.use(express.json())`).

Experiments (5): `e-first-express` (slide `app.put('/api/subjects/:id')`), `e-status-chain` (`res.status(201)` alone hangs, `.json()` sends), `e-middleware-order` (logger + `express.json()` + echo; remove the parser → `req.body` undefined), `e-router-mount` (Router at `/api/subjects`; unknown path → default 404 page), `e-layered-crud` (ESM template project + MySQL fixtures).

Exercises (9): `x-hello-express`, `x-params` (params + query + body echo exactly as the slide), `x-status-chain` (201 + body), `x-router` (Router with `GET /` and `GET /:id` incl. 404 JSON), `x-route-read` (route → service, slide 404 pattern), `x-route-create` (POST via `req.body`, 201), `x-route-update-delete` (PUT 200/404, DELETE 204/404), `x-app-wiring` (`express.json()` + mount + listen), `x-middleware-logger` (`(req,res,next)` logger calling `next()`, verified by log lines).

- [ ] Write; `npm test`; `npm run check-ratio`; commit.

## Task 3: Browser verification and wrap-up

- [ ] Every W5 experiment responds; all 9 exercises fail→pass; execution notes; commit. Do not push.

## Execution notes

(filled in while running)
