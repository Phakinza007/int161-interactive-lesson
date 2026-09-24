// Express 5 simulator on top of the in-memory network (see docs/plans/2026-09-24-plan-4-w5-express.md).
import { STATUS_TEXT } from './net-sim.js';

const METHODS = ['get', 'post', 'put', 'delete', 'patch'];
const byteLength = (s) => new TextEncoder().encode(s).length;
const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const page = (text) => `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Error</title>\n</head>\n<body>\n<pre>${text}</pre>\n</body>\n</html>\n`;

function parseSearch(search) {
  const query = {};
  for (const [k, v] of new URLSearchParams(search)) {
    if (Object.prototype.hasOwnProperty.call(query, k)) query[k] = [].concat(query[k], v);
    else query[k] = v;
  }
  return query;
}

// path -> matcher(pathname) => { params, consumed } | null
function compilePath(path, end) {
  if (path instanceof RegExp) {
    return (p) => {
      const m = path.exec(p);
      if (!m) return null;
      return { params: { ...(m.groups || {}) }, consumed: end ? p : m[0] };
    };
  }
  const segs = String(path).split('/').filter(Boolean).map((s) => (s.startsWith(':') ? { param: s.slice(1) } : { lit: s.toLowerCase() }));
  return (p) => {
    const parts = p.split('/').filter(Boolean);
    if (end ? parts.length !== segs.length : parts.length < segs.length) return null;
    const params = {};
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].param) {
        try { params[segs[i].param] = decodeURIComponent(parts[i]); } catch { params[segs[i].param] = parts[i]; }
      } else if (parts[i].toLowerCase() !== segs[i].lit) return null;
    }
    return { params, consumed: segs.length ? '/' + parts.slice(0, segs.length).join('/') : '' };
  };
}

function invoke(fn, err, req, res, next) {
  try {
    let ret;
    if (err) {
      if (fn.length !== 4) return next(err); // normal middleware is skipped while an error is pending
      ret = fn(err, req, res, next);
    } else {
      if (fn.length === 4) return next(); // error handlers are skipped when there is no error
      ret = fn(req, res, next);
    }
    if (ret && typeof ret.then === 'function') ret.then(undefined, (e) => next(e || new Error('Promise rejected with a falsy value'))); // Express 5
  } catch (e) {
    next(e);
  }
}

function makeCore() {
  const layers = [];
  const addLayer = (method, path, fns, mount) => {
    const matcher = compilePath(path, !mount);
    for (const fn of fns.flat(Infinity)) {
      if (typeof fn !== 'function') throw new TypeError(`Route handler must be a function but got ${fn === null ? 'null' : typeof fn}`);
      layers.push({ method, matcher, fn, mount });
    }
  };
  const dispatch = (req, res, done) => {
    const saved = { url: req.url, baseUrl: req.baseUrl, params: req.params, path: req.path };
    let idx = 0;
    const next = (err) => {
      if (err === 'route' || err === 'router') err = new Error("simulator ยังไม่รองรับ next('route') และ next('router')");
      req.url = saved.url; req.baseUrl = saved.baseUrl; req.path = saved.path;
      while (idx < layers.length) {
        const layer = layers[idx++];
        if (layer.method && layer.method !== 'all' && layer.method !== req.method.toLowerCase()) continue;
        const m = layer.matcher(saved.path);
        if (!m) continue;
        req.params = m.params;
        if (layer.mount) {
          const rest = saved.path.slice(m.consumed.length) || '/';
          req.baseUrl = saved.baseUrl + m.consumed;
          req.path = rest;
          req.url = rest + req._search;
        }
        return invoke(layer.fn, err, req, res, next);
      }
      Object.assign(req, saved);
      done(err);
    };
    next();
  };
  return { addLayer, dispatch };
}

function attachMethods(target, core) {
  target.use = (...args) => {
    let path = '/';
    if (typeof args[0] === 'string' || args[0] instanceof RegExp) path = args.shift();
    core.addLayer(null, path, args, true);
    return target;
  };
  for (const m of [...METHODS, 'all']) {
    target[m] = (path, ...fns) => { core.addLayer(m, path, fns, false); return target; };
  }
}

function finalHandler(err, req, res) {
  if (res.headersSent) return;
  const send = (status, text) => {
    res.statusCode = status;
    res.setHeader('content-security-policy', "default-src 'none'");
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.setHeader('content-length', String(byteLength(page(text))));
    res.end(page(text));
  };
  if (!err) {
    const pathname = req.originalUrl.split('?')[0];
    return send(404, `Cannot ${req.method} ${escapeHtml(pathname)}`);
  }
  let status = err && (err.status ?? err.statusCode);
  if (!(Number.isInteger(status) && status >= 400 && status < 600)) status = res.statusCode >= 400 ? res.statusCode : 500;
  const head = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  send(status, `${escapeHtml(head)}<br> &nbsp; &nbsp;at (stack trace omitted by the simulator)`);
}

function augment(req, res) {
  const url = req.url;
  const q = url.indexOf('?');
  req._search = q === -1 ? '' : url.slice(q);
  req.originalUrl = url;
  req.baseUrl = '';
  req.path = (q === -1 ? url : url.slice(0, q)) || '/';
  req.params = {};
  req.query = parseSearch(req._search.slice(1));
  req.body = undefined;
  req.get = req.header = (name) => req.headers[String(name).toLowerCase()];

  const sendBody = (body) => {
    if (res.statusCode === 204 || res.statusCode === 304) { res.end(); return res; }
    const text = body === undefined || body === null ? '' : String(body);
    res.setHeader('content-length', String(byteLength(text)));
    res.end(text);
    return res;
  };
  res.setHeader('x-powered-by', 'Express');
  res.status = (code) => { res.statusCode = code; return res; };
  res.set = res.header = (name, value) => {
    if (name !== null && typeof name === 'object') for (const [k, v] of Object.entries(name)) res.setHeader(k, v);
    else res.setHeader(name, value);
    return res;
  };
  res.get = (name) => res.getHeader(name);
  res.json = (obj) => {
    if (res.getHeader('content-type') === undefined) res.setHeader('content-type', 'application/json; charset=utf-8');
    return sendBody(JSON.stringify(obj));
  };
  res.send = (body) => {
    if (body !== null && typeof body === 'object') return res.json(body);
    if (res.getHeader('content-type') === undefined) res.setHeader('content-type', 'text/html; charset=utf-8');
    return sendBody(body);
  };
  res.sendStatus = (code) => {
    res.statusCode = code;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    return sendBody(STATUS_TEXT[code] ?? String(code));
  };
}

function createApp(network) {
  const core = makeCore();
  const handle = (req, res) => {
    augment(req, res);
    core.dispatch(req, res, (err) => finalHandler(err, req, res));
  };
  const app = (req, res) => handle(req, res);
  attachMethods(app, core);
  app.handle = handle;
  app.listen = (port, ...rest) => {
    const cb = rest.find((a) => typeof a === 'function');
    network.listen(port, handle);
    if (cb) queueMicrotask(() => cb());
    return {
      listening: true,
      close(done) { network.close(port); if (typeof done === 'function') queueMicrotask(done); },
      on() { return this; },
    };
  };
  return app;
}

function createRouter() {
  const core = makeCore();
  const router = function router(req, res, next) { core.dispatch(req, res, next); };
  attachMethods(router, core);
  return router;
}

function jsonParser() {
  return function jsonParser(req, res, next) {
    const ct = String(req.headers['content-type'] || '');
    if (!/application\/json/i.test(ct) || req.body !== undefined) return next();
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      if (!raw.trim()) return next();
      try {
        req.body = JSON.parse(raw);
      } catch (e) {
        e.status = 400;
        e.statusCode = 400;
        e.type = 'entity.parse.failed';
        return next(e);
      }
      next();
    });
  };
}

export function createExpressModules({ network }) {
  const express = () => createApp(network);
  express.Router = createRouter;
  express.json = jsonParser;
  return { express };
}
