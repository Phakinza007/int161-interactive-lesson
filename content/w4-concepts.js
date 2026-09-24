const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const code = (s) => `<pre><code>${esc(s)}</code></pre>`;
const SRC = 'week4/W04-database-connection.md';

export const concepts = {
  goalsLayers: {
    type: 'concept', id: 'c-goals-layers', title: 'เป้าหมาย, Layered System และการเตรียมฐานข้อมูล',
    source: `${SRC} §01 เป้าหมายของบทนี้, §02 ทบทวน Layered System, §03 DB Client Tool, §04 สร้าง database และ table`,
    body: `<p><b>จบบทนี้ต้องทำได้:</b> 1) ใช้ Node.js เชื่อมต่อ MySQL 2) สร้าง CRUD API (ทำ C, R, D ครบ · U ให้ไปทำเอง) 3) ใช้ <b>Prepared Statement</b> ป้องกัน <b>SQL Injection</b> 4) เข้าใจการจัดการโค้ดแบบ layered system</p>
      <p class="muted"><i>(จาก transcript)</i> "ทำ CRUD ได้พื้นฐาน" = ยังไม่ต้อง validate ข้อมูล และอาจารย์เตือนว่าโค้ดบนสไลด์อาจไม่ตรงกับชื่อที่เราตั้งเอง — ให้เข้าใจแล้วปรับ ไม่ใช่ลอก</p>
      <table><tr><th>ชั้น</th><th>สัปดาห์นี้</th></tr>
      <tr><td>HTTP/Routing Layer</td><td>แก้เฉพาะ <code>async/await</code> + เพิ่มการอ่าน body</td></tr>
      <tr><td>Service Layer</td><td>แก้เฉพาะ <code>async/await</code> + เพิ่มเช็คข้อมูลซ้ำตอนท้ายคาบ</td></tr>
      <tr><td>Data Access Layer</td><td><b>เปลี่ยนทั้งชั้น</b> จาก array ใน memory → MySQL</td></tr></table>
      <p><i>(จาก transcript)</i> ชั้นบนไม่รู้และไม่ต้องรู้ว่าข้อมูลมาจากไหน · ย้าย MySQL → Oracle ก็เปลี่ยน connection ชั้นเดียว · ข้อมูลใน array คือของใน memory (ปิดโปรแกรมก็หาย) ส่วนข้อมูลในฐานข้อมูลคือ <b>persistent data</b></p>
      <p><b>DB Client Tool</b> ใน WebStorm ทำหน้าที่แบบ MySQL Workbench: เป็น client ส่ง SQL ไปให้ DBMS — ไม่เกี่ยวกับโปรแกรมที่เราเขียน (Host <code>localhost</code>, Port <code>3306</code>, User <code>root</code>; ต้องมี <b>driver</b> เพราะ DBMS แต่ละเจ้าเข้าถึงข้อมูลไม่เหมือนกัน — driver ของ WebStorm เป็น JDBC คนละตัวกับ driver ที่ Node.js ติดตั้งเอง)</p>
      <p>สร้าง database และ table (ลองรันจริงในบล็อกทดลอง "SQL console" ถัดไป):</p>
      ${code("create database sampledb;\nuse sampledb;\n\ncreate table subjects\n(\n   id int primary key auto_increment,\n   subject_code varchar(8) not null unique,\n   subject_title varchar(60),\n   credit int not null\n);")}
      <ul><li><code>id</code> เป็น surrogate key + <b>auto_increment</b> — ตอน insert ไม่ต้องคิดเลข id เอง</li>
      <li><code>subject_code</code> ใส่ <b>UNIQUE constraint</b> ห้ามซ้ำ (จะกลับมาหลอกหลอนตอนท้ายคาบ)</li><li>ชื่อฟิลด์ใช้ snake_case ตามธรรมเนียมฝั่งฐานข้อมูล</li></ul>
      <p class="muted">⚠ สไลด์ใช้ชื่อ database ไม่ตรงกัน (<code>sample</code> กับ <code>sampledb</code>) — ในคาบใช้ <b><code>sampledb</code></b></p>`,
  },

  connect: {
    type: 'concept', id: 'c-connect', title: 'ต่อ database จาก Node.js: mysql2, Pool และรูปร่างของผลลัพธ์',
    source: `${SRC} §05 ขั้นตอนการเชื่อม database, §06 รู้จักไลบรารี mysql2, §07 Connection กับ Pool, §08 Callback vs async/await`,
    body: `<p><b>3 ขั้นตอน:</b> 1) ติดตั้ง driver: <code>npm install mysql2</code> (MySQL ≥ 5.2 ใช้ <code>mysql2</code> ต่ำกว่านั้นใช้ <code>mysql</code>) 2) สร้าง Connection หรือ Pool 3) ส่ง SQL ด้วย <code>await pool.query("SQL Command")</code></p>
      ${code("import * as mysql from 'mysql2/promise'\nconst pool = mysql.createPool({\n    host: 'localhost',\n    user: 'root',\n    password: '<your-password>',\n    database: 'sampledb'\n})")}
      <table><tr><th></th><th><code>createConnection</code></th><th><code>createPool</code></th></tr>
      <tr><td>จำนวน</td><td>เรียกครั้งหนึ่ง = instance ใหม่หนึ่งตัว</td><td>สร้างไว้ล่วงหน้าหลายตัว (เช่น 8) แล้วเวียนใช้</td></tr>
      <tr><td>คนเข้าเยอะ</td><td>สร้างใหม่ทุกครั้ง → เปลืองและ DB รับไม่ไหว</td><td>ใครว่างหยิบไปใช้ ไม่พอค่อยเพิ่มทีละสเต็ป</td></tr>
      <tr><td>การปิด</td><td>ต้องจัดการเอง</td><td><b>ไม่ปิด</b> เวียนใช้เรื่อย ๆ</td></tr></table>
      <p><i>(จาก transcript)</i> โลกปัจจุบันใช้ connection pooling · การสร้าง connection เหมือนโทรหาลูกค้าให้ติดก่อนแล้วค่อยคุย · สร้างเสร็จแล้วคุยเหมือนกันหมด</p>
      <p><b>Callback vs async/await:</b> แบบ callback ใส่ฟังก์ชันเป็นอาร์กิวเมนต์ตัวสุดท้าย โค้ดยาวและซ้อนหลายชั้น แบบ async/await สั้นกว่า <b>แต่ต้อง import จาก <code>mysql2/promise</code></b> ถ้าไม่ใส่ <code>/promise</code> จะได้ callback API แล้วใช้ <code>await</code> ไม่ได้</p>
      <p><b>รูปร่างผลลัพธ์:</b> <code>pool.query()</code> คืน array 2 ช่อง <code>[rows, fields]</code></p>
      <table><tr><th>คำสั่ง</th><th><code>[0]</code></th><th><code>[1]</code></th></tr>
      <tr><td>SELECT</td><td>rows — array ของ JavaScript object</td><td>fields/schema (metadata ของคอลัมน์)</td></tr>
      <tr><td>INSERT / UPDATE / DELETE</td><td><b>ResultSetHeader</b>: <code>affectedRows</code>, <code>insertId</code>, <code>info</code>, <code>fieldCount</code></td><td><code>undefined</code></td></tr></table>`,
  },

  layersCode: {
    type: 'concept', id: 'c-layers-code', title: 'pool.js, Prepared Statement, repository และ async/await ทั้งเส้น',
    source: `${SRC} §09 db/pool.js, §10 tests/test-db.js, §11 Prepared Statement, §12 subject-repository.js, §13 async/await ลามทั้งเส้น, §14 getBody()`,
    body: `<ul><li>แยก config ไว้ที่ <code>db/pool.js</code> ที่เดียวแล้ว <code>export</code> — repository หลายตัวจะไม่ต้องเขียนซ้ำ · ใน <code>tests/test-db.js</code> ต้องเรียก <code>await pool.end()</code> ไม่งั้นโปรแกรม<b>ไม่จบ</b> (connection ยังเปิดอยู่ ต้อง Ctrl+C)</li>
      <li><b>Prepared Statement:</b> ใช้ <code>?</code> แทนค่า ส่ง array ของค่าเป็นอาร์กิวเมนต์ที่สอง จับคู่ตามลำดับ — ป้องกัน <b>SQL Injection</b> และรองรับข้อมูลจาก front-end</li>
      <li><code>const [subjects] = await pool.query(...)</code> คือ destructuring รับเฉพาะ index 0 (ถ้าอยากได้ index 1 เขียน <code>const [, fields] = ...</code>) · <code>await</code> ต้องคู่กับ <code>async</code></li>
      <li><code>create()</code> เอา <code>result.insertId</code> ไป <code>findById()</code> เพราะ id เป็น auto_increment รู้ล่วงหน้าไม่ได้ · <code>remove()</code> ตัดสินจาก <code>affectedRows &gt; 0</code></li></ul>
      <p class="muted">⚠ สองจุดที่โค้ดบนสไลด์ไม่ตรงกับที่ทำจริงในคาบ: <code>findById()</code> ต้อง <code>return subject[0]</code> (SELECT ได้ array) และใช้ชื่อฟิลด์จริง <code>subject.subject_code</code>, <code>subject.subject_title</code> แทน <code>subject.code/title</code></p>
      <p><b>async/await ลามทั้งเส้น</b> <i>(จาก transcript)</i>: repository (async) ← service (await → async) ← router (await → async) ← server (await → async) — เติมแค่ <code>async</code>/<code>await</code> ไม่ได้แก้ตรรกะเลย ถ้าลืมจะได้ response ว่างเปล่าทั้งที่ไม่มี error เพราะ response ถูกส่งก่อน Promise resolve · และ <code>id</code> ตอนนี้คือ primary key ตัวเลข (ยิง <code>GET /subjects/1</code>)</p>
      <p><b>อ่าน request body:</b> body ไม่ได้มาครั้งเดียวจบ แต่เป็น chunk ทีละก้อน (stream) จึงต้อง <code>request.on('data')</code> สะสมเป็น string · <code>request.on('end')</code> แล้วค่อย <code>JSON.parse</code> · <code>request.on('error')</code> แล้ว <code>reject</code> — ห่อใน <code>new Promise</code> เพื่อให้ <code>await getBody(...)</code> ได้ (ถ้าใช้ framework เช่น Express จะไม่ต้องเขียนเอง)</p>`,
  },

  crudLogic: {
    type: 'concept', id: 'c-crud-logic', title: 'POST/PUT, HTTP status, business logic ที่ service และวิธีคิดเรื่อง error',
    source: `${SRC} §15 POST /subjects, §16 PUT /subjects/{id}, §17 Business logic ในชั้น service, §18 วิธีคิดเรื่อง error, §สรุปท้ายบท`,
    body: `<table><tr><th>กรณี</th><th>Status</th></tr>
      <tr><td>สร้างสำเร็จ (POST)</td><td><b>201 Created</b> (ไม่ใช่ 200)</td></tr><tr><td>รหัสวิชาซ้ำ</td><td><b>409 Conflict</b></td></tr>
      <tr><td>ไม่มี body</td><td><b>400 Bad Request</b></td></tr><tr><td>อัปเดตสำเร็จ (PUT)</td><td><b>200</b></td></tr>
      <tr><td>ไม่เจอ</td><td><b>404</b></td></tr><tr><td>ลบสำเร็จ (DELETE)</td><td><b>204 No Content</b></td></tr></table>
      <p>PUT โครงเหมือน POST เป๊ะ ต่างที่ตอบ 200/404 และต้องส่ง <code>id</code> จาก URL เป็นพารามิเตอร์ตัวที่สาม (<b>ส่วน U อาจารย์ให้ไปทำเอง</b>) · บนสไลด์บรรทัด <code>service.createNewSubject(subject)</code> ขาด <code>await</code> — ต้องเติม</p>
      <p><b>บั๊กที่ทำ server ตายในคาบ</b> <i>(จาก transcript)</i>: POST รหัสวิชาเดิมซ้ำ → DBMS ปฏิเสธเพราะ UNIQUE constraint แต่โปรแกรมไม่มี exception handling จึงตายทันที: <code>Duplicate entry 'INT 750' for key 'subjects.subject_code'</code> (<code>exit code 1</code> = จบผิดปกติ)</p>
      <p><b>วิธีแก้:</b> เพิ่ม <code>findBySubjectCode</code> ที่ repository แล้วเช็คที่ service ก่อนสั่ง create — ถ้าค้นเจอ (ไม่เป็น <code>null</code>) แปลว่าซ้ำ → คืน <code>null</code> ไม่ต้องยิง INSERT แล้ว router แปลงเป็น 409</p>
      ${code("export async function createNewSubject(subject) {\n    if (await repo.findBySubjectCode(subject) != null) return null;\n    return await repo.create(subject);\n}")}
      <p><i>"การใส่ข้อมูลซ้ำก็ถือเป็น business logic"</i> — ไม่ใช่หน้าที่ของ router (ดูแลแค่ HTTP) และไม่ใช่ของ repository (อ่านเขียนข้อมูล)</p>
      <p><b>วิธีคิดเรื่อง error</b> <i>(จาก transcript)</i>: หัวใจของการเขียนโปรแกรมคือแก้ปัญหาจาก error ให้ได้ ไม่ใช่เทียบโค้ดกับที่ลอกมา · บางทีโค้ดตรงกันแต่ยังพังเพราะสภาพแวดล้อมไม่เหมือนกัน · ถ้า IDE บอกว่าผิดให้เชื่อมัน · อ่าน <code>exit code</code> ก่อน แล้วอ่านข้อความ error ให้ครบ · ความคล่องมาจากชั่วโมงบิน</p>
      <p><b>งานที่เหลือ:</b> เขียน U (PUT/update) ให้ครบเอง · เพิ่มการเช็ค 404 ใน <code>GET /subjects/{id}</code> (ตอนนี้ตอบ <code>null</code> ด้วย 200)</p>`,
  },
};
