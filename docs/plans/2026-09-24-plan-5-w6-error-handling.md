# INT161 Interactive Lesson — Plan 5: W6 (Error Handling) + FK constraints + assignment self-check

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline, task by task).

**Goal:** Finish the course: module W6 (5 concept / 5 experiment / 10 exercise = 20 blocks) with the engine work it needs (foreign keys, richer test expectations, Node-like `console.log(error)`), plus **auto-checkers for the graded assignment with no solutions**.

**Sources:** `week6/06-INT161-Error Handling.pdf` (slides), `week6/express-template/src` (layout/style; its real DB password is **not** copied), `week6/express_crud_exception_assignment.md` (spec + test table → self-check only).

## Global Constraints

- Content only from the sources above. W6 = exactly 5 concept / 5 experiment / 10 exercise. Slide-based exercises have solutions; the 5 assignment exercises (`x-a1`…`x-a5`) have **no `solution`, no reference code and no hints that reveal the answer** (hints only point at the spec's own rules).
- **No student ID in any file.** Assignment starters ship `const STUDENT_ID = '';`; the checker reads the learner's own value from their code (regex over the editor text) and substitutes `{{studentId}}` in test paths. Missing/empty → one failing check that says what to type. The value never leaves the browser.
- The assignment's own rules are enforced by code checks: no `:studentId` route parameter / `req.params.studentId`; and by response checks: JSON shape `{status, data}` / `{status:'error', error:{code,message}}` (a default Express HTML page fails because it is not JSON).
- Simulator fidelity for W6: MySQL 1451/1452 messages and `code`s; `console.log(error)` shows extra own properties (Node style); the three error-response shapes in the sources (slide, template, assignment) are all shown, labelled.
- I write a reference solution **only in the session scratchpad** to prove each checker is satisfiable; it is never saved to the vault or the repo.
- Nothing is pushed without asking the user.

## Task 1: Foreign keys in `engine/sql-engine.js`

`FOREIGN KEY (col[, …]) REFERENCES parent (col[, …])` (table-level, optionally `CONSTRAINT name`) and column-level `REFERENCES parent(col)`. Default action RESTRICT; `ON DELETE/UPDATE` clauses → `SIM_UNSUPPORTED_SQL`. Insert/update child with a non-NULL value that has no parent row → `ER_NO_REFERENCED_ROW_2` (1452) `Cannot add or update a child row: a foreign key constraint fails (`db`.`child`, CONSTRAINT `child_ibfk_1` FOREIGN KEY (`c`) REFERENCES `parent` (`p`))`; delete/update of a referenced parent row → `ER_ROW_IS_REFERENCED_2` (1451) `Cannot delete or update a parent row: a foreign key constraint fails (…same detail…)`. Default constraint name `<table>_ibfk_<n>`; NULL foreign values are allowed; self-references work (`employees.reportsTo → employees.employeeNumber`); `DROP TABLE` of a referenced table → 3730 `ER_FK_CANNOT_DROP_PARENT`.

- [ ] Tests first (`tests/sql-engine.test.js`): 1452 on insert/update, 1451 on delete/update, NULL allowed, self-reference, named constraint, `ON DELETE CASCADE` unsupported, drop parent refused. Implement; commit.

## Task 2: Test-runner extensions and Node-like error printing

- `expect.jsonMatch` (every listed key must deep-equal; extra keys allowed) and `expect.jsonHasKeys: string[]`; both fail when the body is not JSON.
- `{{name}}` substitution in `request.path` and string values of `request.body` from `vars` extracted from the learner's files: `block.vars = { studentId: { file, pattern } }` (`pattern` has one capture group). `runTests(session, tests, vars?)`; when a variable a test uses is missing the runner returns a single failing test `กำหนดค่าก่อน: <hint>` instead of sending requests. Worker `check` receives `vars` (already extracted); `sandbox.check(payload, tests, codeChecks, vars)`; `runpanel` extracts them from the current editor contents.
- `formatArgs(error)` prints `Name: message` followed by ` { own enumerable props }` (JSON) when the error has any (Node-like `console.log(err)`).

- [ ] Tests first (`tests/test-runner.test.js`, `tests/runner.test.js`); implement; commit.

## Task 3: W6 content

**Files:** `content/w6-concepts.js`, `content/w6-labs.js`, `content/w6.js`, `js/modules.js` (`w6.ready`).

Concepts (5): `c-what-error` (exception/error, crash & `exit(1)`, Error is an object, why it matters, error types), `c-propagation` (propagation, `try…catch`, Error properties, custom errors, `AppError`), `c-error-flow-express` (middleware chain, `next(err)`, 4-argument handler at the END, default HTML page), `c-status-response` (status table, slide handler code, the three response shapes: slide / template / assignment), `c-layers-assignment` (error arrows through Controller/Service/Repository, template repo throwing 404, MySQL error mapping from the assignment, assignment rules + how self-check works).

Experiments (5): `e-try-catch` (slide chain + `readFileSync` → ENOENT, `e.message/status/code/stack`), `e-custom-error` (AppError, `console.log(err)`), `e-error-middleware` (routes that throw / `next(err)` / async + slide handler; move it before the routes → default HTML), `e-layered-errors` (template project: `findOne` throws 404, handler maps `ER_DUP_ENTRY` → 409), `e-mysql-errors` (`sql-console` on a small FK schema to provoke 1062/1452/1451).

Exercises (10): slide-based with solutions — `x-try-catch`, `x-app-error`, `x-throw-custom`, `x-error-middleware`, `x-next-err`; assignment self-check without solutions — `x-a1` (GET office, `OFFICE_NOT_FOUND` 404), `x-a2` (POST productline: `VALIDATION_ERROR` 400, `DUPLICATE_KEY` 409, 201), `x-a3` (PUT employee: 404, `INVALID_EMAIL` 400, `FOREIGN_KEY_NOT_FOUND` 400, 200), `x-a4` (DELETE customer: 404, `RESOURCE_IN_USE` 409, 200), `x-a5` (POST payment: composite key, `INVALID_PAYMENT_DATA` 400, `DUPLICATE_KEY` 409, 404, 201). Each assignment block ships the instructor-provided `errorHandler.js` (CJS `AppError` + MySQL mapping, verbatim), the DB config, an `app.js` starter with `STUDENT_ID = ''`, and a route stub.

- [ ] Write; `npm test`; `npm run check-ratio`; prove the 5 checkers with a scratchpad reference solution (not saved); commit.

## Task 4: Final verification

- [ ] Browser: every W6 experiment; W6 slide-based exercises fail→pass; assignment blocks: empty ID message, checkers work with the scratchpad solution pasted in and a made-up ID, forbidden `:studentId` route detected; hub shows all 6 ready; mobile; console clean; `git ls-files` free of slides/recordings/secrets/IDs; notes; commit. **Do not push** — ask the user.

## Execution notes

Found while running; this is the last module plan.

1. **Foreign keys (RESTRICT) implemented** in `engine/sql-engine.js` with MySQL's exact 1451/1452/1824/3730 messages and `<table>_ibfk_<n>` constraint names; column-level `REFERENCES` is parsed but ignored (as in MySQL); `ON DELETE/UPDATE` is `SIM_UNSUPPORTED_SQL`. Bug caught by a review of my own change: updating a *non-key* column of a referenced parent row wrongly raised 1451 — fixed (only changes to the referenced key columns are restricted), with a regression test.
2. **The assignment proof step found a real engine bug:** duplicate detection silently failed for camelCase column names (`productLine`, `checkNumber`) because key columns were looked up lower-cased in case-preserving row objects. Fixed by resolving key columns to their real names at `CREATE TABLE`; regression test added. Lesson: prove checkers against a real solution — here it caught a bug that 200+ other tests could not.
3. **Assignment self-check without solutions (verified):** the five `x-a*` blocks have no `solution`; a reference solution existed only in the session scratchpad, passed all 5 checkers (incl. the empty-ID message and detection of a `:studentId` route), and was deleted. `git grep` finds no assignment answer code. Learners type their own student ID into `app.js`; `{{studentId}}` in test paths is filled from that text at check time.
4. **Test-runner additions:** `expect.jsonMatch` / `jsonHasKeys` (dotted paths such as `error.code`), `{{var}}` substitution with `block.vars`, `resolveVars`, and a single explanatory failing result when a needed variable is missing. `formatArgs(Error)` prints extra own properties Node-style; ENOENT errors carry a short Node-like stack.
5. **Example student id removed:** the brief's sample id had been copied into a concept block and a unit test; both now use placeholders.
6. **Verified live:** 5/5 experiments (try/catch, custom error, error middleware incl. handler-before-routes → default HTML, layered errors 404 + ER_DUP_ENTRY→409, FK errors in the SQL console), 5/5 slide exercises fail→pass, assignment blocks behave as designed, no console errors.

## Diagrams (added after the module plans, on the user's request)

`js/diagrams.js` (pure SVG string builders `flow`, `sequence`, `stack`; theme colours come from CSS classes; `tests/diagrams.test.js` + a per-module well-formedness test) and 21 diagrams on concept blocks across W1–W6 (`diagram` + `diagramCaption` on a block). Findings while checking them in the browser: (a) SVGs shrank to unreadable text on phones → each keeps a readable `min-width` and scrolls inside its frame; (b) sequence notes overflowed the canvas → clamped; (c) my `render.js` change passed `null` to `append()` and printed the text "null" on blocks without a diagram → fixed with `.filter(Boolean)`; (d) two pages overflowed at 375 px because of long inline `<code>` (a URL, a route) → global CSS wrap rule for inline code.
