// A small, MySQL-faithful SQL engine over in-memory tables (see docs/plans/2026-09-24-plan-3-w4-database.md).

export class SqlError extends Error {
  constructor(code, errno, sqlMessage, sqlState = 'HY000') {
    super(sqlMessage);
    this.code = code;
    this.errno = errno;
    this.sqlState = sqlState;
    this.sqlMessage = sqlMessage;
  }
}

const err = (code, errno, msg, state) => new SqlError(code, errno, msg, state);
const unsupported = (sql) => err('SIM_UNSUPPORTED_SQL', 0, `simulator ยังไม่รองรับ SQL นี้: ${String(sql).trim().slice(0, 80)}`);

// ---------- script splitting ----------

function scan(sql, onChar) {
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    if (c === "'" || c === '"' || c === '`') {
      const q = c;
      i++;
      while (i < sql.length) {
        if (sql[i] === '\\' && q !== '`') { i += 2; continue; }
        if (sql[i] === q) { if (sql[i + 1] === q) { i += 2; continue; } break; }
        i++;
      }
      i++;
    } else if ((c === '-' && sql[i + 1] === '-') || c === '#') {
      while (i < sql.length && sql[i] !== '\n') i++;
    } else if (c === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      i = end === -1 ? sql.length : end + 2;
    } else {
      if (onChar(c, i) === false) return;
      i++;
    }
  }
}

const stripSqlComments = (s) => {
  let out = '';
  let last = 0;
  // remove comments while keeping strings intact
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "'" || c === '"' || c === '`') {
      const q = c;
      i++;
      while (i < s.length) {
        if (s[i] === '\\' && q !== '`') { i += 2; continue; }
        if (s[i] === q) { if (s[i + 1] === q) { i += 2; continue; } break; }
        i++;
      }
      i++;
    } else if ((c === '-' && s[i + 1] === '-') || c === '#') {
      out += s.slice(last, i);
      while (i < s.length && s[i] !== '\n') i++;
      last = i;
    } else if (c === '/' && s[i + 1] === '*') {
      out += s.slice(last, i);
      const end = s.indexOf('*/', i + 2);
      i = end === -1 ? s.length : end + 2;
      last = i;
    } else i++;
  }
  return out + s.slice(last);
};

export function splitStatements(sql) {
  const cuts = [];
  scan(sql, (c, i) => { if (c === ';') cuts.push(i); });
  const parts = [];
  let start = 0;
  for (const cut of cuts) { parts.push(sql.slice(start, cut)); start = cut + 1; }
  parts.push(sql.slice(start));
  return parts.map((p) => p.trim()).filter((p) => stripSqlComments(p).trim() !== '');
}

// ---------- tokenizer ----------

function tokenize(sql) {
  const tokens = [];
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const c = sql[i];
    if (/\s/.test(c)) { i++; continue; }
    if ((c === '-' && sql[i + 1] === '-') || c === '#') { while (i < n && sql[i] !== '\n') i++; continue; }
    if (c === '/' && sql[i + 1] === '*') { const e = sql.indexOf('*/', i + 2); i = e === -1 ? n : e + 2; continue; }
    const pos = i;
    if (c === "'" || c === '"') {
      let v = '';
      i++;
      while (i < n) {
        if (sql[i] === '\\' && i + 1 < n) {
          const nx = sql[i + 1];
          v += nx === 'n' ? '\n' : nx === 't' ? '\t' : nx === '0' ? '\0' : nx;
          i += 2;
          continue;
        }
        if (sql[i] === c) { if (sql[i + 1] === c) { v += c; i += 2; continue; } break; }
        v += sql[i++];
      }
      if (i >= n) throw syntax(sql, pos);
      i++;
      tokens.push({ t: 'str', v, pos });
    } else if (c === '`') {
      const e = sql.indexOf('`', i + 1);
      if (e === -1) throw syntax(sql, pos);
      tokens.push({ t: 'ident', v: sql.slice(i + 1, e), pos });
      i = e + 1;
    } else if (/[0-9]/.test(c)) {
      const m = /^\d+(\.\d+)?/.exec(sql.slice(i));
      tokens.push({ t: 'num', v: Number(m[0]), pos });
      i += m[0].length;
    } else if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z0-9_$]*/.exec(sql.slice(i));
      tokens.push({ t: 'word', v: m[0], u: m[0].toUpperCase(), pos });
      i += m[0].length;
    } else if (c === '?') {
      tokens.push({ t: 'param', pos });
      i++;
    } else if ((c === '<' && (sql[i + 1] === '=' || sql[i + 1] === '>')) || ((c === '>' || c === '!') && sql[i + 1] === '=')) {
      tokens.push({ t: 'op', v: sql.slice(i, i + 2), pos });
      i += 2;
    } else if ('(),;=<>*.+-'.includes(c)) {
      tokens.push({ t: 'op', v: c, pos });
      i++;
    } else {
      throw syntax(sql, pos);
    }
  }
  return tokens;
}

function syntax(sql, pos) {
  const near = pos == null || pos >= sql.length ? '' : sql.slice(pos, pos + 60);
  return err('ER_PARSE_ERROR', 1064,
    `You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '${near}' at line 1`, '42000');
}

// ---------- parser ----------

const UNSUPPORTED_WORDS = new Set(['JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'CROSS', 'GROUP', 'HAVING', 'UNION', 'DISTINCT', 'FOREIGN', 'CONSTRAINT', 'REFERENCES']);

class Parser {
  constructor(sql, values) {
    this.sql = sql;
    this.values = values;
    this.tokens = tokenize(sql);
    this.i = 0;
    this.pi = 0;
  }
  peek(o = 0) { return this.tokens[this.i + o]; }
  next() { return this.tokens[this.i++]; }
  fail(tok = this.peek()) { throw syntax(this.sql, tok ? tok.pos : null); }
  isWord(w, o = 0) { const t = this.peek(o); return !!t && t.t === 'word' && t.u === w; }
  eatWord(w) { if (this.isWord(w)) { this.i++; return true; } return false; }
  expectWord(w) { if (!this.eatWord(w)) this.fail(); }
  isOp(v, o = 0) { const t = this.peek(o); return !!t && t.t === 'op' && t.v === v; }
  eatOp(v) { if (this.isOp(v)) { this.i++; return true; } return false; }
  expectOp(v) { if (!this.eatOp(v)) this.fail(); }
  name() {
    const t = this.next();
    if (!t || (t.t !== 'word' && t.t !== 'ident')) this.fail(t);
    return t.v;
  }
  // table / db.table
  qname() {
    const a = this.name();
    if (this.eatOp('.')) return { db: a, name: this.name() };
    return { db: null, name: a };
  }
  operand() {
    const t = this.peek();
    if (!t) this.fail();
    if (t.t === 'num') { this.i++; return { kind: 'lit', v: t.v }; }
    if (t.t === 'op' && t.v === '-' && this.peek(1) && this.peek(1).t === 'num') { this.i += 2; return { kind: 'lit', v: -this.tokens[this.i - 1].v }; }
    if (t.t === 'str') { this.i++; return { kind: 'lit', v: t.v }; }
    if (t.t === 'param') { this.i++; return { kind: 'param', i: this.pi++ }; }
    if (t.t === 'word' && t.u === 'NULL') { this.i++; return { kind: 'lit', v: null }; }
    if (t.t === 'word' && (t.u === 'TRUE' || t.u === 'FALSE')) { this.i++; return { kind: 'lit', v: t.u === 'TRUE' ? 1 : 0 }; }
    if (t.t === 'word' || t.t === 'ident') {
      this.i++;
      let name = t.v;
      if (this.isOp('.') && this.peek(1) && (this.peek(1).t === 'word' || this.peek(1).t === 'ident')) { this.i++; name = this.next().v; }
      return { kind: 'col', name };
    }
    return this.fail(t);
  }
  // ----- conditions -----
  cond() { return this.orExpr(); }
  orExpr() {
    let left = this.andExpr();
    while (this.eatWord('OR')) left = { op: 'or', a: left, b: this.andExpr() };
    return left;
  }
  andExpr() {
    let left = this.unary();
    while (this.eatWord('AND')) left = { op: 'and', a: left, b: this.unary() };
    return left;
  }
  unary() {
    if (this.eatWord('NOT')) return { op: 'not', a: this.unary() };
    if (this.isOp('(')) {
      this.i++;
      const c = this.orExpr();
      this.expectOp(')');
      return c;
    }
    const a = this.operand();
    if (this.eatWord('IS')) {
      const neg = this.eatWord('NOT');
      this.expectWord('NULL');
      return { op: 'isnull', a, neg };
    }
    const neg = this.isWord('NOT') && (this.isWord('LIKE', 1) || this.isWord('IN', 1)) ? (this.i++, true) : false;
    if (this.eatWord('LIKE')) return { op: 'like', a, b: this.operand(), neg };
    if (this.eatWord('IN')) {
      this.expectOp('(');
      const list = [this.operand()];
      while (this.eatOp(',')) list.push(this.operand());
      this.expectOp(')');
      return { op: 'in', a, list, neg };
    }
    const t = this.peek();
    if (t && t.t === 'op' && ['=', '!=', '<>', '<', '<=', '>', '>='].includes(t.v)) {
      this.i++;
      return { op: 'cmp', cmp: t.v, a, b: this.operand() };
    }
    return this.fail(t);
  }
  atEnd() { return this.i >= this.tokens.length; }
}

function prescanUnsupported(tokens, sql) {
  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];
    if (t.t === 'word' && UNSUPPORTED_WORDS.has(t.u)) throw unsupported(sql);
    if (t.t === 'op' && t.v === '(' && tokens[k + 1] && tokens[k + 1].t === 'word' && tokens[k + 1].u === 'SELECT') throw unsupported(sql);
  }
}

// ---------- values, comparison ----------

const isNum = (v) => typeof v === 'number';
const numericLike = (v) => (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) || isNum(v);

function compare(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return null;
  if ((isNum(a) || isNum(b)) && numericLike(a) && numericLike(b)) {
    const x = Number(a);
    const y = Number(b);
    return x < y ? -1 : x > y ? 1 : 0;
  }
  const x = String(a).toLowerCase();
  const y = String(b).toLowerCase();
  return x < y ? -1 : x > y ? 1 : 0;
}

const likeToRegExp = (pat) => new RegExp('^' + String(pat).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.') + '$', 'is');

// ---------- catalog ----------

const INT_TYPES = new Set(['INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT', 'MEDIUMINT', 'BOOL', 'BOOLEAN']);
const STR_TYPES = new Set(['VARCHAR', 'CHAR', 'TEXT', 'DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 'YEAR']);
const NUM_TYPES = new Set(['DECIMAL', 'NUMERIC', 'DOUBLE', 'FLOAT', 'REAL']);

function makeExecutor(server, session, sql, values) {
  const p = new Parser(sql, values);
  prescanUnsupported(p.tokens, sql);
  if (p.atEnd()) throw syntax(sql, null);

  const dbOf = (q) => {
    const dbName = q.db ?? session.database;
    if (!dbName) throw err('ER_NO_DB_ERROR', 1046, 'No database selected', '3D000');
    const db = server.dbs.get(dbName.toLowerCase());
    if (!db) throw err('ER_BAD_DB_ERROR', 1049, `Unknown database '${dbName}'`, '42000');
    return db;
  };
  const tableOf = (q) => {
    const db = dbOf(q);
    const t = db.tables.get(q.name.toLowerCase());
    if (!t) throw err('ER_NO_SUCH_TABLE', 1146, `Table '${db.name}.${q.name}' doesn't exist`, '42S02');
    return t;
  };
  const colOf = (table, name, where) => {
    const c = table.columns.find((x) => x.key === name.toLowerCase());
    if (!c) throw err('ER_BAD_FIELD_ERROR', 1054, `Unknown column '${name}' in '${where}'`, '42S22');
    return c;
  };
  const val = (o, row) => {
    if (o.kind === 'lit') return o.v;
    if (o.kind === 'param') return values[o.i];
    return row[o.col];
  };
  const bindCols = (node, table, where) => {
    const bind = (o) => { if (o.kind === 'col') o.col = colOf(table, o.name, where).name; };
    const walk = (c) => {
      if (c.op === 'and' || c.op === 'or') { walk(c.a); walk(c.b); return; }
      if (c.op === 'not') { walk(c.a); return; }
      bind(c.a);
      if (c.b) bind(c.b);
      if (c.list) c.list.forEach(bind);
    };
    walk(node);
  };
  const test = (c, row) => {
    switch (c.op) {
      case 'and': return test(c.a, row) && test(c.b, row);
      case 'or': return test(c.a, row) || test(c.b, row);
      case 'not': return !test(c.a, row);
      case 'isnull': { const v = val(c.a, row); return c.neg ? v != null : v == null; }
      case 'like': { const a = val(c.a, row); const b = val(c.b, row); if (a == null || b == null) return false; const m = likeToRegExp(b).test(String(a)); return c.neg ? !m : m; }
      case 'in': { const a = val(c.a, row); const hit = c.list.some((o) => compare(a, val(o, row)) === 0); return c.neg ? !hit : hit; }
      default: {
        const r = compare(val(c.a, row), val(c.b, row));
        if (r === null) return false;
        return { '=': r === 0, '!=': r !== 0, '<>': r !== 0, '<': r < 0, '<=': r <= 0, '>': r > 0, '>=': r >= 0 }[c.cmp];
      }
    }
  };
  const header = (affectedRows, extra = {}) => ({
    type: 'header',
    header: { fieldCount: 0, affectedRows, insertId: 0, info: '', serverStatus: 2, warningStatus: 0, changedRows: 0, ...extra },
  });
  const checkPlaceholders = () => {
    if (p.pi > values.length) throw err('ER_WRONG_ARGUMENTS', 1210, 'Incorrect arguments to mysqld_stmt_execute');
  };

  function coerce(col, v, rowNo) {
    if (v === null || v === undefined) return null;
    if (col.type === 'int') {
      const n = typeof v === 'boolean' ? Number(v) : Number(v);
      if (typeof v === 'object' || (typeof v === 'string' && (v.trim() === '' || Number.isNaN(n))) || Number.isNaN(n)) {
        throw err('ER_TRUNCATED_WRONG_VALUE_FOR_FIELD', 1366, `Incorrect integer value: '${v}' for column '${col.name}' at row ${rowNo}`, 'HY000');
      }
      return Math.round(n);
    }
    if (col.type === 'number') {
      const n = Number(v);
      if (Number.isNaN(n)) throw err('ER_TRUNCATED_WRONG_VALUE_FOR_FIELD', 1366, `Incorrect decimal value: '${v}' for column '${col.name}' at row ${rowNo}`, 'HY000');
      return n;
    }
    const s = v instanceof Date ? v.toISOString() : String(v);
    if (col.size && s.length > col.size) throw err('ER_DATA_TOO_LONG', 1406, `Data too long for column '${col.name}' at row ${rowNo}`, '22001');
    return s;
  }

  function checkKeys(table, row, ignore) {
    for (const key of table.keys) {
      const vals = key.cols.map((c) => row[c]);
      if (vals.some((v) => v === null || v === undefined)) continue;
      const clash = table.rows.find((r) => r !== ignore && key.cols.every((c, k) => compare(r[c], vals[k]) === 0));
      if (clash) {
        throw err('ER_DUP_ENTRY', 1062, `Duplicate entry '${vals.join('-')}' for key '${table.name}.${key.name}'`, '23000');
      }
    }
  }

  // ----- statements -----
  function createDatabase() {
    const ifNot = p.eatWord('IF') && (p.expectWord('NOT'), p.expectWord('EXISTS'), true);
    const name = p.name();
    if (server.dbs.has(name.toLowerCase())) {
      if (ifNot) return header(0);
      throw err('ER_DB_CREATE_EXISTS', 1007, `Can't create database '${name}'; database exists`, 'HY000');
    }
    server.dbs.set(name.toLowerCase(), { name, tables: new Map() });
    return header(1);
  }

  function useDb() {
    const name = p.name();
    if (!server.dbs.has(name.toLowerCase())) throw err('ER_BAD_DB_ERROR', 1049, `Unknown database '${name}'`, '42000');
    session.database = server.dbs.get(name.toLowerCase()).name;
    return header(0);
  }

  function createTable() {
    const ifNot = p.eatWord('IF') && (p.expectWord('NOT'), p.expectWord('EXISTS'), true);
    const q = p.qname();
    const db = dbOf(q);
    p.expectOp('(');
    const columns = [];
    const keys = [];
    let primary = null;
    for (;;) {
      if (p.isWord('PRIMARY')) {
        p.i++; p.expectWord('KEY'); p.expectOp('(');
        const cols = [p.name().toLowerCase()];
        while (p.eatOp(',')) cols.push(p.name().toLowerCase());
        p.expectOp(')');
        primary = cols;
      } else if (p.isWord('UNIQUE')) {
        p.i++; p.eatWord('KEY') || p.eatWord('INDEX');
        let kname = null;
        if (!p.isOp('(')) kname = p.name();
        p.expectOp('(');
        const cols = [p.name().toLowerCase()];
        while (p.eatOp(',')) cols.push(p.name().toLowerCase());
        p.expectOp(')');
        keys.push({ name: kname || cols[0], cols });
      } else if (p.isWord('KEY') || p.isWord('INDEX')) {
        p.i++;
        if (!p.isOp('(')) p.name();
        p.expectOp('(');
        p.name();
        while (p.eatOp(',')) p.name();
        p.expectOp(')');
      } else {
        const name = p.name();
        const tw = p.next();
        if (!tw || tw.t !== 'word') p.fail(tw);
        let type;
        if (INT_TYPES.has(tw.u)) type = 'int';
        else if (STR_TYPES.has(tw.u)) type = 'string';
        else if (NUM_TYPES.has(tw.u)) type = 'number';
        else throw unsupported(sql);
        let size = null;
        if (p.eatOp('(')) {
          const s = p.next();
          if (!s || s.t !== 'num') p.fail(s);
          size = s.v;
          if (p.eatOp(',')) p.next();
          p.expectOp(')');
        }
        const col = { name, key: name.toLowerCase(), type, size: type === 'string' ? size : null, notNull: false, autoInc: false, hasDefault: false, def: null };
        for (;;) {
          if (p.eatWord('NOT')) { p.expectWord('NULL'); col.notNull = true; }
          else if (p.eatWord('NULL')) { col.notNull = false; }
          else if (p.eatWord('PRIMARY')) { p.expectWord('KEY'); primary = [col.key]; }
          else if (p.eatWord('AUTO_INCREMENT')) col.autoInc = true;
          else if (p.eatWord('UNIQUE')) { p.eatWord('KEY'); keys.push({ name: col.name, cols: [col.key] }); }
          else if (p.eatWord('UNSIGNED') || p.eatWord('ZEROFILL')) { /* ignored */ }
          else if (p.eatWord('DEFAULT')) { const o = p.operand(); col.hasDefault = true; col.def = o.kind === 'lit' ? o.v : null; }
          else if (p.eatWord('COMMENT')) p.next();
          else break;
        }
        columns.push(col);
      }
      if (!p.eatOp(',')) break;
    }
    p.expectOp(')');
    while (!p.atEnd() && !p.isOp(';')) p.next(); // ENGINE=..., CHARSET=... options
    if (primary) {
      for (const c of primary) colOf({ columns }, c, 'key list').notNull = true;
      keys.unshift({ name: 'PRIMARY', cols: primary });
    }
    if (db.tables.has(q.name.toLowerCase())) {
      if (ifNot) return header(0);
      throw err('ER_TABLE_EXISTS_ERROR', 1050, `Table '${q.name}' already exists`, '42S01');
    }
    db.tables.set(q.name.toLowerCase(), { name: q.name, columns, keys, rows: [], nextId: 1 });
    return header(0);
  }

  function dropTable() {
    p.expectWord('TABLE');
    const ifExists = p.eatWord('IF') && (p.expectWord('EXISTS'), true);
    const q = p.qname();
    const db = dbOf(q);
    if (!db.tables.has(q.name.toLowerCase())) {
      if (ifExists) return header(0);
      throw err('ER_BAD_TABLE_ERROR', 1051, `Unknown table '${db.name}.${q.name}'`, '42S02');
    }
    db.tables.delete(q.name.toLowerCase());
    return header(0);
  }

  function assignments() {
    // SET ?  |  SET a = x, b = y
    if (p.peek() && p.peek().t === 'param' && !p.isOp('=', 1)) {
      p.i++;
      const idx = p.pi++;
      const obj = values[idx];
      if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) throw err('ER_PARSE_ERROR', 1064, "You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '?' at line 1", '42000');
      return Object.entries(obj).map(([k, v]) => ({ col: k, o: { kind: 'lit', v } }));
    }
    const list = [];
    do {
      const col = p.name();
      p.expectOp('=');
      list.push({ col, o: p.operand() });
    } while (p.eatOp(','));
    return list;
  }

  function insert() {
    p.eatWord('INTO');
    const q = p.qname();
    let cols = null;
    let rowsOps = [];
    let setList = null;
    if (p.isOp('(')) {
      p.i++;
      cols = [p.name()];
      while (p.eatOp(',')) cols.push(p.name());
      p.expectOp(')');
    }
    if (p.eatWord('SET')) setList = assignments();
    else {
      if (!(p.eatWord('VALUES') || p.eatWord('VALUE'))) p.fail();
      do {
        p.expectOp('(');
        const row = [p.operand()];
        while (p.eatOp(',')) row.push(p.operand());
        p.expectOp(')');
        rowsOps.push(row);
      } while (p.eatOp(','));
    }
    if (!p.atEnd() && !(p.isOp(';') && p.i === p.tokens.length - 1)) p.fail();
    checkPlaceholders();
    const table = tableOf(q);
    let inputs; // array of Map(colKey -> value)
    if (setList) {
      inputs = [new Map(setList.map((a) => [colOf(table, a.col, 'field list').key, val(a.o, {})]))];
    } else {
      const colNames = cols ? cols.map((c) => colOf(table, c, 'field list')) : table.columns;
      inputs = rowsOps.map((ops, k) => {
        if (ops.length !== colNames.length) throw err('ER_WRONG_VALUE_COUNT_ON_ROW', 1136, `Column count doesn't match value count at row ${k + 1}`, '21S01');
        return new Map(colNames.map((c, j) => [c.key, val(ops[j], {})]));
      });
    }
    const snapshot = table.rows.slice();
    let firstId = 0;
    try {
      inputs.forEach((given, idx) => {
        const rowNo = idx + 1;
        const row = {};
        for (const col of table.columns) {
          const has = given.has(col.key);
          let v = has ? given.get(col.key) : undefined;
          if (v === undefined || v === null) {
            if (col.autoInc) v = table.nextId++;
            else if (!has) {
              if (col.hasDefault) v = col.def;
              else if (col.notNull) throw err('ER_NO_DEFAULT_FOR_FIELD', 1364, `Field '${col.name}' doesn't have a default value`, 'HY000');
              else v = null;
            } else if (col.notNull) throw err('ER_BAD_NULL_ERROR', 1048, `Column '${col.name}' cannot be null`, '23000');
            else v = null;
            row[col.name] = v;
          } else {
            row[col.name] = coerce(col, v, rowNo);
            if (col.autoInc) table.nextId = Math.max(table.nextId, row[col.name] + 1);
          }
          if (col.autoInc && !firstId) firstId = row[col.name];
        }
        checkKeys(table, row, null);
        table.rows.push(row);
      });
    } catch (e) {
      table.rows = snapshot;
      throw e;
    }
    const n = inputs.length;
    return header(n, { insertId: firstId, info: n > 1 ? `Records: ${n}  Duplicates: 0  Warnings: 0` : '' });
  }

  function select() {
    const items = [];
    do {
      if (p.eatOp('*')) items.push({ star: true });
      else if (p.isWord('COUNT') && p.isOp('(', 1)) {
        p.i += 2;
        let arg = '*';
        if (!p.eatOp('*')) arg = p.name();
        p.expectOp(')');
        const label = `COUNT(${arg})`;
        const alias = p.eatWord('AS') ? p.name() : null;
        items.push({ count: arg, label: alias || label });
      } else {
        const o = p.operand();
        if (o.kind !== 'col') throw unsupported(sql);
        const alias = p.eatWord('AS') ? p.name() : null;
        items.push({ col: o.name, alias });
      }
    } while (p.eatOp(','));
    p.expectWord('FROM');
    const q = p.qname();
    let where = null;
    if (p.eatWord('WHERE')) where = p.cond();
    const order = [];
    if (p.eatWord('ORDER')) {
      p.expectWord('BY');
      do {
        const o = p.operand();
        if (o.kind !== 'col') p.fail();
        const dir = p.eatWord('DESC') ? -1 : (p.eatWord('ASC'), 1);
        order.push({ col: o.name, dir });
      } while (p.eatOp(','));
    }
    let limit = null;
    let offset = 0;
    if (p.eatWord('LIMIT')) {
      const a = p.next();
      if (!a || a.t !== 'num') p.fail(a);
      if (p.eatOp(',')) { const b = p.next(); offset = a.v; limit = b.v; }
      else { limit = a.v; if (p.eatWord('OFFSET')) offset = p.next().v; }
    }
    if (!p.atEnd() && !(p.isOp(';') && p.i === p.tokens.length - 1)) p.fail();
    checkPlaceholders();
    const table = tableOf(q);
    for (const it of items) {
      if (it.col) it.real = colOf(table, it.col, 'field list').name;
      if (it.count && it.count !== '*') colOf(table, it.count, 'field list');
    }
    if (where) bindCols(where, table, 'where clause');
    for (const o of order) o.real = colOf(table, o.col, 'order clause').name;
    let rows = table.rows.filter((r) => !where || test(where, r));
    if (order.length) {
      rows = rows.slice().sort((a, b) => {
        for (const o of order) {
          const c = compare(a[o.real], b[o.real]) ?? (a[o.real] == null ? (b[o.real] == null ? 0 : -1) : 1);
          if (c !== 0) return c * o.dir;
        }
        return 0;
      });
    }
    if (limit !== null) rows = rows.slice(offset, offset + limit);
    if (items.some((i) => i.count)) {
      const only = items[0];
      const n = only.count === '*' ? rows.length : rows.filter((r) => r[colOf(table, only.count, 'field list').name] != null).length;
      return { type: 'rows', rows: [{ [only.label]: n }], fields: [{ name: only.label, table: table.name }] };
    }
    const proj = items.some((i) => i.star) ? table.columns.map((c) => ({ src: c.name, out: c.name })) : items.map((i) => ({ src: i.real, out: i.alias || i.real }));
    return {
      type: 'rows',
      rows: rows.map((r) => Object.fromEntries(proj.map((c) => [c.out, r[c.src]]))),
      fields: proj.map((c) => ({ name: c.out, orgName: c.src, table: table.name, orgTable: table.name })),
    };
  }

  function update() {
    const q = p.qname();
    p.expectWord('SET');
    const sets = assignments();
    let where = null;
    if (p.eatWord('WHERE')) where = p.cond();
    if (!p.atEnd() && !(p.isOp(';') && p.i === p.tokens.length - 1)) p.fail();
    checkPlaceholders();
    const table = tableOf(q);
    const setCols = sets.map((s) => ({ col: colOf(table, s.col, 'field list'), o: s.o }));
    for (const s of sets) if (s.o.kind === 'col') s.o.col = colOf(table, s.o.name, 'field list').name;
    if (where) bindCols(where, table, 'where clause');
    const matched = table.rows.filter((r) => !where || test(where, r));
    const snapshot = table.rows.map((r) => ({ ...r }));
    const originals = new Map(table.rows.map((r, i) => [r, snapshot[i]]));
    let changed = 0;
    try {
      matched.forEach((row, idx) => {
        const before = { ...row };
        for (const s of setCols) {
          const v = val(s.o, before);
          if (v === null || v === undefined) {
            if (s.col.notNull) throw err('ER_BAD_NULL_ERROR', 1048, `Column '${s.col.name}' cannot be null`, '23000');
            row[s.col.name] = null;
          } else row[s.col.name] = coerce(s.col, v, idx + 1);
        }
        checkKeys(table, row, row);
        if (Object.keys(row).some((k) => row[k] !== before[k])) changed++;
      });
    } catch (e) {
      for (const [r, orig] of originals) Object.assign(r, orig);
      throw e;
    }
    return header(matched.length, { changedRows: changed, info: `Rows matched: ${matched.length}  Changed: ${changed}  Warnings: 0` });
  }

  function del() {
    p.expectWord('FROM');
    const q = p.qname();
    let where = null;
    if (p.eatWord('WHERE')) where = p.cond();
    if (!p.atEnd() && !(p.isOp(';') && p.i === p.tokens.length - 1)) p.fail();
    checkPlaceholders();
    const table = tableOf(q);
    if (where) bindCols(where, table, 'where clause');
    const keep = table.rows.filter((r) => where && !test(where, r));
    const removed = table.rows.length - keep.length;
    table.rows = keep;
    return header(removed);
  }

  const first = p.next();
  if (first.t !== 'word') throw syntax(sql, first.pos);
  switch (first.u) {
    case 'CREATE':
      if (p.eatWord('DATABASE') || p.eatWord('SCHEMA')) return createDatabase();
      if (p.eatWord('TABLE')) return createTable();
      throw unsupported(sql);
    case 'USE': return useDb();
    case 'DROP': return dropTable();
    case 'INSERT': return insert();
    case 'SELECT': return select();
    case 'UPDATE': return update();
    case 'DELETE': return del();
    default: throw unsupported(sql);
  }
}

// ---------- server / session ----------

export function createSqlServer({ seed } = {}) {
  const server = {
    dbs: new Map(),
    hasDatabase: (name) => server.dbs.has(String(name).toLowerCase()),
    connect({ database } = {}) {
      const session = { database: null, query: null };
      if (database) {
        const db = server.dbs.get(String(database).toLowerCase());
        if (!db) throw err('ER_BAD_DB_ERROR', 1049, `Unknown database '${database}'`, '42000');
        session.database = db.name;
      }
      session.query = (sql, values) => {
        const vals = values === undefined ? [] : Array.isArray(values) ? values : [values];
        try {
          return makeExecutor(server, session, String(sql), vals);
        } catch (e) {
          if (e instanceof SqlError) e.sql = String(sql);
          throw e;
        }
      };
      return session;
    },
    runScript(script, session = server.connect({})) {
      return splitStatements(script).map((st) => session.query(st));
    },
  };
  if (seed) server.runScript(seed);
  return server;
}
