const SRC = 'week4/W04-database-connection.md';

// ============ database seed (SQL exactly as in the note §04) ============

const CREATE_SQL = `create database sampledb;
use sampledb;

create table subjects
(
   id int primary key auto_increment,
   subject_code varchar(8) not null unique,
   subject_title varchar(60),
   credit int not null
);
`;
const INSERT_SQL = `insert into subjects (subject_code, subject_title, credit)
values ('INT 100', 'IT Fundamentals', 3),
    ('INT 101', 'Programming Fundamentals', 3),
    ('INT 102', 'Web Technology', 1),
    ('INT 114', 'Discrete Mathematics', 3),
    ('GEN 101', 'Physical Education', 1),
    ('GEN 111', 'Man and Ethics of Living', 3),
    ('LNG 120', 'General English', 3),
    ('LNG 220', 'Academic English', 3),
    ('INT 103', 'Advanced Programming', 3),
    ('INT 104', 'User Experience Design', 3),
    ('INT 105', 'Basic SQL', 1),
    ('INT 107', 'Computing Platforms Technology', 3),
    ('INT 200', 'Data Structures and Algorithms', 1),
    ('INT 201', 'Client-Side Programming I', 2),
    ('INT 202', 'Server-Side Programming I', 2),
    ('INT 205', 'Database Management System', 3),
    ('INT 207', 'Network I', 3);
`;
const SEED = CREATE_SQL + '\n' + INSERT_SQL;
const FIX = { mysql: { seed: SEED } };

// ============ the application files (note §09–§17, with the corrections the note lists) ============

const DB_POOL = `import * as mysql from 'mysql2/promise'

export const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '<your-password>',
    database: 'sampledb'
})
export default pool;
`;
const DB_POOL_BUG = DB_POOL.replace("database: 'sampledb'", "database: 'sample'");

const R_HEAD = `import pool from '../db/pool.js'
`;
const R_FINDALL = `
export async function findAll() {
    const [subjects] = await pool.query('SELECT * FROM subjects')
    return subjects;
}
`;
const R_FINDALL_TODO = `
export async function findAll() {
    // เขียนโค้ดตรงนี้: SELECT ทุกแถวจากตาราง subjects แล้วคืนเฉพาะ rows (index 0)
}
`;
const R_FINDBYID = `export async function findById(id) {
    const [subject] = await pool.query(
        'SELECT * FROM subjects WHERE id = ?', [id])
    if (subject.length == 0) return null;
    return subject[0];
}
`;
const R_FINDBYID_TODO = `export async function findById(id) {
    // เขียนโค้ดตรงนี้: SELECT ... WHERE id = ? (ส่ง [id]) แล้วคืน object ตัวเดียว
    // ถ้าไม่พบให้คืน null
}
`;
const R_FINDBYCODE = `export async function findBySubjectCode(subject) {
    const [res] = await pool.query(
        'SELECT * FROM subjects WHERE subject_code = ?', [subject.subject_code]);
    if (res.length == 0) return null;
    return res[0];
}
`;
const R_REMOVE = `export async function remove(id) {
    const [result] = await pool.query(
        "DELETE FROM subjects WHERE id = ?", [id]);
    return result.affectedRows > 0;
}
`;
const R_REMOVE_TODO = `export async function remove(id) {
    // เขียนโค้ดตรงนี้: DELETE ... WHERE id = ? แล้วตัดสินสำเร็จจาก result.affectedRows > 0
    return false;
}
`;
const R_CREATE = `export async function create(subject) {
    const [result] = await pool.query(
        "INSERT INTO subjects (subject_code, subject_title, credit) " +
        "VALUES (?, ?, ?)", [subject.subject_code, subject.subject_title, subject.credit]);
    console.log('Result: ', result);
    if (result.affectedRows === 0) return false;
    return findById(result.insertId);
}
`;
const R_CREATE_TODO = `export async function create(subject) {
    // เขียนโค้ดตรงนี้: INSERT (subject_code, subject_title, credit) ด้วย ? 3 ตัว
    // แล้วคืนข้อมูลที่เพิ่ง insert (ใช้ result.insertId กับ findById) — ไม่สำเร็จคืน false
    return false;
}
`;
const R_UPDATE = `export async function update(subject) {
    const [result] = await pool.query(
        "UPDATE subjects SET subject_code = ?, subject_title = ?, " +
        "credit = ? WHERE id = ?", [subject.subject_code, subject.subject_title,
            subject.credit, subject.id]
    );
    if (result.affectedRows === 0) return false;
    return findById(subject.id);
}
`;
const R_UPDATE_TODO = `export async function update(subject) {
    // เขียนโค้ดตรงนี้: UPDATE subject_code, subject_title, credit ... WHERE id = ?
    // affectedRows เป็น 0 → คืน false, สำเร็จ → คืนข้อมูลใหม่ด้วย findById
    return false;
}
`;
const repo = ({ findAll = R_FINDALL, findById = R_FINDBYID, remove = R_REMOVE, create = R_CREATE, update = R_UPDATE } = {}) =>
  [R_HEAD + findAll, findById, R_FINDBYCODE, remove, create, update].join('\n');
const REPO = repo();

const SERVICE_HEAD = `import * as repo from '../repositories/subject-repository.js';

export async function getAllSubjects() {
    return await repo.findAll();
}

export async function getSubjectById(id) {
    return await repo.findById(id);
}

`;
const SERVICE_CREATE = `export async function createNewSubject(subject) {
    if (await repo.findBySubjectCode(subject) != null) return null;
    return await repo.create(subject);
}
`;
const SERVICE_CREATE_NODUP = `export async function createNewSubject(subject) {
    // เขียนโค้ดตรงนี้: เช็คว่ามี subject_code นี้อยู่แล้วหรือยัง (repo.findBySubjectCode)
    // ถ้าซ้ำให้คืน null ไม่ต้อง create — ถ้าไม่ซ้ำค่อย create
    return await repo.create(subject);
}
`;
const SERVICE_TAIL = `
export async function updateSubjectById(id, subject) {
    subject.id = id;
    return await repo.update(subject);
}

export async function removeSubjectById(id) {
    return await repo.remove(id);
}
`;
const SERVICE = SERVICE_HEAD + SERVICE_CREATE + SERVICE_TAIL;

const SERVER = `import * as http from 'node:http';
import * as route from './router.js';

const server = http.createServer(async (req, res) => {
    await route.handleUserRequest(req, res);
});
server.listen(3000, () => {
    console.log('Server running at http://127.0.0.1:3000/');
});
server.on('request', (req, res) => {
    console.log('Request received:', req.method, req.url);
});
`;

const GETBODY = `function getBody(request, response) {
  return new Promise((resolve, reject) => {
    let body = '';
    // Collect data chunks as they arrive stream-by-stream
    request.on('data', chunk => {
        body += chunk.toString();
    });
    // Process the full payload once reception completes
    request.on('end', () => {
        // Parse the raw text buffer into a JavaScript object
        if (body) {
            const jsObject = JSON.parse(body);
            console.log("object: ", jsObject);
            resolve(jsObject);
        } else {
            resolve(null)
        }
    });
    request.on('error', (err) => {
        reject(err);
    });
  });
}
`;
const GETBODY_TODO = `function getBody(request, response) {
  return new Promise((resolve, reject) => {
    // เขียนโค้ดตรงนี้: สะสม chunk จาก request.on('data') เป็น string,
    // เมื่อ 'end' แล้ว JSON.parse เป็น object (ไม่มี body ให้ resolve(null)),
    // และ reject เมื่อเกิด 'error'
    resolve(null);
  });
}
`;
const WRITE_RESPONSE = `
async function writeResponse(response, status, message) {
    response.writeHead(status, {'Content-Type': 'application/json'});
    response.end(JSON.stringify(message));
}
`;
const CREATE_FN = `
async function createNewSubject(request, response) {
  const subject = await getBody(request, response);
  var message = null
  var status = 201
  if (subject) {
     const newSubject = await service.createNewSubject(subject)
     message = newSubject
     if (! newSubject) {
        status = 409
        message = {error: \`Duplicate subject for code \${subject.subject_code}\`}
     }
  } else {
     message = {error: "Bad request, body is empty"}
     status = 400
  }
  writeResponse(response,status,message)
}
`;
const CREATE_FN_TODO = `
async function createNewSubject(request, response) {
  const subject = await getBody(request, response);
  // เขียนโค้ดตรงนี้: ตอบตามกรณี
  //   - มี body → เรียก service.createNewSubject(subject)
  //       สำเร็จ → 201 + subject ที่สร้าง / ซ้ำ (ได้ null) → 409 + {error: '...'}
  //   - ไม่มี body → 400 + {error: "Bad request, body is empty"}
  writeResponse(response, 200, subject)
}
`;
const UPDATE_FN = `
async function updateSubject(request, response, id) {
  const subject = await getBody(request, response);
  var message = null
  var status = 200
  if (subject) {
      var newSubject = await service.updateSubjectById(id, subject)
      message = newSubject
      console.log("update: ", message)
      if (! newSubject) {
         status = 404
         message = {error: \`Subject not found for id \${id}\`}
      }
  } else {
      message = {error: "Bad request, body is empty"}
      status = 400
  }
  writeResponse(response,status,message)
}
`;
const MAIN = `
export async function handleUserRequest(request, response) {
    const {url, method} = request;

    if (url === '/subjects') {
        switch (request.method) {
            case 'GET':
                const subjects = await service.getAllSubjects();
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(subjects));
                break;
            case 'POST':
                await createNewSubject(request, response);
                break;
        }
    } else if (url.startsWith('/subjects/')) {
        const id = url.slice('/subjects/'.length);
        switch (request.method) {
            case 'GET':
                const subject = await service.getSubjectById(id);
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(subject));
                break;
            case 'DELETE':
                const delSubject = await service.removeSubjectById(id);
                if (delSubject) {
                    response.writeHead(204, {'Content-Type': 'application/json'});
                    response.end();
                } else {
                    response.writeHead(404, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify({error: 'Subject not found for id = '+id}));
                }
                break;
            case 'PUT':
                await updateSubject(request, response, id);
                break;
        }
    } else {
        response.writeHead(404, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({error : 'Resource not found'}));
    }
}
`;
const ROUTER_TOP = "import * as service from './services/subject-service.js';\n\n";
const router = ({ getBody = GETBODY, create = CREATE_FN } = {}) => ROUTER_TOP + getBody + WRITE_RESPONSE + create + UPDATE_FN + MAIN;
const ROUTER = router();

// read-only router, used by the async/await exercise
const READ_ROUTER_BODY = (async_, await_) => `import * as service from './services/subject-service.js';

export ${async_}function handleUserRequest(request, response) {
    const {url} = request;
    if (url === '/subjects') {
        const subjects = ${await_}service.getAllSubjects();
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(subjects));
    } else if (url.startsWith('/subjects/')) {
        const id = url.slice('/subjects/'.length);
        const subject = ${await_}service.getSubjectById(id);
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(subject));
    } else {
        response.writeHead(404, {'Content-Type': 'application/json'});
        response.end(JSON.stringify({error: 'Resource not found'}));
    }
}
`;
const READ_ROUTER_STARTER = READ_ROUTER_BODY('', '');
const READ_ROUTER_SOLUTION = READ_ROUTER_BODY('async ', 'await ');

// project with the file being edited listed FIRST (the solution replaces the first file); `entry` selects what runs
const P = { pool: 'db/pool.js', repo: 'repositories/subject-repository.js', service: 'services/subject-service.js', router: 'router.js', server: 'server.js' };
const project = (first, override = {}, extra = {}) => {
  const base = { [P.server]: SERVER, [P.router]: ROUTER, [P.service]: SERVICE, [P.repo]: REPO, [P.pool]: DB_POOL, ...override };
  const ordered = { [first]: base[first] };
  for (const [k, v] of Object.entries(base)) if (k !== first) ordered[k] = v;
  return { ...ordered, ...extra };
};

const NEW_A = { subject_code: 'INT 290', subject_title: 'New Subject', credit: 2 };
const NEW_B = { subject_code: 'INT 291', subject_title: 'Another Subject', credit: 1 };
const S1 = { id: 1, subject_code: 'INT 100', subject_title: 'IT Fundamentals', credit: 3 };
const call = (method, path, body, expect) => ({ request: { method, path, ...(body ? { body } : {}) }, expect });

// ============ experiments ============

const TEST_DB = `import pool from "../db/pool.js"

export async function findAll() {
    const subjects = await pool.query ('SELECT * FROM subjects')
    return subjects;
}

const [subjects,table_schema] = await findAll();
await pool.end();

console.log(subjects);
console.log(table_schema);
`;

const CALLBACK_PROMISE = `import mysql from 'mysql2';
import * as mysqlPromise from 'mysql2/promise';

const config = { host: 'localhost', user: 'root', password: '<your-password>', database: 'sampledb' };

// แบบ callback API (import จาก 'mysql2')
const pool = mysql.createPool(config);
pool.query(
  'SELECT * FROM subjects WHERE credit > ?', [2], (err, results, fields) => {
    if (err) {
      console.error(' Query error:', err);
      return;
    }
    console.log('Results (callback):', results.length);
  }
);

// แบบ Promise API (import จาก 'mysql2/promise') ใช้ async/await ได้
const poolPromise = mysqlPromise.createPool(config);
async function main() {
  const [rows] = await poolPromise.query('SELECT * FROM subjects WHERE credit > ?', [2]);
  console.log('Results (promise):', rows.length);
  await poolPromise.end();
}
await main();
pool.end();
`;

const TEST_CRUD = `import pool from "../db/pool.js"

const [inserted] = await pool.query(
    "INSERT INTO subjects (subject_code, subject_title, credit) " +
    "VALUES (?, ?, ?)", ['INT 290', 'New Subject', 2]);
console.log('insert:', inserted);

const [updated] = await pool.query(
    "UPDATE subjects SET subject_code = ?, subject_title = ?, credit = ? " +
    "WHERE id = ?", ['INT 290', 'New Subject test update', 3, inserted.insertId]);
console.log('update:', updated);

const id = inserted.insertId;
const [deleted] = await pool.query(
    "DELETE FROM subjects WHERE id = ?", [id]);
console.log('delete:', deleted);

await pool.end();
`;

export const experiments = {
  sqlConsole: {
    type: 'experiment', id: 'e-sql-console', title: 'SQL console: สร้าง database, table และ insert 17 แถว',
    source: `${SRC} §04 สร้าง database และ table subjects`, widget: 'sql-console',
    body: '<p>กด <b>Execute</b> เพื่อรัน SQL ตามสไลด์ (จะได้ <code>17 rows affected</code> และตาราง subjects) แล้วลองรันซ้ำ, insert รหัสวิชาซ้ำ (ชน UNIQUE), หรือเพิ่มคำสั่ง <code>update</code>/<code>delete</code> เอง — ตัวจำลองรองรับ SQL พื้นฐาน (CREATE/INSERT/SELECT/UPDATE/DELETE)</p>',
    data: { script: CREATE_SQL + '\n' + INSERT_SQL + '\nselect * from subjects;\n' },
  },

  firstQuery: {
    type: 'experiment', id: 'e-first-query', title: 'ทดสอบ pool.js ด้วย tests/test-db.js',
    source: `${SRC} §09 db/pool.js, §10 ทดสอบก่อนเขียนจริง — tests/test-db.js`,
    body: '<p>Run แล้วดู <code>subjects</code> (array ของ object 17 ตัว) กับ <code>table_schema</code> (fields) จากนั้นลบบรรทัด <code>await pool.end();</code> แล้ว Run ใหม่ — ใน Node จริงโปรแกรมจะไม่จบ ต้องกด Ctrl+C (simulator จะแจ้งเตือนให้)</p>',
    entry: 'tests/test-db.js', fixtures: FIX,
    files: { 'tests/test-db.js': TEST_DB, [P.pool]: DB_POOL },
  },

  callbackPromise: {
    type: 'experiment', id: 'e-callback-promise', title: 'Callback API vs Promise API (async/await)',
    source: `${SRC} §08 Callback vs async/await (ปรับจากตาราง students เป็น subjects ตามที่อาจารย์บอกให้ปรับชื่อเอง)`,
    body: '<p>Run แล้วดูผลทั้งสองแบบ จากนั้นลองเปลี่ยนบรรทัด <code>pool.query(...)</code> แบบ callback เป็น <code>const [rows] = await pool.query(...)</code> — จะเจอ error เพราะ import จาก <code>mysql2</code> ไม่ใช่ <code>mysql2/promise</code></p>',
    fixtures: FIX, files: { 'callback-vs-promise.js': CALLBACK_PROMISE },
  },

  resultShape: {
    type: 'experiment', id: 'e-result-shape', title: 'ResultSetHeader ของ INSERT / UPDATE / DELETE',
    source: `${SRC} §08 รูปร่างของผลลัพธ์, §11 ทดลอง CRUD ด้วย Prepared Statement`,
    body: '<p>Run แล้วดู <code>insertId</code> (id ที่ database เพิ่ง auto_increment ให้ = 18), <code>affectedRows</code> และ <code>info</code> ของ UPDATE จากนั้นเรียก Run ซ้ำ — ทุกครั้งเริ่มจากข้อมูลชุดเดิม ลองเปลี่ยนค่าใน <code>?</code> ดูผล</p>',
    entry: 'tests/test-crud.js', fixtures: FIX,
    files: { 'tests/test-crud.js': TEST_CRUD, [P.pool]: DB_POOL },
  },

  crudApp: {
    type: 'experiment', id: 'e-crud-app', title: 'แอป CRUD ที่ต่อ MySQL ครบทุกชั้น',
    source: `${SRC} §09–§17 (ปรับตามที่โน้ตระบุ: subject_code/subject_title, findById คืน subject[0], เติม await)`,
    body: `<p>แอปเสร็จสมบูรณ์ 5 ไฟล์ ลองยิง <code>GET /subjects</code>, <code>GET /subjects/1</code>, <b>POST</b> <code>/subjects</code> พร้อม body <code>{"subject_code": "INT 290", "subject_title": "New Subject", "credit": 2}</code> (ได้ 201 และ id 18), POST ซ้ำ (ได้ 409 เพราะ service เช็คให้), <b>PUT</b> <code>/subjects/1</code>, <b>DELETE</b> <code>/subjects/1</code> (ได้ 204) แล้วยิงซ้ำ (ได้ 404)</p>`,
    entry: 'server.js', fixtures: FIX,
    files: project(P.server),
  },
};

// ============ exercises ============

const TESTDB_CHECK = [
  { name: 'อ่านข้อมูลได้ (INT 100)', steps: [], logIncludes: ['"subject_code":"INT 100"'] },
  { name: 'อ่านครบทั้ง 17 แถว (INT 207)', steps: [], logIncludes: ['"subject_code":"INT 207"'] },
];

const INJECTION_STARTER = `import * as http from 'node:http';
import * as mysql from 'mysql2/promise';

const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '<your-password>', database: 'sampledb' });

async function findByCode(code) {
    // ตอนนี้ต่อสตริงเป็น SQL ตรง ๆ — ลองส่ง code เป็น  INT 100' OR '1'='1  แล้วดูว่าได้กี่แถว
    // แก้ให้ใช้ prepared statement (? และ array ของค่า)
    const [rows] = await pool.query("SELECT * FROM subjects WHERE subject_code = '" + code + "'");
    return rows;
}

http.createServer(async (request, response) => {
    const urlObj = new URL(request.url, \`http://\${request.headers.host}\`);
    const rows = await findByCode(urlObj.searchParams.get('code'));
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(JSON.stringify(rows));
}).listen(3000);
`;
const INJECTION_SOLUTION = INJECTION_STARTER
  .replace(/    \/\/ ตอนนี้ต่อสตริง[^\n]*\n    \/\/ แก้ให้ใช้[^\n]*\n/, '')
  .replace(`await pool.query("SELECT * FROM subjects WHERE subject_code = '" + code + "'")`, "await pool.query('SELECT * FROM subjects WHERE subject_code = ?', [code])");

export const exercises = {
  poolConfig: {
    type: 'exercise', id: 'x-pool-config', title: 'โจทย์ 1: แก้ config ใน pool.js ให้ต่อ database ได้',
    source: `${SRC} §04 (ระวังชื่อ database ในสไลด์ไม่ตรงกัน), §09 db/pool.js, §10 tests/test-db.js`,
    body: '<p>รัน <code>tests/test-db.js</code> แล้วอ่าน error ให้ครบ — สไลด์ใช้ชื่อ database ผิด (<code>sample</code>) แต่ในคาบใช้ database ที่สร้างไว้ แก้ config ใน <code>db/pool.js</code> ให้ผ่าน</p>',
    hint: 'อ่านข้อความ <code>Unknown database …</code> แล้วเทียบกับชื่อที่สร้างด้วย <code>create database</code>',
    entry: 'tests/test-db.js', fixtures: FIX,
    files: { [P.pool]: DB_POOL_BUG, 'tests/test-db.js': TEST_DB },
    solution: DB_POOL,
    tests: TESTDB_CHECK,
  },

  findAll: {
    type: 'exercise', id: 'x-find-all', title: 'โจทย์ 2: repository — findAll ด้วย pool.query',
    source: `${SRC} §12 แก้ subject-repository.js`,
    body: '<p>เขียน <code>findAll()</code> ให้ส่ง <code>SELECT * FROM subjects</code> แล้วคืน <b>เฉพาะ rows</b> (destructuring <code>const [subjects] = …</code>) — ชั้นอื่นเขียนไว้ให้แล้ว</p>',
    hint: '<code>pool.query</code> คืน <code>[rows, fields]</code> — รับเฉพาะตัวแรก',
    entry: 'server.js', fixtures: FIX,
    files: project(P.repo, { [P.repo]: repo({ findAll: R_FINDALL_TODO }) }),
    solution: REPO,
    tests: [
      { name: 'GET /subjects มี INT 100', steps: [call('GET', '/subjects', null, { status: 200, textIncludes: '"subject_code":"INT 100"' })] },
      { name: 'GET /subjects มี INT 207 (แถวที่ 17)', steps: [call('GET', '/subjects', null, { status: 200, textIncludes: '"subject_code":"INT 207"' })] },
    ],
  },

  findById: {
    type: 'exercise', id: 'x-find-by-id', title: 'โจทย์ 3: repository — findById ด้วย ? และคืน object ตัวเดียว',
    source: `${SRC} §11 Prepared Statement, §12 (จุดที่สไลด์ไม่ตรง: findById คืน subject[0])`,
    body: '<p>เขียน <code>findById(id)</code> ด้วย prepared statement (<code>?</code> + <code>[id]</code>) คืน <b>object ตัวเดียว</b> (ไม่ใช่ array) ถ้าไม่พบคืน <code>null</code></p>',
    hint: 'SELECT ได้ array เสมอ — ถ้า <code>length == 0</code> คืน <code>null</code> ไม่งั้นคืน <code>subject[0]</code>',
    entry: 'server.js', fixtures: FIX,
    files: project(P.repo, { [P.repo]: repo({ findById: R_FINDBYID_TODO }) }),
    solution: REPO,
    tests: [
      { name: 'GET /subjects/1 ได้ object', steps: [call('GET', '/subjects/1', null, { status: 200, json: S1 })] },
      { name: 'GET /subjects/999 ได้ null', steps: [call('GET', '/subjects/999', null, { status: 200, json: null })] },
    ],
  },

  remove: {
    type: 'exercise', id: 'x-remove', title: 'โจทย์ 4: repository — remove ตัดสินจาก affectedRows',
    source: `${SRC} §11 (DELETE), §12 remove()`,
    body: '<p>เขียน <code>remove(id)</code>: ส่ง <code>DELETE … WHERE id = ?</code> แล้วคืน <code>true</code> ถ้า <code>affectedRows &gt; 0</code> ไม่งั้นคืน <code>false</code> (router จะแปลงเป็น 204 / 404)</p>',
    hint: '<code>const [result] = await pool.query(...)</code> — <code>result</code> คือ ResultSetHeader',
    entry: 'server.js', fixtures: FIX,
    files: project(P.repo, { [P.repo]: repo({ remove: R_REMOVE_TODO }) }),
    solution: REPO,
    tests: [{
      name: 'DELETE สำเร็จ 204 → หายไป → DELETE ซ้ำได้ 404',
      steps: [
        call('DELETE', '/subjects/1', null, { status: 204, text: '' }),
        call('GET', '/subjects/1', null, { status: 200, json: null }),
        call('DELETE', '/subjects/1', null, { status: 404, json: { error: 'Subject not found for id = 1' } }),
      ],
    }],
  },

  create: {
    type: 'exercise', id: 'x-create', title: 'โจทย์ 5: repository — create คืนข้อมูลที่เพิ่ง insert',
    source: `${SRC} §11 (INSERT), §12 create()`,
    body: '<p>เขียน <code>create(subject)</code>: INSERT ด้วย <code>?</code> สามตัว แล้วคืนแถวที่เพิ่งสร้างโดยเอา <code>result.insertId</code> ไป <code>findById</code> (ไม่สำเร็จคืน <code>false</code>) — สังเกตว่า id ที่ได้ไม่ย้อนกลับไปใช้เลขที่ถูกลบแล้ว</p>',
    hint: 'id เป็น auto_increment รู้ล่วงหน้าไม่ได้ ต้องอ่านจาก <code>result.insertId</code>',
    entry: 'server.js', fixtures: FIX,
    files: project(P.repo, { [P.repo]: repo({ create: R_CREATE_TODO }) }),
    solution: REPO,
    tests: [{
      name: 'POST ได้ 201 + id 18 → ลบ id 18 → POST ใหม่ได้ id 19 (ไม่ใช้เลขซ้ำ)',
      steps: [
        call('POST', '/subjects', NEW_A, { status: 201, json: { id: 18, ...NEW_A } }),
        call('DELETE', '/subjects/18', null, { status: 204 }),
        call('POST', '/subjects', NEW_B, { status: 201, json: { id: 19, ...NEW_B } }),
      ],
    }],
  },

  update: {
    type: 'exercise', id: 'x-update', title: 'โจทย์ 6: repository — update (ส่วน U ที่ให้ไปทำเอง)',
    source: `${SRC} §11 (UPDATE), §12 update(), §16 PUT /subjects/{id}`,
    body: '<p>เขียน <code>update(subject)</code>: <code>UPDATE … SET subject_code = ?, subject_title = ?, credit = ? WHERE id = ?</code> ถ้า <code>affectedRows</code> เป็น 0 คืน <code>false</code> (router ตอบ 404) ไม่งั้นคืนข้อมูลใหม่ด้วย <code>findById</code></p>',
    hint: 'ลำดับค่าใน array ต้องตรงกับลำดับ <code>?</code> — <code>id</code> อยู่ตัวสุดท้าย',
    entry: 'server.js', fixtures: FIX,
    files: project(P.repo, { [P.repo]: repo({ update: R_UPDATE_TODO }) }),
    solution: REPO,
    tests: [
      { name: 'PUT /subjects/1 → 200 + ข้อมูลใหม่', steps: [call('PUT', '/subjects/1', { subject_code: 'INT 100', subject_title: 'IT Fundamentals (updated)', credit: 2 }, { status: 200, json: { id: 1, subject_code: 'INT 100', subject_title: 'IT Fundamentals (updated)', credit: 2 } })] },
      { name: 'PUT /subjects/999 → 404', steps: [call('PUT', '/subjects/999', { subject_code: 'X 1', subject_title: 'None', credit: 1 }, { status: 404, json: { error: 'Subject not found for id 999' } })] },
    ],
  },

  asyncChain: {
    type: 'exercise', id: 'x-async-chain', title: 'โจทย์ 7: response ว่างเปล่า — เติม async/await ให้ router',
    source: `${SRC} §13 async/await ลามทั้งเส้น (อาการตอนลืมใส่)`,
    body: '<p>repository และ service เป็น <code>async</code> แล้ว แต่ router ยังเรียกแบบเดิม — ลองยิง <code>GET /subjects</code> ดูว่าได้อะไรกลับมา (ทั้งที่ไม่มี error) แล้วเติม <code>async</code>/<code>await</code> ให้ router ทำงานถูก โดยไม่แก้ตรรกะ</p>',
    hint: 'ฟังก์ชันที่มี <code>await</code> ต้องประกาศ <code>async</code> และทุกที่ที่เรียก <code>service.…</code> ต้อง <code>await</code>',
    entry: 'server.js', fixtures: FIX,
    files: project(P.router, { [P.router]: READ_ROUTER_STARTER }),
    solution: READ_ROUTER_SOLUTION,
    tests: [
      { name: 'GET /subjects ได้ข้อมูลจริง', steps: [call('GET', '/subjects', null, { status: 200, textIncludes: '"subject_code":"INT 101"' })] },
      { name: 'GET /subjects/1 ได้ object', steps: [call('GET', '/subjects/1', null, { status: 200, json: S1 })] },
    ],
  },

  getBody: {
    type: 'exercise', id: 'x-get-body', title: 'โจทย์ 8: เขียน getBody() อ่าน request body ที่มาเป็น chunk',
    source: `${SRC} §14 อ่าน request body — getBody() และ writeResponse()`,
    body: '<p>เขียน <code>getBody()</code>: สะสม chunk ด้วย <code>request.on(\'data\')</code> เป็น string, เมื่อ <code>\'end\'</code> แล้ว <code>JSON.parse</code> เป็น object (ไม่มี body ให้ <code>resolve(null)</code>) และ <code>reject</code> เมื่อ <code>\'error\'</code></p>',
    hint: '<code>body += chunk.toString()</code> ใน <code>on(\'data\')</code> แล้วตัดสินใจทั้งหมดใน <code>on(\'end\')</code>',
    entry: 'server.js', fixtures: FIX,
    files: project(P.router, { [P.router]: router({ getBody: GETBODY_TODO }) }),
    solution: ROUTER,
    tests: [
      { name: 'POST พร้อม body → 201', steps: [call('POST', '/subjects', NEW_A, { status: 201, json: { id: 18, ...NEW_A } })] },
      { name: 'POST ไม่มี body → 400', steps: [call('POST', '/subjects', null, { status: 400, json: { error: 'Bad request, body is empty' } })] },
    ],
  },

  statusCodes: {
    type: 'exercise', id: 'x-status-codes', title: 'โจทย์ 9: POST ตอบ 201 / 409 / 400 ให้ถูกต้อง',
    source: `${SRC} §15 POST /subjects — createNewSubject`,
    body: '<p>เขียน <code>createNewSubject</code> ใน router ให้ตอบ: สร้างสำเร็จ <b>201</b> พร้อมข้อมูลที่สร้าง · รหัสวิชาซ้ำ (service คืน <code>null</code>) <b>409</b> พร้อม <code>{error: …}</code> · ไม่มี body <b>400</b> พร้อม <code>{error: "Bad request, body is empty"}</code> — อย่าลืม <code>await</code> ตอนเรียก service</p>',
    hint: 'การ create ตอบ 201 ไม่ใช่ 200 · <code>if (!newSubject)</code> คือกรณีซ้ำ',
    entry: 'server.js', fixtures: FIX,
    files: project(P.router, { [P.router]: router({ create: CREATE_FN_TODO }) }),
    solution: ROUTER,
    tests: [
      { name: 'สร้างสำเร็จ → 201', steps: [call('POST', '/subjects', NEW_A, { status: 201, json: { id: 18, ...NEW_A } })] },
      { name: 'รหัสวิชาซ้ำ → 409 + error', steps: [call('POST', '/subjects', { subject_code: 'INT 100', subject_title: 'Dup', credit: 1 }, { status: 409, textIncludes: '"error"' })] },
      { name: 'ไม่มี body → 400', steps: [call('POST', '/subjects', null, { status: 400, json: { error: 'Bad request, body is empty' } })] },
    ],
  },

  businessDup: {
    type: 'exercise', id: 'x-business-dup', title: 'โจทย์ 10: กัน server ตาย — เช็คข้อมูลซ้ำที่ชั้น service',
    source: `${SRC} §17 Business logic ในชั้น service — กันข้อมูลซ้ำก่อน insert`,
    body: '<p>ลอง POST รหัสวิชาที่มีอยู่แล้ว (เช่น <code>INT 100</code>) — DBMS ปฏิเสธด้วย UNIQUE constraint และโปรแกรมตาย แก้ที่ <b>service</b>: เรียก <code>repo.findBySubjectCode</code> ก่อน ถ้าเจอ (ไม่เป็น <code>null</code>) ให้คืน <code>null</code> โดยไม่ต้อง create</p>',
    hint: '<code>if (await repo.findBySubjectCode(subject) != null) return null;</code>',
    entry: 'server.js', fixtures: FIX,
    files: project(P.service, { [P.service]: SERVICE_HEAD + SERVICE_CREATE_NODUP + SERVICE_TAIL }),
    solution: SERVICE,
    tests: [
      { name: 'POST รหัสวิชาซ้ำ (INT 100) → 409 ไม่ตาย', steps: [call('POST', '/subjects', { subject_code: 'INT 100', subject_title: 'Dup', credit: 1 }, { status: 409, textIncludes: '"error"' })] },
      { name: 'POST รหัสวิชาใหม่ → 201', steps: [call('POST', '/subjects', NEW_A, { status: 201, json: { id: 18, ...NEW_A } })] },
    ],
  },

  sqlInjection: {
    type: 'exercise', id: 'x-sql-injection', title: 'โจทย์ 11: SQL Injection — เปลี่ยนการต่อสตริงเป็น Prepared Statement',
    source: `${SRC} §01 (เป้าหมายข้อ 3), §11 ทำไมต้อง Prepared Statement`,
    body: '<p><code>GET /?code=…</code> ค้นวิชาด้วยรหัส แต่ตอนนี้ต่อสตริงเป็น SQL ตรง ๆ — ลองส่ง <code>INT 100\' OR \'1\'=\'1</code> เป็น code จะได้ทุกแถว! แก้ให้ใช้ <code>?</code> และส่ง array ของค่า แล้วค่าแปลก ๆ จะได้ผลลัพธ์ว่าง</p>',
    hint: '<code>pool.query(\'SELECT * FROM subjects WHERE subject_code = ?\', [code])</code>',
    fixtures: FIX,
    files: { 'server.js': INJECTION_STARTER },
    solution: INJECTION_SOLUTION,
    codeChecks: [{ name: 'ใช้ placeholder ? ใน SQL', pattern: 'subject_code = \\?' }],
    tests: [
      { name: 'ค้นด้วยรหัสปกติ INT 101 ได้แถวเดียว', steps: [call('GET', '/?code=INT 101', null, { status: 200, json: [{ id: 2, subject_code: 'INT 101', subject_title: 'Programming Fundamentals', credit: 3 }] })] },
      { name: "code = INT 100' OR '1'='1 ต้องไม่ได้แถวใดเลย", steps: [call('GET', "/?code=INT 100' OR '1'='1", null, { status: 200, json: [] })] },
    ],
  },
};
export const SEED_SQL = SEED; // shared with W5/W6 fixtures
