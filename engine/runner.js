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
