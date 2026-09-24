import { flow, sequence, stack } from '../js/diagrams.js';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const code = (s) => `<pre><code>${esc(s)}</code></pre>`;
const SRC = 'week5/05-INT161-Express-Framework.pdf';

const DG = {
  what: stack({
    title: 'Express อยู่บน HTTP server ของ Node.js', layerW: 320,
    layers: [
      { label: 'แอปของเรา', sub: 'routes · handlers · services', tone: 'concept' },
      { label: 'Express', sub: 'Routing + Middleware (unopinionated)', tone: 'experiment' },
      { label: 'Node.js  http module', sub: 'createServer · req · res' },
    ],
    between: [{ down: 'app.get / app.use', up: 'res.json()' }, { down: 'req / res', up: 'response' }],
  }),
  layers: stack({
    title: 'Layered System ใน Express', layerW: 340, gap: 48,
    layers: [
      { label: 'Front-End', sub: 'ส่ง/รับ {JSON}' },
      { label: 'Express Router  (Controller)', sub: 'รับ HTTP · ส่งต่อ · ตอบ — เคาน์เตอร์ต้อนรับ', tone: 'concept' },
      { label: 'Service Layer', sub: 'Business logic — หมอที่ตรวจและตัดสินใจ', tone: 'experiment' },
      { label: 'Repository  (Data Access)', sub: 'CRUD — ห้องเวชระเบียน', tone: 'exercise' },
      { label: 'Database' },
    ],
    between: [{ down: 'request', up: 'JSON' }, { down: 'เรียก', up: 'ผลลัพธ์' }, { down: 'เรียก', up: 'ข้อมูล' }, { down: 'SQL', up: 'rows' }],
  }),
  middleware: flow({
    title: 'Middleware ทำงานก่อนถึง router', nodeW: 128, gapX: 40,
    nodes: [
      { id: 'rq', label: 'Request', col: 0, row: 0 },
      { id: 'm1', label: 'Middleware', sub: 'เช่น logger', col: 1, row: 0, tone: 'concept' },
      { id: 'm2', label: 'express.json()', sub: 'built-in', col: 2, row: 0, tone: 'concept' },
      { id: 'rt', label: 'Router', sub: 'app.use(path, router)', col: 3, row: 0, tone: 'experiment' },
      { id: 'rs', label: 'Response', sub: 'res.json()', col: 3, row: 1, tone: 'exercise' },
    ],
    edges: [
      { from: 'rq', to: 'm1' }, { from: 'm1', to: 'm2', label: 'next()' }, { from: 'm2', to: 'rt', label: 'next()' },
      { from: 'rt', to: 'rs' },
    ],
  }),
};

export const concepts = {
  expressWhat: {
    type: 'concept', id: 'c-express-what', diagram: DG.what, diagramCaption: 'Express เป็นชั้น routing + middleware บน http module', title: 'Express.js คืออะไร และต่างจาก http เพียว ๆ อย่างไร',
    source: `${SRC} §Unit Objectives, §What is Express JS?, §Key Concepts, §Raw Node.js HTTP vs. Express.js`,
    body: `<p><b>เมื่อจบบทนี้ควรทำได้:</b> สร้างโปรเจกต์ Node.js ด้วย Express · อธิบายแนวคิดพื้นฐานของ Express · อธิบาย layer system ของ RESTful API · สร้าง CRUD REST API ตาม layer system ได้</p>
      <p>ภาพรวม: Web Application → HTTP Request → <b>Node.js / Bun</b> → Database Server แล้วส่ง HTTP Response กลับ</p>
      <ul><li>Express คือ <b>minimalist, unopinionated, fast web framework</b> สำหรับ Node.js</li>
      <li>เป็นชั้นของ <b>routing</b> และ <b>middleware</b> ครอบอยู่บน HTTP server ที่ Node มีให้ · จัดการ request แบบ GET, PUT, POST, DELETE ได้ง่าย</li>
      <li>เป็นส่วน backend ของ MEAN/MERN stack (MongoDB, Express.js, Angular.js/React.js, Node.js)</li></ul>
      <p><b>Key concepts:</b></p>
      <ul><li><b>Routing</b> — API ตรงไปตรงมาสำหรับรับ request ตาม URL/path และ method</li>
      <li><b>Middleware</b> — ฟังก์ชันที่เข้าถึง <code>req</code>, <code>res</code> และ <code>next</code> ใช้ทำ parse JSON body (<code>express.json()</code>), authentication/authorization, logging และ error handling, เปิด CORS</li>
      <li><b>Unopinionated</b> — อิสระเต็มที่ในการจัดโครงสร้างแอปและเลือก stack</li></ul>
      <table><tr><th>http.createServer (เขียนเอง)</th><th>Express</th></tr>
      <tr><td>อ่าน body ทีละ chunk จาก stream เอง</td><td>Automated body parsers</td></tr>
      <tr><td>แกะ URL และ query string เอง</td><td>Pattern-matched routes</td></tr>
      <tr><td><code>res.writeHead</code> + <code>res.end</code></td><td>Clean <code>res.json</code> / <code>res.send</code></td></tr></table>`,
  },

  installProject: {
    type: 'concept', id: 'c-install-project', title: 'ติดตั้ง Express และโครงโปรเจกต์ (ESM template)',
    source: `${SRC} §Installation & Using Express, §WebStorm Project Template - ESM`,
    body: `<ol><li>สร้างโปรเจกต์</li>
      <li>ติดตั้ง: <code>npm install express</code> — สร้างโฟลเดอร์ใน <code>node_modules</code> และติดตั้งเวอร์ชัน stable ล่าสุด</li>
      <li>ระบุเวอร์ชันได้ด้วย <code>@version</code> ต่อท้ายชื่อแพ็กเกจ</li>
      <li>import: <code>import express from 'express';</code></li></ol>
      <p><b>WebStorm Project Template (ESM):</b> สร้างโปรเจกต์ → ติดตั้ง module → เติม <code>"type": "module"</code> ใน <code>package.json</code> → สร้างโฟลเดอร์ <code>src/</code> ที่มี <code>configs</code>, <code>repositories</code>, <code>services</code>, <code>routes</code> → สร้างไฟล์ config และ app.js/router/service/repository → Tools → Save project as template (<code>Express-ESM</code>)</p>
      ${code('{\n    "name": "basic-rest-express",\n    "version": "1.0.0",\n    "description": "",\n    "main": "src/app.js",\n    "type": "module"\n}')}
      <p class="muted">simulator รันโค้ดที่ import จาก <code>express</code> ได้เลย ไม่ต้อง <code>npm install</code></p>`,
  },

  reqRes: {
    type: 'concept', id: 'c-req-res', title: 'req.params, req.query, req.body และ res.json / res.status',
    source: `${SRC} §Express request parser, §Handling Responses`,
    body: `<p>Request object เข้าถึงส่วนประกอบของ HTTP request:</p>
      <ul><li><code>req.params</code> — พารามิเตอร์ใน path: <code>app.put('/api/subjects/:id', …)</code> → <code>const id = req.params.id;</code></li>
      <li><code>req.query</code> — พารามิเตอร์จาก query string: <code>const {filter, page, size} = req.query;</code></li>
      <li><code>req.body</code> — body ที่ parse แล้ว (ต้องใช้ middleware): <code>const {code, title, credit} = req.body;</code></li></ul>
      <p>Response:</p>
      <ul><li><code>res.json()</code> — แปลง object/ค่าเป็น JSON string ตอบกลับ (status 200)</li>
      <li><code>res.status()</code> — ตั้ง HTTP status code <b>แต่ยังไม่ส่ง response</b> มันคืน <code>res</code> กลับมาให้ต่อกับ <code>.send()</code>, <code>.json()</code> หรือ <code>.render()</code></li></ul>
      ${code('res.status(201).json(subject);')}`,
  },

  layersExpress: {
    type: 'concept', id: 'c-layers-express', diagram: DG.layers, diagramCaption: 'Controller / Service / Repository (อุปมาโรงพยาบาล)', title: 'Layered System กับ Express: Controller / Service / Repository',
    source: `${SRC} §Layered System, §Layer System Functions (1/2), (2/2)`,
    body: `<p>Front-End ⇄ <b>{JSON}</b> ⇄ Express App → <b>Express Router</b> (Presentation/Controller) → <b>Service Layer</b> (Business Logic) → <b>Data Access Layer</b> (Repository)</p>
      ${code("import express from \"express\";\n\nconst PORT = 3000;\n\nconst app = express();\n\napp.use(express.json());\n\napp.use('/customers', customerRoute)\napp.use('/orders', orderRouter);\napp.use('/products', productRouter);\napp.use('/account', accountRouter);\n\napp.listen(PORT, () => {\n    console.log(\n        `Running at http://localhost:${PORT}`)\n});")}
      <table><tr><th>ชั้น</th><th>หน้าที่</th><th>ควรมี</th><th>ไม่ควรมี</th></tr>
      <tr><td>Controller</td><td>จัดการ HTTP request/response</td><td>Routing, mapping, validation</td><td>Business logic, DB code</td></tr>
      <tr><td>Service</td><td>Business rules และประสานงานกระบวนการ</td><td>Business logic, calculations</td><td>HTTP หรือ DB details</td></tr>
      <tr><td>Repository</td><td>Data access (CRUD)</td><td>Queries, persistence</td><td>Business logic, HTTP</td></tr></table>
      <ul><li><b>Controller (API Layer)</b> — จุดเข้าของ HTTP request แปลง request เป็น object ที่ service ใช้ได้ ส่ง response (status + JSON) ไม่มี business logic แค่ส่งต่อ · <i>อุปมา: เคาน์เตอร์ต้อนรับของโรงพยาบาล</i></li>
      <li><b>Service Layer</b> — ตรรกะหลัก กฎ การ validate การคำนวณ ประสานงาน Controller กับ Repository เรียกได้หลาย repository หรือ API ภายนอก · <i>อุปมา: หมอที่ตรวจและตัดสินใจรักษา</i></li>
      <li><b>Repository Layer</b> — เก็บและดึงข้อมูล เป็นตัวกลางเหนือฐานข้อมูล (CRUD) ไม่มี business logic · <i>อุปมา: ห้องเวชระเบียน</i></li></ul>`,
  },

  routing: {
    type: 'concept', id: 'c-routing', title: 'Routing และ express.Router()',
    source: `${SRC} §Routing in Express, §Router example`,
    body: `<p>Routing กำหนดว่าแอปจัดการ request ที่มายัง URL และ HTTP method หนึ่ง ๆ อย่างไร รูปแบบ: <code>router.METHOD(PATH, HANDLER)</code> (METHOD คือ GET, POST, PUT, DELETE ฯลฯ)</p>
      ${code("router.get('/home', (req, res) => {\n      res.send('Welcome to the homepage!');\n});")}
      <ul><li>route pattern เป็น string หรือ regex ได้ · string ใส่พารามิเตอร์ได้ เช่น <code>router.get('/api/user/:id', (req, res) …</code></li></ul>
      ${code("import express from \"express\";\nimport * as service from \"../services/subject-service.js\";\nconst router = express.Router();\n\nrouter.get('/', async (req, res, next) => {\n    const subjects = await service.getAllSubjects();\n    res.json(subjects);\n});\nrouter.get('/:id', async (req, res, next) => {\n    const {id} = req.params;\n    const [subject] = await service.getSubjectById(id);\n    if (!subject[0])\n        return res.status(404).json({message: 'Subject not found'});\n    res.json(subject[0]);\n});\nrouter.post('/', async (req, res, next) => {\n    // call service\n});\nexport default router;")}`,
  },

  middleware: {
    type: 'concept', id: 'c-middleware', diagram: DG.middleware, diagramCaption: 'middleware ทำงานตามลำดับก่อนถึง router', title: 'Middleware ใน Express',
    source: `${SRC} §Middleware in Express`,
    body: `<ul><li>Middleware เป็นขั้นตอนตัวกลางที่ประมวลผล request <b>ก่อน</b>ถึง router — เช่น ตรวจ authentication ก่อนให้เข้า admin API</li>
      <li>ใช้ <code>next()</code> เพื่อส่งต่อการควบคุมไปยัง middleware ตัวถัดไป</li>
      <li>ประเภทที่พบบ่อย: <b>Application-level</b>, <b>Router-level</b>, <b>Error-handling</b>, <b>Built-in</b>, <b>Third-party</b></li></ul>
      ${code("import express from 'express';\nconst app = express();\n\napp.use(express.json()); //midleware\napp.use('/api/subjects', subjRouter);\n\napp.listen(3000);")}
      <p class="muted">Error-handling middleware จะอธิบายละเอียดในสัปดาห์ถัดไป (Error Handling)</p>`,
  },
};
