import { flow, sequence, stack } from '../js/diagrams.js';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const code = (s) => `<pre><code>${esc(s)}</code></pre>`;
const SRC = 'week2/W02-http-programming-basics.md';

const DG = {
  cycle: sequence({
    title: 'วงจร request / response ของ Web Application', gap: 340,
    actors: [{ id: 'b', label: 'Browser' }, { id: 's', label: 'Web Server\n(Node.js)' }],
    steps: [
      { from: 'b', to: 's', label: 'GET /path HTTP/1.1  +  Host: host:port' },
      { note: 'แปลง URL เป็นไฟล์/โปรแกรม แล้วโปรแกรมของเราอ่าน request เป็น input', at: 's' },
      { from: 's', to: 'b', label: 'HTTP/1.1 200 OK  +  body', dashed: true },
      { note: 'จัดรูปแบบ response แล้วแสดงผล', at: 'b' },
    ],
  }),
  arch: flow({
    title: 'Node.js: Event Queue, Event Loop และ Work Threads', nodeW: 132, gapX: 44,
    nodes: [
      { id: 'cl', label: 'Client', sub: 'ส่ง request', col: 0, row: 0 },
      { id: 'q', label: 'Event Queue', sub: 'ต่อคิว', col: 1, row: 0, tone: 'concept' },
      { id: 'el', label: 'Event Loop', sub: 'ทีละตัว', col: 2, row: 0, tone: 'concept' },
      { id: 'rs', label: 'Response', sub: 'กลับไปหา client', col: 3, row: 0, tone: 'exercise' },
      { id: 'wt', label: 'Work Threads', sub: 'fs · network · process', col: 2, row: 1, tone: 'experiment' },
    ],
    edges: [
      { from: 'cl', to: 'q' }, { from: 'q', to: 'el' }, { from: 'el', to: 'rs', label: 'non-blocking' },
      { from: 'el', to: 'wt', label: 'blocking' }, { from: 'wt', to: 'el', label: 'callback', dashed: true },
    ],
  }),
  classes: flow({
    title: 'คลาสหลักของโมดูล http', nodeW: 150, gapX: 56,
    nodes: [
      { id: 'srv', label: 'http.Server', sub: 'listen · close', col: 0, row: 0, tone: 'concept' },
      { id: 'inc', label: 'IncomingMessage', sub: 'method · url · headers', col: 1, row: 0 },
      { id: 'res', label: 'ServerResponse', sub: 'writeHead · write · end', col: 1, row: 1, tone: 'exercise' },
      { id: 'req', label: 'http.request()', col: 0, row: 2 },
      { id: 'cr', label: 'ClientRequest', sub: 'write · end', col: 1, row: 2, tone: 'experiment' },
      { id: 'inc2', label: 'IncomingMessage', sub: 'response ของ client', col: 2, row: 2 },
    ],
    edges: [
      { from: 'srv', to: 'inc', label: "event 'request'" }, { from: 'srv', to: 'res' },
      { from: 'req', to: 'cr' }, { from: 'cr', to: 'inc2', label: "event 'response'" },
    ],
  }),
};

export const concepts = {
  webHttp: {
    type: 'concept', id: 'c-web-http', diagram: DG.cycle, diagramCaption: 'วงจร request/response ทั้งห้าขั้น', title: 'Web Application กับ HTTP และวงจร request/response',
    source: `${SRC} §Unit Objectives, §01 Web Application กับ HTTP`,
    body: `<p><b>เมื่อจบบทนี้ควรทำได้:</b></p>
      <ul><li>อธิบาย HTTP protocol สำหรับการเขียนเว็บได้</li><li>สร้าง HTTP Server ด้วย Node.js ได้</li>
      <li>จัดการ object Request และ Response ได้</li><li>อ่าน request parameter, request body และ path variable ได้</li>
      <li>สร้างโปรเจกต์ Express.js ได้</li></ul>
      <p><b>Web Application</b> คือแอปพลิเคชันที่เราเขียนขึ้นแล้วอาศัยการคุยกับผู้ใช้ผ่าน World Wide Web ซึ่งทำงานโดยอาศัย document ที่เป็น HTML <i>(นิยามจาก transcript)</i></p>
      <p>ภาพรวม: <b>Client → Http Request → Web Application (Node.js / Bun) → Database Server</b> แล้วส่ง <b>Http Response</b> กลับ</p>
      <ol><li>ผู้ใช้ระบุ URL จาก browser — <code>http://host:port/path/file</code></li>
      <li>Browser ส่ง request message เช่น <code>GET URL HTTP/1.1</code> พร้อม header <code>Host: host:port</code></li>
      <li>Server แปลง URL ไปเป็นไฟล์หรือโปรแกรมภายใต้ document directory</li>
      <li>Server ส่ง response message กลับ เช่น <code>HTTP/1.1 200 OK</code></li>
      <li>Browser จัดรูปแบบ response แล้วแสดงผล</li></ol>
      <p><i>(จาก transcript)</i> ถ้าจะทำ web app ต้องมี web server / HTTP server แล้วเอาโปรแกรมของเราไปเชื่อมกับมัน ฝั่ง client ยิง request เข้ามา หน้าที่เราคือ <b>อ่านและทำความเข้าใจสิ่งที่ client ส่งมาให้ได้</b> — โปรแกรมที่เราเขียนรับ HTTP request เป็น <b>input</b></p>
      <p class="muted"><i>อุปมาจาก transcript:</i> เหมือนหัดขับรถ ตอนแรกต้องคิดทีละขั้น พอขับเป็นแล้วก็ทำได้เลย — HTTP ก็เหมือนกัน ตอนนี้ต้องเข้าใจคอนเซปต์ทีละชิ้นก่อน</p>`,
  },

  nodeArch: {
    type: 'concept', id: 'c-node-arch', diagram: DG.arch, diagramCaption: 'request แบบ non-blocking ตอบทันที ส่วน blocking ไปที่ Work Threads แล้ว callback กลับเข้า Event Loop', title: 'Node.js Architecture: Event Queue, Event Loop, Work Threads',
    source: `${SRC} §02 Node.js Architecture`,
    body: `<ol><li>Client ส่ง request มาที่ web server — request มีทั้งแบบ <b>non-blocking</b> และ <b>blocking</b> เช่น query, update หรือลบข้อมูล</li>
      <li>Node.js รับ request แล้วนำไปต่อคิวใน <b>Event Queue</b></li>
      <li>request ถูกส่งผ่าน <b>Event Loop</b> ทีละตัว โดยตรวจว่า request นั้นง่ายพอที่จะไม่ต้องใช้ทรัพยากรภายนอกหรือไม่</li>
      <li>Event Loop ประมวลผล request ที่ง่าย (non-blocking) เช่น I/O Polling แล้วส่ง response กลับให้ client</li></ol>
      <table><tr><th>ส่วน</th><th>หน้าที่</th></tr>
      <tr><td>APPLICATION</td><td>โค้ด JavaScript ของเรา</td></tr>
      <tr><td>V8 (JavaScript Engine)</td><td>รันโค้ด JavaScript — คุยกับแอปผ่าน Node.js Bindings (Node API)</td></tr>
      <tr><td>LIBUV</td><td>ดูแล asynchronous I/O: Event Queue, Event Loop และ Work Threads</td></tr>
      <tr><td>Work Threads</td><td>รับงาน blocking (file system, network, process) แล้วค่อย execute callback กลับเข้า Event Loop</td></tr></table>`,
  },

  coreModules: {
    type: 'concept', id: 'c-core-modules', title: 'Core Built-in Modules และโมดูล http',
    source: `${SRC} §03 Node.js Core Built-in Modules, §04 Node.js HTTP Module`,
    body: `<table><tr><th>โมดูล</th><th>ใช้ทำอะไร</th></tr>
      <tr><td><code>fs</code></td><td>File system operations</td></tr><tr><td><code>http</code></td><td>HTTP server และ client</td></tr>
      <tr><td><code>path</code></td><td>File path utilities</td></tr><tr><td><code>os</code></td><td>Operating system utilities</td></tr>
      <tr><td><code>events</code></td><td>Event handling</td></tr><tr><td><code>util</code></td><td>Utility functions</td></tr>
      <tr><td><code>stream</code></td><td>Stream handling</td></tr><tr><td><code>crypto</code></td><td>Cryptographic functions</td></tr>
      <tr><td><code>url</code></td><td>URL parsing</td></tr><tr><td><code>querystring</code></td><td>URL query string handling</td></tr></table>
      <p>โมดูล <code>http</code> ทำให้ Node.js คุยผ่านเว็บได้โดยไม่ต้องพึ่งไลบรารีภายนอก:</p>
      <ul><li>สร้าง HTTP server เพื่อรับ request และส่ง response</li><li>ยิง HTTP request ไปหา server อื่น</li>
      <li>รองรับ HTTP method ต่าง ๆ (GET, POST, PUT, DELETE, PATCH ฯลฯ)</li><li>จัดการ request และ response header</li>
      <li>จัดการ streaming data สำหรับ payload ขนาดใหญ่</li></ul>
      <p class="muted">simulator นี้รองรับ <code>http</code> (ฝั่ง server), <code>fs</code> และ <code>process</code> เท่านั้น — โมดูลอื่นในตารางยังรันไม่ได้</p>`,
  },

  esmCjs: {
    type: 'concept', id: 'c-esm-cjs', title: 'CommonJS (CJS) vs ES Modules (ESM)',
    source: `${SRC} §04 (ควรใช้อันไหน, CJS vs ESM)`,
    body: `${code("// ES Modules (แนะนำ)\nimport * as http from 'node:http';\n\n// CommonJS\nconst http = require('node:http');")}
      <p><b>ควรใช้อันไหน:</b> ใช้ ESM กับโปรเจกต์ใหม่ทั้งหมด เพราะเป็นมาตรฐานทางการของ JavaScript ต่อจากนี้ ส่วน CJS ใช้เฉพาะเมื่อทำงานกับ codebase เก่าที่การย้ายจะทำให้ dependency เดิมพัง</p>
      <table><tr><th>หัวข้อ</th><th>CommonJS</th><th>ES Modules</th></tr>
      <tr><td>Syntax</td><td><code>require()</code> และ <code>module.exports</code></td><td><code>import</code> และ <code>export</code></td></tr>
      <tr><td>การโหลด</td><td>synchronous ตอน runtime</td><td>parse แบบ static รองรับ asynchronous</td></tr>
      <tr><td>สภาพแวดล้อม</td><td>สร้างมาเพื่อ Node.js ฝั่ง server</td><td>ใช้ได้ทั้ง browser และ Node.js</td></tr>
      <tr><td>Optimization</td><td>ทำ tree-shaking ได้ไม่ดี</td><td>bundler ทำ tree-shaking ตัดโค้ดที่ไม่ได้ใช้ออกได้</td></tr>
      <tr><td>ตัวแปรประจำไฟล์</td><td><code>__dirname</code>, <code>__filename</code></td><td><code>import.meta.url</code></td></tr></table>`,
  },

  httpClasses: {
    type: 'concept', id: 'c-http-classes', diagram: DG.classes, diagramCaption: 'ความสัมพันธ์ของคลาสหลักทั้งสี่', title: 'คลาสหลัก 4 ตัวของโมดูล http',
    source: `${SRC} §05 HTTP Module Core Classes`,
    body: `<p><b>http.Server</b> — instance ของ HTTP server</p>
      <ul><li><code>server.listen(port, callback)</code> เริ่มรอรับ connection</li><li><code>server.close(callback)</code> หยุดรับ connection ใหม่</li>
      <li>event <code>'request'</code> เกิดทุกครั้งที่มี request เข้ามา ส่ง <code>IncomingMessage</code> และ <code>ServerResponse</code> มาด้วย</li></ul>
      <p><b>http.ServerResponse</b> — server สร้างเองเพื่อประกอบและส่ง response กลับ</p>
      <ul><li><code>response.writeHead(statusCode, headers)</code> ส่ง response header</li><li><code>response.setHeader(name, value)</code> ตั้ง header ทีละตัว</li>
      <li><code>response.write(chunk)</code> ส่ง body ทีละก้อน</li><li><code>response.end(data)</code> บอกว่าส่ง header และ body ครบแล้ว</li></ul>
      <p><b>http.IncomingMessage</b> — อ่านข้อมูล request ที่เข้ามา (implement ReadableStream)</p>
      <ul><li><code>request.method</code> เช่น <code>'GET'</code>, <code>'POST'</code></li><li><code>request.url</code> URL ของ request</li><li><code>request.headers</code> object ของ header ที่ parse แล้ว</li></ul>
      <p><b>http.ClientRequest</b> — สร้างเมื่อเรียก <code>http.request()</code> แทน request ฝั่ง client</p>
      <ul><li><code>request.write(chunk)</code>, <code>request.end()</code>, event <code>'response'</code></li></ul>
      <p class="muted">simulator ยังไม่มี <code>http.request()</code> (ฝั่ง client)</p>`,
  },

  methodsUrl: {
    type: 'concept', id: 'c-methods-url', title: 'HTTP Methods, การอ่านค่าจาก URL และสรุปบท',
    source: `${SRC} §07 HTTP Methods, §08 อ่านค่าจาก URL, §สรุปท้ายบท`,
    body: `<table><tr><th>Method</th><th>ใช้ทำอะไร</th><th>ตัวอย่าง</th></tr>
      <tr><td>GET</td><td>ดึงข้อมูลจาก resource</td><td><code>/subjects</code> <code>/students</code></td></tr>
      <tr><td>POST</td><td>สร้าง resource ใหม่</td><td><code>/subjects</code> (พร้อมข้อมูล)</td></tr>
      <tr><td>PUT</td><td>แก้ไขข้อมูลที่มีอยู่</td><td><code>/subjects/{id}</code> (พร้อมข้อมูล)</td></tr>
      <tr><td>DELETE</td><td>ลบ resource</td><td><code>/subjects/{id}</code></td></tr></table>
      <p>Node.js รุ่นใหม่ใช้ <b>WHATWG URL API</b> ทำให้คลาส <code>URL</code> และ <code>URLSearchParams</code> เป็น global ใช้ได้เลย</p>
      ${code("const urlObj = new URL(request.url, `http://${request.headers.host}`);\nconst params = urlObj.searchParams;\nconst name = params.get('name');           // ค่าเดียว\nconst subjects = params.getAll('fav_subj'); // ทุกค่าที่ชื่อซ้ำ → array")}
      <p><b>Path segments:</b> <code>pathname.split('/')</code> ของ <code>/users/123</code> ได้ <code>["", "users", "123"]</code> (มีสตริงว่างนำหน้า) — <code>.filter(Boolean)</code> เก็บเฉพาะตัวที่เป็น true จึงตัดสตริงว่างทิ้ง</p>
      <p><b>สรุป:</b> web server ส่ง request มาให้โปรแกรมเรา (input) · Node.js ใช้ Event Queue/Event Loop/Work Threads · โมดูล <code>node:http</code> มีคลาสหลัก 4 ตัว · โปรเจกต์ใหม่ใช้ ESM · ปลายทางของบทนี้คือ REST API</p>`,
  },
};
