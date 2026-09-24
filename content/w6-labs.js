import { SEED_SQL } from './w4-labs.js';

const SRC = 'week6/06-INT161-Error Handling.pdf';
const TPL = 'week6/express-template/src';
const ASG = 'week6/express_crud_exception_assignment.md';
const SUBJECTS = { mysql: { seed: SEED_SQL } };

// ============ small classic-models-style database for the assignment self-check (invented sample data) ============

const CLASSIC_SQL = `create database classicdb;
use classicdb;

create table offices (
  officeCode varchar(10) primary key,
  city varchar(50) not null,
  country varchar(50) not null
);
create table productlines (
  productLine varchar(50) primary key,
  textDescription varchar(4000)
);
create table employees (
  employeeNumber int primary key,
  lastName varchar(50) not null,
  firstName varchar(50) not null,
  email varchar(100) not null,
  officeCode varchar(10) not null,
  reportsTo int,
  jobTitle varchar(50) not null,
  foreign key (officeCode) references offices (officeCode),
  foreign key (reportsTo) references employees (employeeNumber)
);
create table customers (
  customerNumber int primary key,
  customerName varchar(100) not null,
  country varchar(50)
);
create table orders (
  orderNumber int primary key,
  orderDate varchar(10) not null,
  status varchar(20) not null,
  customerNumber int not null,
  foreign key (customerNumber) references customers (customerNumber)
);
create table payments (
  customerNumber int not null,
  checkNumber varchar(50) not null,
  paymentDate varchar(10) not null,
  amount double not null,
  primary key (customerNumber, checkNumber),
  foreign key (customerNumber) references customers (customerNumber)
);

insert into offices values ('1', 'San Francisco', 'USA'), ('2', 'Boston', 'USA'), ('NA', 'Not Assigned', 'N/A');
insert into productlines values ('Classic Cars', 'Attention car enthusiasts: classic models of vintage automobiles.'), ('Motorcycles', 'Replicas of famous motorcycles.');
insert into employees values
  (1002, 'Murphy', 'Diane', 'dmurphy@classicmodelcars.com', '1', NULL, 'President'),
  (1056, 'Patterson', 'Mary', 'mpatterson@classicmodelcars.com', '1', 1002, 'VP Sales'),
  (1076, 'Firrelli', 'Jeff', 'jfirrelli@classicmodelcars.com', '2', 1002, 'VP Marketing');
insert into customers values (103, 'Atelier graphique', 'France'), (112, 'Signal Gift Stores', 'USA'), (500, 'Lonely Shop', 'Thailand');
insert into orders values (10100, '2026-01-06', 'Shipped', 103), (10101, '2026-01-09', 'Shipped', 112);
insert into payments values (103, 'HQ336336', '2026-10-19', 6066.78), (112, 'JM555205', '2026-06-05', 14571.44);
`;
const CLASSIC = { mysql: { seed: CLASSIC_SQL } };

const MYSQL_ERRORS_SCRIPT = CLASSIC_SQL + `
select * from customers;

-- ลองลบ -- หน้าคำสั่งทีละบรรทัด แล้วกด Execute (ตัวจำลองจะหยุดที่คำสั่งแรกที่ error)
-- insert into offices values ('1', 'Duplicate', 'USA');                                  -- 1062 ER_DUP_ENTRY (primary key ซ้ำ)
-- insert into employees values (2000, 'Doe', 'John', 'j@x.com', '99', NULL, 'Rep');       -- 1452 ER_NO_REFERENCED_ROW_2 (office 99 ไม่มี)
-- delete from customers where customerNumber = 103;                                       -- 1451 ER_ROW_IS_REFERENCED_2 (ยังมี orders/payments)
-- delete from customers where customerNumber = 500;                                       -- ลบได้ (ไม่มีใครอ้างอิง)
`;

// ============ experiments (slide / template code) ============

const CHAIN = `function main(value=0) {
  console.log(a(value));
}
function a(value) {
  return b(value);
}
`;

const TRY_CATCH = `import fs from 'node:fs';

${CHAIN}function b(value) {
  if (value > 0) {
      return ++value;
  }
  const data = fs.readFileSync('test.txt');
}

try {
    main(1);
    console.log('After main success');
    console.log('------------------');
    main();
    console.log('After main error');
} catch (e) {
    console.log('Message: ', e.message);
    console.log('Status: ', e.status);
    console.log('Code: ', e.code);
    console.log('Stack Trace: ', e.stack);
}

console.log('Program was normal ended');
`;

const APP_ERROR_CLASS = `class AppError extends Error {
    errors = {404:'NOT_FOUND', 400:'BAD REQUEST', 409:'CONFLICT',
        500:'INTERNAL SERVER ERROR', 403:'FORBIDDEN', 401:'UNAUTHORIZED'}
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.error = this.errors[statusCode];
        this.isOperational = true; // Indicate if it's an expected operational error
        Error.captureStackTrace(this, this.constructor);
    }
}
`;

const CUSTOM_ERROR = `import fs from 'node:fs'

${APP_ERROR_CLASS}
${CHAIN}function b(value) {
  if (value > 0) {
    return ++value;
  }
  const data = fs.readFileSync('test.txt')
}

try {
    main(1);
    console.log('After main success');
    console.log('------------------');
    main();
    console.log('After main error');
} catch (e) {
    const err = new AppError(e.message, 404)
    console.log(err);
}

console.log('Program was normal ended');
`;

const ERROR_HANDLER_SLIDE = `app.use(function (err, req, res, next) {
    const status = err.status || 500;
    res.status(status);
    res.json( {
           error: err.code,
           statusCode: status,
           message: err.message,
           path: req.originalUrl,
           timestamp: new Date().toLocaleString()
       }
    );
});
`;

const ERROR_MIDDLEWARE = `import express from 'express';

const app = express();
app.use(express.json());

app.get('/sync', (req, res) => {
    throw new Error('เกิดข้อผิดพลาดใน route แบบ sync');
});
app.get('/next', (req, res, next) => {
    const err = new Error('Subject not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    next(err);
});
app.get('/async', async (req, res) => {
    throw new Error('async rejected');
});
app.get('/ok', (req, res) => {
    res.json({ message: 'no error here' });
});

// error handler — ต้องอยู่ท้ายสุด หลังทุก route/middleware
${ERROR_HANDLER_SLIDE}
app.listen(3000);
`;

// ----- template project (week6/express-template) with subjects instead of the generic example -----

const T_DB = `import mysql from 'mysql2/promise'

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '<your-password>',
    database: 'sampledb',
})
export default db
`;
const T_REPO = `import db from '../configs/db-config.js'

const TABLE_NAME = "subjects"
const ENTITY_NAME = "Subject"

const FIND_ALL_SQL = \`SELECT * FROM \${TABLE_NAME}\`
const FIND_ONE_SQL = \`SELECT * FROM \${TABLE_NAME} WHERE id = ?\`
const UPDATE_SQL = \`UPDATE \${TABLE_NAME} SET ? WHERE id = ?\`
const REMOVE_SQL = \`DELETE FROM \${TABLE_NAME} WHERE id = ?\`
const CREATE_SQL = \`INSERT INTO \${TABLE_NAME} SET ?\`

export async function findAll() {
    const [datas] = await db.query(FIND_ALL_SQL)
    return datas
}

export async function findOne(id) {
    const [data] = await db.query(FIND_ONE_SQL, [id])
    if (data.length === 0) {
        const err = new Error(\`\${ENTITY_NAME} not found for id = \${id}\`)
        err.statusCode = 404
        err.code = "NOT FOUND"
        throw err
    }
    return data[0]
}

export async function update(id, data) {
    await findOne(id)
    await db.query(UPDATE_SQL, [data, id])
    return findOne(id)
}

export async function remove(id) {
    await findOne(id)
    const [data] = await db.query(REMOVE_SQL, [id])
    return data
}

export async function create(data) {
    const [result] = await db.query(CREATE_SQL, [data])
    return findOne(result.insertId)
}
`;
const T_SERVICE = `import * as repo from "../repositories/example-repo.js"

export async function getObject(id) {
    return await repo.findOne(id)
}

export async function getAllObjects() {
    return await repo.findAll()
}

export async function updateObject(id, data) {
    return await repo.update(id, data)
}

export async function removeObject(id) {
    return await repo.remove(id)
}

export async function createObject(data) {
    return await repo.create(data)
}
`;
const T_ROUTE = `import * as service from "../services/example-service.js"
import express from "express"

const router = express.Router()

router.get("/", async (req, res) => {
    const objects = await service.getAllObjects()
    res.json(objects)
})

router.get("/:id", async (req, res) => {
    const id = req.params.id
    const object = await service.getObject(id)
    res.json(object)
})

router.post("/", async (req, res) => {
    const object = req.body
    const result = await service.createObject(object)
    res.status(201).json({result})
})
router.put("/:id", async (req, res) => {
    const id = req.params.id
    const object = await service.updateObject(id, req.body)
    res.json(object)
})
router.delete("/:id", async (req, res) => {
    const id = req.params.id
    await service.removeObject(id)
    res.status(204).end()
})

export default router
`;
const T_APP = `import express from 'express'
import exRouter from './routes/example-route.js'

const app = express()
app.use(express.json())

app.use('/examples', exRouter)

app.listen(3000, () => {
    console.log('Example app listening on port 3000')
})

app.use((err, req, res, next) => {
    if (err.code == "ER_DUP_ENTRY") {
        err.statusCode = 409
        err.code = "CONFLICT"
    }
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: statusCode,
        error: err.code || 'Server Error',
        message: err.message,
        resource: req.originalUrl,
        timestamp: new Date().toLocaleString()
    })
})
`;

export const experiments = {
  tryCatch: {
    type: 'experiment', id: 'e-try-catch', title: 'try…catch และ property ของ Error (message / status / code / stack)',
    source: `${SRC} §Error Handling (Sync): try .. catch, §The standard JavaScript Error object`,
    body: '<p>Run แล้วดูว่า <code>main(1)</code> ผ่าน แต่ <code>main()</code> ทำให้ <code>fs.readFileSync(\'test.txt\')</code> โยน error (ไม่มีไฟล์) — โค้ดหลัง <code>main()</code> ไม่ถูกรัน โปรแกรมกระโดดเข้า <code>catch</code> แล้วจบตามปกติ จากนั้นลองลบ <code>try…catch</code> ออกดูว่าเกิดอะไรขึ้น</p>',
    files: { 'app.js': TRY_CATCH },
  },

  customError: {
    type: 'experiment', id: 'e-custom-error', title: 'Custom error class: AppError',
    source: `${SRC} §Custom Error Classes, §Custom Error Classes example`,
    body: '<p>Run แล้วดู <code>console.log(err)</code> — จะเห็น property ที่เพิ่มเข้ามา (<code>statusCode</code>, <code>error</code>, <code>isOperational</code>) ลองเปลี่ยน <code>404</code> เป็น <code>409</code> หรือ <code>500</code> แล้วดูค่า <code>error</code> ที่เปลี่ยนตาม</p>',
    files: { 'app.js': CUSTOM_ERROR },
  },

  errorMiddleware: {
    type: 'experiment', id: 'e-error-middleware', title: 'Error-handling middleware: next(err), throw และ async',
    source: `${SRC} §Error Handling Mechanism in Express.js, §Express: Error-handling Middleware`,
    body: '<p>ยิง <code>GET /sync</code>, <code>/next</code>, <code>/async</code> และ <code>/ok</code> — error ทุกแบบถูกส่งมาที่ handler ตัวเดียวและตอบเป็น JSON เดียวกัน จากนั้น<b>ย้าย error handler ไปไว้ก่อน route</b> แล้ว Run ใหม่ — handler จะไม่ทำงานและได้หน้า HTML error ของ Express แทน (ต้องอยู่ท้ายสุดเสมอ)</p>',
    files: { 'app.js': ERROR_MIDDLEWARE },
  },

  layeredErrors: {
    type: 'experiment', id: 'e-layered-errors', title: 'error ไหลผ่านทุกชั้น (โปรเจกต์ template)',
    source: `${TPL} (app.js, routes, services, repositories) — ปรับให้ใช้ตาราง subjects`,
    body: `<p>ยิง <code>GET /examples/1</code> (ได้ข้อมูล) และ <code>GET /examples/999</code> — repository โยน error 404 ขึ้นมาผ่าน service และ route จนถึง error middleware กลางใน <code>app.js</code> แล้วลอง <b>POST</b> <code>/examples</code> ด้วย <code>{"subject_code": "INT 100", "subject_title": "Dup", "credit": 1}</code> (รหัสซ้ำ) — MySQL โยน <code>ER_DUP_ENTRY</code> แล้ว handler แปลงเป็น <b>409 CONFLICT</b></p>`,
    entry: 'app.js', fixtures: SUBJECTS,
    files: { 'app.js': T_APP, 'routes/example-route.js': T_ROUTE, 'services/example-service.js': T_SERVICE, 'repositories/example-repo.js': T_REPO, 'configs/db-config.js': T_DB },
  },

  mysqlErrors: {
    type: 'experiment', id: 'e-mysql-errors', title: 'MySQL error code ที่ต้องแปลง: 1062, 1452, 1451',
    source: `${ASG} §1.3 (การแปลง MySQL Error Codes), §2 (ความสัมพันธ์ของตาราง)`, widget: 'sql-console',
    body: '<p>กด <b>Execute</b> เพื่อสร้างฐานข้อมูลตัวอย่างขนาดเล็กที่มี foreign key แล้วลบ <code>--</code> หน้าคำสั่งที่อยู่ท้ายสคริปต์ทีละบรรทัดเพื่อกระตุ้น error แต่ละแบบ ดู <code>code</code> และข้อความที่ MySQL ตอบ — ข้อความเหล่านี้คือสิ่งที่ error middleware กลางต้องแปลงเป็น 409/400</p>',
    data: { script: MYSQL_ERRORS_SCRIPT },
  },
};

// ============ slide-based exercises (with solutions) ============

const CHECK_INCLUDES = (list) => list.map((t) => `"${t}"`).join(', ');
void CHECK_INCLUDES;

const TRYCATCH_STARTER = `import fs from 'node:fs';

${CHAIN}function b(value) {
  if (value > 0) {
      return ++value;
  }
  const data = fs.readFileSync('test.txt');
}

// เขียนโค้ดตรงนี้: ครอบการเรียก main ด้วย try … catch
// แล้วแสดง e.message และ e.code ใน catch (โปรแกรมต้องจบตามปกติ)
main(1);
console.log('After main success');
main();
console.log('After main error');

console.log('Program was normal ended');
`;
const TRYCATCH_SOLUTION = `import fs from 'node:fs';

${CHAIN}function b(value) {
  if (value > 0) {
      return ++value;
  }
  const data = fs.readFileSync('test.txt');
}

try {
    main(1);
    console.log('After main success');
    main();
    console.log('After main error');
} catch (e) {
    console.log('Message: ', e.message);
    console.log('Code: ', e.code);
}

console.log('Program was normal ended');
`;

const APPERR_STARTER = `export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        // เขียนโค้ดตรงนี้: เก็บ statusCode, เติม this.error จากตาราง status → ชื่อ
        // (404 → 'NOT_FOUND', 400 → 'BAD REQUEST', 409 → 'CONFLICT', 500 → 'INTERNAL SERVER ERROR',
        //  403 → 'FORBIDDEN', 401 → 'UNAUTHORIZED') และ this.isOperational = true
    }
}
`;
const APPERR_SOLUTION = `export class AppError extends Error {
    errors = {404:'NOT_FOUND', 400:'BAD REQUEST', 409:'CONFLICT',
        500:'INTERNAL SERVER ERROR', 403:'FORBIDDEN', 401:'UNAUTHORIZED'}
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.error = this.errors[statusCode];
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
`;
const APPERR_CHECK = `import { AppError } from './app-error.js';

const e = new AppError('Not found', 404);
console.log(e.statusCode, e.error, e.isOperational, e instanceof Error, e.message);

const c = new AppError('Duplicate', 409);
console.log(c.error);
`;

const CUSTOM_STARTER = `import fs from 'node:fs/promises';

async function b() {
    // เขียนโค้ดตรงนี้: ถ้าอ่าน data.txt ไม่ได้ ให้ catch แล้วโยน Error ใหม่
    // 'File data.txt not found' ที่มี err.code = 'FILE_NOT_FOUND' และ err.status = 404
    const data = await fs.readFile('data.txt', 'utf8');
    return data;
}

try {
    await b();
} catch (e) {
    console.log('code:', e.code, 'status:', e.status, 'message:', e.message);
}
`;
const CUSTOM_SOLUTION = `import fs from 'node:fs/promises';

async function b() {
    try {
        const data = await fs.readFile('data.txt', 'utf8');
        return data;
    } catch (e) {
        const err = new Error('File data.txt not found');
        err.code = 'FILE_NOT_FOUND';
        err.status = 404;
        throw err;
    }
}

try {
    await b();
} catch (e) {
    console.log('code:', e.code, 'status:', e.status, 'message:', e.message);
}
`;

const ROUTES_FOR_HANDLER = `import express from 'express';

const app = express();

app.get('/boom', () => {
    throw new Error('kaboom');
});
app.get('/missing', (req, res, next) => {
    const err = new Error('Subject not found');
    err.status = 404;
    err.code = 'NOT_FOUND';
    next(err);
});
app.get('/async', async () => {
    throw new Error('async rejected');
});
`;
const HANDLER_STARTER = `${ROUTES_FOR_HANDLER}
// เขียนโค้ดตรงนี้: error-handling middleware (err, req, res, next) — ต้องอยู่ท้ายสุด
// status = err.status || 500 แล้วตอบ JSON
// { error: err.code, statusCode: status, message: err.message, path: req.originalUrl, timestamp: new Date().toLocaleString() }

app.listen(3000);
`;
const HANDLER_SOLUTION = `${ROUTES_FOR_HANDLER}
${ERROR_HANDLER_SLIDE}
app.listen(3000);
`;

const NEXT_STARTER = `import express from 'express';

const app = express();

app.get('/square', (req, res, next) => {
    const n = Number(req.query.n);
    // เขียนโค้ดตรงนี้: ถ้า n ไม่ใช่ตัวเลข (isNaN) ให้สร้าง Error 'n must be a number'
    // ที่มี status = 400 และ code = 'BAD_REQUEST' แล้วส่งต่อด้วย next(err) (แล้ว return)
    res.json({ n, square: n * n });
});

${ERROR_HANDLER_SLIDE}
app.listen(3000);
`;
const NEXT_SOLUTION = NEXT_STARTER.replace(/    \/\/ เขียนโค้ดตรงนี้[^\n]*\n    \/\/ ที่มี[^\n]*\n/, `    if (Number.isNaN(n)) {
        const err = new Error('n must be a number');
        err.status = 400;
        err.code = 'BAD_REQUEST';
        return next(err);
    }
`);

// ============ assignment self-check (NO solutions) ============

const ERROR_HANDLER_FILE = `// middleware/errorHandler.js  (โค้ดที่โจทย์ให้มา)
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';

  // ตรวจจับและแปลง MySQL Error Codes เป็น Client Error
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY';
    message = 'Resource already exists (Primary key or unique constraint violation)';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    errorCode = 'FOREIGN_KEY_NOT_FOUND';
    message = 'Referenced foreign key record does not exist';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 409;
    errorCode = 'RESOURCE_IN_USE';
    message = 'Cannot delete or modify resource because it is referenced by related records';
  }

  res.status(statusCode).json({
    status: 'error',
    error: {
      code: errorCode,
      message: message
    }
  });
};

module.exports = { AppError, errorHandler };
`;

const asgApp = (importName, importPath, mount) => `import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import ${importName} from '${importPath}';

// กำหนดรหัสนักศึกษาของตนเองเป็น Static Prefix ของ path (ห้ามใช้ route parameter :studentId)
const STUDENT_ID = '';

const app = express();
app.use(express.json());

app.use(\`/api/\${STUDENT_ID}/${mount}\`, ${importName});

// เขียนโค้ดตรงนี้: ลงทะเบียน errorHandler เป็น middleware ตัวสุดท้าย (หลังทุก route)

app.listen(3000);
`;
const asgRoute = (verbPath, note) => `import express from 'express';
import db from '../configs/db-config.js';
import { AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// ${note}
${verbPath}
    // เขียนโค้ดตรงนี้ — ดูเงื่อนไขในโจทย์ (ตอบรูปแบบ JSON มาตรฐาน และส่ง error ด้วย next(err))
});

export default router;
`;

const ASG_VARS = {
  studentId: {
    file: 'app.js',
    pattern: "STUDENT_ID\\s*=\\s*['\"](\\d+)['\"]",
    hint: "กรอกรหัสนักศึกษาของคุณเองใน app.js เช่น const STUDENT_ID = '…'; (ตัวเลข — เก็บในเบราว์เซอร์ของคุณเท่านั้น)",
  },
};
const ASG_CHECKS = [
  { name: 'ห้ามใช้ route parameter :studentId', pattern: ':studentId', mustMatch: false },
  { name: 'ห้ามอ่าน req.params.studentId', pattern: 'params\\.studentId', mustMatch: false },
  { name: 'ลงทะเบียน errorHandler ใน app.js', file: 'app.js', pattern: 'app\\.use\\(\\s*errorHandler' },
];
const asgFiles = (app, routeName, route) => ({ 'app.js': app, [`routes/${routeName}.js`]: route, 'middleware/errorHandler.js': ERROR_HANDLER_FILE, 'configs/db-config.js': T_DB.replace("database: 'sampledb'", "database: 'classicdb'") });
const api = (rest) => `/api/{{studentId}}/${rest}`;
const call = (method, path, body, expect) => ({ request: { method, path, ...(body === undefined ? {} : { body }) }, expect });
const err = (status, code, message) => ({ status, jsonMatch: { status: 'error', 'error.code': code, ...(message ? { 'error.message': message } : {}) } });
const ok = (status, extra = {}) => ({ status, jsonMatch: { status: 'success', ...extra }, jsonHasKeys: ['data'] });

const EMP = { firstName: 'John', lastName: 'Doe', email: 'john.doe@classicmodelcars.com', officeCode: '1', reportsTo: 1002, jobTitle: 'Sales Representative' };
const PAY = { checkNumber: 'HQ336338', paymentDate: '2026-09-18', amount: 2500.5 };

const asgBlock = (o) => ({
  type: 'exercise', entry: 'app.js', fixtures: CLASSIC, vars: ASG_VARS, codeChecks: ASG_CHECKS, source: `${ASG} ${o.section}`, ...o.block,
  files: asgFiles(asgApp(o.importName, o.importPath, o.mount), o.routeName, asgRoute(o.verbPath, o.note)),
});

export const exercises = {
  tryCatch: {
    type: 'exercise', id: 'x-try-catch', title: 'โจทย์ 1: จับ error ด้วย try…catch ให้โปรแกรมจบตามปกติ',
    source: `${SRC} §Error Handling (Sync): try .. catch`,
    body: '<p><code>main()</code> เรียก <code>fs.readFileSync(\'test.txt\')</code> ที่ไม่มีไฟล์ทำให้โปรแกรมล้ม — ครอบด้วย <code>try…catch</code> แล้วพิมพ์ <code>Message: </code> กับ <code>Code: </code> ให้โปรแกรมจบด้วย <code>Program was normal ended</code></p>',
    hint: 'ใน <code>catch (e)</code> ใช้ <code>e.message</code> และ <code>e.code</code> — โค้ดหลังบรรทัดที่ error ใน <code>try</code> จะถูกข้าม',
    files: { 'app.js': TRYCATCH_STARTER }, solution: TRYCATCH_SOLUTION,
    tests: [
      { name: 'แสดง message ของ ENOENT', steps: [], logIncludes: ["Message:  ENOENT: no such file or directory, open 'test.txt'"] },
      { name: 'แสดง code', steps: [], logIncludes: ['Code:  ENOENT'] },
      { name: 'โปรแกรมจบตามปกติ', steps: [], logIncludes: ['After main success', 'Program was normal ended'] },
    ],
  },

  appError: {
    type: 'exercise', id: 'x-app-error', title: 'โจทย์ 2: เขียน custom error class AppError',
    source: `${SRC} §Custom Error Classes`,
    body: '<p>เติม <code>AppError extends Error</code>: เก็บ <code>statusCode</code>, ตั้ง <code>error</code> จากตารางชื่อของ status (404 → <code>NOT_FOUND</code>, 409 → <code>CONFLICT</code> ฯลฯ ตามสไลด์) และ <code>isOperational = true</code> — <code>check.js</code> จะสร้าง error สองตัวแล้วพิมพ์ค่า</p>',
    hint: 'เก็บตาราง <code>{404:\'NOT_FOUND\', …}</code> ไว้ใน class แล้วอ่านด้วย <code>this.errors[statusCode]</code>',
    entry: 'check.js',
    files: { 'app-error.js': APPERR_STARTER, 'check.js': APPERR_CHECK }, solution: APPERR_SOLUTION,
    tests: [
      { name: 'ค่าใน AppError(404)', steps: [], logIncludes: ['404 NOT_FOUND true true Not found'] },
      { name: 'AppError(409).error', steps: [], logIncludes: ['CONFLICT'] },
    ],
  },

  throwCustom: {
    type: 'exercise', id: 'x-throw-custom', title: 'โจทย์ 3: แปลง error ระบบเป็น error ของเรา (code + status)',
    source: `${SRC} §Customer Error`,
    body: '<p>ตอนนี้ได้ error ดิบของระบบ (<code>ENOENT</code>) — แก้ <code>b()</code> ให้ <code>catch</code> แล้วโยน <code>Error(\'File data.txt not found\')</code> ใหม่ที่ตั้ง <code>code = \'FILE_NOT_FOUND\'</code> และ <code>status = 404</code> เหมือนในสไลด์</p>',
    hint: '<code>const err = new Error(…); err.code = …; err.status = …; throw err;</code>',
    files: { 'app.js': CUSTOM_STARTER }, solution: CUSTOM_SOLUTION,
    tests: [{ name: 'code / status / message ที่ผู้เรียกได้รับ', steps: [], logIncludes: ['code: FILE_NOT_FOUND status: 404 message: File data.txt not found'] }],
  },

  errorMiddleware: {
    type: 'exercise', id: 'x-error-middleware', title: 'โจทย์ 4: เขียน error-handling middleware ตามสไลด์',
    source: `${SRC} §Express: Error-handling Middleware`,
    body: '<p>route ทั้งสามมี error (throw, <code>next(err)</code>, async) แต่ยังไม่มีตัวจัดการ — เขียน error handler 4 พารามิเตอร์ไว้<b>ท้ายสุด</b>: <code>status = err.status || 500</code> แล้วตอบ JSON <code>{error: err.code, statusCode, message, path: req.originalUrl, timestamp}</code></p>',
    hint: 'ต้องมี 4 พารามิเตอร์ <code>(err, req, res, next)</code> ไม่งั้น Express ไม่ถือว่าเป็น error handler · และต้องอยู่หลัง route',
    files: { 'app.js': HANDLER_STARTER }, solution: HANDLER_SOLUTION,
    tests: [
      { name: 'throw ธรรมดา → 500', steps: [call('GET', '/boom', undefined, { status: 500, jsonMatch: { statusCode: 500, message: 'kaboom', path: '/boom' }, jsonHasKeys: ['timestamp'] })] },
      { name: 'next(err) ที่มี status/code → 404', steps: [call('GET', '/missing', undefined, { status: 404, jsonMatch: { error: 'NOT_FOUND', statusCode: 404, message: 'Subject not found', path: '/missing' } })] },
      { name: 'async rejection → 500 (Express 5 ส่งให้เอง)', steps: [call('GET', '/async', undefined, { status: 500, jsonMatch: { statusCode: 500, message: 'async rejected' } })] },
    ],
  },

  nextErr: {
    type: 'exercise', id: 'x-next-err', title: 'โจทย์ 5: ตรวจ input แล้วส่ง error ต่อด้วย next(err)',
    source: `${SRC} §Error Handling Mechanism in Express.js (Forward Error with next(err))`,
    body: '<p><code>/square?n=…</code> ยกกำลังสอง — ถ้า <code>n</code> ไม่ใช่ตัวเลข ให้สร้าง <code>Error(\'n must be a number\')</code> ที่มี <code>status = 400</code>, <code>code = \'BAD_REQUEST\'</code> แล้ว <code>return next(err)</code> (error handler เขียนไว้ให้แล้ว)</p>',
    hint: '<code>Number.isNaN(n)</code> — และอย่าลืม <code>return</code> ไม่งั้นโค้ดด้านล่างจะตอบซ้ำ',
    files: { 'app.js': NEXT_STARTER }, solution: NEXT_SOLUTION,
    tests: [
      { name: '/square?n=4 → 200', steps: [call('GET', '/square?n=4', undefined, { status: 200, json: { n: 4, square: 16 } })] },
      { name: '/square?n=abc → 400', steps: [call('GET', '/square?n=abc', undefined, { status: 400, jsonMatch: { error: 'BAD_REQUEST', statusCode: 400, message: 'n must be a number' } })] },
      { name: '/square (ไม่ส่ง n) → 400', steps: [call('GET', '/square', undefined, { status: 400, jsonMatch: { statusCode: 400 } })] },
    ],
  },

  // ---------- assignment (self-check only; no solution, no answer-revealing hints) ----------

  a1: asgBlock({
    section: '§ข้อที่ 1', importName: 'officeRouter', importPath: './routes/offices.js', mount: 'offices', routeName: 'offices',
    verbPath: "router.get('/:officeCode', async (req, res, next) => {", note: 'GET /api/<รหัสนักศึกษา>/offices/:officeCode',
    block: {
      id: 'x-a1', title: 'งานส่ง ข้อ 1 [Simple]: GET Office by ID — จัดการ 404 Not Found',
      body: `<p><b>Resource:</b> ตาราง <code>offices</code> · <b>GET</b> <code>/api/&lt;รหัสนักศึกษา&gt;/offices/:officeCode</code></p>
        <ol><li>ดึงสำนักงานตาม <code>:officeCode</code> (เช่น <code>1</code>, <code>2</code>, <code>NA</code>)</li>
        <li>พบ → ตอบ <b>200</b> พร้อมข้อมูลใน <code>data</code> (รูปแบบ <code>{status: "success", data: …}</code>)</li>
        <li>ไม่พบ → <b>ห้าม</b>ส่ง object ว่างหรือ <code>null</code> ให้โยน <code>AppError</code> ไปที่ error middleware เพื่อตอบ <b>404</b> รหัส <code>OFFICE_NOT_FOUND</code> ข้อความ <code>Office with code '99' was not found</code></li></ol>
        <p class="muted">ใส่รหัสนักศึกษาของคุณใน <code>app.js</code> (<code>STUDENT_ID</code>) และลงทะเบียน <code>errorHandler</code> เป็นตัวสุดท้าย แล้วกด "ตรวจคำตอบ"</p>`,
      hint: 'เงื่อนไขทั้งหมดอยู่ในโจทย์ข้างบน และกติกาของงานส่งอยู่ในบล็อก "error ในทุกชั้น…" ด้านบน',
      tests: [
        { name: 'GET /offices/1 → 200 success', steps: [call('GET', api('offices/1'), undefined, ok(200, { 'data.officeCode': '1', 'data.city': 'San Francisco' }))] },
        { name: 'GET /offices/NA → 200 success', steps: [call('GET', api('offices/NA'), undefined, ok(200, { 'data.officeCode': 'NA' }))] },
        { name: 'GET /offices/99 → 404 OFFICE_NOT_FOUND', steps: [call('GET', api('offices/99'), undefined, err(404, 'OFFICE_NOT_FOUND', "Office with code '99' was not found"))] },
      ],
    },
  }),

  a2: asgBlock({
    section: '§ข้อที่ 2', importName: 'productLineRouter', importPath: './routes/productlines.js', mount: 'productlines', routeName: 'productlines',
    verbPath: "router.post('/', async (req, res, next) => {", note: 'POST /api/<รหัสนักศึกษา>/productlines',
    block: {
      id: 'x-a2', title: 'งานส่ง ข้อ 2 [Simple]: Create Product Line — String PK และ Duplicate Entry',
      body: `<p><b>Resource:</b> ตาราง <code>productlines</code> (PK <code>productLine</code> เป็น <code>VARCHAR(50)</code> ที่ client ส่งมา) · <b>POST</b> <code>/api/&lt;รหัสนักศึกษา&gt;/productlines</code> · body <code>{"productLine": "Electric Vehicles", "textDescription": "…"}</code></p>
        <ol><li><b>Validation:</b> <code>productLine</code> ต้องส่งมาและไม่เป็นช่องว่าง ไม่งั้นตอบ <b>400</b> <code>VALIDATION_ERROR</code> ข้อความ <code>Field 'productLine' is required and cannot be empty</code></li>
        <li>บันทึกสำเร็จ → <b>201 Created</b></li>
        <li>มี <code>productLine</code> นี้อยู่แล้ว (MySQL <code>ER_DUP_ENTRY</code>) → error middleware ต้องดักและตอบ <b>409</b> <code>DUPLICATE_KEY</code></li></ol>`,
      hint: 'ให้ error จาก MySQL ไหลไปถึง error middleware กลางด้วย next(err) — ไม่ต้องเช็คซ้ำเองใน controller',
      tests: [
        { name: 'POST ใหม่ → 201 success', steps: [call('POST', api('productlines'), { productLine: 'Electric Vehicles', textDescription: 'Line of modern high-performance electric cars' }, ok(201))] },
        { name: 'ไม่มี productLine → 400 VALIDATION_ERROR', steps: [call('POST', api('productlines'), { textDescription: 'x' }, err(400, 'VALIDATION_ERROR', "Field 'productLine' is required and cannot be empty"))] },
        { name: 'productLine เป็นช่องว่าง → 400 VALIDATION_ERROR', steps: [call('POST', api('productlines'), { productLine: '   ' }, err(400, 'VALIDATION_ERROR'))] },
        { name: 'productLine ซ้ำ → 409 DUPLICATE_KEY', steps: [call('POST', api('productlines'), { productLine: 'Classic Cars', textDescription: 'again' }, err(409, 'DUPLICATE_KEY'))] },
      ],
    },
  }),

  a3: asgBlock({
    section: '§ข้อที่ 3', importName: 'employeeRouter', importPath: './routes/employees.js', mount: 'employees', routeName: 'employees',
    verbPath: "router.put('/:employeeNumber', async (req, res, next) => {", note: 'PUT /api/<รหัสนักศึกษา>/employees/:employeeNumber',
    block: {
      id: 'x-a3', title: 'งานส่ง ข้อ 3 [Intermediate]: Update Employee — Foreign Key ตอนแก้ไข',
      body: `<p><b>Resource:</b> ตาราง <code>employees</code> · <b>PUT</b> <code>/api/&lt;รหัสนักศึกษา&gt;/employees/:employeeNumber</code> · body <code>{firstName, lastName, email, officeCode, reportsTo, jobTitle}</code> · <code>officeCode</code> ต้องมีใน <code>offices</code> และ <code>reportsTo</code> (ถ้ามี) ต้องมีใน <code>employees</code></p>
        <ol><li>ไม่พบพนักงาน → <b>404</b> <code>EMPLOYEE_NOT_FOUND</code> ข้อความ <code>Employee with ID '9999' was not found</code></li>
        <li>รูปแบบ <code>email</code> ไม่ถูกต้อง → <b>400</b> <code>INVALID_EMAIL</code> ข้อความ <code>Invalid email address format</code></li>
        <li><code>officeCode</code> หรือ <code>reportsTo</code> ไม่มีจริง (MySQL <code>ER_NO_REFERENCED_ROW_2</code>) → error middleware ตอบ <b>400</b> <code>FOREIGN_KEY_NOT_FOUND</code></li>
        <li>สำเร็จ → <b>200</b> <code>{status: "success", data: …}</code></li></ol>`,
      hint: 'ลำดับตามโจทย์: เช็คว่ามีพนักงานก่อน แล้วตรวจ email แล้วค่อยสั่ง UPDATE — ปล่อยให้ MySQL โยน foreign key error ขึ้นไปเอง',
      tests: [
        { name: 'PUT พนักงานที่มี + ข้อมูลถูก → 200', steps: [call('PUT', api('employees/1056'), EMP, ok(200))] },
        { name: 'PUT พนักงานที่ไม่มี (9999) → 404 EMPLOYEE_NOT_FOUND', steps: [call('PUT', api('employees/9999'), EMP, err(404, 'EMPLOYEE_NOT_FOUND', "Employee with ID '9999' was not found"))] },
        { name: 'email ผิดรูปแบบ → 400 INVALID_EMAIL', steps: [call('PUT', api('employees/1056'), { ...EMP, email: 'not-an-email' }, err(400, 'INVALID_EMAIL', 'Invalid email address format'))] },
        { name: 'officeCode ไม่มีจริง → 400 FOREIGN_KEY_NOT_FOUND', steps: [call('PUT', api('employees/1056'), { ...EMP, officeCode: '99' }, err(400, 'FOREIGN_KEY_NOT_FOUND'))] },
        { name: 'reportsTo ไม่มีจริง → 400 FOREIGN_KEY_NOT_FOUND', steps: [call('PUT', api('employees/1056'), { ...EMP, reportsTo: 5555 }, err(400, 'FOREIGN_KEY_NOT_FOUND'))] },
      ],
    },
  }),

  a4: asgBlock({
    section: '§ข้อที่ 4', importName: 'customerRouter', importPath: './routes/customers.js', mount: 'customers', routeName: 'customers',
    verbPath: "router.delete('/:customerNumber', async (req, res, next) => {", note: 'DELETE /api/<รหัสนักศึกษา>/customers/:customerNumber',
    block: {
      id: 'x-a4', title: 'งานส่ง ข้อ 4 [Intermediate]: Delete Customer — Foreign Key (ON DELETE RESTRICT)',
      body: `<p><b>Resource:</b> ตาราง <code>customers</code> (ถูกอ้างอิงใน <code>orders</code> และ <code>payments</code>) · <b>DELETE</b> <code>/api/&lt;รหัสนักศึกษา&gt;/customers/:customerNumber</code></p>
        <ol><li>ไม่พบลูกค้า → <b>404</b> <code>CUSTOMER_NOT_FOUND</code></li>
        <li>ลบด้วย <code>DELETE FROM customers WHERE customerNumber = ?</code> สำเร็จ → <b>200</b> <code>{status: "success", data: {message: "Customer record successfully deleted"}}</code></li>
        <li>ลูกค้ามี orders หรือ payments ค้างอยู่ MySQL จะไม่ให้ลบ (<code>ER_ROW_IS_REFERENCED_2</code>) → error middleware ตอบ <b>409</b> <code>RESOURCE_IN_USE</code></li></ol>`,
      hint: 'ข้อมูลตัวอย่าง: ลูกค้า 103 มี orders/payments, ลูกค้า 500 ไม่มีใครอ้างอิง',
      tests: [
        { name: 'ลบลูกค้าที่ไม่มี → 404 CUSTOMER_NOT_FOUND', steps: [call('DELETE', api('customers/999999'), undefined, err(404, 'CUSTOMER_NOT_FOUND'))] },
        { name: 'ลบลูกค้าที่มี orders/payments (103) → 409 RESOURCE_IN_USE', steps: [call('DELETE', api('customers/103'), undefined, err(409, 'RESOURCE_IN_USE'))] },
        { name: 'ลบลูกค้าที่ไม่มีใครอ้างอิง (500) → 200 แล้วลบซ้ำ → 404', steps: [
          call('DELETE', api('customers/500'), undefined, ok(200, { 'data.message': 'Customer record successfully deleted' })),
          call('DELETE', api('customers/500'), undefined, err(404, 'CUSTOMER_NOT_FOUND')),
        ] },
      ],
    },
  }),

  a5: asgBlock({
    section: '§ข้อที่ 5', importName: 'customerRouter', importPath: './routes/customers.js', mount: 'customers', routeName: 'customers',
    verbPath: "router.post('/:customerNumber/payments', async (req, res, next) => {", note: 'POST /api/<รหัสนักศึกษา>/customers/:customerNumber/payments',
    block: {
      id: 'x-a5', title: 'งานส่ง ข้อ 5 [Intermediate]: Create Payment — Composite PK และ Business Logic',
      body: `<p><b>Resource:</b> ตาราง <code>payments</code> (Composite PK <code>(customerNumber, checkNumber)</code>) · <b>POST</b> <code>/api/&lt;รหัสนักศึกษา&gt;/customers/:customerNumber/payments</code> · body <code>{"checkNumber": "HQ336338", "paymentDate": "2026-09-18", "amount": 2500.50}</code></p>
        <ol><li>ไม่พบลูกค้า <code>:customerNumber</code> → <b>404</b> <code>CUSTOMER_NOT_FOUND</code></li>
        <li>Business rules: <code>amount</code> ต้องเป็นตัวเลขและ &gt; 0, <code>paymentDate</code> ต้องเป็น ISO <code>YYYY-MM-DD</code> ไม่งั้น <b>400</b> <code>INVALID_PAYMENT_DATA</code> (ข้อความ <code>Payment amount must be greater than zero</code> เมื่อ amount ไม่ถูกต้อง)</li>
        <li>บันทึกสำเร็จ → <b>201 Created</b></li>
        <li><code>checkNumber</code> ซ้ำสำหรับลูกค้ารายเดิม (MySQL <code>ER_DUP_ENTRY</code>) → error middleware ตอบ <b>409</b> <code>DUPLICATE_KEY</code> (แต่ลูกค้าคนละรายใช้เลขเช็คเดียวกันได้)</li></ol>`,
      hint: 'ลำดับตามโจทย์: ตรวจลูกค้า → ตรวจ business rules → INSERT — ปล่อยให้ MySQL โยน duplicate key เอง',
      tests: [
        { name: 'ลูกค้าไม่มี (9999) → 404 CUSTOMER_NOT_FOUND', steps: [call('POST', api('customers/9999/payments'), PAY, err(404, 'CUSTOMER_NOT_FOUND'))] },
        { name: 'amount = 0 → 400 INVALID_PAYMENT_DATA', steps: [call('POST', api('customers/500/payments'), { ...PAY, amount: 0 }, err(400, 'INVALID_PAYMENT_DATA', 'Payment amount must be greater than zero'))] },
        { name: 'amount ไม่ใช่ตัวเลข → 400 INVALID_PAYMENT_DATA', steps: [call('POST', api('customers/500/payments'), { ...PAY, amount: 'abc' }, err(400, 'INVALID_PAYMENT_DATA'))] },
        { name: 'paymentDate ไม่ใช่ YYYY-MM-DD → 400 INVALID_PAYMENT_DATA', steps: [call('POST', api('customers/500/payments'), { ...PAY, paymentDate: '18-09-2026' }, err(400, 'INVALID_PAYMENT_DATA'))] },
        { name: 'สร้างสำเร็จ 201 → เลขเช็คซ้ำของลูกค้าเดิม 409 → ลูกค้าอื่นใช้เลขเดียวกันได้ 201', steps: [
          call('POST', api('customers/500/payments'), PAY, ok(201)),
          call('POST', api('customers/500/payments'), PAY, err(409, 'DUPLICATE_KEY')),
          call('POST', api('customers/112/payments'), PAY, ok(201)),
        ] },
      ],
    },
  }),
};
