import { EventEmitter } from './events.js';

export const STATUS_TEXT = {
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
  let timedOut = false; // once a handler has proven unresponsive, later waits are short
  return {
    listen(port, handler) { servers.set(port, handler); },
    close(port) { servers.delete(port); },
    isListening() { return servers.size > 0; },
    request({ method = 'GET', path = '/', headers = {}, body, port } = {}) {
      const handler = port !== undefined ? servers.get(port) : [...servers.values()].pop();
      if (!handler) {
        return Promise.reject(new Error('ยังไม่มี server ที่ listen อยู่ (ต้องเรียก server.listen(...) ก่อน)'));
      }
      const hostPort = port !== undefined ? port : ([...servers.keys()].pop() ?? 3000);
      const reqHeaders = { host: `localhost:${hostPort}` };
      for (const [k, v] of Object.entries(headers)) reqHeaders[k.toLowerCase()] = String(v);
      let payload = body;
      if (payload !== undefined && typeof payload !== 'string') {
        payload = JSON.stringify(payload);
        if (!reqHeaders['content-type']) reqHeaders['content-type'] = 'application/json';
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          timedOut = true;
          reject(new Error('handler ไม่ได้เรียก res.end() ภายในเวลาที่กำหนด'));
        }, timedOut ? Math.min(responseTimeoutMs, 40) : responseTimeoutMs);
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
