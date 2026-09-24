import test from 'node:test';
import assert from 'node:assert/strict';
import { runProject } from '../engine/runner.js';

const SEED = `create database sampledb; use sampledb;
create table subjects (id int primary key auto_increment, subject_code varchar(8) not null unique, subject_title varchar(60), credit int not null);
insert into subjects (subject_code, subject_title, credit) values ('INT 100', 'IT Fundamentals', 3), ('INT 101', 'Programming Fundamentals', 3), ('INT 102', 'Web Technology', 1);`;

const POOL = `import * as mysql from 'mysql2/promise'
const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '<your-password>', database: 'sampledb' })
`;

const run = (src, extra = {}) => runProject({ files: { 'a.js': src }, entry: 'a.js', fixtures: { mysql: { seed: SEED } }, ...extra });
const texts = (r) => r.logs.map((l) => l.text);

test('promise API: query returns [rows, fields]; header for INSERT with fields undefined', async () => {
  const r = await run(POOL + `
const [rows, fields] = await pool.query('SELECT * FROM subjects');
console.log(rows.length, fields.length, rows[0].subject_code);
const [res, f2] = await pool.query('INSERT INTO subjects (subject_code, subject_title, credit) VALUES (?, ?, ?)', ['INT 290', 'New Subject', 2]);
console.log(res.affectedRows, res.insertId, f2);
await pool.end();`);
  assert.equal(r.ok, true, r.error && r.error.message);
  assert.deepEqual(texts(r), ['3 4 INT 100', '1 4 undefined']);
});

test('default import works (import mysql from "mysql2/promise")', async () => {
  const r = await run(`import mysql from 'mysql2/promise';
const pool = mysql.createPool({ database: 'sampledb' });
const [rows] = await pool.query('SELECT COUNT(*) AS n FROM subjects');
console.log(rows[0].n);
await pool.end();`);
  assert.deepEqual(texts(r), ['3']);
});

test('unknown database (the slide says "sample"): error has code/errno/sqlMessage', async () => {
  const r = await run(`import * as mysql from 'mysql2/promise'
const pool = mysql.createPool({ database: 'sample' });
try { await pool.query('SELECT * FROM subjects'); } catch (e) { console.log(e.code, e.errno, e.message); }
await pool.end();`);
  assert.deepEqual(texts(r), ["ER_BAD_DB_ERROR 1049 Unknown database 'sample'"]);
});

test('createConnection (promise) rejects at once for an unknown database', async () => {
  const r = await run(`import * as mysql from 'mysql2/promise'
try { await mysql.createConnection({ database: 'nope' }); } catch (e) { console.log(e.code); }`);
  assert.deepEqual(texts(r), ['ER_BAD_DB_ERROR']);
});

test('callback API: results arrive in the first run (tracked), err is null on success', async () => {
  const r = await run(`import mysql from 'mysql2';
const pool = mysql.createPool({ database: 'sampledb' });
pool.query('SELECT * FROM subjects WHERE credit > ?', [2], (err, results, fields) => {
  if (err) { console.error('Query error:', err); return; }
  console.log('Results:', results.length, fields.length);
});
console.log('sent');
pool.end();`);
  assert.deepEqual(texts(r), ['sent', 'Results: 2 4']);
});

test('callback API: error goes to err; await on a callback query gives the mysql2 message', async () => {
  const r = await run(`import mysql from 'mysql2';
const pool = mysql.createPool({ database: 'sampledb' });
pool.query('SELECT * FROM nope', (err) => console.log('err:', err.code));
try { await pool.query('SELECT 1'); } catch (e) { console.log(e.message.slice(0, 60)); }
pool.end();`);
  assert.equal(texts(r)[0], 'You have tried to call .then(), .catch(), or invoked await o'); // first 60 chars
  assert.equal(texts(r)[1], 'err: ER_NO_SUCH_TABLE');
});

test('after pool.end() queries are rejected', async () => {
  const r = await run(POOL + `
await pool.end();
try { await pool.query('SELECT * FROM subjects'); } catch (e) { console.log(e.message); }`);
  assert.deepEqual(texts(r), ['Pool is closed.']);
});

test('a pool that is never ended (no server) explains that a real process would hang', async () => {
  const r = await run(POOL + `await pool.query('SELECT * FROM subjects');`);
  const infos = r.logs.filter((l) => l.level === 'info');
  assert.equal(infos.length, 1);
  assert.match(infos[0].text, /pool\.end\(\)/);
  const ended = await run(POOL + `await pool.query('SELECT * FROM subjects'); await pool.end();`);
  assert.equal(ended.logs.filter((l) => l.level === 'info').length, 0);
});

test('a pool is fine while an http server is listening (no hang hint)', async () => {
  const r = await run(`import * as http from 'node:http';
import * as mysql from 'mysql2/promise';
const pool = mysql.createPool({ database: 'sampledb' });
http.createServer(async (q, s) => { const [rows] = await pool.query('SELECT * FROM subjects'); s.end(String(rows.length)); }).listen(3000);`);
  assert.equal(r.logs.filter((l) => l.level === 'info').length, 0);
  assert.equal((await r.session.request({ path: '/' })).text, '3');
});

test('execute rejects undefined bind parameters; getConnection/release work', async () => {
  const r = await run(POOL + `
try { await pool.execute('SELECT * FROM subjects WHERE id = ?', [undefined]); } catch (e) { console.log(e.message); }
const conn = await pool.getConnection();
const [rows] = await conn.query('SELECT * FROM subjects WHERE id = ?', [2]);
console.log(rows[0].subject_code);
conn.release();
await pool.end();`);
  assert.deepEqual(texts(r), ['Bind parameters must not contain undefined. To pass SQL NULL specify JS null', 'INT 101']);
});

test('unsupported SQL and duplicate entry surface as errors with MySQL fields', async () => {
  const r = await run(POOL + `
try { await pool.query('SELECT * FROM subjects a JOIN subjects b ON a.id = b.id'); } catch (e) { console.log(e.code); }
try { await pool.query('INSERT INTO subjects (subject_code, credit) VALUES (?, ?)', ['INT 100', 1]); } catch (e) { console.log(e.errno, e.message); }
await pool.end();`);
  assert.deepEqual(texts(r), ['SIM_UNSUPPORTED_SQL', "1062 Duplicate entry 'INT 100' for key 'subjects.subject_code'"]);
});

test('without a seed fixture the database does not exist', async () => {
  const r = await runProject({ files: { 'a.js': POOL + `try { await pool.query('SELECT 1'); } catch (e) { console.log(e.code); } await pool.end();` }, entry: 'a.js' });
  assert.deepEqual(texts(r), ['ER_BAD_DB_ERROR']);
});
