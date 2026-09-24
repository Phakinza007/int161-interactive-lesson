import test from 'node:test';
import assert from 'node:assert/strict';
import { createSqlServer, splitStatements, SqlError } from '../engine/sql-engine.js';

const SEED = `create database sampledb;
use sampledb;
create table subjects
(
   id int primary key auto_increment,
   subject_code varchar(8) not null unique,
   subject_title varchar(60),
   credit int not null
);
insert into subjects (subject_code, subject_title, credit)
values ('INT 100', 'IT Fundamentals', 3),
    ('INT 101', 'Programming Fundamentals', 3),
    ('INT 102', 'Web Technology', 1);`;

const setup = () => {
  const server = createSqlServer({ seed: SEED });
  return { server, s: server.connect({ database: 'sampledb' }) };
};
const rejectsWith = (fn, code, errno, msg) => {
  assert.throws(fn, (e) => {
    assert.ok(e instanceof SqlError, `not a SqlError: ${e && e.message}`);
    assert.equal(e.code, code);
    if (errno) assert.equal(e.errno, errno);
    if (msg instanceof RegExp) assert.match(e.sqlMessage, msg); else if (msg) assert.equal(e.sqlMessage, msg);
    assert.equal(e.message, e.sqlMessage);
    return true;
  });
};

test('seed script builds the table; SELECT * returns plain objects in column order', () => {
  const { s } = setup();
  const r = s.query('SELECT * FROM subjects');
  assert.equal(r.type, 'rows');
  assert.equal(r.rows.length, 3);
  assert.deepEqual(r.rows[0], { id: 1, subject_code: 'INT 100', subject_title: 'IT Fundamentals', credit: 3 });
  assert.deepEqual(Object.keys(r.rows[0]), ['id', 'subject_code', 'subject_title', 'credit']);
  assert.deepEqual(r.fields.map((f) => f.name), ['id', 'subject_code', 'subject_title', 'credit']);
});

test('WHERE id = ? matches a numeric string against an int column', () => {
  const { s } = setup();
  assert.equal(s.query('SELECT * FROM subjects WHERE id = ?', ['2']).rows[0].subject_code, 'INT 101');
  assert.equal(s.query('SELECT * FROM subjects WHERE id = ?', [2]).rows.length, 1);
  assert.equal(s.query('SELECT * FROM subjects WHERE id = ?', [99]).rows.length, 0);
});

test('string comparison is case-insensitive (default MySQL collation)', () => {
  const { s } = setup();
  assert.equal(s.query('SELECT * FROM subjects WHERE subject_code = ?', ['int 101']).rows[0].id, 2);
});

test('column list, ORDER BY (multiple keys), LIMIT/OFFSET, COUNT(*)', () => {
  const { s } = setup();
  assert.deepEqual(s.query('SELECT subject_code FROM subjects ORDER BY credit DESC, id DESC LIMIT 2').rows,
    [{ subject_code: 'INT 101' }, { subject_code: 'INT 100' }]);
  assert.deepEqual(s.query('SELECT id FROM subjects ORDER BY id LIMIT 1 OFFSET 1').rows, [{ id: 2 }]);
  assert.deepEqual(s.query('SELECT COUNT(*) AS n FROM subjects').rows, [{ n: 3 }]);
  assert.deepEqual(s.query('SELECT COUNT(*) FROM subjects WHERE credit = 1').rows, [{ 'COUNT(*)': 1 }]);
});

test('WHERE: AND / OR / NOT / parentheses / IN / LIKE / IS NULL / comparison operators', () => {
  const { s } = setup();
  const ids = (sql, v) => s.query(sql, v).rows.map((r) => r.id);
  assert.deepEqual(ids('SELECT * FROM subjects WHERE credit > ? AND (subject_code LIKE ? OR id = 3)', [2, 'INT 10%']), [1, 2]);
  assert.deepEqual(ids('SELECT * FROM subjects WHERE id IN (1, 3)'), [1, 3]);
  assert.deepEqual(ids('SELECT * FROM subjects WHERE NOT credit = 3'), [3]);
  assert.deepEqual(ids('SELECT * FROM subjects WHERE credit <> 3'), [3]);
  assert.deepEqual(ids('SELECT * FROM subjects WHERE credit >= 3 AND id != 1'), [2]);
  s.query('INSERT INTO subjects (subject_code, credit) VALUES (?, ?)', ['GEN 1', 2]);
  assert.deepEqual(ids('SELECT * FROM subjects WHERE subject_title IS NULL'), [4]);
  assert.deepEqual(ids('SELECT * FROM subjects WHERE subject_title IS NOT NULL'), [1, 2, 3]);
});

test('INSERT returns a ResultSetHeader; auto_increment never reuses ids (the "id 19, not 18" lesson)', () => {
  const { s } = setup();
  const a = s.query('INSERT INTO subjects (subject_code, subject_title, credit) VALUES (?, ?, ?)', ['INT 290', 'New Subject', 2]);
  assert.equal(a.type, 'header');
  assert.deepEqual(a.header, { fieldCount: 0, affectedRows: 1, insertId: 4, info: '', serverStatus: 2, warningStatus: 0, changedRows: 0 });
  assert.equal(s.query('DELETE FROM subjects WHERE id = ?', [4]).header.affectedRows, 1);
  assert.equal(s.query('INSERT INTO subjects (subject_code, credit) VALUES (?, ?)', ['INT 750', 3]).header.insertId, 5);
});

test('multi-row INSERT: info line, first generated id, all-or-nothing on failure', () => {
  const { s } = setup();
  const r = s.query("INSERT INTO subjects (subject_code, credit) VALUES ('A 1', 1), ('A 2', 2)");
  assert.equal(r.header.affectedRows, 2);
  assert.equal(r.header.insertId, 4);
  assert.equal(r.header.info, 'Records: 2  Duplicates: 0  Warnings: 0');
  rejectsWith(() => s.query("INSERT INTO subjects (subject_code, credit) VALUES ('B 1', 1), ('INT 100', 2)"), 'ER_DUP_ENTRY', 1062);
  assert.equal(s.query('SELECT COUNT(*) AS n FROM subjects').rows[0].n, 5); // 'B 1' was rolled back
});

test('UPDATE header: affectedRows = matched, changedRows = actually changed, info text', () => {
  const { s } = setup();
  const u = s.query('UPDATE subjects SET subject_code = ?, subject_title = ?, credit = ? WHERE id = ?', ['INT 290', 'New Subject test update', 3, 1]);
  assert.equal(u.header.affectedRows, 1);
  assert.equal(u.header.changedRows, 1);
  assert.equal(u.header.info, 'Rows matched: 1  Changed: 1  Warnings: 0');
  const same = s.query('UPDATE subjects SET credit = ? WHERE id = ?', [3, 1]);
  assert.equal(same.header.affectedRows, 1);
  assert.equal(same.header.changedRows, 0);
  assert.equal(s.query('UPDATE subjects SET credit = 9 WHERE id = 999').header.affectedRows, 0);
});

test('DELETE header and DELETE without WHERE', () => {
  const { s } = setup();
  assert.equal(s.query('DELETE FROM subjects WHERE id = ?', [1]).header.affectedRows, 1);
  assert.equal(s.query('DELETE FROM subjects WHERE id = ?', [1]).header.affectedRows, 0);
  assert.equal(s.query('DELETE FROM subjects').header.affectedRows, 2);
});

test('UNIQUE violation: exact MySQL message, case-insensitive, on INSERT and on UPDATE', () => {
  const { s } = setup();
  rejectsWith(() => s.query('INSERT INTO subjects (subject_code, credit) VALUES (?, ?)', ['INT 100', 1]),
    'ER_DUP_ENTRY', 1062, "Duplicate entry 'INT 100' for key 'subjects.subject_code'");
  rejectsWith(() => s.query('INSERT INTO subjects (subject_code, credit) VALUES (?, ?)', ['int 100', 1]), 'ER_DUP_ENTRY', 1062);
  rejectsWith(() => s.query('UPDATE subjects SET subject_code = ? WHERE id = ?', ['INT 101', 1]),
    'ER_DUP_ENTRY', 1062, "Duplicate entry 'INT 101' for key 'subjects.subject_code'");
});

test('composite PRIMARY KEY duplicate uses key name PRIMARY and joins values with -', () => {
  const server = createSqlServer({ seed: `create database d; use d;
    create table payments (customer int not null, check_no varchar(10) not null, amount double, primary key (customer, check_no));
    insert into payments values (1, 'HQ1', 10.5);` });
  const s = server.connect({ database: 'd' });
  rejectsWith(() => s.query("INSERT INTO payments (customer, check_no, amount) VALUES (1, 'HQ1', 5)"),
    'ER_DUP_ENTRY', 1062, "Duplicate entry '1-HQ1' for key 'payments.PRIMARY'");
  assert.equal(s.query("INSERT INTO payments (customer, check_no, amount) VALUES (1, 'HQ2', 5)").header.affectedRows, 1);
});

test('NOT NULL: omitted column without default (1364) and explicit NULL (1048)', () => {
  const { s } = setup();
  rejectsWith(() => s.query('INSERT INTO subjects (subject_code) VALUES (?)', ['X 1']), 'ER_NO_DEFAULT_FOR_FIELD', 1364, "Field 'credit' doesn't have a default value");
  rejectsWith(() => s.query('INSERT INTO subjects (subject_code, credit) VALUES (?, ?)', ['X 1', null]), 'ER_BAD_NULL_ERROR', 1048, "Column 'credit' cannot be null");
});

test('varchar length (1406) and int coercion / invalid integer (1366)', () => {
  const { s } = setup();
  rejectsWith(() => s.query('INSERT INTO subjects (subject_code, credit) VALUES (?, ?)', ['INT 1000000', 1]),
    'ER_DATA_TOO_LONG', 1406, "Data too long for column 'subject_code' at row 1");
  s.query('INSERT INTO subjects (subject_code, credit) VALUES (?, ?)', ['N 1', '3']);
  assert.strictEqual(s.query('SELECT credit FROM subjects WHERE subject_code = ?', ['N 1']).rows[0].credit, 3);
  rejectsWith(() => s.query('INSERT INTO subjects (subject_code, credit) VALUES (?, ?)', ['N 2', 'abc']),
    'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD', 1366, "Incorrect integer value: 'abc' for column 'credit' at row 1");
});

test('SET ? with an object (INSERT and UPDATE) and SET a = ?, b = ?', () => {
  const { s } = setup();
  const ins = s.query('INSERT INTO subjects SET ?', [{ subject_code: 'OBJ 1', subject_title: 'From object', credit: 2 }]);
  assert.equal(ins.header.insertId, 4);
  s.query('UPDATE subjects SET ? WHERE id = ?', [{ credit: 1, subject_title: 'Changed' }, 4]);
  assert.deepEqual(s.query('SELECT credit, subject_title FROM subjects WHERE id = 4').rows[0], { credit: 1, subject_title: 'Changed' });
  s.query('INSERT INTO subjects SET subject_code = ?, credit = ?', ['SET 1', 3]);
  assert.equal(s.query('SELECT * FROM subjects WHERE subject_code = ?', ['SET 1']).rows.length, 1);
});

test('lookup errors: table, column, database, no database selected', () => {
  const { server, s } = setup();
  rejectsWith(() => s.query('SELECT * FROM nope'), 'ER_NO_SUCH_TABLE', 1146, "Table 'sampledb.nope' doesn't exist");
  rejectsWith(() => s.query('SELECT x FROM subjects'), 'ER_BAD_FIELD_ERROR', 1054, "Unknown column 'x' in 'field list'");
  rejectsWith(() => s.query('SELECT * FROM subjects WHERE x = 1'), 'ER_BAD_FIELD_ERROR', 1054, "Unknown column 'x' in 'where clause'");
  rejectsWith(() => server.connect({ database: 'sample' }), 'ER_BAD_DB_ERROR', 1049, "Unknown database 'sample'");
  rejectsWith(() => s.query('use sample'), 'ER_BAD_DB_ERROR', 1049, "Unknown database 'sample'");
  const none = server.connect({});
  rejectsWith(() => none.query('SELECT * FROM subjects'), 'ER_NO_DB_ERROR', 1046, 'No database selected');
  assert.equal(none.query('SELECT * FROM sampledb.subjects').rows.length, 3); // qualified name works
});

test('placeholder count mismatch, syntax errors, unsupported SQL', () => {
  const { s } = setup();
  rejectsWith(() => s.query('SELECT * FROM subjects WHERE id = ? AND credit = ?', [1]), 'ER_WRONG_ARGUMENTS', 1210);
  rejectsWith(() => s.query('SELECT * subjects'), 'ER_PARSE_ERROR', 1064, /You have an error in your SQL syntax/);
  rejectsWith(() => s.query('SELECT * FROM subjects a JOIN subjects b ON a.id = b.id'), 'SIM_UNSUPPORTED_SQL', undefined, /^simulator ยังไม่รองรับ SQL นี้: /);
  rejectsWith(() => s.query('ALTER TABLE subjects ADD x int'), 'SIM_UNSUPPORTED_SQL');
});

test('SQL injection: concatenation is exploitable, a placeholder is not', () => {
  const { s } = setup();
  const evil = "INT 100' OR '1'='1";
  assert.equal(s.query("SELECT * FROM subjects WHERE subject_code = '" + evil + "'").rows.length, 3);
  assert.equal(s.query('SELECT * FROM subjects WHERE subject_code = ?', [evil]).rows.length, 0);
});

test('comments, backticks and db-qualified names', () => {
  const { s } = setup();
  const r = s.query('select * from `sampledb`.`subjects` /* all */ where id = 1 -- first');
  assert.equal(r.rows.length, 1);
});

test('CREATE TABLE IF NOT EXISTS, existing table error, DROP TABLE', () => {
  const { s } = setup();
  s.query('create table if not exists subjects (id int)');
  rejectsWith(() => s.query('create table subjects (id int)'), 'ER_TABLE_EXISTS_ERROR', 1050, "Table 'subjects' already exists");
  s.query('drop table subjects');
  rejectsWith(() => s.query('drop table subjects'), 'ER_BAD_TABLE_ERROR', 1051, "Unknown table 'sampledb.subjects'");
  s.query('drop table if exists subjects');
});

test('splitStatements respects quotes and comments', () => {
  assert.deepEqual(splitStatements("insert into t values ('a;b'); select 1; -- x;y\nselect 2"),
    ["insert into t values ('a;b')", 'select 1', '-- x;y\nselect 2']);
});
