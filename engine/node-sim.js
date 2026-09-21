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
