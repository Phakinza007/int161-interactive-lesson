import { createSqlServer } from './sql-engine.js';

const CALLBACK_AWAIT_MESSAGE = "You have tried to call .then(), .catch(), or invoked await on the result of query that is not a promise, which is a programming error. Try calling con.promise().query(), or require('mysql2/promise') instead of 'mysql2' for a promise-compatible version of the query interface.";
const HANG_HINT = '(simulator) โปรแกรมยังไม่จบ: ยังมี pool/connection ที่ไม่ได้ปิด — ใน Node จริงโปรแกรมจะค้างจนกด Ctrl+C ให้เรียก await pool.end() เมื่อทำงานเสร็จ';

const closedError = (what) => Object.assign(
  new Error(what === 'pool' ? 'Pool is closed.' : "Can't add new command when connection is in closed state"),
  { code: what === 'pool' ? 'POOL_CLOSED' : 'PROTOCOL_ENQUEUE_AFTER_QUIT', fatal: false },
);

export function createMysqlModules({ fixtures = {}, track, onIdle, console, network }) {
  let server = null;
  const getServer = () => (server ||= createSqlServer({ seed: fixtures.mysql && fixtures.mysql.seed }));
  const open = new Set();
  let hooked = false;
  const hook = () => {
    if (hooked) return;
    hooked = true;
    onIdle(() => { if (open.size && !network.isListening()) console.info(HANG_HINT); });
  };

  const normalize = (sql, values) => (sql && typeof sql === 'object' ? { sql: sql.sql, values: sql.values } : { sql, values });

  // shared "handle" behind pools and connections: one SQL session + open/closed state
  // pooled connections belong to their pool: they are not "open" on their own (pool.end() closes everything)
  const makeHandle = (config, kind, { pooled = false } = {}) => {
    const handle = { config, kind, closed: false, session: null };
    if (!pooled) { open.add(handle); hook(); }
    handle.getSession = () => (handle.session ||= getServer().connect({ database: config && config.database }));
    // `closed` is decided when the query is ISSUED, so pool.query(...); pool.end(); still lets the query finish
    handle.exec = (sqlIn, valuesIn, { strict = false, closed = handle.closed } = {}) => {
      const { sql, values } = normalize(sqlIn, valuesIn);
      if (closed) throw closedError(kind);
      if (strict && Array.isArray(values) && values.some((v) => v === undefined)) {
        throw new Error('Bind parameters must not contain undefined. To pass SQL NULL specify JS null');
      }
      const r = handle.getSession().query(sql, values);
      return r.type === 'rows' ? [r.rows, r.fields] : [r.header, undefined];
    };
    handle.close = () => { handle.closed = true; open.delete(handle); };
    return handle;
  };

  // ----- promise API -----
  const promiseApi = (handle) => {
    const run = (strict) => (sql, values) => {
      const closed = handle.closed;
      return track(Promise.resolve().then(() => handle.exec(sql, values, { strict, closed })));
    };
    return { query: run(false), execute: run(true) };
  };

  const promiseConnection = (config, opts) => {
    const handle = makeHandle(config, 'connection', opts);
    return { ...promiseApi(handle), release() {}, end: () => track(Promise.resolve().then(() => handle.close())), config };
  };

  const promisePool = (config) => {
    const handle = makeHandle(config, 'pool');
    return {
      ...promiseApi(handle),
      config,
      getConnection: () => track(Promise.resolve().then(() => {
        if (handle.closed) throw closedError('pool');
        handle.getSession(); // surfaces "Unknown database" like a real connect
        return promiseConnection(config, { pooled: true });
      })),
      end: () => track(Promise.resolve().then(() => handle.close())),
    };
  };

  // ----- callback API -----
  const callbackApi = (handle) => {
    const run = (strict) => (sql, values, cb) => {
      if (typeof values === 'function') { cb = values; values = undefined; }
      const closed = handle.closed;
      // callbacks fire on a later macrotask (like real I/O), after the current code and any awaits
      track(new Promise((resolve) => setTimeout(resolve, 0)).then(() => {
        let out;
        try { out = handle.exec(sql, values, { strict, closed }); } catch (e) {
          if (cb) { try { cb(e); } catch (x) { console.error(`Uncaught ${x.name}: ${x.message}`); } } else console.error(e);
          return;
        }
        if (cb) { try { cb(null, out[0], out[1]); } catch (x) { console.error(`Uncaught ${x.name}: ${x.message}`); } }
      }));
      const notPromise = () => { throw new Error(CALLBACK_AWAIT_MESSAGE); };
      return { then: notPromise, catch: notPromise, on() { return this; } };
    };
    return { query: run(false), execute: run(true) };
  };

  const callbackConnection = (config, opts) => {
    const handle = makeHandle(config, 'connection', opts);
    return {
      ...callbackApi(handle), config,
      end(cb) { handle.close(); if (cb) queueMicrotask(() => cb(null)); },
    };
  };

  const callbackPool = (config) => {
    const handle = makeHandle(config, 'pool');
    return {
      ...callbackApi(handle), config,
      getConnection(cb) {
        track(Promise.resolve().then(() => {
          try {
            if (handle.closed) throw closedError('pool');
            handle.getSession();
            const c = callbackConnection(config, { pooled: true });
            c.release = () => {};
            cb(null, c);
          } catch (e) { cb(e); }
        }));
      },
      end(cb) { handle.close(); if (cb) queueMicrotask(() => cb(null)); },
    };
  };

  return {
    mysql2: {
      createPool: (config) => callbackPool(config),
      createConnection: (config) => callbackConnection(config),
    },
    'mysql2/promise': {
      createPool: (config) => promisePool(config),
      createConnection: (config) => track(Promise.resolve().then(() => {
        getServer().connect({ database: config && config.database }); // throws for an unknown database
        return promiseConnection(config);
      })),
    },
  };
}
