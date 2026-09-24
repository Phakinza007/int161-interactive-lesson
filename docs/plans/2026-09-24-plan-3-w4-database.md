# INT161 Interactive Lesson — Plan 3: W4 (Database Connection) + MySQL simulator

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline, task by task).

**Goal:** Add the MySQL simulator (a small real SQL engine + `mysql2` / `mysql2/promise` APIs) and module W4 (4 concept / 5 experiment / 11 exercise = 20 blocks).

**Architecture:** `engine/sql-engine.js` is pure JS (tokenizer → parser → executor over in-memory tables, MySQL-faithful results and errors). `engine/mysql-sim.js` wraps it in the `mysql2` callback API and the `mysql2/promise` API. `runProject` registers both automatically; the server is created lazily and seeded from `fixtures.mysql.seed` (an SQL script), so every Run starts from clean data.

**Spec:** `docs/specs/2026-09-20-int161-interactive-lesson-design.md` §4.4 · **Builds on:** Plans 1–2 (+ their Execution notes).

**Sources:** `week4/W04-database-connection.md` only (slide code adapted exactly as the note says: `subject_code`/`subject_title`, `findById` returns `subject[0]`, `await` added on the service call).

## Global Constraints

- Content only from the W04 note; transcript-derived items labelled "(จาก transcript)".
- W4 = exactly 4 concept / 5 experiment / 11 exercise. Starters fail, solutions pass (`tests/content.test.js`).
- SQL outside the supported set fails with `simulator ยังไม่รองรับ SQL นี้: …` (never silently); syntax errors in supported statements give `ER_PARSE_ERROR`.
- MySQL-faithful behaviour that the lessons rely on: auto_increment never reuses ids; string comparison and UNIQUE are case-insensitive; `int` columns compare numerically with numeric strings; multi-row INSERT is all-or-nothing; error `code`/`errno`/`sqlMessage` match MySQL 8.
- User/password are not validated (no credentials in the simulator); the database name is validated (`Unknown database 'sample'` teaches the slide mismatch).
- No password or other secret in any file. Nothing is pushed without asking the user.

## Task 1: Runner support — `track`, `onIdle`, `network.isListening()`

`buildModules` receives `{ network, fixtures, console, track, onIdle }`. `track(promise)` makes `runProject` wait for it (callback-style queries finish before the first output snapshot); `onIdle(fn)` runs after the entry finished and tracked work drained (used for the "program never ends" hint). `net-sim` gains `isListening()`.

- [ ] Failing tests (`tests/runner.test.js`, `tests/net-sim.test.js`): tracked promise resolves before `runProject` returns; a tracked rejection does not crash the run; `onIdle` runs once after tracked work; `isListening()` true only while a server listens.
- [ ] Implement; commit.

## Task 2: `engine/sql-engine.js`

**Interface:** `createSqlServer({ seed? }) → { connect({database?}) → session, runScript(sql, session?), hasDatabase(name) }`; `session.query(sql, values?) → { type:'rows', rows, fields } | { type:'header', header }`; `SqlError { code, errno, sqlState, sqlMessage }` (`message === sqlMessage`).

Supported: `CREATE DATABASE [IF NOT EXISTS]`, `USE`, `CREATE TABLE [IF NOT EXISTS]` (types int/bigint/smallint/tinyint/bool, varchar/char/text, decimal/double/float, date/datetime/timestamp; `NOT NULL`, `PRIMARY KEY` (column or table level, composite), `AUTO_INCREMENT`, `UNIQUE`, `DEFAULT`, `UNSIGNED`), `DROP TABLE [IF EXISTS]`, `INSERT … VALUES (…),(…)` / `INSERT … SET a=?,b=?` / `SET ?` (object), `SELECT */cols/COUNT(*) FROM t [WHERE] [ORDER BY] [LIMIT [OFFSET]]`, `UPDATE … SET … [WHERE]`, `DELETE FROM … [WHERE]`. `WHERE`: `= != <> < <= > >= IS [NOT] NULL [NOT] LIKE IN (…)`, `AND`/`OR`/`NOT`/parentheses, operands = column | number | string | `?`. `db.table` qualified names, backticks, `--`/`#`/`/* */` comments, `;`-separated scripts (only via `runScript`).

Results: SELECT → rows are plain objects in column order; header = `{ fieldCount:0, affectedRows, insertId, info, serverStatus:2, warningStatus:0, changedRows }` (UPDATE `info` = `Rows matched: m  Changed: c  Warnings: 0`; multi-row INSERT `info` = `Records: n  Duplicates: 0  Warnings: 0`). Errors: 1062 `ER_DUP_ENTRY` (`Duplicate entry 'x' for key 'table.column'`, composite keys joined by `-`, PK key name `PRIMARY`), 1048 `ER_BAD_NULL_ERROR`, 1364 `ER_NO_DEFAULT_FOR_FIELD`, 1406 `ER_DATA_TOO_LONG`, 1366 `ER_TRUNCATED_WRONG_VALUE_FOR_FIELD`, 1146 `ER_NO_SUCH_TABLE`, 1054 `ER_BAD_FIELD_ERROR`, 1049 `ER_BAD_DB_ERROR`, 1046 `ER_NO_DB_ERROR`, 1050/1051/1007, 1064 `ER_PARSE_ERROR`, 1210 `ER_WRONG_ARGUMENTS` (placeholder count mismatch), `SIM_UNSUPPORTED_SQL`.

- [ ] Tests first (`tests/sql-engine.test.js`): DDL + seed script; SELECT variants; the note's exact statements (17-row insert, INSERT with `?`, UPDATE with 4 params, DELETE); auto_increment gap after delete (`insertId` 19 not 18); UNIQUE violation message; case-insensitive UNIQUE/`=`; numeric-string vs int compare; all-or-nothing multi-row insert; `SET ?` object; SQL injection string returns all rows when concatenated but none with `?`; each error code above; unsupported SQL message.
- [ ] Implement; commit.

## Task 3: `engine/mysql-sim.js` and auto-registration

**Interface:** `createMysqlModules({ fixtures, track, onIdle, console, network }) → { mysql2, 'mysql2/promise' }`. Both expose `createPool(config)` and `createConnection(config)`.
- promise API: `pool.query/execute(sql, values?) → Promise<[rowsOrHeader, fields|undefined]>`, `pool.getConnection() → connection { query, execute, release }`, `pool.end()`, `createConnection → Promise<connection {query, execute, end}>` (rejects at once on an unknown database; a pool reports it on first use).
- callback API: `pool.query(sql, [values], cb(err, results, fields))`; awaiting/`.then` on the returned query throws mysql2's real message ("You have tried to call .then(), .catch(), or invoked await on the result of query that is not a promise … require('mysql2/promise') …").
- After `pool.end()` any query rejects with `Pool is closed.`. If the entry finished, no server is listening and a pool is still open, `onIdle` logs an `info` line explaining a real Node process would hang until Ctrl+C / `await pool.end()`.
- `runProject` merges these modules automatically (server created lazily from `fixtures.mysql.seed`).

- [ ] Tests first (`tests/mysql-sim.test.js`) through `runProject`; then implement; commit.

## Task 4: SQL console widget + W4 content

**Files:** `js/widgets.js` (`sql-console`), `css/app.css`, `content/w4-concepts.js`, `content/w4-labs.js`, `content/w4.js`, `js/modules.js` (`w4.ready`).

`sql-console` widget: textarea preloaded with the note's SQL (create database, use, create table, 17-row insert, select), buttons Execute / Reset; runs `createSqlServer` in the page; SELECT → table, other statements → "n rows affected" / OK, errors in red with `code`.

Concepts (4): `c-goals-layers` (§01–04: objectives, layers, persistent data, DB client tool, driver, schema/table SQL), `c-connect` (§05–08: 3 steps, mysql2 versions, Connection vs Pool, callback vs Promise, result shapes), `c-layers-code` (§09–14: pool.js, prepared statements, repository conversion, async/await chain, `getBody`), `c-crud-logic` (§15–18 + summary: status codes, PUT, duplicate check in service, error mindset, remaining work).

Experiments (5): `e-sql-console`, `e-first-query` (pool.js + test-db.js; try removing `pool.end()`), `e-callback-promise`, `e-result-shape` (INSERT/UPDATE/DELETE headers), `e-crud-app` (finished 5-file app with fixtures).

Exercises (11): `x-pool-config` (`sample` → `sampledb`), `x-find-all`, `x-find-by-id`, `x-remove`, `x-create`, `x-update`, `x-async-chain` (missing `await`), `x-get-body`, `x-status-codes` (201/409/400), `x-business-dup` (service checks `findBySubjectCode`), `x-sql-injection` (concatenation vs `?`).

- [ ] Write; `npm test`; `npm run check-ratio`; commit.

## Task 5: Browser verification and wrap-up

- [ ] SQL console runs the note's script (17 rows affected, SELECT table, duplicate insert error); every W4 experiment responds; all 11 exercises fail→pass; mobile/no console errors; execution notes; commit. Do not push.

## Execution notes

(filled in while running)
