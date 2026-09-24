import { SEED_SQL } from './w4-labs.js';

const SRC = 'week5/05-INT161-Express-Framework.pdf';
const FIX = { mysql: { seed: SEED_SQL } };

// ============ experiments (code from the slides) ============

const FIRST_EXPRESS = `import express from 'express';

const app = express();
app.use(express.json()); //midle-ware

app.put('/api/subjects/:id', (req, res) => {
    const {filter, page, size} = req.query;
    const id = req.params.id;
    const subject = req.body;
    subject.id = id;
    res.json([subject, {filter: filter,
       page: page, size: size}]);
});
app.listen(3000);
`;

const STATUS_CHAIN = `import express from 'express';

const app = express();
app.use(express.json());

app.post('/api/subjects', (req, res) => {
    const subject = req.body;
    res.status(201);                    // ตั้ง status เท่านั้น — ยังไม่ได้ส่ง response
    // res.status(201).json(subject);   // ← ต่อ .json() แล้วถึงจะส่ง
});
app.listen(3000);
`;

const ROUTER_MOUNT = `import express from 'express';

const router = express.Router();
router.get('/', (req, res) => {
    res.send('Welcome to the homepage!');
});
router.get('/:id', (req, res) => {
    const {id} = req.params;
    res.json({ id: id });
});

const app = express();
app.use('/api/subjects', router);
app.listen(3000);
`;

const MIDDLEWARE_ORDER = `import express from 'express';

const app = express();

// Middleware 1 - Logger
app.use((req, res, next) => {
    console.log(\`\${req.method} \${req.url}\`)
    next()
})

// Middleware 2 - JSON parser
app.use(express.json())

app.post('/echo', (req, res) => {
    res.json({ received: req.body });
});
app.listen(3000);
`;

// ============ the layered CRUD project (ESM template layout) ============

const DB_CONFIG = `import mysql from 'mysql2/promise'

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '<your-password>',
    database: 'sampledb',
})
export default db
`;

const REPO = `import db from '../configs/db-config.js'

const FIND_ALL_SQL = 'SELECT * FROM subjects'
const FIND_ONE_SQL = 'SELECT * FROM subjects WHERE id = ?'
const UPDATE_SQL = 'UPDATE subjects SET ? WHERE id = ?'
const REMOVE_SQL = 'DELETE FROM subjects WHERE id = ?'
const CREATE_SQL = 'INSERT INTO subjects SET ?'

export async function findAll() {
    const [subjects] = await db.query(FIND_ALL_SQL)
    return subjects
}

export async function findById(id) {
    return await db.query(FIND_ONE_SQL, [id]) // ผลดิบ [rows, fields] ตามตัวอย่างในสไลด์
}

export async function create(subject) {
    const [result] = await db.query(CREATE_SQL, [subject])
    const [created] = await db.query(FIND_ONE_SQL, [result.insertId])
    return created[0]
}

export async function update(id, subject) {
    const [result] = await db.query(UPDATE_SQL, [subject, id])
    if (result.affectedRows === 0) return null
    const [updated] = await db.query(FIND_ONE_SQL, [id])
    return updated[0]
}

export async function remove(id) {
    const [result] = await db.query(REMOVE_SQL, [id])
    return result.affectedRows > 0
}
`;

const SERVICE = `import * as repo from '../repositories/subject-repository.js'

export async function getAllSubjects() {
    return await repo.findAll()
}

export async function getSubjectById(id) {
    return await repo.findById(id) // ผลดิบ [rows, fields]
}

export async function createSubject(subject) {
    return await repo.create(subject)
}

export async function updateSubject(id, subject) {
    return await repo.update(id, subject)
}

export async function removeSubject(id) {
    return await repo.remove(id)
}
`;

const R_HEAD = `import express from "express";
import * as service from "../services/subject-service.js";
const router = express.Router();

`;
const R_GET_ALL = `router.get('/', async (req, res, next) => {
    const subjects = await service.getAllSubjects();
    res.json(subjects);
});
`;
const R_GET_ONE = `router.get('/:id', async (req, res, next) => {
    const {id} = req.params;
    const [subject] = await service.getSubjectById(id);
    if (!subject[0])
        return res.status(404).json({message: 'Subject not found'});
    res.json(subject[0]);
});
`;
const R_POST = `router.post('/', async (req, res, next) => {
    const created = await service.createSubject(req.body);
    res.status(201).json(created);
});
`;
const R_PUT = `router.put('/:id', async (req, res, next) => {
    const updated = await service.updateSubject(req.params.id, req.body);
    if (!updated) return res.status(404).json({message: 'Subject not found'});
    res.json(updated);
});
`;
const R_DELETE = `router.delete('/:id', async (req, res, next) => {
    const removed = await service.removeSubject(req.params.id);
    if (!removed) return res.status(404).json({message: 'Subject not found'});
    res.status(204).end();
});
`;
const R_TAIL = 'export default router;\n';

const R_GET_TODO = `router.get('/', async (req, res, next) => {
    // เขียนโค้ดตรงนี้: เรียก service.getAllSubjects() แล้วตอบ JSON
});
router.get('/:id', async (req, res, next) => {
    // เขียนโค้ดตรงนี้: อ่าน id จาก req.params, เรียก service.getSubjectById(id)
    // (คืนผลดิบ [rows, fields]) ถ้าไม่พบตอบ 404 {message: 'Subject not found'} ไม่งั้นตอบ subject ตัวแรก
});
`;
const R_POST_TODO = `router.post('/', async (req, res, next) => {
    // call service: เรียก service.createSubject(req.body) แล้วตอบ 201 พร้อมข้อมูลที่สร้าง
});
`;
const R_PUTDEL_TODO = `router.put('/:id', async (req, res, next) => {
    // เขียนโค้ดตรงนี้: service.updateSubject(req.params.id, req.body)
    // ไม่พบ → 404 {message: 'Subject not found'} / สำเร็จ → ตอบข้อมูลใหม่ (200)
});
router.delete('/:id', async (req, res, next) => {
    // เขียนโค้ดตรงนี้: service.removeSubject(req.params.id)
    // ไม่พบ → 404 {message: 'Subject not found'} / สำเร็จ → 204 ไม่มี body
});
`;
const route = ({ get = R_GET_ALL + R_GET_ONE, post = R_POST, putdel = R_PUT + R_DELETE } = {}) => R_HEAD + get + post + putdel + R_TAIL;
const ROUTE = route();

const APP_JS = `import express from "express";
import subjectRouter from "./routes/subject-route.js";

const PORT = 3000;

const app = express();

app.use(express.json());

app.use('/api/subjects', subjectRouter);

app.listen(PORT, () => {
    console.log(
        \`Running at http://localhost:\${PORT}\`)
});
`;
const APP_TODO_WIRING = `import express from "express";
import subjectRouter from "./routes/subject-route.js";

const PORT = 3000;

const app = express();

// เขียนโค้ดตรงนี้: (1) ใช้ middleware express.json() เพื่ออ่าน JSON body
//                  (2) mount subjectRouter ที่ /api/subjects

app.listen(PORT, () => {
    console.log(
        \`Running at http://localhost:\${PORT}\`)
});
`;
const APP_TODO_LOGGER = APP_JS.replace("app.use(express.json());", "// เขียนโค้ดตรงนี้: middleware ที่ console.log(`${req.method} ${req.url}`) แล้วเรียก next()\n//   ต้องลงทะเบียนก่อน route ทั้งหมด\n\napp.use(express.json());");
const APP_LOGGER = APP_JS.replace("app.use(express.json());", "app.use((req, res, next) => {\n    console.log(`${req.method} ${req.url}`)\n    next()\n})\n\napp.use(express.json());");

const P = { app: 'app.js', route: 'routes/subject-route.js', service: 'services/subject-service.js', repo: 'repositories/subject-repository.js', db: 'configs/db-config.js' };
// project with the file being edited listed FIRST (the solution replaces the first file); `entry` selects what runs
const project = (first, override = {}) => {
  const base = { [P.app]: APP_JS, [P.route]: ROUTE, [P.service]: SERVICE, [P.repo]: REPO, [P.db]: DB_CONFIG, ...override };
  const ordered = { [first]: base[first] };
  for (const [k, v] of Object.entries(base)) if (k !== first) ordered[k] = v;
  return ordered;
};

export const experiments = {
  firstExpress: {
    type: 'experiment', id: 'e-first-express', title: 'Express แรก: params + query + body ในที่เดียว',
    source: `${SRC} §Express.js example`,
    body: `<p>ส่ง <b>PUT</b> ไปที่ <code>/api/subjects/5?filter=web&amp;page=1&amp;size=10</code> พร้อม body <code>{"code": "INT 100", "title": "IT Fundamentals", "credit": 3}</code> แล้วดูว่า <code>req.params</code>, <code>req.query</code> และ <code>req.body</code> ถูกแยกให้อย่างไร จากนั้นลองลบ <code>app.use(express.json())</code> แล้ว Run ใหม่</p>`,
    files: { 'app.js': FIRST_EXPRESS },
  },

  statusChain: {
    type: 'experiment', id: 'e-status-chain', title: 'res.status() อย่างเดียวไม่ส่ง response',
    source: `${SRC} §Handling Responses (res.status())`,
    body: '<p>ส่ง <b>POST</b> ไปที่ <code>/api/subjects</code> — request จะค้าง (error: handler ไม่ได้เรียก <code>res.end()</code>) เพราะ <code>res.status(201)</code> ตั้ง status เฉยๆ แล้วเอา comment หน้า <code>res.status(201).json(subject)</code> ออกแทน Run ใหม่แล้วส่งอีกครั้ง</p>',
    files: { 'app.js': STATUS_CHAIN },
  },

  routerMount: {
    type: 'experiment', id: 'e-router-mount', title: 'express.Router() และการ mount ที่ /api/subjects',
    source: `${SRC} §Routing in Express, §Router example, §Middleware in Express`,
    body: '<p>ยิง <code>GET /api/subjects</code>, <code>GET /api/subjects/3</code> และ path ที่ไม่มี route (เช่น <code>/api/other</code>) — สังเกตหน้า <code>Cannot GET …</code> ที่ Express ตอบเองเมื่อไม่พบ route</p>',
    files: { 'app.js': ROUTER_MOUNT },
  },

  middlewareOrder: {
    type: 'experiment', id: 'e-middleware-order', title: 'ลำดับ middleware: logger → JSON parser → route',
    source: 'week6/06-INT161-Error Handling.pdf §Express Middleware (ตัวอย่าง logger) และ week5 §Middleware in Express',
    body: '<p>ส่ง <b>POST</b> ไปที่ <code>/echo</code> พร้อม JSON แล้วดู Output (logger ทำงานก่อนทุก route แล้วเรียก <code>next()</code>) จากนั้นลบ <code>app.use(express.json())</code> — <code>req.body</code> จะเป็น <code>undefined</code> ลองย้ายมันไปไว้หลัง route ก็ได้ผลเหมือนกัน (ลำดับสำคัญ)</p>',
    files: { 'app.js': MIDDLEWARE_ORDER },
  },

  layeredCrud: {
    type: 'experiment', id: 'e-layered-crud', title: 'CRUD REST API ตาม layer system (Express + MySQL)',
    source: `${SRC} §Layered System, §Router example, §WebStorm Project Template - ESM (โครง src/ configs, repositories, services, routes)`,
    body: `<p>โปรเจกต์ครบ 5 ไฟล์ตามโครง ESM template — router (controller) ↔ service ↔ repository ↔ database ลองยิง <code>GET /api/subjects</code>, <code>GET /api/subjects/1</code>, <code>GET /api/subjects/999</code> (ได้ 404), <b>POST</b> พร้อม <code>{"subject_code": "INT 290", "subject_title": "New Subject", "credit": 2}</code> (201), <b>PUT</b> และ <b>DELETE</b> (204)</p>`,
    entry: 'app.js', fixtures: FIX,
    files: project(P.app),
  },
};

// ============ exercises ============

const S1 = { id: 1, subject_code: 'INT 100', subject_title: 'IT Fundamentals', credit: 3 };
const NEW_A = { subject_code: 'INT 290', subject_title: 'New Subject', credit: 2 };
const call = (method, path, body, expect) => ({ request: { method, path, ...(body ? { body } : {}) }, expect });
const JSON_CT = 'application/json; charset=utf-8';

const HELLO_STARTER = `import express from 'express';

const app = express();

// เขียนโค้ดตรงนี้: GET /hello ตอบ JSON { message: 'Hello Express' }

app.listen(3000);
`;
const HELLO_SOLUTION = `import express from 'express';

const app = express();

app.get('/hello', (req, res) => {
    res.json({ message: 'Hello Express' });
});

app.listen(3000);
`;

const PARAMS_STARTER = `import express from 'express';

const app = express();
app.use(express.json());

app.put('/api/subjects/:id', (req, res) => {
    // เขียนโค้ดตรงนี้: อ่าน filter, page, size จาก req.query / id จาก req.params / subject จาก req.body
    // ใส่ id ลงใน subject แล้วตอบ JSON เป็น array: [subject, {filter, page, size}]
});
app.listen(3000);
`;
const PARAMS_SOLUTION = FIRST_EXPRESS.replace(' //midle-ware', '');

const CHAIN_STARTER = `import express from 'express';

const app = express();
app.use(express.json());

app.post('/api/subjects', (req, res) => {
    const subject = req.body;
    // เขียนโค้ดตรงนี้: ตอบ status 201 พร้อม subject ที่ได้รับเป็น JSON
    res.status(201);
});
app.listen(3000);
`;
const CHAIN_SOLUTION = CHAIN_STARTER.replace(/    \/\/ เขียนโค้ดตรงนี้[^\n]*\n    res\.status\(201\);\n/, '    res.status(201).json(subject);\n');

const ROUTER_STARTER = `import express from 'express';

const subjects = [
    { id: '1', code: 'INT 100', title: 'IT Fundamentals' },
    { id: '2', code: 'INT 101', title: 'Programming Fundamentals' },
];

const router = express.Router();
// เขียนโค้ดตรงนี้: router.get('/') ตอบ subjects ทั้งหมด
//                  router.get('/:id') ตอบ subject ตัวนั้น — ไม่พบตอบ 404 {message: 'Subject not found'}

const app = express();
// เขียนโค้ดตรงนี้: mount router ที่ /api/subjects
app.listen(3000);
`;
const ROUTER_SOLUTION = `import express from 'express';

const subjects = [
    { id: '1', code: 'INT 100', title: 'IT Fundamentals' },
    { id: '2', code: 'INT 101', title: 'Programming Fundamentals' },
];

const router = express.Router();
router.get('/', (req, res) => {
    res.json(subjects);
});
router.get('/:id', (req, res) => {
    const subject = subjects.find((s) => s.id === req.params.id);
    if (!subject) return res.status(404).json({message: 'Subject not found'});
    res.json(subject);
});

const app = express();
app.use('/api/subjects', router);
app.listen(3000);
`;

export const exercises = {
  hello: {
    type: 'exercise', id: 'x-hello-express', title: 'โจทย์ 1: server Express แรก — GET /hello',
    source: `${SRC} §What is Express JS?, §Handling Responses`,
    body: '<p>เขียน route <code>GET /hello</code> ที่ตอบ JSON <code>{ "message": "Hello Express" }</code> ด้วย <code>res.json</code> — path อื่นที่ไม่มี route Express จะตอบ 404 ให้เอง</p>',
    hint: '<code>app.get(path, (req, res) =&gt; { res.json(...) })</code>',
    files: { 'app.js': HELLO_STARTER }, solution: HELLO_SOLUTION,
    tests: [
      { name: 'GET /hello → 200 JSON', steps: [call('GET', '/hello', null, { status: 200, json: { message: 'Hello Express' }, headers: { 'Content-Type': JSON_CT } })] },
      { name: 'path ที่ไม่มี route → 404', steps: [call('GET', '/other', null, { status: 404, textIncludes: 'Cannot GET /other' })] },
    ],
  },

  params: {
    type: 'exercise', id: 'x-params', title: 'โจทย์ 2: อ่าน req.params, req.query และ req.body',
    source: `${SRC} §Express request parser, §Express.js example`,
    body: '<p>ใน <code>PUT /api/subjects/:id</code> อ่าน <code>filter, page, size</code> จาก <code>req.query</code>, <code>id</code> จาก <code>req.params</code> และ <code>subject</code> จาก <code>req.body</code> — ใส่ <code>id</code> ลงใน subject แล้วตอบ JSON array <code>[subject, {filter, page, size}]</code></p>',
    hint: '<code>const {filter, page, size} = req.query;</code> · <code>subject.id = id;</code> แล้ว <code>res.json([subject, {...}])</code>',
    files: { 'app.js': PARAMS_STARTER }, solution: PARAMS_SOLUTION,
    tests: [
      { name: 'PUT /api/subjects/5?filter=web&page=2&size=10', steps: [call('PUT', '/api/subjects/5?filter=web&page=2&size=10', { code: 'INT 100' }, { status: 200, json: [{ code: 'INT 100', id: '5' }, { filter: 'web', page: '2', size: '10' }] })] },
      { name: 'พารามิเตอร์ query ที่ไม่ได้ส่งจะหายไป', steps: [call('PUT', '/api/subjects/9?filter=a', { title: 'X' }, { status: 200, json: [{ title: 'X', id: '9' }, { filter: 'a' }] })] },
    ],
  },

  statusChain: {
    type: 'exercise', id: 'x-status-chain', title: 'โจทย์ 3: ตอบ 201 ด้วย res.status(201).json(...)',
    source: `${SRC} §Handling Responses`,
    body: '<p><code>POST /api/subjects</code> ตอนนี้ค้าง เพราะ <code>res.status(201)</code> ตั้ง status แต่ไม่ได้ส่ง response — แก้ให้ตอบ 201 พร้อม subject ที่ได้รับเป็น JSON</p>',
    hint: '<code>res.status()</code> คืน <code>res</code> กลับมา ต่อ <code>.json()</code> ได้เลย',
    files: { 'app.js': CHAIN_STARTER }, solution: CHAIN_SOLUTION,
    tests: [{ name: 'POST → 201 + body เดิม', steps: [call('POST', '/api/subjects', { code: 'INT 100', title: 'IT' }, { status: 201, json: { code: 'INT 100', title: 'IT' } })] }],
  },

  router: {
    type: 'exercise', id: 'x-router', title: 'โจทย์ 4: สร้าง Router แล้ว mount ที่ /api/subjects',
    source: `${SRC} §Routing in Express, §Router example`,
    body: '<p>เขียน <code>router.get(\'/\')</code> ตอบ subjects ทั้งหมด และ <code>router.get(\'/:id\')</code> ตอบตัวที่ id ตรงกัน (ไม่พบตอบ <b>404</b> พร้อม <code>{message: \'Subject not found\'}</code>) แล้ว mount router ที่ <code>/api/subjects</code> ด้วย <code>app.use</code></p>',
    hint: 'ใน router path เริ่มที่ <code>/</code> เสมอ — prefix <code>/api/subjects</code> มาจากตอน <code>app.use(...)</code>',
    files: { 'app.js': ROUTER_STARTER }, solution: ROUTER_SOLUTION,
    tests: [
      { name: 'GET /api/subjects → ทั้งหมด', steps: [call('GET', '/api/subjects', null, { status: 200, json: [{ id: '1', code: 'INT 100', title: 'IT Fundamentals' }, { id: '2', code: 'INT 101', title: 'Programming Fundamentals' }] })] },
      { name: 'GET /api/subjects/2 → ตัวเดียว', steps: [call('GET', '/api/subjects/2', null, { status: 200, json: { id: '2', code: 'INT 101', title: 'Programming Fundamentals' } })] },
      { name: 'GET /api/subjects/99 → 404 + message', steps: [call('GET', '/api/subjects/99', null, { status: 404, json: { message: 'Subject not found' } })] },
    ],
  },

  middlewareLogger: {
    type: 'exercise', id: 'x-middleware-logger', title: 'โจทย์ 5: เขียน middleware logger แล้วเรียก next()',
    source: 'week6/06-INT161-Error Handling.pdf §Express Middleware (Middleware 1 - Logger); week5 §Middleware in Express',
    body: '<p>เพิ่ม middleware (application-level) ที่ <code>console.log</code> ข้อความ <code>&lt;METHOD&gt; &lt;URL&gt;</code> ของทุก request แล้วเรียก <code>next()</code> — ต้องลงทะเบียน<b>ก่อน</b> route ทั้งหมด</p>',
    hint: '<code>app.use((req, res, next) =&gt; { … next() })</code> — ถ้าไม่เรียก <code>next()</code> request จะค้าง',
    entry: 'app.js', fixtures: FIX,
    files: project(P.app, { [P.app]: APP_TODO_LOGGER }),
    solution: APP_LOGGER,
    tests: [
      { name: 'GET /api/subjects ถูก log และยังทำงานปกติ', steps: [call('GET', '/api/subjects', null, { status: 200, textIncludes: '"subject_code":"INT 100"' })], logIncludes: ['GET /api/subjects'] },
      { name: 'POST /api/subjects ถูก log (next() ส่งต่อถึง route)', steps: [call('POST', '/api/subjects', NEW_A, { status: 201, json: { id: 18, ...NEW_A } })], logIncludes: ['POST /api/subjects'] },
    ],
  },

  routeRead: {
    type: 'exercise', id: 'x-route-read', title: 'โจทย์ 6: controller — GET / และ GET /:id ผ่าน service',
    source: `${SRC} §Router example, §Layer System Functions (Controller)`,
    body: '<p>เติม <code>router.get(\'/\')</code> (เรียก <code>service.getAllSubjects()</code> ตอบ JSON) และ <code>router.get(\'/:id\')</code> (เรียก <code>service.getSubjectById(id)</code> ซึ่งคืนผลดิบ <code>[rows, fields]</code> — ไม่พบตอบ 404 <code>{message: \'Subject not found\'}</code>) controller ห้ามมี SQL</p>',
    hint: 'เหมือนตัวอย่างใน slide: <code>const [subject] = await service.getSubjectById(id); if (!subject[0]) return res.status(404)…</code>',
    entry: 'app.js', fixtures: FIX,
    files: project(P.route, { [P.route]: route({ get: R_GET_TODO }) }),
    solution: ROUTE,
    tests: [
      { name: 'GET /api/subjects มีข้อมูล', steps: [call('GET', '/api/subjects', null, { status: 200, textIncludes: '"subject_code":"INT 207"' })] },
      { name: 'GET /api/subjects/1', steps: [call('GET', '/api/subjects/1', null, { status: 200, json: S1 })] },
      { name: 'GET /api/subjects/999 → 404', steps: [call('GET', '/api/subjects/999', null, { status: 404, json: { message: 'Subject not found' } })] },
    ],
  },

  routeCreate: {
    type: 'exercise', id: 'x-route-create', title: 'โจทย์ 7: controller — POST / สร้างข้อมูลด้วย req.body',
    source: `${SRC} §Router example (router.post → "// call service")`,
    body: '<p>เติม <code>router.post(\'/\')</code> ที่ในสไลด์เขียนไว้แค่ <code>// call service</code>: เรียก <code>service.createSubject(req.body)</code> แล้วตอบ <b>201</b> พร้อมข้อมูลที่สร้าง (ต้องมี <code>express.json()</code> ใน app.js แล้ว)</p>',
    hint: '<code>res.status(201).json(created)</code>',
    entry: 'app.js', fixtures: FIX,
    files: project(P.route, { [P.route]: route({ post: R_POST_TODO }) }),
    solution: ROUTE,
    tests: [{ name: 'POST → 201 + id 18', steps: [call('POST', '/api/subjects', NEW_A, { status: 201, json: { id: 18, ...NEW_A } })] }],
  },

  routeUpdateDelete: {
    type: 'exercise', id: 'x-route-update-delete', title: 'โจทย์ 8: controller — PUT /:id และ DELETE /:id',
    source: `${SRC} §Handling Responses, §Router example`,
    body: '<p>เติม <code>PUT /:id</code> (สำเร็จตอบข้อมูลใหม่ 200 · ไม่พบตอบ 404 <code>{message: \'Subject not found\'}</code>) และ <code>DELETE /:id</code> (สำเร็จตอบ <b>204</b> ไม่มี body · ไม่พบตอบ 404)</p>',
    hint: 'ไม่มี body ให้ใช้ <code>res.status(204).end()</code>',
    entry: 'app.js', fixtures: FIX,
    files: project(P.route, { [P.route]: route({ putdel: R_PUTDEL_TODO }) }),
    solution: ROUTE,
    tests: [
      { name: 'PUT /1 → 200 + ข้อมูลใหม่', steps: [call('PUT', '/api/subjects/1', { subject_title: 'IT Fundamentals (updated)', credit: 2 }, { status: 200, json: { id: 1, subject_code: 'INT 100', subject_title: 'IT Fundamentals (updated)', credit: 2 } })] },
      { name: 'PUT /999 → 404', steps: [call('PUT', '/api/subjects/999', { credit: 1 }, { status: 404, json: { message: 'Subject not found' } })] },
      { name: 'DELETE /1 → 204 แล้วซ้ำ → 404', steps: [
        call('DELETE', '/api/subjects/1', null, { status: 204, text: '' }),
        call('DELETE', '/api/subjects/1', null, { status: 404, json: { message: 'Subject not found' } }),
      ] },
    ],
  },

  appWiring: {
    type: 'exercise', id: 'x-app-wiring', title: 'โจทย์ 9: ต่อสายใน app.js — express.json() และ mount router',
    source: `${SRC} §Layered System (app.use …), §Middleware in Express`,
    body: '<p>router เขียนไว้ครบแล้ว แต่ <code>app.js</code> ยังไม่ได้ต่อสาย: เพิ่ม <code>app.use(express.json())</code> เพื่ออ่าน body และ mount <code>subjectRouter</code> ที่ <code>/api/subjects</code> ด้วย <code>app.use</code></p>',
    hint: 'ลำดับสำคัญ: <code>express.json()</code> ต้องมาก่อน router ที่ต้องอ่าน <code>req.body</code>',
    entry: 'app.js', fixtures: FIX,
    files: project(P.app, { [P.app]: APP_TODO_WIRING }),
    solution: APP_JS,
    tests: [
      { name: 'GET /api/subjects ทำงาน (mount แล้ว)', steps: [call('GET', '/api/subjects', null, { status: 200, textIncludes: '"subject_code":"INT 100"' })] },
      { name: 'POST อ่าน req.body ได้ (มี express.json())', steps: [call('POST', '/api/subjects', NEW_A, { status: 201, json: { id: 18, ...NEW_A } })] },
    ],
  },
};
