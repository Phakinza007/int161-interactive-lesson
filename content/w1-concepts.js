import { flow, sequence, stack } from '../js/diagrams.js';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const code = (s) => `<pre><code>${esc(s)}</code></pre>`;
const SRC = 'week1/W01-Introduction.md';

const DG = {
  http: sequence({
    title: 'วงจร HTTP request / response', gap: 360,
    actors: [{ id: 'c', label: 'Client\n(Browser)' }, { id: 's', label: 'Server' }],
    steps: [
      { from: 'c', to: 's', label: 'HTTP Request (Method · Headers · Body)' },
      { from: 's', to: 'c', label: 'HTTP Response (Status Line · Header · Payload)', dashed: true },
      { note: 'Browser แสดงผลข้อมูลที่ได้รับ', at: 'c' },
    ],
  }),
  fullstack: stack({
    title: 'Full Stack: client + server + database', layerW: 320,
    layers: [
      { label: 'Client-side', sub: 'HTML · CSS · JavaScript (jQuery / Angular / Vue)', tone: 'concept' },
      { label: 'Server-side', sub: 'Java · PHP · ASP · Python · Node.js', tone: 'experiment' },
      { label: 'Database', sub: 'SQL · SQLite · MongoDB', tone: 'exercise' },
    ],
    between: [{ down: 'HTTP Request', up: 'JSON / HTML' }, { down: 'query', up: 'ข้อมูล' }],
  }),
  translators: flow({
    title: 'Compilation vs Interpretation vs Hybrid', nodeW: 132, gapX: 44,
    nodes: [
      { id: 'c1', label: 'Source code', col: 0, row: 0 }, { id: 'c2', label: 'Compiler', sub: 'แปลทั้งโปรแกรม', col: 1, row: 0, tone: 'concept' },
      { id: 'c3', label: 'Binary', sub: 'machine code', col: 2, row: 0 }, { id: 'c4', label: 'รันตรง ๆ', sub: 'เร็ว', col: 3, row: 0 },
      { id: 'i1', label: 'Source code', col: 0, row: 1 }, { id: 'i2', label: 'Interpreter', sub: 'แปลทีละบรรทัด', col: 1, row: 1, tone: 'experiment' },
      { id: 'i3', label: 'ไม่มีไฟล์แปล', sub: 'ต้องแจก source', col: 2, row: 1 }, { id: 'i4', label: 'รันทีละบรรทัด', sub: 'debug ง่าย', col: 3, row: 1 },
      { id: 'h1', label: 'Source code', col: 0, row: 2 }, { id: 'h2', label: 'Compiler', sub: 'เป็น byte code', col: 1, row: 2, tone: 'exercise' },
      { id: 'h3', label: 'Byte code', col: 2, row: 2 }, { id: 'h4', label: 'VM / JIT', sub: 'interpreter + JIT', col: 3, row: 2 },
    ],
    edges: [
      { from: 'c1', to: 'c2' }, { from: 'c2', to: 'c3' }, { from: 'c3', to: 'c4' },
      { from: 'i1', to: 'i2' }, { from: 'i2', to: 'i3', dashed: true }, { from: 'i2', to: 'i4' },
      { from: 'h1', to: 'h2' }, { from: 'h2', to: 'h3' }, { from: 'h3', to: 'h4' },
    ],
  }),
  nodejs: flow({
    title: 'Node.js คือ runtime', nodeW: 140, gapX: 50,
    nodes: [
      { id: 'js', label: 'โค้ด JavaScript', col: 0, row: 0 }, { id: 'rt', label: 'Node.js (runtime)', sub: 'แปลงเป็น machine code', col: 1, row: 0, tone: 'concept' },
      { id: 'os', label: 'รันบน OS', sub: 'Windows · Linux · Mac', col: 2, row: 0 },
      { id: 'use', label: 'CLI · web app · REST API', sub: 'event เกิดเมื่อมี request', col: 1, row: 1, tone: 'exercise' },
    ],
    edges: [{ from: 'js', to: 'rt' }, { from: 'rt', to: 'os' }, { from: 'rt', to: 'use' }],
  }),
};

export const concepts = {
  agreements: {
    type: 'concept', id: 'c-agreements', title: 'ข้อตกลงในการเรียน (จาก transcript)',
    source: `${SRC} §ประกาศ/ข้อตกลงในการเรียน`,
    body: `<ul>
      <li>เรียนแบบผู้ใหญ่ระดับอุดมศึกษา ต่างคนต่างดูแลรับผิดชอบตัวเอง แต่ขอให้เคารพกฎเกณฑ์ในสังคม (เช่น ไม่ส่งเสียงดังรบกวนเพื่อน)</li>
      <li>คาบเรียนมีทั้งทฤษฎีและปฏิบัติสลับกัน — ถ้ามีปัญหาระหว่างทำแล็บให้ <b>ยกมือเรียกอาจารย์</b> ถ้าไม่เรียก อาจารย์จะไม่เข้าไปช่วย</li>
      <li>คำเตือนเรื่องเกรด: การได้เกรด F เกิดขึ้นได้จริงในวิชานี้ — "เอฟก็แค่เกรด" แต่ไม่ใช่คำขู่ลอย ๆ</li>
    </ul>`,
  },

  courseEval: {
    type: 'concept', id: 'c-course-eval', title: 'Course Description และการประเมินผล',
    source: `${SRC} §Course Description, §Evaluation`, widget: 'eval-bars',
    body: `<p>ความรู้เบื้องต้นเกี่ยวกับ RESTful API, การเชื่อมต่อฐานข้อมูล, API authentication และความปลอดภัย, การเรียงลำดับ/แบ่งหน้า/กรองข้อมูล</p>
      <p class="muted">PLO: 2C-I, 2D-E, 2F-E, 5BE-I, 5FS-I · สไลด์ระบุสัดส่วนเฉพาะ 2nd/3rd Exam รวม 100% ไม่มีสัดส่วนของ 1st Exam</p>`,
    data: [
      { label: '2nd Exam — Theory (choice/describe)', pct: 30 },
      { label: '2nd Exam — Practice (เขียนโปรแกรมแก้โจทย์)', pct: 20 },
      { label: '3rd Exam — Theory', pct: 30 },
      { label: '3rd Exam — Practice', pct: 20 },
    ],
  },

  schedule: {
    type: 'concept', id: 'c-schedule', title: 'ตารางเรียน Group B / Group 2 (พฤหัสบดี)',
    source: `${SRC} §ตารางเรียน`,
    body: `<table><tr><th>สัปดาห์</th><th>วันที่</th><th>หัวข้อ (ตามสไลด์ W1)</th></tr>
      <tr><td>1</td><td>6 Aug 2026</td><td>Introduction</td></tr>
      <tr><td>2</td><td>13 Aug 2026</td><td>Node.js vs Bun</td></tr>
      <tr><td>3</td><td>20 Aug 2026</td><td>RESTful API</td></tr>
      <tr><td>4</td><td>27 Aug 2026</td><td>Express framework</td></tr>
      <tr><td>5</td><td>3 Sep 2026</td><td>Connection to Database</td></tr>
      <tr><td>—</td><td>7–11 Sep 2026</td><td><b>1st Examination</b></td></tr>
      <tr><td>6</td><td>17 Sep 2026</td><td>Relationship Modeling/ORM</td></tr>
      <tr><td>7</td><td>24 Sep 2026</td><td>Prisma ORM</td></tr>
      <tr><td>8</td><td>1 Oct 2026</td><td>Validation &amp; Error Handling</td></tr>
      <tr><td>9</td><td>8 Oct 2026</td><td>Data Transfer Object (DTO)</td></tr>
      <tr><td>10</td><td>15 Oct 2026</td><td>Filtering, Sorting &amp; Pagination</td></tr>
      <tr><td>—</td><td>19–26 Oct 2026</td><td><b>2nd Examination</b></td></tr>
      <tr><td>11</td><td>5 Nov 2026</td><td>JWT: JSON Web Tokens</td></tr>
      <tr><td>12</td><td>12 Nov 2026</td><td>Authentication/Authorization</td></tr>
      <tr><td>13–14</td><td>19, 26 Nov 2026</td><td>Integrated Project Support Topic</td></tr>
      <tr><td>—</td><td>30 Nov–11 Dec 2026</td><td><b>3rd Examination</b></td></tr></table>
      <p class="muted">Group A เรียนวันศุกร์ หัวข้อเดียวกัน เลื่อนช้ากว่า Group B 1 วัน · ลำดับหัวข้อจริงในคาบอาจสลับจากตารางนี้ (บทเรียนนี้ W4 = Database, W5 = Express)</p>`,
  },

  http: {
    type: 'concept', id: 'c-http', diagram: DG.http, diagramCaption: 'HTTP Request ⇄ HTTP Response', title: 'HTTP Protocol: Request และ Response',
    source: `${SRC} §01 HTTP Protocol & Web Application พื้นฐาน`, widget: 'http-parts',
    body: `<ul>
      <li>HTTP = <b>HyperText Transfer Protocol</b> — การสื่อสารระหว่าง client (browser) กับ server ผ่าน <b>HTTP Request</b> และ <b>HTTP Response</b></li>
      <li>HTTP Request มี 3 ส่วนที่เก็บ/ส่งข้อมูลได้: <b>Headers, Methods, Body</b></li>
      <li>HTTP Response มี 3 ส่วนหลัก: <b>Status Line, Header, Message Body (Payload)</b></li></ul>`,
  },

  architecture: {
    type: 'concept', id: 'c-architecture', title: 'Web Application Architecture: MPA, MVC modern, SPA',
    source: `${SRC} §Web Application Architecture`, widget: 'arch-tabs',
    body: '<p>เลือกแต่ละแบบเพื่อดูเส้นทางของข้อมูลระหว่าง client กับ server</p>',
    data: [
      { name: 'MPA', note: 'Multi-Page Application: สถาปัตยกรรมดั้งเดิม แต่ละหน้าโหลดใหม่ทั้งหน้าจาก server',
        chain: ['Client', 'url mapping / router', 'controller', 'view (template engine)', 'data access engine', 'database'] },
      { name: 'MVC modern', note: 'client ใช้ XMLHttpRequest คุยกับ server ผ่าน router → controller → model → data access engine',
        chain: ['Client (XMLHttpRequest)', 'router', 'controller', 'model', 'data access engine', 'database'] },
      { name: 'SPA', note: 'Single Page Application: client โหลด HTML/CSS/JS ครั้งแรก จากนั้นคุยกับ back-end ผ่าน RESTful API/Microservice ด้วย AJAX แลกข้อมูลเป็น JSON',
        chain: ['Client (โหลด HTML/CSS/JS ครั้งแรก)', 'AJAX แลก JSON', 'Back-end: RESTful API / Microservice'] },
    ],
  },

  json: {
    type: 'concept', id: 'c-json', title: 'JSON (JavaScript Object Notation)',
    source: `${SRC} §JSON`,
    body: `<ul><li>รูปแบบข้อมูลน้ำหนักเบา อ่าน/เขียนง่ายทั้งคนและเครื่อง</li>
      <li>มาจากส่วนหนึ่งของ JavaScript (ECMA-262 3rd Edition, ธ.ค. 1999) แต่เป็น <b>text format</b> ที่ independent จากภาษาใด ๆ</li></ul>
      ${code('{ "name": "John Doe" }')}`,
  },

  fullstack: {
    type: 'concept', id: 'c-fullstack', diagram: DG.fullstack, diagramCaption: 'Full Stack = client + server + database', title: 'Full Stack Developer และ Web Development Roadmap',
    source: `${SRC} §Full Stack Developer, §Web Development Roadmap`,
    body: `<p>Full Stack Developer คือคนที่พัฒนาได้ทั้ง <b>client-side</b> (เช่น JavaScript/jQuery/Angular/Vue), <b>server-side</b> (เช่น Java/PHP/ASP/Python/Node.js) และ <b>database</b> (SQL/SQLite/MongoDB)</p>
      <table><tr><th>ด้าน</th><th>สิ่งที่ต้องรู้</th></tr>
      <tr><td>Front-End</td><td>HTML, CSS, JavaScript, Responsive Design, CSS framework (Bootstrap/Material/Tailwind), JS framework (React/Angular/Vue)</td></tr>
      <tr><td>Back-End</td><td>SQL/NoSQL, ภาษา (Java/PHP/C#/Python/Node.js), Framework (Spring Boot/Laravel/.NET/Django/Express+Prisma), Web Service, Microservice</td></tr></table>`,
  },

  webservice: {
    type: 'concept', id: 'c-webservice', title: 'Web Services: SOAP vs RESTful',
    source: `${SRC} §Web Services: SOAP vs RESTful`,
    body: `<table><tr><th></th><th>SOAP</th><th>RESTful</th></tr>
      <tr><td>คืออะไร</td><td>Simple Object Access Protocol — มาตรฐาน XML format</td><td>design approach ไม่ใช่ protocol</td></tr>
      <tr><td>รายละเอียด</td><td>กำหนดด้วย WSDL</td><td>สร้างโดย Roy Thomas Fielding (ผู้สร้าง HTTP เดียวกัน) เน้นประสิทธิภาพของ web service โดยใช้หลักการที่มีอยู่แล้วใน HTTP</td></tr></table>`,
  },

  nodejs: {
    type: 'concept', id: 'c-nodejs', diagram: DG.nodejs, diagramCaption: 'Node.js แปลง JavaScript แล้วรันฝั่ง server', title: 'Node.js คืออะไร และทำไมต้องเรียน',
    source: `${SRC} §02 Node.js คืออะไร, §ทำไมต้องเรียน Node.js`,
    body: `<ul><li>Node.js <b>ไม่ใช่ภาษาโปรแกรม</b> แต่เป็น <b>runtime</b> ที่แปลง JavaScript เป็น machine code — open source, ฟรี, รันได้หลายแพลตฟอร์ม, ใช้ JavaScript ฝั่ง server</li></ul>
      <p><b>ทำไมต้องเรียน:</b></p>
      <ul><li>ใช้ JavaScript ภาษาเดียวได้ทั้ง front-end และ back-end</li>
      <li>รองรับ asynchronous execution แบบ single thread ด้วย async/await — เร็วกว่าแบบ multi-threaded ในหลายกรณี</li>
      <li>สร้างได้ทั้ง command line app, web app, real-time chat, REST API</li></ul>`,
  },

  translators: {
    type: 'concept', id: 'c-translators', diagram: DG.translators, diagramCaption: 'เทียบสามวิธีแปลโปรแกรมแล้วรัน', title: 'Compilation vs Interpretation vs Hybrid',
    source: `${SRC} §Compiler vs Interpreter vs Hybrid`,
    body: `<table><tr><th>แบบ</th><th>วิธีทำงาน</th><th>ตัวอย่างภาษา</th></tr>
      <tr><td>Compilation</td><td>แปลทั้งโปรแกรมเป็น binary ล่วงหน้า ก่อนรัน — เร็วตอนรัน แต่ portability ต่ำ, source code เป็นความลับ</td><td>C, C++, Go</td></tr>
      <tr><td>Interpretation</td><td>แปลทีละบรรทัดตอนรันจริง — dev เร็ว debug ง่าย แต่ช้ากว่า, ต้องแจก source code</td><td>(สไลด์ยกตัวอย่าง Python-style)</td></tr>
      <tr><td>Hybrid (byte code + VM/JIT)</td><td>compile เป็น byte code ก่อน แล้วรันผ่าน VM/Runtime (interpreter+JIT)</td><td>Java, Kotlin, Groovy, C# (.NET)</td></tr></table>`,
  },

  installFile: {
    type: 'concept', id: 'c-install-file', title: 'ติดตั้ง Node.js (nvm) และไฟล์ Node.js',
    source: `${SRC} §ติดตั้ง Node.js, §ไฟล์ Node.js คืออะไร`,
    body: `<p>ติดตั้งผ่าน nvm:</p>
      ${code('curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash\n\\. "$HOME/.nvm/nvm.sh"\nnvm install 22\nnode -v      # v22.14.0\nnpm -v       # 10.9.2')}
      <p>ไฟล์ Node.js คือไฟล์ <code>.js</code> (หรือ <code>.ts</code> สำหรับ TypeScript) ที่รันด้วยคำสั่ง <code>node</code> บน server ทำงานเมื่อมี event เกิดขึ้น (เช่น web request)</p>
      ${code("// myfirst.js — ตัวอย่าง interactive script\nconst readline = require('node:readline/promises');\nconst { stdin: input, stdout: output } = require('node:process');\n\nasync function askQuestion() {\n  const rl = readline.createInterface({ input, output });\n  try {\n    const name = await rl.question('What is your name? ');\n    const birthyear = await rl.question('What is your birth year in B.E.? ');\n    const age = new Date().getFullYear() - birthyear + 543;\n    console.log(`Thank you ${name}, aged ${age}!`);\n  } finally {\n    rl.close();\n  }\n}\naskQuestion();")}
      <p class="muted">สคริปต์นี้รับค่าจากคีย์บอร์ด (readline) ซึ่ง simulator ไม่รองรับ — ให้รันบนเครื่องตัวเองด้วย <code>node myfirst.js</code></p>`,
  },

  backendSummary: {
    type: 'concept', id: 'c-backend-summary', title: 'แนวคิด Backend เบื้องต้น และสรุปท้ายบท',
    source: `${SRC} §แนวคิด Backend เบื้องต้น (จาก transcript), §ตารางสรุปท้ายบท`,
    body: `<ul><li>Backend ต้อง provide การจัดการข้อมูล (data) ที่มักเก็บอยู่ใน database ให้ front-end ไปแสดงผลบน DOM ในเบราว์เซอร์ <i>(จาก transcript)</i></li>
      <li>การเขียน backend แบบสมัยใหม่ = การเขียน <b>RESTful API</b> <i>(จาก transcript)</i></li>
      <li>การจัดการข้อมูลมี 4 อย่างหลัก — อาจารย์เริ่มอธิบายด้วยตัวอักษร "C..." (น่าจะหมายถึง CRUD แต่ transcript ตัดก่อนอธิบายจบ จึงยังไม่ยืนยัน)</li></ul>
      <table><tr><th>หัวข้อ</th><th>ประเด็นสำคัญ</th></tr>
      <tr><td>HTTP</td><td>Request (Header/Method/Body) ↔ Response (Status/Header/Body)</td></tr>
      <tr><td>Web Architecture</td><td>MPA vs MVC (modern) vs SPA</td></tr>
      <tr><td>JSON</td><td>data format เบา อ่านง่าย มาจาก JS subset</td></tr>
      <tr><td>Full Stack</td><td>client + server + database</td></tr>
      <tr><td>Web Service</td><td>SOAP (XML/WSDL) vs RESTful (ใช้หลัก HTTP)</td></tr>
      <tr><td>Node.js</td><td>runtime แปลง JS → machine code, ไม่ใช่ภาษา</td></tr>
      <tr><td>Translator</td><td>Compilation vs Interpretation vs Hybrid (VM/JIT)</td></tr>
      <tr><td>Hello World App</td><td>require → createServer → listen</td></tr>
      <tr><td>Backend core</td><td>provide data management (CRUD) ผ่าน RESTful API</td></tr></table>`,
  },
};
