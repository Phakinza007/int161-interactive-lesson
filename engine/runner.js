import { createNetwork } from './net-sim.js';
import { createNodeModules } from './node-sim.js';
import { createLoader } from './loader.js';
import { createMysqlModules } from './mysql-sim.js';
import { createExpressModules } from './express-sim.js';

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
  const network = createNetwork({
    onError: (e) => level('error')('Uncaught ' + describe(e)),
    // in-memory network: a handler that has not answered after this long never will
    responseTimeoutMs: fixtures.responseTimeoutMs ?? 300,
  });
  const node = createNodeModules({ network, files: fixtures.fs || {} });
  const pending = new Set();
  const idleHooks = [];
  // simulated async work (e.g. callback-style DB queries) registers here so the first output snapshot includes it
  const track = (p) => {
    pending.add(p);
    p.then(() => pending.delete(p), () => pending.delete(p));
    return p;
  };
  const onIdle = (fn) => { idleHooks.push(fn); };
  const ctx = { network, fixtures, console, track, onIdle };
  const builtins = { ...node, ...createMysqlModules(ctx), ...createExpressModules(ctx), ...(buildModules ? buildModules(ctx) : {}) };
  const session = { request: (req) => network.request(req), network, logs };
  const loader = createLoader({ files, builtins, globals: { console, process: node.process } });
  try {
    await loader.runEntry(entry);
    while (pending.size) await Promise.allSettled([...pending]);
    for (const fn of idleHooks) fn();
    return { ok: true, logs, error: null, session };
  } catch (e) {
    if (e && e.name === 'ProcessExit') {
      level('info')(`process.exit(${e.code})`);
      return { ok: true, logs, error: null, session };
    }
    return { ok: false, logs, error: { name: e.name, message: e.message, stack: e.stack }, session };
  }
}
