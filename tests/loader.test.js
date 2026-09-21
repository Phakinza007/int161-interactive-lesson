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
