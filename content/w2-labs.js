const SRC = 'week2/W02-http-programming-basics.md';

// ---------- experiments (code from the slides) ----------

const HTTP_SERVER = `import * as http from 'node:http';

const listener = function (request, response) {
  const { url, method } = request;
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end(\`You made a \${method} request to \${url}\`); // template literal
};

const server = http.createServer(listener);

server.listen(3000, () => {
  console.log('Server running at http://127.0.0.1:3000/');
});

server.on('request', (req, res) => {
  console.log('Request received:', req.method, req.url);
});
`;

const ESM_SERVER = `import * as http from 'node:http';

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Hello from ESM');
});
server.listen(3000);
console.log('ESM server started');
`;

const QUERY_SERVER = `import * as http from 'node:http';

const listener = function (request, response) {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  const { url, method } = request;
  const urlObj = new URL(request.url, \`http://\${request.headers.host}\`);
  const params = urlObj.searchParams;
  const name = params.get('name');
  const subjects = params.getAll('fav_subj');
  response.write(\`Name = \${name} Favorite Subjects: \${subjects}\\n\`);
  response.end(\`You made a \${method} request to \${url}\`);
};

http.createServer(listener).listen(3000);
`;

const PATH_SERVER = `import * as http from 'node:http';

const listener = function (request, response) {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  const urlObj = new URL(request.url, \`http://\${request.headers.host}\`);
  const pathSegments = urlObj.pathname.split('/').filter(Boolean);

  response.write('Path Segments:\\n');
  pathSegments.forEach(function (pathSegment, index) {
    response.write('    ' + (index + 1) + ', ' + pathSegment + '\\n\\n');
  });

  response.end(\`urlObj.pathname: \${urlObj.pathname}\`);
  console.log('path', urlObj.pathname);
};

http.createServer(listener).listen(3000);
`;

const RESPONSE_API = `import * as http from 'node:http';

const listener = function (request, response) {
  response.setHeader('Content-Type', 'text/plain'); // ตั้ง header ทีละตัว
  response.write('ก้อนที่ 1\\n');                      // ส่ง body ทีละก้อน
  response.write('ก้อนที่ 2\\n');
  response.end('จบ');                                 // บอกว่าส่งครบแล้ว
};

http.createServer(listener).listen(3000);
`;

// ---------- exercise skeletons ----------

const skeleton = (todo, prelude = '') => `import * as http from 'node:http';

const listener = function (request, response) {
${prelude}  // ${todo}
};

const server = http.createServer(listener);
server.listen(3000);
`;

const SOLUTION_HEAD = `import * as http from 'node:http';

const listener = function (request, response) {
`;
const SOLUTION_TAIL = `};

const server = http.createServer(listener);
server.listen(3000);
`;
const solution = (body) => SOLUTION_HEAD + body + SOLUTION_TAIL;

const URL_LINE = "  const urlObj = new URL(request.url, `http://${request.headers.host}`);\n";

const text = (path, want, extra = {}) => ({ request: { path }, expect: { status: 200, text: want, ...extra } });

export const experiments = {
  httpServer: {
    type: 'experiment', id: 'e-http-server', title: 'สร้าง HTTP Server และดู request ที่เข้ามา',
    source: `${SRC} §06 สร้าง HTTP Server`,
    body: `<p>กด <b>Run</b> แล้วส่ง request หลายแบบ (เปลี่ยน method เป็น PUT และ path เป็น <code>/user/5</code> พร้อม body <code>{"name": "John Doe", "role": "Admin"}</code> เหมือนตัวอย่าง <code>curl -i -X PUT …</code> ในสไลด์) สังเกตข้อความตอบกลับ และบรรทัด <code>Request received:</code> ใน Output ที่มาจาก listener ตัวที่สอง (<code>server.on('request')</code>)</p>`,
    files: { 'http-server.js': HTTP_SERVER },
  },

  eventLoop: {
    type: 'experiment', id: 'e-event-loop', title: 'Event Queue → Event Loop → Work Threads',
    source: `${SRC} §02 Node.js Architecture (ภาพประกอบตามลำดับการทำงานในสไลด์)`, widget: 'event-loop',
    body: '<p>ส่ง request แบบ non-blocking และ blocking หลายตัว แล้วกด "ขั้นถัดไป" ดูว่า Event Loop ประมวลผลทีละตัว และงาน blocking ถูกส่งไป Work Threads ก่อนที่ callback จะกลับมา</p>',
  },

  esmCjs: {
    type: 'experiment', id: 'e-esm-cjs', title: 'ESM กับ CJS: เขียน server เดียวกันได้ทั้งสองแบบ',
    source: `${SRC} §04 (ควรใช้อันไหน)`,
    body: `<p>Run เวอร์ชัน ESM ก่อน แล้วแก้บรรทัดแรกเป็น <code>const http = require('node:http');</code> (แบบ CJS) แล้ว Run อีกครั้ง ผลที่ได้เหมือนกัน แต่โปรเจกต์ใหม่ให้ใช้ ESM</p>`,
    files: { 'server.js': ESM_SERVER },
  },

  responseApi: {
    type: 'experiment', id: 'e-response-api', title: 'setHeader, write, end ของ ServerResponse',
    source: `${SRC} §05 http.ServerResponse`,
    body: '<p>ดูว่า <code>setHeader</code> ตั้ง header ทีละตัว, <code>write</code> ส่ง body ทีละก้อน และ <code>end</code> ปิด response แล้วลองเพิ่ม <code>write</code> อีกก้อน</p>',
    files: { 'response-api.js': RESPONSE_API },
  },

  query: {
    type: 'experiment', id: 'e-query', title: 'อ่าน query string ด้วย URL และ searchParams',
    source: `${SRC} §08 อ่านค่าจาก URL (Query parameters)`,
    body: `<p>ส่ง request ไปที่ <code>/user?name=Somchai&amp;fav_subj=Back-end Dev&amp;fav_subj=Front-end Dec</code> แล้วดูความต่างระหว่าง <code>get('name')</code> (ค่าเดียว) กับ <code>getAll('fav_subj')</code> (array)</p>`,
    files: { 'http-server.js': QUERY_SERVER },
  },

  pathSegments: {
    type: 'experiment', id: 'e-path-segments', title: 'แยก path segments ด้วย split และ filter(Boolean)',
    source: `${SRC} §08 อ่านค่าจาก URL (Path segments)`,
    body: `<p>ส่ง <code>/users/123</code> แล้วลองลบ <code>.filter(Boolean)</code> ออก Run ใหม่ แล้วดูว่ามี segment ว่างโผล่ขึ้นมาเป็นตัวแรก</p>`,
    files: { 'http-server-path.js': PATH_SERVER },
  },
};

export const exercises = {
  echo: {
    type: 'exercise', id: 'x-echo', title: 'โจทย์ 1: ตอบว่า "You made a … request to …"',
    source: `${SRC} §06 สร้าง HTTP Server`,
    body: '<p>ตอบ status 200 พร้อม <code>Content-Type: text/plain</code> และข้อความ <code>You made a &lt;method&gt; request to &lt;url&gt;</code> (ใช้ค่าจาก <code>request</code>)</p>',
    hint: 'ใช้ <code>response.writeHead(200, {...})</code> แล้ว <code>response.end(...)</code> กับ template literal',
    files: { 'server.js': skeleton('ตอบ text/plain และข้อความ "You made a <method> request to <url>"', "  const { url, method } = request;\n") },
    solution: solution("  const { url, method } = request;\n  response.writeHead(200, { 'Content-Type': 'text/plain' });\n  response.end(`You made a ${method} request to ${url}`);\n"),
    tests: [
      { name: 'GET /hello', steps: [text('/hello', 'You made a GET request to /hello', { headers: { 'Content-Type': 'text/plain' } })] },
      { name: 'POST /x', steps: [{ request: { method: 'POST', path: '/x' }, expect: { status: 200, text: 'You made a POST request to /x' } }] },
    ],
  },

  writeEnd: {
    type: 'exercise', id: 'x-write-end', title: 'โจทย์ 2: setHeader + write + end',
    source: `${SRC} §05 http.ServerResponse`,
    body: '<p>ตั้ง <code>Content-Type: text/plain</code> ด้วย <code>setHeader</code> ส่ง <code>Hello </code> ด้วย <code>write</code> แล้วปิดด้วย <code>end(\'World\')</code></p>',
    hint: 'เรียก <code>response.setHeader(name, value)</code> → <code>response.write(chunk)</code> → <code>response.end(data)</code> ตามลำดับ',
    files: { 'server.js': skeleton('setHeader → write("Hello ") → end("World")') },
    solution: solution("  response.setHeader('Content-Type', 'text/plain');\n  response.write('Hello ');\n  response.end('World');\n"),
    codeChecks: [
      { name: 'ใช้ response.setHeader(...)', pattern: 'setHeader\\(' },
      { name: 'ใช้ response.write(...)', pattern: 'response\\.write\\(' },
    ],
    tests: [{ name: 'GET / → "Hello World" (text/plain)', steps: [text('/', 'Hello World', { headers: { 'Content-Type': 'text/plain' } })] }],
  },

  queryName: {
    type: 'exercise', id: 'x-query-name', title: 'โจทย์ 3: อ่านค่า name จาก query string',
    source: `${SRC} §08 อ่านค่าจาก URL (Query parameters)`,
    body: '<p>อ่าน query parameter ชื่อ <code>name</code> ด้วย <code>URL</code> + <code>searchParams.get</code> แล้วตอบ <code>Name = &lt;name&gt;</code> เช่น <code>/user?name=Somchai</code> → <code>Name = Somchai</code></p>',
    hint: '<code>new URL(request.url, `http://${request.headers.host}`)</code> แล้วอ่าน <code>.searchParams.get(\'name\')</code>',
    files: { 'server.js': skeleton('อ่าน name จาก query string แล้วตอบ "Name = <name>"', "  response.writeHead(200, { 'Content-Type': 'text/plain' });\n") },
    solution: solution("  response.writeHead(200, { 'Content-Type': 'text/plain' });\n" + URL_LINE + "  const name = urlObj.searchParams.get('name');\n  response.end(`Name = ${name}`);\n"),
    codeChecks: [{ name: 'ใช้ searchParams', pattern: 'searchParams' }],
    tests: [
      { name: '/user?name=Somchai', steps: [text('/user?name=Somchai', 'Name = Somchai')] },
      { name: '/user?name=Anong', steps: [text('/user?name=Anong', 'Name = Anong')] },
    ],
  },

  queryAll: {
    type: 'exercise', id: 'x-query-all', title: 'โจทย์ 4: อ่านหลายค่าด้วย getAll',
    source: `${SRC} §08 อ่านค่าจาก URL (Query parameters)`,
    body: '<p>อ่านทุกค่าของ <code>fav_subj</code> ด้วย <code>getAll</code> แล้วตอบบรรทัดเดียวด้วย template literal: <code>Favorite Subjects: &lt;array&gt;</code> เช่น <code>Favorite Subjects: Back-end Dev,Front-end Dec</code></p>',
    hint: 'array ที่ใส่ใน template literal จะถูกต่อด้วยเครื่องหมาย <code>,</code> โดยอัตโนมัติ',
    files: { 'server.js': skeleton('อ่านทุกค่าของ fav_subj แล้วตอบ "Favorite Subjects: <array>"', "  response.writeHead(200, { 'Content-Type': 'text/plain' });\n") },
    solution: solution("  response.writeHead(200, { 'Content-Type': 'text/plain' });\n" + URL_LINE + "  const subjects = urlObj.searchParams.getAll('fav_subj');\n  response.end(`Favorite Subjects: ${subjects}`);\n"),
    codeChecks: [{ name: 'ใช้ getAll', pattern: 'getAll\\(' }],
    tests: [
      { name: 'สองค่า', steps: [text('/user?fav_subj=Back-end%20Dev&fav_subj=Front-end%20Dec', 'Favorite Subjects: Back-end Dev,Front-end Dec')] },
      { name: 'ค่าเดียว', steps: [text('/user?fav_subj=Web', 'Favorite Subjects: Web')] },
    ],
  },

  pathSegments: {
    type: 'exercise', id: 'x-path-segments', title: 'โจทย์ 5: แสดง path segments ทีละบรรทัด',
    source: `${SRC} §08 อ่านค่าจาก URL (Path segments)`,
    body: '<p>แยก <code>pathname</code> เป็น segment (ตัด segment ว่างทิ้ง) แล้วเขียนทีละบรรทัดในรูป <code>&lt;ลำดับเริ่มที่ 1&gt;, &lt;segment&gt;</code> เช่น <code>/users/123</code> → <code>1, users</code> และ <code>2, 123</code></p>',
    hint: '<code>pathname.split(\'/\').filter(Boolean)</code> แล้ววน <code>forEach((segment, index) => …)</code> ใช้ <code>response.write</code> ทีละบรรทัด',
    files: { 'server.js': skeleton('เขียน "<ลำดับ>, <segment>" ทีละบรรทัด แล้วจบด้วย response.end()', "  response.writeHead(200, { 'Content-Type': 'text/plain' });\n") },
    solution: solution("  response.writeHead(200, { 'Content-Type': 'text/plain' });\n" + URL_LINE + "  const pathSegments = urlObj.pathname.split('/').filter(Boolean);\n  pathSegments.forEach(function (pathSegment, index) {\n    response.write((index + 1) + ', ' + pathSegment + '\\n');\n  });\n  response.end();\n"),
    tests: [
      { name: '/users/123 → segment 1', steps: [{ request: { path: '/users/123' }, expect: { status: 200, textIncludes: '1, users' } }] },
      { name: '/users/123 → segment 2', steps: [{ request: { path: '/users/123' }, expect: { status: 200, textIncludes: '2, 123' } }] },
      { name: '/users/123 → มีแค่ 2 segment', steps: [{ request: { path: '/users/123' }, expect: { status: 200, textExcludes: '3, ' } }] },
      { name: '/a/b/c → segment 3', steps: [{ request: { path: '/a/b/c' }, expect: { status: 200, textIncludes: '3, c' } }] },
    ],
  },

  pathVar: {
    type: 'exercise', id: 'x-path-var', title: 'โจทย์ 6: ดึง path variable จาก /users/{id}',
    source: `${SRC} §อภิธานศัพท์ (Path variable), §08`,
    body: '<p>path มีรูปแบบ <code>/users/{id}</code> — ดึง <code>id</code> ออกจาก <code>pathname</code> ด้วย <code>split</code> แล้วตอบ <code>User id = &lt;id&gt;</code></p>',
    hint: 'segment ที่สองของ <code>pathname.split(\'/\').filter(Boolean)</code> คือ id',
    files: { 'server.js': skeleton('ดึง id จาก /users/{id} แล้วตอบ "User id = <id>"', "  response.writeHead(200, { 'Content-Type': 'text/plain' });\n") },
    solution: solution("  response.writeHead(200, { 'Content-Type': 'text/plain' });\n" + URL_LINE + "  const [, id] = urlObj.pathname.split('/').filter(Boolean);\n  response.end(`User id = ${id}`);\n"),
    codeChecks: [{ name: 'ใช้ split', pattern: 'split\\(' }],
    tests: [
      { name: '/users/123', steps: [text('/users/123', 'User id = 123')] },
      { name: '/users/45', steps: [text('/users/45', 'User id = 45')] },
    ],
  },

  multiplication: {
    type: 'exercise', id: 'x-multiplication', title: 'โจทย์ 7: สูตรคูณจาก ?number=',
    source: `${SRC} §09 แบบฝึกหัด — Multiplication table`,
    body: '<p>รับ request parameter <code>number</code> แล้วคืนสูตรคูณของเลขนั้น: หัวเรื่อง <code>Multiplication number for 8</code> ตามด้วยบรรทัด <code>8 x 1 = 8</code> ไปจนถึง <code>8 x 12 = 96</code> (ทดสอบด้วย <code>/user?number=8</code>)</p>',
    hint: 'แปลงค่าที่อ่านได้ด้วย <code>Number(...)</code> แล้ววน <code>for</code> 1 ถึง 12 เขียนทีละบรรทัดด้วย <code>response.write</code>',
    files: { 'server.js': skeleton('หัวเรื่อง "Multiplication number for <n>" แล้ว "<n> x <i> = <n*i>" ตั้งแต่ i = 1 ถึง 12', "  response.writeHead(200, { 'Content-Type': 'text/plain' });\n") },
    solution: solution("  response.writeHead(200, { 'Content-Type': 'text/plain' });\n" + URL_LINE + "  const number = Number(urlObj.searchParams.get('number'));\n  response.write(`Multiplication number for ${number}\\n`);\n  for (let i = 1; i <= 12; i++) {\n    response.write(`${number} x ${i} = ${number * i}\\n`);\n  }\n  response.end();\n"),
    tests: [
      { name: 'หัวเรื่อง (แม่ 8)', steps: [{ request: { path: '/user?number=8' }, expect: { status: 200, textIncludes: 'Multiplication number for 8' } }] },
      { name: '8 x 1 = 8', steps: [{ request: { path: '/user?number=8' }, expect: { status: 200, textIncludes: '8 x 1 = 8' } }] },
      { name: '8 x 12 = 96', steps: [{ request: { path: '/user?number=8' }, expect: { status: 200, textIncludes: '8 x 12 = 96' } }] },
      { name: 'แม่ 5: 5 x 7 = 35 และไม่มีแถว 13', steps: [
        { request: { path: '/user?number=5' }, expect: { status: 200, textIncludes: '5 x 7 = 35' } },
        { request: { path: '/user?number=5' }, expect: { status: 200, textExcludes: '5 x 13' } },
      ] },
    ],
  },

  esm: {
    type: 'exercise', id: 'x-esm', title: 'โจทย์ 8: แปลง server จาก CJS เป็น ESM',
    source: `${SRC} §04 (ควรใช้อันไหน, CJS vs ESM)`,
    body: '<p>ไฟล์นี้เขียนแบบ CommonJS (<code>require</code>) — แก้ให้เป็น ES Modules (<code>import</code>) โดยที่ server ยังตอบ <code>Hello ESM</code> เหมือนเดิม</p>',
    hint: '<code>import * as http from \'node:http\';</code> แทน <code>const http = require(\'node:http\');</code>',
    files: { 'server.js': "const http = require('node:http');\n\nconst listener = function (request, response) {\n  response.writeHead(200, { 'Content-Type': 'text/plain' });\n  response.end('Hello ESM');\n};\n\nconst server = http.createServer(listener);\nserver.listen(3000);\n" },
    solution: "import * as http from 'node:http';\n\nconst listener = function (request, response) {\n  response.writeHead(200, { 'Content-Type': 'text/plain' });\n  response.end('Hello ESM');\n};\n\nconst server = http.createServer(listener);\nserver.listen(3000);\n",
    codeChecks: [
      { name: 'ใช้ import', pattern: 'import\\s' },
      { name: 'ไม่ใช้ require()', pattern: 'require\\(', mustMatch: false },
    ],
    tests: [{ name: 'GET / → Hello ESM', steps: [text('/', 'Hello ESM')] }],
  },
};
