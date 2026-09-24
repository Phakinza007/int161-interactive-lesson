import { flow, sequence, stack } from '../js/diagrams.js';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const code = (s) => `<pre><code>${esc(s)}</code></pre>`;
const SRC = 'week3/W03-introduction-to-rest-api.md';

const DG = {
  spa: flow({
    title: 'SPA คุยกับ RESTful API ด้วย AJAX + JSON', nodeW: 150, gapX: 64,
    nodes: [
      { id: 'cl', label: 'Client', sub: 'Browser / Mobile App\nHTML + CSS + JavaScript', col: 0, row: 0, tone: 'concept' },
      { id: 'api', label: 'RESTful API', sub: 'Microservice', col: 1, row: 0, tone: 'experiment' },
      { id: 'db', label: 'Database', col: 2, row: 0, tone: 'exercise' },
    ],
    edges: [
      { from: 'cl', to: 'api', label: 'AJAX (verb + URI)' }, { from: 'api', to: 'cl', label: '{JSON}', dashed: true },
      { from: 'api', to: 'db' },
    ],
  }),
  layered: stack({
    title: 'Layered System: router → service → repository', layerW: 320,
    layers: [
      { label: 'Client', sub: 'ไม่รู้ว่าคุยกับชั้นไหนข้างหลัง' },
      { label: 'Router  (HTTP / Presentation)', sub: 'ตีความ URL + method แล้วตอบ JSON', tone: 'concept' },
      { label: 'Service  (Business Logic)', sub: 'ตรรกะทางธุรกิจ · Entity', tone: 'experiment' },
      { label: 'Repository  (Data Access)', sub: 'อ่านเขียนข้อมูล · Entity', tone: 'exercise' },
    ],
    between: [{ down: 'request', up: 'JSON' }, { down: 'เรียก', up: 'ผลลัพธ์' }, { down: 'เรียก', up: 'ข้อมูล' }],
  }),
};

export const concepts = {
  spaRest: {
    type: 'concept', id: 'c-spa-rest', diagram: DG.spa, diagramCaption: 'SPA ↔ RESTful API', title: 'ทบทวน SPA และ REST API คืออะไร',
    source: `${SRC} §01 ทบทวน — Web Application กับ SPA, §02 REST API คืออะไร`,
    body: `<p>ภาพรวมเดิม: <b>Client → Http Request → Web Application (Node.js / Bun) → Database Server</b> แล้วส่ง <b>Http Response</b> กลับ — สัปดาห์นี้เพิ่มภาพของ <b>SPA (Single Page Application)</b></p>
      <table><tr><th>ฝั่ง</th><th>มีอะไร</th><th>คุยกันด้วย</th></tr>
      <tr><td>Client Side</td><td>Web Browser หรือ Mobile App · HTML + CSS + JavaScript</td><td><code>initial request</code> ได้ HTML ครั้งแรก จากนั้นคุยด้วย AJAX แลก {JSON}</td></tr>
      <tr><td>Server Side</td><td>RESTful API / Microservice</td><td>ต่อกับ DB</td></tr></table>
      <p>หลังโหลดหน้าแรกแล้ว หน้าเว็บไม่โหลดใหม่ทั้งหน้าอีก แต่ยิง AJAX ไปขอเฉพาะข้อมูลเป็น JSON</p>
      <ul><li><b>REST</b> = <b>REpresentational State Transfer</b> คิดค้นโดย Roy Fielding</li>
      <li>เป็น API ที่ทำตามข้อจำกัด (constraints) ของสถาปัตยกรรม REST เพื่อให้เรียกใช้ RESTful web service ได้</li>
      <li>REST Server แค่เปิดทางให้เข้าถึง <b>resource</b> ส่วน REST client เป็นคนเข้าถึงและแก้ไข resource นั้น</li>
      <li>resource แต่ละตัวระบุด้วย <b>URI</b> หรือ global ID</li>
      <li>ใช้ representation ได้หลายแบบ เช่น text, JSON, XML — <b>JSON นิยมที่สุด</b></li></ul>`,
  },

  constraints: {
    type: 'concept', id: 'c-constraints', title: 'หลักการและข้อจำกัดของ REST',
    source: `${SRC} §03 หลักการและข้อจำกัดของ REST`,
    body: `<table><tr><th>ข้อจำกัด</th><th>ความหมาย</th></tr>
      <tr><td>Client-Server</td><td>server มี RESTful web service ตามที่ client ต้องการ · client ส่ง request · server ปฏิเสธหรือทำให้แล้วตอบกลับอย่างเหมาะสม</td></tr>
      <tr><td>Stateless</td><td>ทุก request ต้องมีข้อมูลครบพอที่จะเข้าใจและทำงานให้จบได้ในตัวเอง — server อาศัย context ที่เก็บไว้ก่อนหน้าไม่ได้ ฝั่ง client จึงต้องถือ session state เอง</td></tr>
      <tr><td>Uniform Interface</td><td>ทำงานบนชั้น HTTP ใช้ verb หลัก POST (สร้าง), GET (ดึง), PUT (อัปเดต), DELETE (ลบ)</td></tr>
      <tr><td>Layered System</td><td>สถาปัตยกรรมประกอบจากชั้นลดหลั่นกัน แต่ละ component มองไม่เห็นชั้นที่ตัวเองคุยด้วย</td></tr>
      <tr><td>Cacheable</td><td>response ต้องบอกตัวเองว่า cache ได้หรือไม่ ถ้าได้ client เอากลับมาใช้ซ้ำภายในช่วงเวลาที่กำหนด</td></tr>
      <tr><td>Code on demand (ไม่บังคับ)</td><td>ขยายความสามารถของ client ด้วยการดาวน์โหลดโค้ด (applet/script) ไปรัน</td></tr></table>`,
  },

  uniform: {
    type: 'concept', id: 'c-uniform', title: 'เจาะลึก Uniform Interface: 4 เสาหลัก',
    source: `${SRC} §04 เจาะลึก Uniform Interface`,
    body: `<p>ข้อจำกัดพื้นฐานที่ทำให้ client ไม่ผูกติดกับวิธี implement ของ server:</p>
      <ol><li><b>Resource Identification</b> — URI ระบุ <i>สิ่งของ</i> ไม่ใช่ <i>การกระทำ</i> เช่น <code>/api/v1/users</code></li>
      <li><b>Manipulation via Representations</b> — แลกเปลี่ยนสถานะด้วยรูปแบบมาตรฐาน (JSON)</li>
      <li><b>Self-Descriptive Messages</b> — ใช้ HTTP method มาตรฐาน (GET, POST, PUT, DELETE) และ header เช่น <code>Content-Type: application/json</code></li>
      <li><b>HATEOAS</b> — ใส่ลิงก์ hypermedia เพื่อบอก client ว่าทำอะไรต่อได้บ้างแบบ dynamic</li></ol>`,
  },

  naming: {
    type: 'concept', id: 'c-naming', title: 'กติกาการตั้งชื่อ endpoint',
    source: `${SRC} §05 กติกาการตั้งชื่อ endpoint`,
    body: `<ul><li>REST อิงกับ <b>resource หรือคำนาม</b> ไม่ใช่ action หรือคำกริยา — URI ควรลงท้ายด้วยคำนามเสมอ เช่น <code>/api/users</code></li>
      <li>ใช้ <b>HTTP verb</b> บอกว่าจะทำอะไรกับ resource (GET, PUT, POST, DELETE, PATCH)</li>
      <li>คนอ่านโค้ดควรรู้ทันทีว่าเกิดอะไรขึ้นแค่ดู endpoint กับ method</li>
      <li><b>ใช้พหูพจน์ใน URL เสมอ</b> เพื่อให้ URI ทั้งแอปสม่ำเสมอ และ <b>ส่ง HTTP code ให้ถูกต้อง</b> เพื่อบอกว่าสำเร็จหรือผิดพลาด</li></ul>
      <table><tr><th>URI</th><th>Verb</th><th>ความหมาย</th></tr>
      <tr><td><code>api/products</code></td><td>GET</td><td>ดึง products ทั้งหมด</td></tr>
      <tr><td><code>api/products/1</code></td><td>GET</td><td>ดึง product ที่ id = 1</td></tr>
      <tr><td><code>api/products/1/orders</code></td><td>GET</td><td>ดึง orders ทั้งหมดของ product id = 1</td></tr>
      <tr><td><code>api/products</code></td><td>POST</td><td>เพิ่ม product ใหม่</td></tr>
      <tr><td><code>api/products/1</code></td><td>PUT</td><td>แก้ product ที่ id = 1</td></tr>
      <tr><td><code>api/products/1</code></td><td>DELETE</td><td>ลบ product ที่ id = 1</td></tr></table>
      ${code('/customers              // collection resource\n/customers/{id}         // singleton resource\n/customers/{id}/orders  // sub-collection resource')}`,
  },

  url: {
    type: 'concept', id: 'c-url', title: 'โครงสร้างของ URL และ Restful Endpoint',
    source: `${SRC} §05 โครงสร้างของ URL`,
    body: `<p>จาก <code>http://localhost:9999/restfulservices/v1/users/{id}</code></p>
      <table><tr><th>ส่วน</th><th>ตัวอย่าง</th></tr>
      <tr><td>Protocol</td><td><code>http://</code></td></tr><tr><td>Host (domain name)</td><td><code>localhost</code></td></tr>
      <tr><td>Port</td><td><code>9999</code></td></tr><tr><td>Application Context</td><td><code>restfulservices</code></td></tr>
      <tr><td>Version</td><td><code>v1</code></td></tr><tr><td>Resource</td><td><code>users</code></td></tr>
      <tr><td>Parameter</td><td><code>{id}</code></td></tr></table>
      <p>ส่วนที่นับเป็น <b>Restful Endpoint</b> คือตั้งแต่ <code>restfulservices</code> ไปจนจบ</p>`,
  },

  layered: {
    type: 'concept', id: 'c-layered', diagram: DG.layered, diagramCaption: 'แต่ละชั้นคุยกับเพื่อนบ้านที่ติดกันเท่านั้น', title: 'เจาะลึก Layered System',
    source: `${SRC} §06 เจาะลึก Layered System`,
    body: `<p>ลำดับชั้นของชั้นกลาง โดย<b>แต่ละชั้นคุยกับเพื่อนบ้านที่ติดกันเท่านั้น</b></p>
      <table><tr><th>ชั้น</th><th>หน้าที่</th><th>สิ่งที่อยู่ในชั้น</th></tr>
      <tr><td>HTTP/Routing Layer</td><td>รับ request ตีความ URL/method แล้วตอบ JSON</td><td>Presentation</td></tr>
      <tr><td>Service Layer</td><td>ตรรกะทางธุรกิจ</td><td>Business Logic, Entity Object</td></tr>
      <tr><td>Data Access Layer</td><td>เข้าถึงข้อมูล</td><td>Repository, Entity Object</td></tr></table>
      <ul><li><b>Scalability</b> — เพิ่ม shared cache หรือ load balancer ได้โดยไม่ต้องแก้ฝั่ง client</li>
      <li><b>Separation of Concerns</b> — แยกการแกะ HTTP ดิบ ๆ ออกจากตรรกะธุรกิจและการคุยกับฐานข้อมูล</li>
      <li><b>Security</b></li></ul>`,
  },

  project: {
    type: 'concept', id: 'c-project', title: 'โครงไฟล์โปรเจกต์ โค้ดที่แจก และบั๊ก 3 จุด',
    source: `${SRC} §07 โครงไฟล์ในโปรเจกต์, §08 โค้ดตัวอย่างที่แจกมา, §09 บั๊กในโค้ดที่แจกมา, §สรุปท้ายบท`,
    body: `${code('src/\n├── server.js       --> ตั้ง HTTP Server ด้วยของที่มีมาให้\n├── router.js       --> จับคู่ route และจัดการ HTTP\n├── services/       --> ตรรกะธุรกิจ (ไม่ผูกกับ framework)\n└── repositories/   --> ชั้นเข้าถึงข้อมูล (File System / DB)')}
      <ul><li><b>server.js</b> ตั้ง server แล้วโยนงานให้ router · <b>router.js</b> คือชั้น HTTP · <b>service</b> ยังไม่มีตรรกะ แค่ส่งต่อ repository แต่ทำให้ router ไม่ต้องรู้ว่าข้อมูลมาจากไหน · <b>repository</b> เก็บ 17 รายวิชาเป็น array ในหน่วยความจำ</li>
      <li>DELETE ที่สำเร็จตอบ <b>204 No Content</b> (ไม่มี body) ส่วนหาไม่เจอตอบ <b>404</b></li></ul>
      <p><b>โค้ดที่แจกมามีบั๊ก 3 จุด</b> <i>(จากการรันทดสอบเองในโน้ต ไม่ได้อยู่ในสไลด์)</i> — ให้ลองหาและแก้ในโจทย์ท้ายบท:</p>
      <ol><li><code>insertSubject()</code> ใช้ตัวแปร <code>existing</code> ที่ไม่มีอยู่ (ต้องเป็น <code>idx</code>) → <code>ReferenceError</code></li>
      <li><code>updateSubjectById()</code> เรียก <code>repo.updateSubject(subject)</code> ส่งอาร์กิวเมนต์ไม่ครบ (ต้องส่ง <code>id, subject</code>) → อัปเดตไม่สำเร็จเลย</li>
      <li>branch สุดท้ายของ router สะกดผิด <code>respose</code> และใช้ <code>res</code> แทน <code>response</code> → เปิด path ที่ไม่มีแล้ว server พัง</li></ol>
      <p><b>สรุป:</b> REST คือสถาปัตยกรรม ไม่ใช่ไลบรารี · ข้อจำกัดหลัก: Client-Server, Stateless, Uniform Interface, Layered System, Cacheable (+ Code on demand ไม่บังคับ) · URI เป็นคำนามพหูพจน์ verb บอกการกระทำ · แบ่งเป็น router → service → repository</p>`,
  },
};
