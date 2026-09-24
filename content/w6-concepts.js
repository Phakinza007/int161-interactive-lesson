const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const code = (s) => `<pre><code>${esc(s)}</code></pre>`;
const SRC = 'week6/06-INT161-Error Handling.pdf';
const TPL = 'week6/express-template/src';
const ASG = 'week6/express_crud_exception_assignment.md';

export const concepts = {
  whatError: {
    type: 'concept', id: 'c-what-error', title: 'Exception / Error คืออะไร และทำไมต้องจัดการ',
    source: `${SRC} §Unit Objectives, §What is an Exception/Error?, §Why Error Handling Matters`,
    body: `<p><b>เมื่อจบบทนี้ควรทำได้:</b> เรียนรู้การจัดการ error ด้วย Express middleware · ออกแบบ global error handling ใน Node/Express ตาม best practice</p>
      <ul><li><b>Exception/Error</b> คือเหตุการณ์หรือเงื่อนไขที่ขัดขวางการทำงานปกติของโปรแกรม</li>
      <li>ถ้าโยน exception แล้วไม่มีใครจับ Node.js จะ<b>สิ้นสุดโปรเซส</b> (<code>process.exit(1)</code>) ทำให้ backend server ทั้งตัวล่ม</li>
      <li><b>Error เป็น object</b> — ห่อหุ้มเงื่อนไขที่ไม่คาดคิดไว้ในออบเจกต์</li></ul>
      <p><b>ทำไมต้องจัดการ error:</b></p>
      <ul><li>ป้องกันแอปล่ม/downtime</li><li>ประสบการณ์ผู้ใช้ที่ดี (ข้อความ error ที่เป็นมิตร)</li><li>ป้องกันข้อมูลสำคัญรั่ว (เช่น stack trace)</li><li>ช่วย debug, monitoring และ alerting</li></ul>
      <table><tr><th>ประเภท error</th><th>ตัวอย่าง</th></tr>
      <tr><td>Programming Errors</td><td>bug, ตรรกะผิด (<code>TypeError</code>, สมมติฐานผิด)</td></tr>
      <tr><td>Operational Errors</td><td>network timeout, DB ใช้ไม่ได้, ไม่พบไฟล์</td></tr>
      <tr><td>Expected vs Unexpected</td><td>error ที่คาดไว้ควรจัดการอย่างนุ่มนวล</td></tr></table>`,
  },

  propagation: {
    type: 'concept', id: 'c-propagation', title: 'Error propagation, try…catch และ custom error',
    source: `${SRC} §Error propagation, §Error Handling (Sync): try .. catch, §The standard JavaScript Error object, §Customer Error, §Custom Error Classes`,
    body: `<p><b>Error propagation</b> คือกลไกส่ง error ขึ้นไปตาม call stack จนกว่าจะถูกจับและจัดการ — ถ้าฟังก์ชันที่เรียกไม่จัดการ มันจะส่งต่อขึ้นไปเรื่อย ๆ จนถึง global scope และอาจทำให้โปรแกรมจบ</p>
      ${code("try {\n   main(1);\n   main();            // ฟังก์ชัน b() เรียก fs.readFileSync('test.txt') ที่ไม่มีไฟล์\n} catch (e) {\n   console.log('Message: ', e.message);\n   console.log('Status: ', e.status);\n   console.log('Code: ', e.code);\n   console.log('Stack Trace: ', e.stack);\n}")}
      <table><tr><th>property ของ Error</th><th>ความหมาย</th></tr>
      <tr><td><code>message</code></td><td>คำอธิบายที่คนอ่านได้</td></tr><tr><td><code>name</code></td><td>ชนิดของ error เช่น "Error", "TypeError", "ReferenceError"</td></tr>
      <tr><td><code>stack</code></td><td>stack trace (ไม่เป็นมาตรฐานแต่รองรับกว้าง) บอกว่า error เกิดที่ไหน</td></tr>
      <tr><td><code>code</code> / <code>errno</code></td><td>ของ system error ใน Node.js เช่น <code>EACCES</code> (permission denied)</td></tr></table>
      <p>สร้าง error ของเราเองพร้อม code/status:</p>
      ${code("} catch (e) {\n    const err = new Error('File data.txt not found');\n    err.code = 'FILE_NOT_FOUND';\n    err.status = 404;\n    throw err;\n}")}
      <p>หรือสร้าง <b>custom error class</b> (เช่น <code>AppError</code>) เพื่อจัดหมวดหมู่และใส่บริบท ช่วยให้ตอบ client ได้ละเอียดและ log ภายในได้ดี:</p>
      ${code("class AppError extends Error {\n    errors = {404:'NOT_FOUND', 400:'BAD REQUEST', 409:'CONFLICT',\n        500:'INTERNAL SERVER ERROR', 403:'FORBIDDEN', 401:'UNAUTHORIZED'}\n    constructor(message, statusCode) {\n        super(message);\n        this.statusCode = statusCode;\n        this.error = this.errors[statusCode];\n        this.isOperational = true;\n        Error.captureStackTrace(this, this.constructor);\n    }\n}")}
      <p class="muted">stack trace ใน simulator ถูกย่อ/จำลองให้อ่านง่าย ไม่ตรงกับ Node จริงทุกบรรทัด</p>`,
  },

  errorFlow: {
    type: 'concept', id: 'c-error-flow', title: 'Middleware และกลไก error handling ใน Express',
    source: `${SRC} §Express Middleware, §Error Handling Mechanism in Express.js`,
    body: `<p><b>Middleware</b> คือฟังก์ชันที่รับ <code>(req, res, next)</code> ทำงานบางอย่างได้ เช่น log, parse body, auth, validate · เรียก <code>next()</code> → ส่งต่อไป middleware ถัดไป · <code>res.send()</code>/<code>res.end()</code> → จบ (ตอบ client)</p>
      <p style="font-family:ui-monospace,monospace;font-size:13px">Client (Request) → Express server → [Middleware 1] → next() → [Middleware 2] → next() → [Router Match] → handler → [Response] → Client</p>
      ${code("// Middleware 1 - Logger\napp.use((req, res, next) => {\n    console.log(`${req.method} ${req.url}`)\n    next()\n})\n\n// Middleware 2 - JSON parser\napp.use(express.json())\n\napp.use('/films', filmRouter)")}
      <p><b>กลไกของ error:</b></p>
      <ol><li><b>Error occurs</b> — จากโค้ดเรา (<code>throw new Error</code>, rejected Promise) หรือ middleware/route ล้มเหลว (DB query error, input ไม่ถูกต้อง)</li>
      <li><b>Forward ด้วย <code>next(err)</code></b> — Express จะข้าม middleware/route ปกติทั้งหมดไปที่ error-handling middleware โดยตรง</li>
      <li><b>Error-handling middleware</b> — ลายเซ็น <code>(err, req, res, next)</code> (ต่างจากปกติที่เป็น <code>(req, res, next)</code>)</li>
      <li><b>ส่ง response</b> พร้อม status code และข้อความ/JSON ที่เหมาะสม</li></ol>
      <p>ต้อง<b>ประกาศไว้ท้ายสุด</b> หลังทุก route/middleware · ถ้าไม่มี error handler Express จะส่ง <b>หน้า HTML error แบบ default</b> (แสดง stack trace ในโหมด dev)</p>`,
  },

  statusResponse: {
    type: 'concept', id: 'c-status-response', title: 'HTTP status ของ error และรูปแบบ response (สามแบบในวิชานี้)',
    source: `${SRC} §Handling Errors, §Express: Error-handling Middleware; ${TPL}/app.js; ${ASG} §1.2`,
    body: `<table><tr><th>Status</th><th>ความหมาย</th></tr>
      <tr><td>400 Bad Request</td><td>client ส่ง request ไม่ถูกต้อง เช่น ขาด body/พารามิเตอร์ที่จำเป็น</td></tr>
      <tr><td>401 Unauthorized</td><td>client ยังไม่ผ่านการ authenticate</td></tr>
      <tr><td>403 Forbidden</td><td>authenticate แล้วแต่ไม่มีสิทธิ์เข้าถึง resource</td></tr>
      <tr><td>404 Not Found</td><td>ไม่มี resource ที่ร้องขอ</td></tr>
      <tr><td>409 Conflict</td><td>request ชนกับสถานะปัจจุบันของ resource</td></tr>
      <tr><td>412 Precondition Failed</td><td>เงื่อนไขใน request header เป็น false</td></tr>
      <tr><td>500 Internal Server Error</td><td>server เกิด error ทั่วไป</td></tr>
      <tr><td>503 Service Unavailable</td><td>บริการที่ร้องขอใช้งานไม่ได้</td></tr></table>
      ${code("// error handler (สไลด์)\napp.use(function (err, req, res, next) {\n    const status = err.status || 500;\n    res.status(status);\n    res.json( {\n           error: err.code,\n           statusCode: status,\n           message: err.message,\n           path: req.originalUrl,\n           timestamp: new Date().toLocaleString()\n       }\n    );\n});")}
      <p><b>รูปแบบ response ที่พบในวิชานี้ ไม่เหมือนกัน</b> — อ่านโจทย์ให้ดีว่าโจทย์ใช้แบบไหน:</p>
      <table><tr><th>แหล่ง</th><th>field ของ error</th><th>รูป JSON</th></tr>
      <tr><td>สไลด์</td><td><code>err.status</code>, <code>err.code</code></td><td><code>{error, statusCode, message, path, timestamp}</code></td></tr>
      <tr><td>template (<code>app.js</code>)</td><td><code>err.statusCode</code>, <code>err.code</code></td><td><code>{status: &lt;ตัวเลข&gt;, error, message, resource, timestamp}</code></td></tr>
      <tr><td>งานส่ง</td><td><code>AppError(message, statusCode, errorCode)</code></td><td><code>{status: "error", error: {code, message}}</code> (สำเร็จ: <code>{status: "success", data}</code>)</td></tr></table>`,
  },

  layersAssignment: {
    type: 'concept', id: 'c-layers-assignment', title: 'error ในทุกชั้น, MySQL error code และกติกาของงานส่ง',
    source: `${SRC} §Layered System; ${TPL}/repositories/example-repo.js; ${ASG} §1, §1.3, §3`,
    body: `<p>ตาม Layered System error ไหลย้อนขึ้นมาทีละชั้น: <b>Repository → Service → Controller → (error middleware) → Client</b> แต่ละชั้นโยน error ขึ้นไป ไม่ตอบ client เอง — ชั้นที่ตอบมีที่เดียวคือ error-handling middleware</p>
      ${code("// template: repository โยน error ที่มี status/code\nexport async function findOne(id) {\n    const [data] = await db.query(FIND_ONE_SQL, [id])\n    if (data.length === 0) {\n        const err = new Error(`${ENTITY_NAME} not found for id = ${id}`)\n        err.statusCode = 404\n        err.code = \"NOT FOUND\"\n        throw err\n    }\n    return data[0]\n}")}
      <p>error จากฐานข้อมูลมี <code>err.code</code> ของ MySQL — error middleware กลางแปลงเป็น client error:</p>
      <table><tr><th>MySQL error</th><th>ความหมาย</th><th>ตอบ</th></tr>
      <tr><td><code>ER_DUP_ENTRY</code> (1062)</td><td>primary key / unique ซ้ำ</td><td>409 <code>DUPLICATE_KEY</code></td></tr>
      <tr><td><code>ER_NO_REFERENCED_ROW_2</code> (1452)</td><td>foreign key ที่อ้างถึงไม่มีจริง</td><td>400 <code>FOREIGN_KEY_NOT_FOUND</code></td></tr>
      <tr><td><code>ER_ROW_IS_REFERENCED_2</code> (1451)</td><td>ลบ/แก้แถวที่ถูกอ้างอิงอยู่</td><td>409 <code>RESOURCE_IN_USE</code></td></tr></table>
      <p><b>งานส่ง (แบบฝึกหัด CRUD + Centralized Exception Handling)</b> — 5 โจทย์ในโมดูลนี้คือ<b>ตัวตรวจอัตโนมัติ</b>ให้ทดสอบงานของตัวเอง:</p>
      <ul><li>ต้อง<b>ระบุรหัสนักศึกษาของตนเองใน path โดยตรง</b> (เช่น <code>/api/66011234/offices</code>) — ห้ามใช้ route parameter <code>:studentId</code></li>
      <li>response ต้องเป็น JSON มาตรฐาน <code>status/data/error</code> ห้ามหลุดเป็นหน้า HTML error ของ Express</li>
      <li>ใน controller ใช้ <code>next(err)</code> ส่ง error มาที่ error middleware กลางจุดเดียว</li></ul>
      <p class="muted">เว็บนี้<b>ไม่มีเฉลย</b>ของงานส่ง — มีแต่ตัวตรวจ · รหัสนักศึกษาที่คุณพิมพ์ในโค้ดเก็บอยู่ในเบราว์เซอร์ของคุณเท่านั้น ไม่ถูกส่งไปที่ใด · ข้อมูลตัวอย่างในตัวจำลองเป็นชุดเล็กที่สร้างขึ้นเองเพื่อฝึก ไม่ใช่ฐานข้อมูลจริง</p>`,
  },
};
