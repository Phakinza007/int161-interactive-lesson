export default {
  "id": "theory",
  "title": "อ่านสอบข้อกา · สรุปทฤษฎี W1–W7",
  "sources": [
    "บทเรียน INT161 W1–W7 และประกาศสอบจากผู้ใช้"
  ],
  "blocks": [
    {
      "type": "concept",
      "id": "theory-web",
      "title": "Web application, SPA/MPA และ JSON",
      "source": "สรุปทบทวนจากบท W1 ของ INT161; ไม่ใช่ข้อสอบหรือเฉลยจากอาจารย์",
      "body": "<p><b>หน้านี้ใช้ทบทวนข้อกาทฤษฎี:</b> ตามประกาศมี 52 ข้อ 50 คะแนน เวลา 1 ชั่วโมง เลือกคำตอบเดียว Close Book และใช้ดินสอ เนื้อหาครอบคลุมทุกหัวข้อที่บรรยาย สรุปนี้รวม W1–W7 ที่มีในเว็บ เป็นเครื่องมือทบทวน ไม่ใช่การรับประกันข้อสอบ</p><table><thead><tr><th>คำ</th><th>จำว่า</th></tr></thead><tbody><tr><td>Client / Server</td><td>Client ส่ง request; server ประมวลผลแล้วส่ง response</td></tr><tr><td>Front-end / Back-end</td><td>Front-end จัดการส่วนติดต่อผู้ใช้; back-end จัดการบริการ กฎ และข้อมูล</td></tr><tr><td>MPA</td><td>การเปลี่ยนหน้ามักขอเอกสารหน้าใหม่จาก server</td></tr><tr><td>SPA</td><td>โหลดหน้าเริ่มต้น แล้วใช้ JavaScript ขอข้อมูลมาอัปเดตบางส่วน</td></tr><tr><td>AJAX</td><td>แนวทางสื่อสารกับ server แบบ asynchronous โดยไม่ต้องโหลดหน้าใหม่ทั้งหน้า</td></tr><tr><td>JSON</td><td>รูปแบบข้อมูลข้อความ แลกเปลี่ยนได้หลายภาษา ไม่ใช่ฐานข้อมูล</td></tr><tr><td>SOAP / REST</td><td>SOAP เป็น protocol; REST เป็นรูปแบบสถาปัตยกรรม SOAP มักใช้ XML; REST รองรับ representation หลายแบบรวม JSON</td></tr></tbody></table><p><b>แยกให้ได้:</b> JSON ไม่ใช่ JavaScript object โดยตรง การส่งผ่านเครือข่ายต้อง serialize; JSON ใช้ชื่อ key และ string ใน double quotes และไม่มี comment/function/undefined</p>"
    },
    {
      "type": "concept",
      "id": "theory-runtime",
      "title": "Node.js, compiler และระบบ module",
      "source": "สรุปทบทวนจากบท W1 ของ INT161; ไม่ใช่ข้อสอบหรือเฉลยจากอาจารย์",
      "body": "<p><b>JavaScript เป็นภาษา · Node.js เป็น runtime · Express เป็น framework</b> Node.js ทำให้รัน JavaScript นอก browser ได้ ใช้ V8 เป็น JavaScript engine</p><table><thead><tr><th>เรื่อง</th><th>จุดจำ</th></tr></thead><tbody><tr><td>Compiler</td><td>แปลโปรแกรมก่อนนำผลไปรัน เป็นโมเดลพื้นฐานที่สไลด์เปรียบเทียบ</td></tr><tr><td>Interpreter</td><td>ประมวลผลผ่านตัวแปลระหว่างรัน; การอธิบายว่าแปลทีละบรรทัดเป็นภาพจำแบบง่าย</td></tr><tr><td>Hybrid / VM / JIT</td><td>ผสมการแปล/ประมวลผล เช่น bytecode และการ compile ระหว่างรัน ไม่ควรสรุปว่าทุกภาษามีกลไกเหมือนกัน</td></tr><tr><td>npm / package.json</td><td>npm จัดการ packages; package.json เก็บข้อมูลโปรเจกต์ dependencies และ scripts</td></tr><tr><td>CJS</td><td>CommonJS ใช้ require() และ module.exports</td></tr><tr><td>ESM</td><td>ES Modules ใช้ import/export; template วิชาใช้ \"type\": \"module\"</td></tr><tr><td>Core module</td><td>มากับ Node เช่น http, fs, path, os, events; Express และ mysql2 ต้องติดตั้งเพิ่ม</td></tr></tbody></table><p><b>จุดสับสน:</b> ไม่ใช่ทุก module ต้อง npm install และ Express ไม่ใช่ database driver</p>"
    },
    {
      "type": "concept",
      "id": "theory-async",
      "title": "Event loop, non-blocking, callback และ Promise",
      "source": "สรุปทบทวนจากบท W2 ของ INT161; ไม่ใช่ข้อสอบหรือเฉลยจากอาจารย์",
      "body": "<p>JavaScript ใน event loop หลักของ Node ทำงานทีละงาน ส่วน I/O อาจให้ระบบปฏิบัติการหรือ libuv/thread pool ดูแล แล้วส่งผลกลับมาประมวลผลภายหลัง จึงไม่เท่ากับว่า Node ทั้งระบบมีเพียง thread เดียว</p><table><thead><tr><th>คำ</th><th>ความหมาย</th></tr></thead><tbody><tr><td>Blocking</td><td>งานขัดขวางไม่ให้ thread เดิมไปทำงานอื่นระหว่างรอ/ประมวลผล</td></tr><tr><td>Non-blocking I/O</td><td>เริ่ม I/O แล้วคืนการควบคุมก่อน งานเสร็จจึงแจ้งผลกลับ</td></tr><tr><td>Callback</td><td>ฟังก์ชันที่ส่งไว้ให้เรียกภายหลัง; API ของ mysql2 แบบ callback มักรับ (err, results, fields)</td></tr><tr><td>Promise</td><td>ตัวแทนผลลัพธ์ asynchronous: pending, fulfilled หรือ rejected</td></tr><tr><td>async function</td><td>คืน Promise; การ return ค่าภายในกลายเป็นค่าที่ Promise resolve</td></tr><tr><td>await</td><td>รอ Promise ภายใน async function; ไม่ได้หยุดทั้ง Node process และไม่ทำให้ callback API กลายเป็น Promise API</td></tr></tbody></table><p><b>จำ:</b> async/await ไม่ได้ทำให้งานคำนวณหนักเป็นงานขนานอัตโนมัติ และการใช้ await กับ query แบบ callback ไม่ได้รับประกันว่าจะรอผลฐานข้อมูล ต้องใช้ promise API ให้ถูก</p>"
    },
    {
      "type": "concept",
      "id": "theory-http",
      "title": "HTTP request/response, URL และ stream",
      "source": "สรุปทบทวนจากบท W2 ของ INT161; ไม่ใช่ข้อสอบหรือเฉลยจากอาจารย์",
      "body": "<table><thead><tr><th>ส่วน</th><th>สิ่งที่อยู่ในนั้น</th></tr></thead><tbody><tr><td>Request line</td><td>Method, request target และ HTTP version</td></tr><tr><td>Request headers</td><td>ข้อมูลกำกับ เช่น Content-Type และ Host</td></tr><tr><td>Request body</td><td>payload ที่ client ส่งมาเมื่อ endpoint ต้องใช้</td></tr><tr><td>Response status line</td><td>HTTP version และ status code</td></tr><tr><td>Response headers</td><td>metadata ของ response เช่น Content-Type</td></tr><tr><td>Response body</td><td>ข้อมูลที่ส่งกลับ เช่น JSON; response แบบ 204 ไม่มี body</td></tr></tbody></table><p><code>/products/7?page=2&amp;limit=10</code>: path ระบุ resource; ค่า 7 เป็น path parameter เมื่อ route ประกาศ :id ส่วน page/limit เป็น query parameters หลัง ? และคั่นด้วย &amp;</p><table><thead><tr><th>Node HTTP</th><th>หน้าที่</th></tr></thead><tbody><tr><td>http.Server</td><td>server ที่รับ request</td></tr><tr><td>http.IncomingMessage</td><td>ข้อมูล request ฝั่ง server; อ่าน body เป็น stream</td></tr><tr><td>http.ServerResponse</td><td>ใช้เขียน headers/body แล้วจบ response</td></tr><tr><td>http.ClientRequest</td><td>request ที่ส่งออกจาก client ฝั่ง Node</td></tr><tr><td>writeHead / write / end</td><td>ตั้ง status+headers / เขียน body / จบ response</td></tr><tr><td>URLSearchParams.get / getAll</td><td>อ่านค่าเดียว / อ่านทุกค่าของชื่อ query ที่ซ้ำกันเป็น array</td></tr></tbody></table><p><b>จุดสับสน:</b> body อาจมาหลาย chunks ต้องรออ่านครบก่อน parse JSON; URL query โดยทั่วไปมาเป็นข้อความ จึงต้องแปลงและตรวจค่าก่อนคำนวณ</p>"
    },
    {
      "type": "concept",
      "id": "theory-rest",
      "title": "REST constraints และ Uniform Interface",
      "source": "สรุปทบทวนจากบท W3 ของ INT161; ไม่ใช่ข้อสอบหรือเฉลยจากอาจารย์",
      "body": "<p>REST ย่อมาจาก REpresentational State Transfer อธิบายโดย Roy Fielding ใช้ resource และ representation; REST ไม่ได้บังคับให้ใช้ JSON อย่างเดียว</p><table><thead><tr><th>Constraint</th><th>ความหมาย</th></tr></thead><tbody><tr><td>Client–Server</td><td>แยกหน้าที่ client กับ server</td></tr><tr><td>Stateless</td><td>แต่ละ request มีข้อมูลเพียงพอให้เข้าใจได้เอง; ไม่ต้องอาศัย session context ของ request ก่อนหน้า</td></tr><tr><td>Cacheable</td><td>ระบุได้ว่า response เก็บ cache ได้หรือไม่</td></tr><tr><td>Uniform Interface</td><td>สื่อสารผ่าน contract ที่สม่ำเสมอ</td></tr><tr><td>Layered System</td><td>client ติดต่อชั้นที่เห็นอยู่ได้โดยไม่ต้องรู้ทุกชั้นภายใน</td></tr><tr><td>Code on demand</td><td>ส่งโค้ดไปให้ client รันเพิ่มเติม เป็นข้อกำหนดที่ optional</td></tr></tbody></table><p><b>Uniform Interface มี 4 ส่วน:</b> Resource Identification (URI), Manipulation through Representations, Self-Descriptive Messages และ HATEOAS (ลิงก์บอกสิ่งที่ทำต่อได้)</p><p><b>แยกให้ได้:</b> Stateless ไม่ได้แปลว่า server ไม่มี database หรือห้ามเก็บข้อมูล resource และไม่ใช่คำเดียวกับ non-blocking</p>"
    },
    {
      "type": "concept",
      "id": "theory-contract",
      "title": "HTTP methods, resource และ status codes",
      "source": "สรุปทบทวนจากบท W3 ของ INT161; ไม่ใช่ข้อสอบหรือเฉลยจากอาจารย์",
      "body": "<table><thead><tr><th>Method</th><th>แนวใช้ในวิชา</th></tr></thead><tbody><tr><td>GET</td><td>อ่านรายการหรือรายตัว</td></tr><tr><td>POST</td><td>เพิ่ม resource</td></tr><tr><td>PUT</td><td>แก้ข้อมูล resource ตาม contract</td></tr><tr><td>DELETE</td><td>ลบ resource</td></tr></tbody></table><p>แนวตั้งชื่อในวิชาใช้คำนามพหูพจน์ เช่น /products แล้วให้ method บอกการกระทำ; /products คือ collection, /products/7 คือรายตัว และ /customers/7/payments คือ sub-collection</p><table><thead><tr><th>Status</th><th>ความหมาย</th></tr></thead><tbody><tr><td>200 OK</td><td>สำเร็จและอาจมี response body</td></tr><tr><td>201 Created</td><td>สร้าง resource สำเร็จ</td></tr><tr><td>204 No Content</td><td>สำเร็จ โดยไม่มี response body</td></tr><tr><td>400 Bad Request</td><td>ข้อมูล/คำขอไม่ผ่านเงื่อนไขที่กำหนด</td></tr><tr><td>404 Not Found</td><td>ไม่พบ resource/route ที่ร้องขอ</td></tr><tr><td>409 Conflict</td><td>คำขอขัดแย้งกับสถานะข้อมูล เช่น unique key ซ้ำ</td></tr><tr><td>500 Internal Server Error</td><td>เกิดข้อผิดพลาดภายใน server</td></tr></tbody></table><p><b>จำ:</b> 2xx สำเร็จ, 4xx ปัญหาคำขอจาก client, 5xx ปัญหาฝั่ง server การลบไม่ได้มี status เดียวทุกงาน: ชุดงาน W6 ใช้ 200 พร้อม JSON แต่ชุดซ้อม W8 ใช้ 204 ไม่มี body ต้องอ่านสเปก</p>"
    },
    {
      "type": "concept",
      "id": "theory-express",
      "title": "Express routes, middleware และ request parser",
      "source": "สรุปทบทวนจากบท W5 ของ INT161; ไม่ใช่ข้อสอบหรือเฉลยจากอาจารย์",
      "body": "<p>Express เป็น framework บน Node HTTP ช่วย routing และ middleware มีโครงสร้างแบบ unopinionated คือเลือกจัดเลเยอร์เองได้</p><table><thead><tr><th>API</th><th>หน้าที่</th></tr></thead><tbody><tr><td>req.params</td><td>ค่าที่จับจาก path เช่น :id</td></tr><tr><td>req.query</td><td>ค่าจาก query string เช่น page และ limit</td></tr><tr><td>req.body</td><td>body ที่ middleware parse แล้ว</td></tr><tr><td>express.json()</td><td>parse JSON request ที่ Content-Type ตรง ก่อน route ใช้ req.body</td></tr><tr><td>express.Router()</td><td>แยกชุด routes ออกจาก app หลัก</td></tr><tr><td>res.status(code)</td><td>ตั้ง status และคืน res; ยังไม่จบ response ด้วยตัวเอง</td></tr><tr><td>res.json(value)</td><td>ส่งค่าในรูปแบบ JSON</td></tr><tr><td>next()</td><td>ส่งการควบคุมไป middleware/handler ถัดไป</td></tr><tr><td>next(err)</td><td>ส่งเข้าสาย error handling</td></tr></tbody></table><p><b>ลำดับสำคัญ:</b> JSON/pagination middleware มาก่อน routes ที่ใช้มัน และ error middleware อยู่หลัง routes ที่จะส่ง error มาให้ handler ที่ไม่ตอบและไม่เรียก next อาจทำให้ request ค้าง; หลังตอบแล้วอย่าตอบซ้ำ</p>"
    },
    {
      "type": "concept",
      "id": "theory-layers",
      "title": "Controller, Service, Repository และ Mapper",
      "source": "สรุปทบทวนจากบท W5 ของ INT161; ไม่ใช่ข้อสอบหรือเฉลยจากอาจารย์",
      "body": "<table><thead><tr><th>ชั้น</th><th>รับผิดชอบ</th><th>จุดสังเกต</th></tr></thead><tbody><tr><td>Route / Controller</td><td>HTTP method/path, รับ input, เรียก service, ส่ง status/JSON</td><td>พบ req และ res</td></tr><tr><td>Service</td><td>กฎธุรกิจ ตรวจเงื่อนไขและประสานงาน</td><td>เช่น ตรวจข้อมูลซ้ำก่อนสร้าง</td></tr><tr><td>Repository</td><td>เข้าถึงและบันทึกข้อมูล</td><td>พบ SQL / database driver</td></tr><tr><td>Mapper</td><td>แปลง Entity เป็น DTO ตาม contract</td><td>เลือกและเปลี่ยนชื่อฟิลด์</td></tr></tbody></table><p><b>ทางไป:</b> Request → Controller → Service → Repository → Database<br><b>ทางกลับ:</b> ข้อมูล → Service/Mapper → Controller → Response</p><p><b>จำ:</b> Service ไม่ควรผูกกับ res.json และ Repository ไม่ควรเลือก HTTP status เองในทุก query การตรวจรูปแบบ request ทำได้ที่ขอบ API ส่วนกฎธุรกิจอยู่ service ตามข้อตกลงของโปรเจกต์</p>"
    },
    {
      "type": "concept",
      "id": "theory-database",
      "title": "Database driver, Connection/Pool และ SQL",
      "source": "สรุปทบทวนจากบท W4 ของ INT161; ไม่ใช่ข้อสอบหรือเฉลยจากอาจารย์",
      "body": "<p>Database driver เป็นตัวกลางให้โปรแกรมสื่อสารกับ DBMS สำหรับวิชาใช้ mysql2; config ที่สำคัญคือ host, user, password และ database</p><table><thead><tr><th>เรื่อง</th><th>จุดจำ</th></tr></thead><tbody><tr><td>Connection</td><td>การเชื่อมต่อฐานข้อมูลหนึ่ง connection</td></tr><tr><td>Connection pool</td><td>จัดการและนำ connections กลับมาใช้ซ้ำ ลดการเปิด/ปิดใหม่ทุก request</td></tr><tr><td>pool.end()</td><td>ปิด pool เมื่อเลิกใช้; ไม่ใช่สิ่งที่ต้องทำหลังทุก request ของ server</td></tr><tr><td>SELECT / INSERT / UPDATE / DELETE</td><td>อ่าน / เพิ่ม / แก้ไข / ลบข้อมูล</td></tr><tr><td>WHERE</td><td>เลือกแถวตามเงื่อนไข; ลืมใน UPDATE/DELETE อาจกระทบหลายแถว</td></tr><tr><td>ORDER BY</td><td>เรียงลำดับผลลัพธ์</td></tr><tr><td>Placeholders ?</td><td>ผูกค่าข้อมูลแยกจาก SQL แทนการต่อ input เข้า string</td></tr><tr><td>Prepared statement</td><td>เตรียมคำสั่งแยกจากค่าพารามิเตอร์; mysql2 มี execute() สำหรับ prepared statement และ query() สำหรับ query API</td></tr></tbody></table><p><b>แยกให้ได้:</b> primary key ระบุแถว ไม่ใช่ตำแหน่ง index ใน array; SQL placeholders สำหรับค่าข้อมูลไม่ใช่ตัวแทนชื่อตารางอิสระ</p>"
    },
    {
      "type": "concept",
      "id": "theory-db-results",
      "title": "ผล query, keys และ constraint errors",
      "source": "สรุปทบทวนจากบท W4 ของ INT161; ไม่ใช่ข้อสอบหรือเฉลยจากอาจารย์",
      "body": "<p>mysql2/promise คืนโครงสร้าง [results, fields] สำหรับ SELECT results เป็น rows array จึงมักใช้ const [rows] = await db.query(...); แถวแรกคือ rows[0] ถ้าไม่มีแถวจะได้ array ว่าง</p><table><thead><tr><th>เรื่อง</th><th>ความหมาย</th></tr></thead><tbody><tr><td>INSERT / UPDATE / DELETE result</td><td>เป็นข้อมูลผลการแก้ไข เช่น insertId, affectedRows ไม่ใช่ rows ของ SELECT</td></tr><tr><td>insertId</td><td>ID ที่สร้างแบบ auto-increment ในกรณีที่เกี่ยวข้อง ไม่ใช่ค่ารับประกันสำหรับทุกตาราง</td></tr><tr><td>affectedRows</td><td>จำนวนแถวตามผล operation; ไม่ใช่จำนวนแถวทั้งหมดในตาราง</td></tr><tr><td>Primary key</td><td>ระบุแถว ไม่ซ้ำ และไม่เป็น NULL</td></tr><tr><td>Unique constraint</td><td>บังคับความไม่ซ้ำตามคอลัมน์/ชุดคอลัมน์</td></tr><tr><td>Foreign key</td><td>รักษาความสัมพันธ์กับแถวที่อ้างอิง</td></tr><tr><td>Composite primary key</td><td>ใช้หลายคอลัมน์ร่วมกันเป็น key เช่น customerNumber + checkNumber</td></tr></tbody></table><p><b>จำ:</b> checkNumber เดิมในลูกค้าคนละคนอาจไม่ชน composite key แต่คู่ customerNumber/checkNumber เดิมชน และการใช้ await ต้องต่อให้ครบ repository → service → route เพื่อไม่ตอบด้วย Promise แทนข้อมูลที่ต้องการ</p>"
    },
    {
      "type": "concept",
      "id": "theory-errors",
      "title": "Exception, AppError และ centralized error handling",
      "source": "สรุปทบทวนจากบท W6 ของ INT161; ไม่ใช่ข้อสอบหรือเฉลยจากอาจารย์",
      "body": "<p>Error เกิดได้ทุกเลเยอร์ ถ้าไม่มีใครจัดการจะทำให้งานล้มเหลวและอาจทำให้ process จบได้ try/catch ใช้จับ error ในขอบเขตการทำงานนั้น; rejected Promise ที่ await ภายใน try สามารถเข้า catch ได้</p><p>AppError เพิ่มข้อมูลของแอป เช่น status/statusCode และ errorCode ซึ่งเป็นชื่อที่ทีมกำหนดเอง ต้องใช้ให้ตรงกัน handler กลางของ Express มี <b>4 parameters: (err, req, res, next)</b> ส่วน middleware ปกติมักมี 3</p><table><thead><tr><th>เหตุการณ์ในงาน W6</th><th>MySQL code</th><th>HTTP ที่โจทย์กำหนด</th></tr></thead><tbody><tr><td>คีย์ซ้ำ</td><td>ER_DUP_ENTRY / 1062</td><td>409</td></tr><tr><td>อ้าง foreign key ที่ไม่มีจริง</td><td>ER_NO_REFERENCED_ROW_2 / 1452</td><td>400</td></tr><tr><td>ลบแถวที่ยังถูกแถวอื่นอ้างอิง</td><td>ER_ROW_IS_REFERENCED_2 / 1451</td><td>409</td></tr><tr><td>ค้น resource รายตัวไม่พบ</td><td>แอปตรวจเอง / AppError</td><td>404</td></tr><tr><td>Input ไม่ผ่าน validation</td><td>แอปตรวจเอง / AppError</td><td>400</td></tr></tbody></table><p><b>จุดสับสน:</b> next(err) ไม่ใช่ next(); catch แล้วไม่ตอบหรือไม่ส่งต่ออาจทำให้คำขอค้าง; ไม่ควรส่ง password, SQL ภายใน หรือ stack trace ให้ client; การได้ 404 ไม่ใช่เหตุให้หยุด server ทุกครั้ง</p>"
    },
    {
      "type": "concept",
      "id": "theory-pagination",
      "title": "Pagination: สูตร, COUNT และหน้าว่าง",
      "source": "สรุปทบทวนจากบท W7 ของ INT161; ไม่ใช่ข้อสอบหรือเฉลยจากอาจารย์",
      "body": "<p>Pagination ลดขนาด response และงานที่ต้องส่งข้อมูลทีเดียวทั้ง collection ในสไลด์/template ใช้ <b>page เริ่ม 1</b> และ limit เป็นจำนวนสูงสุดต่อหน้า</p><table><thead><tr><th>สิ่งที่หา</th><th>สูตร/ความหมาย</th></tr></thead><tbody><tr><td>offset</td><td>(page - 1) × limit</td></tr><tr><td>totalPages</td><td>Math.ceil(total / limit)</td></tr><tr><td>hasNextPage</td><td>page × limit &lt; total</td></tr><tr><td>hasPrevPage</td><td>page &gt; 1</td></tr><tr><td>LIMIT</td><td>จำนวนสูงสุดที่จะอ่าน</td></tr><tr><td>OFFSET</td><td>จำนวนแถวที่ข้าม</td></tr><tr><td>COUNT(*)</td><td>นับจำนวนแถวที่ตรงเงื่อนไขทั้งหมด</td></tr></tbody></table><p><b>ตัวอย่าง:</b> page=3, limit=10 → offset=20 คือข้าม 20 แถว แล้วเอาสูงสุด 10 แถว ถ้า total=75 จะมี 8 หน้า หน้า 8 มีได้ 5 รายการ</p><p><b>จำ:</b> total ไม่เท่ากับ data.length เสมอ หน้าเกินข้อมูลอาจได้ [] ตามสเปก แต่ total ยังต้องถูกต้อง; total=0 ต้องไม่หายเพราะ if(total) เป็น false ต้องใช้ limit ที่ตรวจ/จำกัดแล้วคำนวณ offset และใช้ ORDER BY ที่แน่นอน ถ้ามี filter ให้ COUNT ใช้เงื่อนไขเดียวกัน</p><p>สไลด์มีตัวอย่างภาพ page=2 แต่ hasPreviousPage=false ที่ไม่ตรงกับสูตร บทสรุปนี้ยึด page&gt;1 และต้องตรวจชื่อฟิลด์ เช่น total/totalItems หรือ hasPrevPage/hasPreviousPage ตามสเปก</p>"
    },
    {
      "type": "concept",
      "id": "theory-dto",
      "title": "Entity, Request DTO, Response DTO และจุดจำก่อนสอบ",
      "source": "สรุปทบทวนจากบท W7 ของ INT161; ไม่ใช่ข้อสอบหรือเฉลยจากอาจารย์",
      "body": "<table><thead><tr><th>คำ</th><th>จุดจำ</th></tr></thead><tbody><tr><td>Entity</td><td>ข้อมูลภายในที่แทน domain/ข้อมูลที่เก็บในฐานข้อมูล</td></tr><tr><td>Request DTO</td><td>รูปแบบข้อมูลที่ API รับเข้า</td></tr><tr><td>Response DTO</td><td>รูปแบบข้อมูลที่ API ส่งออก</td></tr><tr><td>Summary DTO</td><td>ฟิลด์สรุปที่เหมาะกับหน้ารายการ</td></tr><tr><td>Detail DTO</td><td>ฟิลด์รายละเอียดที่ endpoint รายตัวต้องการ</td></tr><tr><td>Mapper</td><td>แปลง Entity ↔ รูปแบบข้อมูลที่ต้องใช้ตาม contract</td></tr></tbody></table><p><b>ทำไมต้อง DTO:</b> คุมรูปทรงข้อมูล ลดการผูก client กับ schema ฐานข้อมูล และลดโอกาสเปิดเผยฟิลด์เกินจำเป็น เช่น password_hash ใช้การเลือกฟิลด์ชัดเจนแทนการส่ง entity ทั้งก้อน</p><p><b>จุดสับสน:</b> DTO ไม่ใช่ตารางใหม่, ไม่ได้เข้ารหัสข้อมูลให้เอง และไม่ได้ตรวจ validation ให้เองอัตโนมัติ การเปลี่ยน stock_quantity เป็น stockQuantity เป็นการ mapping ชื่อฟิลด์ ส่วน Summary/Detail ต้องดูสเปก ไม่จำเป็นต้องมีฟิลด์เท่ากัน</p><p><b>ก่อนเข้าห้องสอบ ตอบให้ได้:</b> Node/Express ต่างกันอย่างไร · params/query/body อยู่ไหน · 200/201/204 ต่างกันอย่างไร · แต่ละเลเยอร์ทำอะไร · Promise/await ทำงานอย่างไร · [rows] กับ rows[0] ต่างกันอย่างไร · PK/FK/composite key คืออะไร · next(err) ไปไหน · offset/totalPages คิดอย่างไร · Entity/DTO ต่างกันอย่างไร</p>"
    }
  ]
};
