const SRC = 'week1/W01-Introduction.md';

const HELLO_STARTER = `const http = require('node:http');

const listener = function (request, response) {
  // เขียนโค้ดตรงนี้: ตอบ status 200 พร้อมข้อความ Hello World
};

const server = http.createServer(listener);
server.listen(3000);
console.log('Server running at http://127.0.0.1:3000/');
`;

const HELLO_SOLUTION = `const http = require('node:http');

const listener = function (request, response) {
  response.writeHead(200);
  response.end('Hello World');
};

const server = http.createServer(listener);
server.listen(3000);
console.log('Server running at http://127.0.0.1:3000/');
`;

const USER_STARTER = `const http = require('node:http');

const listener = function (request, response) {
  if (request.url === '/') {
    response.writeHead(200);
    response.end('Hello World');
  }
  // เขียนโค้ดตรงนี้: ถ้า request.url === '/user' ตอบ JSON { name: 'John Doe' }
  // (อย่าลืมตั้ง Content-Type เป็น application/json)
};

const server = http.createServer(listener);
server.listen(3000);
`;

const USER_SOLUTION = `const http = require('node:http');

const listener = function (request, response) {
  if (request.url === '/user') {
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({ name: 'John Doe' }));
  } else if (request.url === '/') {
    response.writeHead(200);
    response.end('Hello World');
  }
};

const server = http.createServer(listener);
server.listen(3000);
`;

const NOTFOUND_STARTER = `const http = require('node:http');

const listener = function (request, response) {
  if (request.url === '/user') {
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({ name: 'John Doe' }));
  } else if (request.url === '/') {
    response.writeHead(200);
    response.end('Hello World');
  }
  // เขียนโค้ดตรงนี้: path อื่น ๆ ทั้งหมดต้องตอบ 404
};

const server = http.createServer(listener);
server.listen(3000);
`;

const NOTFOUND_SOLUTION = `const http = require('node:http');

const listener = function (request, response) {
  if (request.url === '/user') {
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({ name: 'John Doe' }));
  } else if (request.url === '/') {
    response.writeHead(200);
    response.end('Hello World');
  } else {
    response.writeHead(404);
    response.end('<Error: Page Not Found');
  }
};

const server = http.createServer(listener);
server.listen(3000);
`;

const rootTest = { name: 'GET / → 200 Hello World', steps: [{ request: { path: '/' }, expect: { status: 200, text: 'Hello World' } }] };
const userTest = {
  name: 'GET /user → 200 JSON { name: "John Doe" }',
  steps: [{ request: { path: '/user' }, expect: { status: 200, headers: { 'Content-Type': 'application/json' }, json: { name: 'John Doe' } } }],
};

export const experiments = {
  httpServer: {
    type: 'experiment', id: 'e-http-server', title: 'Hello World server แรก + ตัวยิง request',
    source: `${SRC} §สร้าง Node.js Web Application (Hello World)`,
    body: `<p>ขั้นตอนหลัก 3 อย่าง: import module (<code>require</code>) → create server → อ่าน request/ส่ง response</p>
      <p>กด <b>Run</b> แล้วใช้ตัวยิง request ส่ง <code>GET /</code> สังเกต status, header และ body ที่ได้ จากนั้นลองเปลี่ยน <code>200</code> เป็น <code>404</code> แล้ว Run ใหม่</p>`,
    files: {
      'my-first-app.js': `http = require('node:http');
listener = function (request, response) {
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.end('<h2 style="text-align: center;">Hello World</h2>');
};
server = http.createServer(listener);
server.listen(3000);
console.log('Server running at http://127.0.0.1:3000/');
`,
    },
  },

  contentType: {
    type: 'experiment', id: 'e-content-type', title: 'Routing ด้วย request.url และ Content-Type',
    source: `${SRC} §สร้าง Node.js Web Application (my-third-app.js)`,
    body: '<p>ส่ง request ไปที่ <code>/user</code>, <code>/</code> และ <code>/abc</code> เทียบ status กับ Content-Type ที่ได้ แล้วลองแก้ชื่อ <code>John Doe</code> เป็นชื่อของคุณ</p>',
    files: {
      'my-third-app.js': `http = require('node:http');
listener = function (request, response) {
  if (request.url === '/user') {
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.end(JSON.stringify({ name: 'John Doe' }));
  } else if (request.url === '/') {
    response.writeHead(200);
    response.end('Hello World');
  } else {
    response.writeHead(404);
    response.end('<Error: Page Not Found');
  }
};
server = http.createServer(listener);
server.listen(3000);
`,
    },
  },

  archFlow: {
    type: 'experiment', id: 'e-arch-flow', title: 'MPA vs SPA: คลิกลิงก์แล้วเกิดอะไรขึ้น',
    source: `${SRC} §Web Application Architecture (นิยาม MPA และ SPA)`, widget: 'arch-flow',
    body: '<p>กด "คลิกลิงก์ไปหน้าอื่น" หลาย ๆ ครั้ง เทียบว่า MPA โหลดทั้งหน้าใหม่ทุกครั้ง ส่วน SPA โหลด HTML/CSS/JS ครั้งแรกแล้วขอเฉพาะ JSON ผ่าน AJAX</p>',
  },

  json: {
    type: 'experiment', id: 'e-json', title: 'JSON คือข้อความ (text format)',
    source: `${SRC} §JSON, §สร้าง Node.js Web Application`,
    body: '<p>Run แล้วดูผลของ <code>JSON.stringify</code> และ <code>typeof</code> จากนั้นเพิ่ม property ใน object แล้ว Run ใหม่</p>',
    files: {
      'json.js': `const user = { name: 'John Doe' };
const text = JSON.stringify(user);
console.log(text);
console.log(typeof user);
console.log(typeof text);
`,
    },
  },

  translator: {
    type: 'experiment', id: 'e-translator', title: 'Compilation vs Interpretation ทีละขั้น',
    source: `${SRC} §Compiler vs Interpreter vs Hybrid (Compilation = แปลก่อนรัน, Interpretation = แปลทีละบรรทัดตอนรัน — ภาพประกอบด้วยโปรแกรมสมมติ)`,
    widget: 'translator-sim',
    body: '<p>เลือกวิธีแปล กด "ขั้นถัดไป" ดูลำดับ แล้วติ๊ก "บรรทัด 3 มีข้อผิดพลาด" เทียบว่าสองวิธีต่างกันตรงไหน</p>',
  },
};

export const exercises = {
  hello: {
    type: 'exercise', id: 'x-hello', title: 'โจทย์ 1: GET / ตอบ Hello World',
    source: `${SRC} §สร้าง Node.js Web Application (Hello World)`,
    body: '<p>เขียน <code>listener</code> ให้ตอบ status <b>200</b> พร้อมข้อความ <code>Hello World</code></p>',
    hint: 'ใช้ <code>response.writeHead(200)</code> แล้วจบด้วย <code>response.end(...)</code>',
    files: { 'app.js': HELLO_STARTER }, solution: HELLO_SOLUTION, tests: [rootTest],
  },
  user: {
    type: 'exercise', id: 'x-user', title: 'โจทย์ 2: GET /user ตอบ JSON',
    source: `${SRC} §สร้าง Node.js Web Application (my-third-app.js)`,
    body: '<p>เพิ่ม route <code>/user</code> ให้ตอบ JSON <code>{ "name": "John Doe" }</code> พร้อม <code>Content-Type: application/json</code> (route <code>/</code> ต้องยังทำงานเหมือนเดิม)</p>',
    hint: 'แปลง object เป็นข้อความด้วย <code>JSON.stringify({...})</code> และส่ง header ผ่านอาร์กิวเมนต์ที่สองของ <code>writeHead</code>',
    files: { 'app.js': USER_STARTER }, solution: USER_SOLUTION, tests: [rootTest, userTest],
  },
  notFound: {
    type: 'exercise', id: 'x-404', title: 'โจทย์ 3: path อื่น ๆ ตอบ 404',
    source: `${SRC} §สร้าง Node.js Web Application (my-third-app.js)`,
    body: '<p>path ที่ไม่ใช่ <code>/</code> และ <code>/user</code> ต้องตอบ status <b>404</b></p>',
    hint: 'ใช้ <code>else</code> ท้ายสุดของ <code>if … else if</code>',
    files: { 'app.js': NOTFOUND_STARTER }, solution: NOTFOUND_SOLUTION,
    tests: [
      rootTest, userTest,
      { name: 'GET /nothing → 404', steps: [{ request: { path: '/nothing' }, expect: { status: 404 } }] },
      { name: 'GET /abc → 404', steps: [{ request: { path: '/abc' }, expect: { status: 404 } }] },
    ],
  },
};
