const SRC = 'week3/W03-introduction-to-rest-api.md';

// ============ the handed-out project (week3/basic-rest/src/src), verbatim unless noted ============

const SUBJECTS = `// Data Access Layer
const subjects = [
    {id: 'INT100', name: 'IT Fundamentals', credit: 3},
    {id: "INT101", name: "Programming Fundamentals", credit: 3},
    {id: "INT102", name: "Web Technology", credit: 1},
    {id: "INT114", name: "Discrete Mathematics", credit: 3},
    {id: "GEN101", name: "Physical Education", credit: 1},
    {id: "GEN111", name: "Man and Ethics of Living", credit: 3},
    {id: "LNG120", name: "General English", credit: 3},
    {id: "LNG220", name: "Academic English", credit: 3},
    {id: "INT103", name: "Advanced Programming", credit: 3},
    {id: "INT104", name: "User Experience Design", credit: 3},
    {id: "INT105", name: "Basic SQL", credit: 1},
    {id: "INT107", name: "Computing Platforms Technology", credit: 3},
    {id: "INT200", name: "Data Structures and Algorithms", credit: 1},
    {id: "INT201", name: "Client-Side Programming I", credit: 2},
    {id: "INT202", name: "Server-Side Programming I", credit: 2},
    {id: "INT205", name: "Database Management System", credit: 3},
    {id: "INT207", name: "Network I", credit: 3}
];
`;

const F_FINDALL = `
export function findAll() {
    return subjects;
}
`;
const F_FINDALL_TODO = `
export function findAll() {
    // เขียนโค้ดตรงนี้: คืน array subjects ทั้งหมด
}
`;
const F_FIND = `
export function find(id) {
    const subject = subjects.find(subject => subject.id === id);
    return subject;
}
`;
const F_FIND_TODO = `
export function find(id) {
    // เขียนโค้ดตรงนี้: คืน subject ที่ id ตรงกัน (ไม่เจอให้คืน undefined)
}
`;
const F_INSERT_BUG = `
export function insertSubject(subject) {
    const idx = subjects.findIndex(subj => subj.id === subject.id);
    //check duplicate data
    if (existing >= 0) {
        return false;
    }
    subjects.push(subject);
    return subject;
}
`;
const F_INSERT_OK = F_INSERT_BUG.replace('existing >= 0', 'idx >= 0');
const F_UPDATE = `
export function updateSubject(id, subject) {
    const idx = subjects.findIndex(subj => subj.id === id);
    if (idx === -1) return false;
    subjects[idx] = subject;
    return subject;
}
`;
const F_REMOVE = `
export function removeSubject(id) {
    const idx = subjects.findIndex(subject => subject.id === id);
    if (idx === -1) return false;
    // Removes 1 item starting at idx
    subjects.splice(idx, 1);
    return true;
}
`;
const F_REMOVE_TODO = `
export function removeSubject(id) {
    // เขียนโค้ดตรงนี้: หา index ของ subject แล้วลบออก
    // ไม่เจอให้คืน false, ลบสำเร็จให้คืน true
    return false;
}
`;

const REPO_OK = SUBJECTS + F_FINDALL + F_FIND + F_INSERT_OK + F_UPDATE + F_REMOVE;

const SERVICE_HEAD = `// Service layer for subject resource
import * as repo from '../repositories/subject-repository.js';
export function getAllSubjects() {
    return repo.findAll();
}

export function getSubjectById(id) {
    return repo.find(id);
}

export function createNewSubject(subject) {
    return repo.insertSubject(subject);
}
`;
const SERVICE_UPDATE_BUG = `
export function updateSubjectById(id, subject) {
    const newSubject = repo.updateSubject(subject);
    if (newSubject == null) return false;
    return newSubject;
}
`;
const SERVICE_UPDATE_OK = SERVICE_UPDATE_BUG.replace('repo.updateSubject(subject)', 'repo.updateSubject(id, subject)');
const SERVICE_REMOVE = `
export function removeSubjectById(id) {
    return repo.removeSubject(id);
}
`;
const SERVICE_OK = SERVICE_HEAD + SERVICE_UPDATE_OK + SERVICE_REMOVE;

const SERVER = `import * as http from 'node:http';
import * as route from './router.js';
import {handleUserRequest} from "./router.js";

const server = http.createServer((req, res) => {
    route.handleUserRequest(req, res);
});
server.listen(3000,() => {
    console.log('Server running at http://127.0.0.1:3000/');
});
server.on('request', (req, res) => {
    console.log('Request received:', req.method, req.url);
});
`;

const ROUTER_HEAD = `// 1. Router Layer (HTTP/Uniform Interface Concern)
import * as service from './services/subject-service.js';
export function handleUserRequest(request, response) {
    const {url, method} = request;

    if (url === '/subjects') {
        switch (request.method) {
            case 'GET':
                const subjects = service.getAllSubjects();
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(subjects));
                break;
            case 'POST':
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({warning: 'under construction'}));
                break;
        }
    } else if (url.startsWith('/subjects/')) {
        const id = url.slice('/subjects/'.length);
        switch (request.method) {
            case 'GET':
                const subject = service.getSubjectById(id);
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify(subject));
                break;
`;
const ROUTER_DELETE = `            case 'DELETE':
                const delSubject = service.removeSubjectById(id);
                if (delSubject) {
                    response.writeHead(204, {'Content-Type': 'application/json'});
                    response.end();
                } else {
                    response.writeHead(404, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify({error: 'Subject not found for id = '+id}));
                }
                break;
`;
const ROUTER_DELETE_TODO = `            case 'DELETE':
                // เขียนโค้ดตรงนี้: ลบสำเร็จตอบ 204 (ไม่มี body) / ไม่พบตอบ 404 พร้อม JSON
                // {error: 'Subject not found for id = <id>'}
                break;
`;
const ROUTER_PUT = `            case 'PUT':
                response.writeHead(200, {'Content-Type': 'application/json'});
                response.end(JSON.stringify({warning: 'under construction'}));
                break;
        }
    } else {
`;
const ROUTER_ELSE_BUG = `        respose.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({error : 'Resource not found'}));
    }
}
`;
const ROUTER_ELSE_OK = ROUTER_ELSE_BUG.replace('respose.writeHead', 'response.writeHead').replace('res.end', 'response.end');

const ROUTER_OK = ROUTER_HEAD + ROUTER_DELETE + ROUTER_PUT + ROUTER_ELSE_OK;

const S = 'services/subject-service.js';
const R = 'repositories/subject-repository.js';

// project files with the file being edited listed FIRST (the editor opens on it)
const project = ({ first, override = {}, extra = {} }) => {
  const base = { 'server.js': SERVER, 'router.js': ROUTER_OK, [S]: SERVICE_OK, [R]: REPO_OK, ...override };
  const ordered = { [first]: base[first] };
  for (const [k, v] of Object.entries(base)) if (k !== first) ordered[k] = v;
  return { ...ordered, ...extra };
};

const get = (path, expect) => ({ request: { path }, expect: { status: 200, ...expect } });

// ============ experiments ============

const MINI_ROUTER = `import * as service from './services/subject-service.js';

export function handleUserRequest(request, response) {
    const {url, method} = request;
    if (url === '/subjects' && method === 'GET') {
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(service.getAllSubjects()));
    } else if (url.startsWith('/subjects/') && method === 'GET') {
        const id = url.slice('/subjects/'.length);
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(service.getSubjectById(id)));
    } else {
        response.writeHead(404, {'Content-Type': 'application/json'});
        response.end(JSON.stringify({error: 'Resource not found'}));
    }
}
`;
const MINI_SERVER = `import * as http from 'node:http';
import * as route from './router.js';

http.createServer((req, res) => {
    route.handleUserRequest(req, res);
}).listen(3000);
console.log('Server running at http://127.0.0.1:3000/');
`;
const MINI_SERVICE = `import * as repo from '../repositories/subject-repository.js';

export function getAllSubjects() {
    return repo.findAll();
}

export function getSubjectById(id) {
    return repo.find(id);
}
`;
const MINI_REPO = `// Data Access Layer — เปลี่ยนข้อมูลตรงนี้ ชั้นอื่นไม่ต้องแก้
const subjects = [
    {id: 'INT100', name: 'IT Fundamentals', credit: 3},
    {id: 'INT101', name: 'Programming Fundamentals', credit: 3},
    {id: 'INT102', name: 'Web Technology', credit: 1}
];

export function findAll() {
    return subjects;
}

export function find(id) {
    return subjects.find(subject => subject.id === id);
}
`;

const STATUS_SERVER = `import * as http from 'node:http';

const subjects = [
  { id: 'INT100', name: 'IT Fundamentals', credit: 3 },
  { id: 'INT101', name: 'Programming Fundamentals', credit: 3 },
];

const listener = function (request, response) {
  const { url, method } = request;
  if (method === 'DELETE' && url.startsWith('/subjects/')) {
    const id = url.slice('/subjects/'.length);
    const idx = subjects.findIndex((subject) => subject.id === id);
    if (idx === -1) {
      response.writeHead(404, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Subject not found for id = ' + id }));
    } else {
      subjects.splice(idx, 1);
      response.writeHead(204, { 'Content-Type': 'application/json' });
      response.end();
    }
  } else {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(subjects));
  }
};

http.createServer(listener).listen(3000);
`;

export const experiments = {
  verbs: {
    type: 'experiment', id: 'e-verbs', title: 'เดาความหมายของ endpoint + verb',
    source: `${SRC} §05 กติกาการตั้งชื่อ endpoint (ตารางตัวอย่าง)`, widget: 'verb-quiz',
    body: '<p>ดู verb กับ URI แล้วเลือกความหมายที่ถูก — คนอ่านโค้ดควรรู้ทันทีว่าเกิดอะไรขึ้นแค่ดู endpoint กับ method</p>',
    data: [
      { verb: 'GET', uri: 'api/products', meaning: 'ดึง products ทั้งหมด' },
      { verb: 'GET', uri: 'api/products/1', meaning: 'ดึง product ที่ id = 1' },
      { verb: 'GET', uri: 'api/products/1/orders', meaning: 'ดึง orders ทั้งหมดของ product id = 1' },
      { verb: 'POST', uri: 'api/products', meaning: 'เพิ่ม product ใหม่' },
      { verb: 'PUT', uri: 'api/products/1', meaning: 'แก้ product ที่ id = 1' },
      { verb: 'DELETE', uri: 'api/products/1', meaning: 'ลบ product ที่ id = 1' },
    ],
  },

  urlAnatomy: {
    type: 'experiment', id: 'e-url-anatomy', title: 'แยกส่วนประกอบของ URL',
    source: `${SRC} §05 โครงสร้างของ URL`, widget: 'url-anatomy',
    body: '<p>ลองแก้ URL (เช่น เปลี่ยน port, version หรือ resource) แล้วดูว่าแต่ละส่วนถูกแยกอย่างไร และส่วนไหนนับเป็น Restful Endpoint</p>',
  },

  layers: {
    type: 'experiment', id: 'e-layers', title: 'Layered System: เปลี่ยนชั้นข้อมูลโดยไม่แตะชั้นอื่น',
    source: `${SRC} §06 เจาะลึก Layered System, §07 โครงไฟล์ในโปรเจกต์ (ตัวอย่างย่อจากโค้ดที่แจก)`,
    body: '<p>Run แล้วส่ง <code>GET /subjects</code> จากนั้นแก้ข้อมูลใน <code>repositories/subject-repository.js</code> (เช่น เปลี่ยนชื่อวิชา หรือเพิ่มวิชา) Run ใหม่ — ผลใน response เปลี่ยนโดยที่ router และ service ไม่ต้องแก้เลย</p>',
    entry: 'server.js',
    files: { [R]: MINI_REPO, 'server.js': MINI_SERVER, 'router.js': MINI_ROUTER, [S]: MINI_SERVICE },
  },

  projectRun: {
    type: 'experiment', id: 'e-project-run', title: 'รันโปรเจกต์ที่แจก (แก้บั๊กแล้ว) และลองยิง endpoint',
    source: `${SRC} §08 โค้ดตัวอย่างที่แจกมา (แก้บั๊ก 3 จุดจาก §09 แล้ว)`,
    body: '<p>โปรเจกต์ 4 ไฟล์ตามที่แจก (แก้บั๊กแล้ว) ลองยิง <code>GET /subjects</code>, <code>GET /subjects/INT101</code>, <code>DELETE /subjects/INT101</code> (ได้ 204) แล้วส่งซ้ำ (ได้ 404) และ <code>GET /nothing</code> — สังเกตบรรทัด <code>Request received:</code> ใน Output</p>',
    entry: 'server.js',
    files: project({ first: 'server.js' }),
  },

  status: {
    type: 'experiment', id: 'e-status', title: 'DELETE สำเร็จตอบ 204 ส่วนไม่พบตอบ 404',
    source: `${SRC} §08 router.js (DELETE ที่สำเร็จตอบ 204 No Content)`,
    body: '<p>ส่ง <code>DELETE /subjects/INT100</code> สองครั้งติดกัน — ครั้งแรกได้ <b>204 No Content</b> (ไม่มี body) ครั้งที่สองได้ <b>404</b> พร้อม JSON แล้วลอง <code>GET /subjects</code> ดูข้อมูลที่เหลือ</p>',
    files: { 'server.js': STATUS_SERVER },
  },
};

// ============ exercises ============

const ENDPOINT_TABLE = [
  ['GET', '/api/products', 'ดึง products ทั้งหมด'],
  ['GET', '/api/products/1', 'ดึง product ที่ id = 1'],
  ['GET', '/api/products/1/orders', 'ดึง orders ทั้งหมดของ product id = 1'],
  ['POST', '/api/products', 'เพิ่ม product ใหม่'],
  ['PUT', '/api/products/1', 'แก้ product ที่ id = 1'],
  ['DELETE', '/api/products/1', 'ลบ product ที่ id = 1'],
];

const ENDPOINTS_STARTER = `import * as http from 'node:http';

const listener = function (request, response) {
  const { url, method } = request;
  // เขียนโค้ดตรงนี้: ตอบ JSON { action: '<ความหมาย>' } ตามตาราง endpoint ในโจทย์
  // ถ้าไม่ตรงกับ endpoint ไหนเลย ให้ตอบ 404
};

http.createServer(listener).listen(3000);
`;
const ENDPOINTS_SOLUTION = `import * as http from 'node:http';

const listener = function (request, response) {
  const { url, method } = request;
  const segments = url.split('/').filter(Boolean); // ['api', 'products', id?, 'orders'?]
  let action = null;
  if (segments[0] === 'api' && segments[1] === 'products') {
    const id = segments[2];
    if (segments.length === 2 && method === 'GET') action = 'ดึง products ทั้งหมด';
    else if (segments.length === 2 && method === 'POST') action = 'เพิ่ม product ใหม่';
    else if (segments.length === 3 && method === 'GET') action = \`ดึง product ที่ id = \${id}\`;
    else if (segments.length === 3 && method === 'PUT') action = \`แก้ product ที่ id = \${id}\`;
    else if (segments.length === 3 && method === 'DELETE') action = \`ลบ product ที่ id = \${id}\`;
    else if (segments.length === 4 && segments[3] === 'orders' && method === 'GET') {
      action = \`ดึง orders ทั้งหมดของ product id = \${id}\`;
    }
  }
  if (action) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ action }));
  } else {
    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Resource not found' }));
  }
};

http.createServer(listener).listen(3000);
`;

const CHECK_INSERT = `import * as service from './services/subject-service.js';

const dup = service.createNewSubject({ id: 'INT100', name: 'Duplicate', credit: 3 });
console.log('duplicate:', dup);

const fresh = service.createNewSubject({ id: 'INT999', name: 'New Subject', credit: 3 });
console.log('fresh:', fresh);
`;
const CHECK_UPDATE = `import * as service from './services/subject-service.js';

const updated = service.updateSubjectById('INT100', { id: 'INT100', name: 'IT Fundamentals (updated)', credit: 3 });
console.log('updated:', updated);
console.log('after:', service.getSubjectById('INT100'));
`;

const LAYERS_ROUTER_BYPASS = `// 1. Router Layer — ตอนนี้เรียก repository ตรง ๆ (ข้ามชั้น service)
import * as repo from './repositories/subject-repository.js';

export function handleUserRequest(request, response) {
    const {url, method} = request;

    if (url === '/subjects' && method === 'GET') {
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(repo.findAll()));
    } else if (url.startsWith('/subjects/') && method === 'GET') {
        const id = url.slice('/subjects/'.length);
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.end(JSON.stringify(repo.find(id)));
    } else {
        response.writeHead(404, {'Content-Type': 'application/json'});
        response.end(JSON.stringify({error: 'Resource not found'}));
    }
}
`;

const readTests = [
  { name: 'GET /subjects มี INT100', steps: [get('/subjects', { textIncludes: '"id":"INT100"' })] },
  { name: 'GET /subjects มี INT207 (ตัวสุดท้าย)', steps: [get('/subjects', { textIncludes: '"id":"INT207"' })] },
  { name: 'GET /subjects/INT101', steps: [get('/subjects/INT101', { json: { id: 'INT101', name: 'Programming Fundamentals', credit: 3 } })] },
];

export const exercises = {
  endpoints: {
    type: 'exercise', id: 'x-endpoints', title: 'โจทย์ 1: ทำ router ตามตาราง endpoint (api/products)',
    source: `${SRC} §05 กติกาการตั้งชื่อ endpoint (ตารางตัวอย่าง)`,
    body: `<p>ตอบ JSON <code>{ "action": "…" }</code> ตามตาราง (id ใด ๆ ก็ได้ ไม่ใช่แค่ 1) และตอบ <b>404</b> ถ้าไม่ตรงกับ endpoint ไหนเลย</p>
      <table><tr><th>Verb</th><th>URI</th><th>action</th></tr>${ENDPOINT_TABLE.map(([v, u, a]) => `<tr><td>${v}</td><td><code>${u}</code></td><td>${a}</td></tr>`).join('')}</table>`,
    hint: '<code>url.split(\'/\').filter(Boolean)</code> ให้ segment ของ path — เช็คจำนวน segment และ <code>method</code>',
    files: { 'server.js': ENDPOINTS_STARTER },
    solution: ENDPOINTS_SOLUTION,
    tests: [
      ...ENDPOINT_TABLE.map(([method, path, action]) => ({ name: `${method} ${path}`, steps: [{ request: { method, path }, expect: { status: 200, json: { action } } }] })),
      { name: 'GET /api/products/7 (id อื่น)', steps: [get('/api/products/7', { json: { action: 'ดึง product ที่ id = 7' } })] },
      { name: 'GET /api/customers → 404', steps: [{ request: { path: '/api/customers' }, expect: { status: 404 } }] },
    ],
  },

  repoRead: {
    type: 'exercise', id: 'x-repo-read', title: 'โจทย์ 2: ชั้น repository — findAll และ find',
    source: `${SRC} §08 subject-repository.js`,
    body: '<p>เขียน <code>findAll()</code> (คืน array ทั้งหมด) และ <code>find(id)</code> (คืน subject ที่ id ตรงกัน) ในชั้น Data Access — router และ service เขียนไว้ให้แล้ว</p>',
    hint: '<code>find</code> ใช้ <code>subjects.find(subject =&gt; subject.id === id)</code>',
    entry: 'server.js',
    files: project({ first: R, override: { [R]: SUBJECTS + F_FINDALL_TODO + F_FIND_TODO + F_INSERT_OK + F_UPDATE + F_REMOVE } }),
    solution: REPO_OK,
    tests: readTests,
  },

  repoRemove: {
    type: 'exercise', id: 'x-repo-remove', title: 'โจทย์ 3: ชั้น repository — removeSubject',
    source: `${SRC} §08 subject-repository.js (removeSubject), router.js (DELETE)`,
    body: '<p>เขียน <code>removeSubject(id)</code>: ไม่พบ id ให้คืน <code>false</code> พบแล้วลบ <b>1 ตัว</b> ที่ตำแหน่งนั้นออกจาก array แล้วคืน <code>true</code></p>',
    hint: '<code>findIndex</code> หาตำแหน่ง แล้ว <code>subjects.splice(idx, 1)</code> ลบ 1 ตัวที่ตำแหน่ง idx',
    entry: 'server.js',
    files: project({ first: R, override: { [R]: SUBJECTS + F_FINDALL + F_FIND + F_INSERT_OK + F_UPDATE + F_REMOVE_TODO } }),
    solution: REPO_OK,
    tests: [{
      name: 'DELETE สำเร็จ → หายไป → DELETE ซ้ำได้ 404',
      steps: [
        { request: { method: 'DELETE', path: '/subjects/INT100' }, expect: { status: 204, text: '' } },
        { request: { path: '/subjects' }, expect: { status: 200, textExcludes: '"id":"INT100"' } },
        { request: { method: 'DELETE', path: '/subjects/INT100' }, expect: { status: 404, json: { error: 'Subject not found for id = INT100' } } },
      ],
    }],
  },

  routerDelete: {
    type: 'exercise', id: 'x-router-delete', title: 'โจทย์ 4: router — DELETE ตอบ 204 หรือ 404',
    source: `${SRC} §08 router.js (DELETE ที่สำเร็จตอบ 204 No Content)`,
    body: '<p>เติม <code>case \'DELETE\'</code> ใน router: เรียก service ลบ ถ้าสำเร็จตอบ <b>204</b> (ไม่มี body) ถ้าไม่พบตอบ <b>404</b> พร้อม JSON <code>{error: \'Subject not found for id = &lt;id&gt;\'}</code></p>',
    hint: '<code>service.removeSubjectById(id)</code> คืน <code>true</code>/<code>false</code>',
    entry: 'server.js',
    files: project({ first: 'router.js', override: { 'router.js': ROUTER_HEAD + ROUTER_DELETE_TODO + ROUTER_PUT + ROUTER_ELSE_OK } }),
    solution: ROUTER_OK,
    tests: [
      { name: 'DELETE /subjects/INT100 → 204 ไม่มี body', steps: [{ request: { method: 'DELETE', path: '/subjects/INT100' }, expect: { status: 204, text: '' } }] },
      { name: 'DELETE /subjects/NOPE → 404 + JSON error', steps: [{ request: { method: 'DELETE', path: '/subjects/NOPE' }, expect: { status: 404, json: { error: 'Subject not found for id = NOPE' } } }] },
    ],
  },

  layers: {
    type: 'exercise', id: 'x-layers', title: 'โจทย์ 5: ให้ router คุยกับ service ไม่ข้ามชั้น',
    source: `${SRC} §06 เจาะลึก Layered System (แต่ละชั้นคุยกับเพื่อนบ้านที่ติดกันเท่านั้น)`,
    body: '<p>router ตอนนี้เรียก repository ตรง ๆ ทำให้ข้ามชั้น service — แก้ให้เรียกผ่าน <code>services/subject-service.js</code> (<code>getAllSubjects</code>, <code>getSubjectById</code>) โดยที่ผลลัพธ์ยังเหมือนเดิม และ <code>router.js</code> ต้องไม่ import repository เลย</p>',
    hint: 'เปลี่ยน <code>import * as repo …</code> เป็น import service แล้วเรียก <code>service.getAllSubjects()</code> / <code>service.getSubjectById(id)</code>',
    entry: 'server.js',
    files: project({ first: 'router.js', override: { 'router.js': LAYERS_ROUTER_BYPASS } }),
    solution: MINI_ROUTER,
    codeChecks: [
      { name: 'router.js ต้องไม่ import repository', file: 'router.js', pattern: 'repositories/', mustMatch: false },
      { name: 'router.js ต้องเรียกผ่าน service', file: 'router.js', pattern: 'services/subject-service' },
    ],
    tests: [
      ...readTests.slice(0, 1),
      readTests[2],
      { name: 'GET /nothing → 404', steps: [{ request: { path: '/nothing' }, expect: { status: 404, json: { error: 'Resource not found' } } }] },
    ],
  },

  bugRouterElse: {
    type: 'exercise', id: 'x-bug-router-else', title: 'โจทย์ 6: หาบั๊ก — เปิด path ที่ไม่มีแล้ว server พัง',
    source: `${SRC} §09 บั๊กในโค้ดที่แจกมา (จุดที่ 3 — จากการรันทดสอบเอง)`,
    body: '<p>ลอง Run แล้วยิง <code>GET /nothing</code> ดูว่าเกิด error อะไร จากนั้นแก้ branch สุดท้ายของ router ให้ตอบ <b>404</b> พร้อม JSON <code>{error: \'Resource not found\'}</code></p>',
    hint: 'อ่านชื่อตัวแปรใน error message — ในฟังก์ชันนี้ parameter ชื่อว่าอะไร?',
    entry: 'server.js',
    files: project({ first: 'router.js', override: { 'router.js': ROUTER_HEAD + ROUTER_DELETE + ROUTER_PUT + ROUTER_ELSE_BUG } }),
    solution: ROUTER_OK,
    tests: [
      { name: 'GET /nothing → 404 + JSON', steps: [{ request: { path: '/nothing' }, expect: { status: 404, json: { error: 'Resource not found' } } }] },
      { name: 'GET /subjects ยังทำงานปกติ', steps: [get('/subjects', { textIncludes: '"id":"INT100"' })] },
    ],
  },

  bugInsert: {
    type: 'exercise', id: 'x-bug-insert', title: 'โจทย์ 7: หาบั๊ก — insertSubject พังทันที',
    source: `${SRC} §09 บั๊กในโค้ดที่แจกมา (จุดที่ 1 — จากการรันทดสอบเอง)`,
    body: '<p><code>check.js</code> เรียก <code>createNewSubject</code> สองครั้ง (เพิ่มซ้ำ / เพิ่มใหม่) — Run แล้วดู error ที่ได้ แก้ <code>insertSubject</code> ให้ตัวซ้ำได้ <code>false</code> และตัวใหม่คืน subject กลับมา</p>',
    hint: 'ดูชื่อตัวแปรที่ประกาศไว้บรรทัดบน กับชื่อที่ใช้ใน <code>if</code>',
    entry: 'check.js',
    files: project({ first: R, override: { [R]: SUBJECTS + F_FINDALL + F_FIND + F_INSERT_BUG + F_UPDATE + F_REMOVE }, extra: { 'check.js': CHECK_INSERT } }),
    solution: REPO_OK,
    tests: [
      { name: 'เพิ่ม id ซ้ำ (INT100) ต้องได้ false', steps: [], logIncludes: ['duplicate: false'] },
      { name: 'เพิ่ม id ใหม่ (INT999) ต้องคืน subject', steps: [], logIncludes: ['fresh: {"id":"INT999","name":"New Subject","credit":3}'] },
    ],
  },

  bugUpdate: {
    type: 'exercise', id: 'x-bug-update', title: 'โจทย์ 8: หาบั๊ก — อัปเดตไม่เคยสำเร็จ',
    source: `${SRC} §09 บั๊กในโค้ดที่แจกมา (จุดที่ 2 — จากการรันทดสอบเอง)`,
    body: '<p><code>check.js</code> เรียก <code>updateSubjectById</code> แล้วอ่านข้อมูลกลับมาดู — Run แล้วสังเกตว่าได้ <code>false</code> ตลอด หาสาเหตุในชั้น service (เทียบกับ signature ของ <code>updateSubject</code> ใน repository) แล้วแก้</p>',
    hint: '<code>repo.updateSubject</code> รับกี่อาร์กิวเมนต์ และ service ส่งไปกี่ตัว?',
    entry: 'check.js',
    files: project({ first: S, override: { [S]: SERVICE_HEAD + SERVICE_UPDATE_BUG + SERVICE_REMOVE }, extra: { 'check.js': CHECK_UPDATE } }),
    solution: SERVICE_OK,
    tests: [
      { name: 'updateSubjectById คืน subject ใหม่', steps: [], logIncludes: ['updated: {"id":"INT100","name":"IT Fundamentals (updated)","credit":3}'] },
      { name: 'ข้อมูลในชั้น repository เปลี่ยนจริง', steps: [], logIncludes: ['after: {"id":"INT100","name":"IT Fundamentals (updated)","credit":3}'] },
    ],
  },
};
