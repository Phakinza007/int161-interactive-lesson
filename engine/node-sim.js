import { EventEmitter } from './events.js';

class Server extends EventEmitter {
  #handlers = [];
  #port = null;
  #network;
  listening = false;
  constructor(network, handler) {
    super();
    this.#network = network;
    if (handler) this.#handlers.push(handler);
  }
  on(name, fn) {
    if (name === 'request') { this.#handlers.push(fn); return this; }
    return super.on(name, fn);
  }
  listen(port, ...rest) {
    this.#port = port;
    this.#network.listen(port, (req, res) => {
      const pending = this.#handlers.map((h) => h(req, res)).filter((r) => r && typeof r.then === 'function');
      return pending.length ? Promise.all(pending) : undefined;
    });
    this.listening = true;
    const cb = rest.find((a) => typeof a === 'function');
    if (cb) queueMicrotask(cb); // before the entry run resolves, so its console output is in the first snapshot
    return this;
  }
  close(cb) {
    if (this.#port !== null) this.#network.close(this.#port);
    this.listening = false;
    if (typeof cb === 'function') queueMicrotask(cb);
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
