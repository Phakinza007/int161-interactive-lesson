export default {
  "id": "midterm",
  "title": "เตรียมสอบกลางภาค · CRUD, DTO, Pagination",
  "sources": [
    "Week-08 Practice Exam Simulation/exam-spec-*.md",
    "midterm-exam-esm-template.zip/src",
    "ประกาศสอบกลางภาคจากผู้ใช้"
  ],
  "blocks": [
    {
      "type": "concept",
      "id": "c-exam-rules",
      "title": "ขอบเขตสอบและกติกา",
      "body": "<p><a href=\"lesson.html?m=theory\">เปิดหน้าอ่านสอบข้อกาอย่างเดียว →</a></p><p><b>ทฤษฎี:</b> ทุกหัวข้อที่บรรยาย; ปรนัยเลือกคำตอบเดียว 52 ข้อ 50 คะแนน เวลา 1 ชั่วโมง Close Book และใช้ดินสอ</p><p><b>ปฏิบัติ:</b> เน้น CRUD, DTO, Pagination, Exception Handling มี 6 ข้อ: 1C, 3R, 1U, 1D รวมคะแนนดิบ 110 คะแนน คะแนนเต็ม 100 ตามประกาศ</p><p>ปฏิบัติอนุญาตเอกสาร hard copy/soft copy ดาวน์โหลดไฟล์ภายใน 15 นาทีก่อนสอบ ระหว่างสอบห้ามต่ออินเทอร์เน็ต รับ/ส่ง project ผ่าน LEB2 และเตรียมบัญชีให้พร้อม</p><p>ประกาศที่ส่งมาไม่ได้ระบุระยะเวลาปฏิบัติ อย่านำเวลา 120 นาทีของชุดซ้อมมาแทนเวลาสอบจริง</p>",
      "source": "ประกาศสอบกลางภาคที่ผู้ใช้ส่งในบทสนทนา วันที่ 21 ต.ค. 2026"
    },
    {
      "type": "concept",
      "id": "c-exam-topic-map",
      "title": "รายการทบทวนทฤษฎีครบทุกส่วน",
      "body": "<ul><li><a href=\"lesson.html?m=w1\">W1:</a> Web application, Node.js และ module</li><li><a href=\"lesson.html?m=w2\">W2:</a> HTTP request/response, headers, body, status</li><li><a href=\"lesson.html?m=w3\">W3:</a> REST, resource, method, path/query parameters, JSON</li><li><a href=\"lesson.html?m=w4\">W4:</a> MySQL, connection pool, async/await, prepared statements, CRUD</li><li><a href=\"lesson.html?m=w5\">W5:</a> Express routes/middleware และ Controller/Service/Repository</li><li><a href=\"lesson.html?m=w6\">W6:</a> try/catch, custom error, next(err), error middleware</li><li><a href=\"lesson.html?m=w7\">W7:</a> Pagination, metadata, Entity/DTO และ mapper</li></ul><p>รายการนี้ใช้จัดลำดับอ่าน ไม่ใช่การรับประกันข้อสอบ; ประกาศระบุว่าครอบคลุมทุกหัวข้อที่บรรยาย</p>",
      "source": "เนื้อหา W1–W7 และประกาศสอบกลางภาค"
    },
    {
      "type": "concept",
      "id": "c-exam-template",
      "title": "อ่าน template: จุดที่ยังต้องเติม",
      "body": "<table><tr><th>ไฟล์/เลเยอร์</th><th>งานที่ต้องตรวจและเติมตามสเปก</th></tr><tr><td>app.js</td><td>base path/รหัสของตนเอง, queryParser ก่อน router, error middleware ที่ตอบจริง</td></tr><tr><td>db-config.js</td><td>host, user, password, database ที่ใช้สอบ</td></tr><tr><td>route.js</td><td>JSON response, status, PUT ส่ง id และ req.body เข้า service</td></tr><tr><td>service.js</td><td>ส่ง pagination/view ต่อ; แปลง null เป็น not-found ตามข้อตกลง</td></tr><tr><td>repository.js</td><td>ชื่อตาราง/primary key, SELECT/CRUD และ COUNT(*) ที่ตรงเงื่อนไข</td></tr><tr><td>mapper / api-response</td><td>ฟิลด์ DTO, total=0, envelope และ metadata ตามสเปก</td></tr></table><p>template เป็นโครงเริ่มต้น มี placeholder และโค้ดที่ยังไม่ครบ จึงไม่ใช่เฉลยพร้อมรันผ่านทุกข้อ</p><p><b>Exception Handling:</b> ถ้า repository คืน null ต้องตรวจแล้วส่ง 404; ถ้าโยน error ให้ route ส่งต่อด้วย next(err) และใช้ middleware (err, req, res, next) หลัง router เพื่อส่ง response เพียงครั้งเดียว ตรวจ duplicate ก่อน create และจัดการ unique constraint ของฐานข้อมูลตามสเปกด้วย ไม่ส่ง SQL/password/stack ภายในกลับ client</p>",
      "source": "midterm-exam-esm-template.zip/src"
    },
    {
      "type": "concept",
      "id": "c-exam-contract",
      "title": "อ่านสเปกก่อนเขียน: method, path, input, output",
      "body": "<p>ทำตาราง contract ของแต่ละ endpoint ก่อนลงมือ: method/path, params/query/body, status สำเร็จ, response DTO และ error cases</p><table><tr><th>ตัวอย่าง Week 08</th><th>สำเร็จ</th><th>กรณีผิดพลาด</th></tr><tr><td>GET brands / brands/:id</td><td>200</td><td>รายตัวไม่พบ → 404</td></tr><tr><td>GET products / products/:id</td><td>200 + Summary/Detail DTO</td><td>รายตัวไม่พบ → 404</td></tr><tr><td>POST products</td><td>201</td><td>SKU ซ้ำ → 409</td></tr><tr><td>PUT products/:id</td><td>200</td><td>ไม่พบ → 404</td></tr><tr><td>DELETE products/:id</td><td>204 ไม่มี body</td><td>ไม่พบ → 404</td></tr></table><p>Week 08 มี student-info และเงื่อนไขรายบุคคล ให้ใช้รหัส/ข้อมูลที่ได้รับของตนเอง จำนวน endpoint ในชุดซ้อมไม่ใช่คำยืนยันว่า 6 ข้อสอบจริงจะเป็น endpoint เดียวกัน</p>",
      "source": "Week-08 Practice Exam Simulation/exam-spec-*.md"
    },
    {
      "type": "concept",
      "id": "c-exam-offline",
      "title": "เตรียมไฟล์ออฟไลน์และวิธีไล่ตรวจ",
      "body": "<ol><li>เตรียม template, สไลด์, SQL, สเปก และ test runner ที่อาจารย์ให้; ตรวจว่าเปิดได้</li><li>ติดตั้ง dependencies ในช่วงที่อนุญาต และลองรัน project/ฐานข้อมูลจริงก่อนสอบ</li><li>ตรวจ base path แล้วลอง happy path ของแต่ละ endpoint ด้วย Postman</li><li>ลอง not-found, duplicate, ข้อมูลผิด, หน้าสุดท้าย และหน้าว่าง</li><li>รัน test runner ของโจทย์ อ่าน Expected/Actual แล้วแก้ทีละจุด</li><li>จัด ZIP ตามข้อกำหนดการส่ง ตรวจว่ามี source/config ที่ต้องใช้ และส่ง LEB2</li></ol><p>เว็บนี้มี editor ที่โหลดจาก CDN จึงควรเตรียมสไลด์และตัวอย่างโค้ดเป็นไฟล์ในเครื่องสำหรับการสอบออฟไลน์ ไม่พึ่งว่าเว็บจะเปิดใช้งานได้ในห้องสอบ</p>",
      "source": "Week-08 Practice Exam Simulation/exam-spec-*.md และ transcript INT161_G2_20261015.docx"
    },
    {
      "type": "concept",
      "id": "c-exam-practice",
      "title": "แบบฝึก 6 งาน: 1C, 3R, 1U, 1D",
      "body": "<p>แบบฝึกต่อจากนี้เป็น <b>โจทย์ฝึกที่สร้างเพิ่ม</b> จากหัวข้อสอบ ใช้ข้อมูลสมมติและเก็บใน memory เพื่อฝึก contract แต่ละงาน แยกจากข้อสอบจริงและไม่ได้จำลอง MySQL ของห้องสอบ</p><p>แต่ละข้อมี server เริ่มต้นของตัวเอง ปุ่มตรวจจะทดสอบทั้ง success และกรณีขอบ เฉลยอยู่ในปุ่มดูเฉลยหลังลองทำ แก้ route ที่มี TODO; routes อื่นให้มาเพื่อใช้ตรวจผลต่อเนื่อง</p><p>ชุด Week 09 ที่ชื่อ int261-sample-exam.zip เป็น INT261 (Java/Spring Boot) ตาม transcript วันที่ 15 ต.ค. จึงไม่นำมาปนในเนื้อหา INT161</p>",
      "source": "ประกาศสอบ, Week 08 และ transcript INT161_G2_20261015.docx"
    },
    {
      "type": "experiment",
      "id": "e-exam-contract",
      "title": "ทดลอง API ครบวงจรก่อนทำโจทย์",
      "source": "โจทย์ฝึกเพิ่มเติม อ้างอิงหัวข้อใน Week-08 Practice Exam Simulation/exam-spec-*.md",
      "body": "<p>Run แล้วลอง GET /products?page=2&amp;limit=1, GET /products/999 และ DELETE /products/1 ตรวจ status และ body จากนั้น GET รายการซ้ำ</p>",
      "files": {
        "app.js": "import express from 'express';\nconst app = express();\napp.use(express.json());\nlet products = [{ id: 1, sku: 'PHONE-A', name: 'Phone A', price: 100, internalCost: 50 }, { id: 2, sku: 'PHONE-B', name: 'Phone B', price: 200, internalCost: 90 }];\nconst brands = [{ id: 1, name: 'Example Brand' }];\nconst dto = p => ({ id: p.id, sku: p.sku, name: p.name, price: p.price });\napp.post('/products', (req, res) => {\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.sku === sku)) return res.status(409).json({ success: false });\n  const item = { id: Math.max(0, ...products.map(p => p.id)) + 1, sku, name, price };\n  products.push(item);\n  res.status(201).json({ success: true, data: dto(item) });\n});\n\napp.get('/products', (req, res) => {\n  const page = req.query.page === undefined ? 1 : Number(req.query.page);\n  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger((page-1)*limit)) return res.status(400).json({ success: false });\n  const total = products.length;\n  res.json({ success: true, data: products.slice((page-1)*limit, page*limit).map(dto), pagination: { total, page, limit, totalPages: Math.ceil(total/limit), hasNextPage: page*limit<total, hasPrevPage: page>1 } });\n});\n\napp.get('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.get('/brands', (req, res) => res.json({ success: true, data: brands }));\n\napp.put('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.id !== item.id && p.sku === sku)) return res.status(409).json({ success: false });\n  Object.assign(item, { sku, name, price });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.delete('/products/:id', (req, res) => {\n  const index = products.findIndex(p => p.id === Number(req.params.id));\n  if (index < 0) return res.status(404).json({ success: false });\n  products.splice(index, 1);\n  res.status(204).end();\n});\napp.listen(3000);\n"
      }
    },
    {
      "type": "exercise",
      "id": "x-exam-create",
      "title": "C · POST สินค้าใหม่: 201 และ SKU ซ้ำ 409",
      "source": "โจทย์ฝึกเพิ่มเติมจากหัวข้อสอบ; Week-08 Practice Exam Simulation/exam-spec-*.md",
      "body": "<p><b>Contract:</b> POST /products รับ JSON {sku, name, price}; sku/name ต้องไม่ว่าง, price เป็น number ≥ 0 ถ้าข้อมูลผิดส่ง 400, SKU ซ้ำส่ง 409 มิฉะนั้นเพิ่ม id ใหม่และส่ง 201 พร้อม {success:true,data:{id,sku,name,price}} ต้อง GET รายตัวกลับได้</p><pre><code>{\"sku\":\"PHONE-C\",\"name\":\"Phone C\",\"price\":300}</code></pre><p>แก้ route ที่มี TODO แล้วกดตรวจคำตอบ ข้อมูลและกติกาชุดนี้สร้างเพื่อฝึก ไม่ใช่ข้อสอบจริง</p>",
      "files": {
        "app.js": "import express from 'express';\nconst app = express();\napp.use(express.json());\nlet products = [{ id: 1, sku: 'PHONE-A', name: 'Phone A', price: 100, internalCost: 50 }, { id: 2, sku: 'PHONE-B', name: 'Phone B', price: 200, internalCost: 90 }];\nconst brands = [{ id: 1, name: 'Example Brand' }];\nconst dto = p => ({ id: p.id, sku: p.sku, name: p.name, price: p.price });\napp.post('/products', (req, res) => {\n  // TODO: เติม route นี้ตาม contract ด้านล่าง\n  res.status(501).json({ message: 'TODO' });\n});\n\napp.get('/products', (req, res) => {\n  const page = req.query.page === undefined ? 1 : Number(req.query.page);\n  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger((page-1)*limit)) return res.status(400).json({ success: false });\n  const total = products.length;\n  res.json({ success: true, data: products.slice((page-1)*limit, page*limit).map(dto), pagination: { total, page, limit, totalPages: Math.ceil(total/limit), hasNextPage: page*limit<total, hasPrevPage: page>1 } });\n});\n\napp.get('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.get('/brands', (req, res) => res.json({ success: true, data: brands }));\n\napp.put('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.id !== item.id && p.sku === sku)) return res.status(409).json({ success: false });\n  Object.assign(item, { sku, name, price });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.delete('/products/:id', (req, res) => {\n  const index = products.findIndex(p => p.id === Number(req.params.id));\n  if (index < 0) return res.status(404).json({ success: false });\n  products.splice(index, 1);\n  res.status(204).end();\n});\napp.listen(3000);\n"
      },
      "solution": "import express from 'express';\nconst app = express();\napp.use(express.json());\nlet products = [{ id: 1, sku: 'PHONE-A', name: 'Phone A', price: 100, internalCost: 50 }, { id: 2, sku: 'PHONE-B', name: 'Phone B', price: 200, internalCost: 90 }];\nconst brands = [{ id: 1, name: 'Example Brand' }];\nconst dto = p => ({ id: p.id, sku: p.sku, name: p.name, price: p.price });\napp.post('/products', (req, res) => {\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.sku === sku)) return res.status(409).json({ success: false });\n  const item = { id: Math.max(0, ...products.map(p => p.id)) + 1, sku, name, price };\n  products.push(item);\n  res.status(201).json({ success: true, data: dto(item) });\n});\n\napp.get('/products', (req, res) => {\n  const page = req.query.page === undefined ? 1 : Number(req.query.page);\n  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger((page-1)*limit)) return res.status(400).json({ success: false });\n  const total = products.length;\n  res.json({ success: true, data: products.slice((page-1)*limit, page*limit).map(dto), pagination: { total, page, limit, totalPages: Math.ceil(total/limit), hasNextPage: page*limit<total, hasPrevPage: page>1 } });\n});\n\napp.get('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.get('/brands', (req, res) => res.json({ success: true, data: brands }));\n\napp.put('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.id !== item.id && p.sku === sku)) return res.status(409).json({ success: false });\n  Object.assign(item, { sku, name, price });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.delete('/products/:id', (req, res) => {\n  const index = products.findIndex(p => p.id === Number(req.params.id));\n  if (index < 0) return res.status(404).json({ success: false });\n  products.splice(index, 1);\n  res.status(204).end();\n});\napp.listen(3000);\n",
      "tests": [
        {
          "name": "เพิ่มแล้วต้องอ่านกลับได้",
          "steps": [
            {
              "request": {
                "method": "POST",
                "path": "/products",
                "body": {
                  "sku": "PHONE-C",
                  "name": "Phone C",
                  "price": 300
                }
              },
              "expect": {
                "status": 201,
                "jsonMatch": {
                  "data.id": 3,
                  "data.name": "Phone C"
                }
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products/3"
              },
              "expect": {
                "status": 200,
                "jsonMatch": {
                  "data.sku": "PHONE-C"
                }
              }
            }
          ]
        },
        {
          "name": "ซ้ำและข้อมูลผิดไม่เพิ่มรายการ",
          "steps": [
            {
              "request": {
                "method": "POST",
                "path": "/products",
                "body": {
                  "sku": "PHONE-C",
                  "name": "Phone C",
                  "price": 300
                }
              },
              "expect": {
                "status": 409
              }
            },
            {
              "request": {
                "method": "POST",
                "path": "/products",
                "body": {
                  "sku": "BAD",
                  "price": -1
                }
              },
              "expect": {
                "status": 400
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products"
              },
              "expect": {
                "jsonMatch": {
                  "pagination.total": 3
                }
              }
            }
          ]
        }
      ],
      "hint": "อ่าน method/path แล้วตรวจ params/query/body; เลือกฟิลด์ DTO และ status ตาม contract ข้างบน"
    },
    {
      "type": "exercise",
      "id": "x-exam-list",
      "title": "R1 · GET รายการพร้อม DTO และ pagination",
      "source": "โจทย์ฝึกเพิ่มเติมจากหัวข้อสอบ; Week-08 Practice Exam Simulation/exam-spec-*.md",
      "body": "<p><b>Contract:</b> GET /products?page=2&amp;limit=1 คืน 200, data เป็น array ของ DTO {id,sku,name,price} และ pagination {total,page,limit,totalPages,hasNextPage,hasPrevPage}; default page=1,limit=10 รับจำนวนเต็มบวกและ limit ≤ 100; ค่าผิดส่ง 400 หน้าที่เกินข้อมูลคืน [] แต่ total ยังอยู่ ห้ามเผย internalCost</p><p>แก้ route ที่มี TODO แล้วกดตรวจคำตอบ ข้อมูลและกติกาชุดนี้สร้างเพื่อฝึก ไม่ใช่ข้อสอบจริง</p>",
      "files": {
        "app.js": "import express from 'express';\nconst app = express();\napp.use(express.json());\nlet products = [{ id: 1, sku: 'PHONE-A', name: 'Phone A', price: 100, internalCost: 50 }, { id: 2, sku: 'PHONE-B', name: 'Phone B', price: 200, internalCost: 90 }];\nconst brands = [{ id: 1, name: 'Example Brand' }];\nconst dto = p => ({ id: p.id, sku: p.sku, name: p.name, price: p.price });\napp.post('/products', (req, res) => {\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.sku === sku)) return res.status(409).json({ success: false });\n  const item = { id: Math.max(0, ...products.map(p => p.id)) + 1, sku, name, price };\n  products.push(item);\n  res.status(201).json({ success: true, data: dto(item) });\n});\n\napp.get('/products', (req, res) => {\n  // TODO: เติม route นี้ตาม contract ด้านล่าง\n  res.status(501).json({ message: 'TODO' });\n});\n\napp.get('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.get('/brands', (req, res) => res.json({ success: true, data: brands }));\n\napp.put('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.id !== item.id && p.sku === sku)) return res.status(409).json({ success: false });\n  Object.assign(item, { sku, name, price });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.delete('/products/:id', (req, res) => {\n  const index = products.findIndex(p => p.id === Number(req.params.id));\n  if (index < 0) return res.status(404).json({ success: false });\n  products.splice(index, 1);\n  res.status(204).end();\n});\napp.listen(3000);\n"
      },
      "solution": "import express from 'express';\nconst app = express();\napp.use(express.json());\nlet products = [{ id: 1, sku: 'PHONE-A', name: 'Phone A', price: 100, internalCost: 50 }, { id: 2, sku: 'PHONE-B', name: 'Phone B', price: 200, internalCost: 90 }];\nconst brands = [{ id: 1, name: 'Example Brand' }];\nconst dto = p => ({ id: p.id, sku: p.sku, name: p.name, price: p.price });\napp.post('/products', (req, res) => {\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.sku === sku)) return res.status(409).json({ success: false });\n  const item = { id: Math.max(0, ...products.map(p => p.id)) + 1, sku, name, price };\n  products.push(item);\n  res.status(201).json({ success: true, data: dto(item) });\n});\n\napp.get('/products', (req, res) => {\n  const page = req.query.page === undefined ? 1 : Number(req.query.page);\n  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger((page-1)*limit)) return res.status(400).json({ success: false });\n  const total = products.length;\n  res.json({ success: true, data: products.slice((page-1)*limit, page*limit).map(dto), pagination: { total, page, limit, totalPages: Math.ceil(total/limit), hasNextPage: page*limit<total, hasPrevPage: page>1 } });\n});\n\napp.get('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.get('/brands', (req, res) => res.json({ success: true, data: brands }));\n\napp.put('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.id !== item.id && p.sku === sku)) return res.status(409).json({ success: false });\n  Object.assign(item, { sku, name, price });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.delete('/products/:id', (req, res) => {\n  const index = products.findIndex(p => p.id === Number(req.params.id));\n  if (index < 0) return res.status(404).json({ success: false });\n  products.splice(index, 1);\n  res.status(204).end();\n});\napp.listen(3000);\n",
      "tests": [
        {
          "name": "แบ่งหน้าและไม่เผย internalCost",
          "steps": [
            {
              "request": {
                "method": "GET",
                "path": "/products?page=2&limit=1"
              },
              "expect": {
                "status": 200,
                "jsonMatch": {
                  "data": [
                    {
                      "id": 2,
                      "sku": "PHONE-B",
                      "name": "Phone B",
                      "price": 200
                    }
                  ],
                  "pagination.total": 2,
                  "pagination.totalPages": 2,
                  "pagination.hasNextPage": false,
                  "pagination.hasPrevPage": true
                },
                "textExcludes": "internalCost"
              }
            }
          ]
        },
        {
          "name": "หน้าว่างและ input ผิด",
          "steps": [
            {
              "request": {
                "method": "GET",
                "path": "/products?page=9&limit=1"
              },
              "expect": {
                "status": 200,
                "jsonMatch": {
                  "data": [],
                  "pagination.total": 2
                }
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products?page=0"
              },
              "expect": {
                "status": 400
              }
            }
          ]
        }
      ],
      "hint": "อ่าน method/path แล้วตรวจ params/query/body; เลือกฟิลด์ DTO และ status ตาม contract ข้างบน"
    },
    {
      "type": "exercise",
      "id": "x-exam-detail",
      "title": "R2 · GET รายตัว: 200 หรือ 404",
      "source": "โจทย์ฝึกเพิ่มเติมจากหัวข้อสอบ; Week-08 Practice Exam Simulation/exam-spec-*.md",
      "body": "<p><b>Contract:</b> GET /products/:id คืน 200 พร้อม {success:true,data:{id,sku,name,price}} เมื่อพบ; ไม่พบส่ง 404 และ {success:false} ห้ามเผย internalCost</p><p>แก้ route ที่มี TODO แล้วกดตรวจคำตอบ ข้อมูลและกติกาชุดนี้สร้างเพื่อฝึก ไม่ใช่ข้อสอบจริง</p>",
      "files": {
        "app.js": "import express from 'express';\nconst app = express();\napp.use(express.json());\nlet products = [{ id: 1, sku: 'PHONE-A', name: 'Phone A', price: 100, internalCost: 50 }, { id: 2, sku: 'PHONE-B', name: 'Phone B', price: 200, internalCost: 90 }];\nconst brands = [{ id: 1, name: 'Example Brand' }];\nconst dto = p => ({ id: p.id, sku: p.sku, name: p.name, price: p.price });\napp.post('/products', (req, res) => {\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.sku === sku)) return res.status(409).json({ success: false });\n  const item = { id: Math.max(0, ...products.map(p => p.id)) + 1, sku, name, price };\n  products.push(item);\n  res.status(201).json({ success: true, data: dto(item) });\n});\n\napp.get('/products', (req, res) => {\n  const page = req.query.page === undefined ? 1 : Number(req.query.page);\n  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger((page-1)*limit)) return res.status(400).json({ success: false });\n  const total = products.length;\n  res.json({ success: true, data: products.slice((page-1)*limit, page*limit).map(dto), pagination: { total, page, limit, totalPages: Math.ceil(total/limit), hasNextPage: page*limit<total, hasPrevPage: page>1 } });\n});\n\napp.get('/products/:id', (req, res) => {\n  // TODO: เติม route นี้ตาม contract ด้านล่าง\n  res.status(501).json({ message: 'TODO' });\n});\n\napp.get('/brands', (req, res) => res.json({ success: true, data: brands }));\n\napp.put('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.id !== item.id && p.sku === sku)) return res.status(409).json({ success: false });\n  Object.assign(item, { sku, name, price });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.delete('/products/:id', (req, res) => {\n  const index = products.findIndex(p => p.id === Number(req.params.id));\n  if (index < 0) return res.status(404).json({ success: false });\n  products.splice(index, 1);\n  res.status(204).end();\n});\napp.listen(3000);\n"
      },
      "solution": "import express from 'express';\nconst app = express();\napp.use(express.json());\nlet products = [{ id: 1, sku: 'PHONE-A', name: 'Phone A', price: 100, internalCost: 50 }, { id: 2, sku: 'PHONE-B', name: 'Phone B', price: 200, internalCost: 90 }];\nconst brands = [{ id: 1, name: 'Example Brand' }];\nconst dto = p => ({ id: p.id, sku: p.sku, name: p.name, price: p.price });\napp.post('/products', (req, res) => {\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.sku === sku)) return res.status(409).json({ success: false });\n  const item = { id: Math.max(0, ...products.map(p => p.id)) + 1, sku, name, price };\n  products.push(item);\n  res.status(201).json({ success: true, data: dto(item) });\n});\n\napp.get('/products', (req, res) => {\n  const page = req.query.page === undefined ? 1 : Number(req.query.page);\n  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger((page-1)*limit)) return res.status(400).json({ success: false });\n  const total = products.length;\n  res.json({ success: true, data: products.slice((page-1)*limit, page*limit).map(dto), pagination: { total, page, limit, totalPages: Math.ceil(total/limit), hasNextPage: page*limit<total, hasPrevPage: page>1 } });\n});\n\napp.get('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.get('/brands', (req, res) => res.json({ success: true, data: brands }));\n\napp.put('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.id !== item.id && p.sku === sku)) return res.status(409).json({ success: false });\n  Object.assign(item, { sku, name, price });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.delete('/products/:id', (req, res) => {\n  const index = products.findIndex(p => p.id === Number(req.params.id));\n  if (index < 0) return res.status(404).json({ success: false });\n  products.splice(index, 1);\n  res.status(204).end();\n});\napp.listen(3000);\n",
      "tests": [
        {
          "name": "พบและไม่พบ",
          "steps": [
            {
              "request": {
                "method": "GET",
                "path": "/products/1"
              },
              "expect": {
                "status": 200,
                "json": {
                  "success": true,
                  "data": {
                    "id": 1,
                    "sku": "PHONE-A",
                    "name": "Phone A",
                    "price": 100
                  }
                }
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products/999"
              },
              "expect": {
                "status": 404
              }
            }
          ]
        }
      ],
      "hint": "อ่าน method/path แล้วตรวจ params/query/body; เลือกฟิลด์ DTO และ status ตาม contract ข้างบน"
    },
    {
      "type": "exercise",
      "id": "x-exam-brands",
      "title": "R3 · GET รายการแบรนด์",
      "source": "โจทย์ฝึกเพิ่มเติมจากหัวข้อสอบ; Week-08 Practice Exam Simulation/exam-spec-*.md",
      "body": "<p><b>Contract:</b> GET /brands คืน 200 และ {success:true,data:[{id:1,name:\"Example Brand\"}]} โดย data เป็น array</p><p>แก้ route ที่มี TODO แล้วกดตรวจคำตอบ ข้อมูลและกติกาชุดนี้สร้างเพื่อฝึก ไม่ใช่ข้อสอบจริง</p>",
      "files": {
        "app.js": "import express from 'express';\nconst app = express();\napp.use(express.json());\nlet products = [{ id: 1, sku: 'PHONE-A', name: 'Phone A', price: 100, internalCost: 50 }, { id: 2, sku: 'PHONE-B', name: 'Phone B', price: 200, internalCost: 90 }];\nconst brands = [{ id: 1, name: 'Example Brand' }];\nconst dto = p => ({ id: p.id, sku: p.sku, name: p.name, price: p.price });\napp.post('/products', (req, res) => {\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.sku === sku)) return res.status(409).json({ success: false });\n  const item = { id: Math.max(0, ...products.map(p => p.id)) + 1, sku, name, price };\n  products.push(item);\n  res.status(201).json({ success: true, data: dto(item) });\n});\n\napp.get('/products', (req, res) => {\n  const page = req.query.page === undefined ? 1 : Number(req.query.page);\n  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger((page-1)*limit)) return res.status(400).json({ success: false });\n  const total = products.length;\n  res.json({ success: true, data: products.slice((page-1)*limit, page*limit).map(dto), pagination: { total, page, limit, totalPages: Math.ceil(total/limit), hasNextPage: page*limit<total, hasPrevPage: page>1 } });\n});\n\napp.get('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.get('/brands', (req, res) => {\n  // TODO: เติม route นี้ตาม contract ด้านล่าง\n  res.status(501).json({ message: 'TODO' });\n});\n\napp.put('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.id !== item.id && p.sku === sku)) return res.status(409).json({ success: false });\n  Object.assign(item, { sku, name, price });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.delete('/products/:id', (req, res) => {\n  const index = products.findIndex(p => p.id === Number(req.params.id));\n  if (index < 0) return res.status(404).json({ success: false });\n  products.splice(index, 1);\n  res.status(204).end();\n});\napp.listen(3000);\n"
      },
      "solution": "import express from 'express';\nconst app = express();\napp.use(express.json());\nlet products = [{ id: 1, sku: 'PHONE-A', name: 'Phone A', price: 100, internalCost: 50 }, { id: 2, sku: 'PHONE-B', name: 'Phone B', price: 200, internalCost: 90 }];\nconst brands = [{ id: 1, name: 'Example Brand' }];\nconst dto = p => ({ id: p.id, sku: p.sku, name: p.name, price: p.price });\napp.post('/products', (req, res) => {\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.sku === sku)) return res.status(409).json({ success: false });\n  const item = { id: Math.max(0, ...products.map(p => p.id)) + 1, sku, name, price };\n  products.push(item);\n  res.status(201).json({ success: true, data: dto(item) });\n});\n\napp.get('/products', (req, res) => {\n  const page = req.query.page === undefined ? 1 : Number(req.query.page);\n  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger((page-1)*limit)) return res.status(400).json({ success: false });\n  const total = products.length;\n  res.json({ success: true, data: products.slice((page-1)*limit, page*limit).map(dto), pagination: { total, page, limit, totalPages: Math.ceil(total/limit), hasNextPage: page*limit<total, hasPrevPage: page>1 } });\n});\n\napp.get('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.get('/brands', (req, res) => res.json({ success: true, data: brands }));\n\napp.put('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.id !== item.id && p.sku === sku)) return res.status(409).json({ success: false });\n  Object.assign(item, { sku, name, price });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.delete('/products/:id', (req, res) => {\n  const index = products.findIndex(p => p.id === Number(req.params.id));\n  if (index < 0) return res.status(404).json({ success: false });\n  products.splice(index, 1);\n  res.status(204).end();\n});\napp.listen(3000);\n",
      "tests": [
        {
          "name": "envelope และ data ต้องตรง",
          "steps": [
            {
              "request": {
                "method": "GET",
                "path": "/brands"
              },
              "expect": {
                "status": 200,
                "json": {
                  "success": true,
                  "data": [
                    {
                      "id": 1,
                      "name": "Example Brand"
                    }
                  ]
                }
              }
            }
          ]
        }
      ],
      "hint": "อ่าน method/path แล้วตรวจ params/query/body; เลือกฟิลด์ DTO และ status ตาม contract ข้างบน"
    },
    {
      "type": "exercise",
      "id": "x-exam-update",
      "title": "U · PUT แก้ไขสินค้าเดิม",
      "source": "โจทย์ฝึกเพิ่มเติมจากหัวข้อสอบ; Week-08 Practice Exam Simulation/exam-spec-*.md",
      "body": "<p><b>Contract:</b> PUT /products/:id รับ {sku,name,price} ครบทั้งสามฟิลด์ เงื่อนไขเหมือน POST; ไม่พบ id ส่ง 404, ข้อมูลผิดส่ง 400, SKU ตรงกับสินค้าอื่นส่ง 409 แต่ใช้ SKU เดิมของตนเองได้ แก้สำเร็จส่ง 200 พร้อม DTO และ GET กลับต้องเป็นค่าใหม่</p><pre><code>{\"sku\":\"PHONE-A\",\"name\":\"Updated Phone\",\"price\":150}</code></pre><p>แก้ route ที่มี TODO แล้วกดตรวจคำตอบ ข้อมูลและกติกาชุดนี้สร้างเพื่อฝึก ไม่ใช่ข้อสอบจริง</p>",
      "files": {
        "app.js": "import express from 'express';\nconst app = express();\napp.use(express.json());\nlet products = [{ id: 1, sku: 'PHONE-A', name: 'Phone A', price: 100, internalCost: 50 }, { id: 2, sku: 'PHONE-B', name: 'Phone B', price: 200, internalCost: 90 }];\nconst brands = [{ id: 1, name: 'Example Brand' }];\nconst dto = p => ({ id: p.id, sku: p.sku, name: p.name, price: p.price });\napp.post('/products', (req, res) => {\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.sku === sku)) return res.status(409).json({ success: false });\n  const item = { id: Math.max(0, ...products.map(p => p.id)) + 1, sku, name, price };\n  products.push(item);\n  res.status(201).json({ success: true, data: dto(item) });\n});\n\napp.get('/products', (req, res) => {\n  const page = req.query.page === undefined ? 1 : Number(req.query.page);\n  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger((page-1)*limit)) return res.status(400).json({ success: false });\n  const total = products.length;\n  res.json({ success: true, data: products.slice((page-1)*limit, page*limit).map(dto), pagination: { total, page, limit, totalPages: Math.ceil(total/limit), hasNextPage: page*limit<total, hasPrevPage: page>1 } });\n});\n\napp.get('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.get('/brands', (req, res) => res.json({ success: true, data: brands }));\n\napp.put('/products/:id', (req, res) => {\n  // TODO: เติม route นี้ตาม contract ด้านล่าง\n  res.status(501).json({ message: 'TODO' });\n});\n\napp.delete('/products/:id', (req, res) => {\n  const index = products.findIndex(p => p.id === Number(req.params.id));\n  if (index < 0) return res.status(404).json({ success: false });\n  products.splice(index, 1);\n  res.status(204).end();\n});\napp.listen(3000);\n"
      },
      "solution": "import express from 'express';\nconst app = express();\napp.use(express.json());\nlet products = [{ id: 1, sku: 'PHONE-A', name: 'Phone A', price: 100, internalCost: 50 }, { id: 2, sku: 'PHONE-B', name: 'Phone B', price: 200, internalCost: 90 }];\nconst brands = [{ id: 1, name: 'Example Brand' }];\nconst dto = p => ({ id: p.id, sku: p.sku, name: p.name, price: p.price });\napp.post('/products', (req, res) => {\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.sku === sku)) return res.status(409).json({ success: false });\n  const item = { id: Math.max(0, ...products.map(p => p.id)) + 1, sku, name, price };\n  products.push(item);\n  res.status(201).json({ success: true, data: dto(item) });\n});\n\napp.get('/products', (req, res) => {\n  const page = req.query.page === undefined ? 1 : Number(req.query.page);\n  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger((page-1)*limit)) return res.status(400).json({ success: false });\n  const total = products.length;\n  res.json({ success: true, data: products.slice((page-1)*limit, page*limit).map(dto), pagination: { total, page, limit, totalPages: Math.ceil(total/limit), hasNextPage: page*limit<total, hasPrevPage: page>1 } });\n});\n\napp.get('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.get('/brands', (req, res) => res.json({ success: true, data: brands }));\n\napp.put('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.id !== item.id && p.sku === sku)) return res.status(409).json({ success: false });\n  Object.assign(item, { sku, name, price });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.delete('/products/:id', (req, res) => {\n  const index = products.findIndex(p => p.id === Number(req.params.id));\n  if (index < 0) return res.status(404).json({ success: false });\n  products.splice(index, 1);\n  res.status(204).end();\n});\napp.listen(3000);\n",
      "tests": [
        {
          "name": "แก้แล้ว GET ต้องเปลี่ยน",
          "steps": [
            {
              "request": {
                "method": "PUT",
                "path": "/products/1",
                "body": {
                  "sku": "PHONE-A",
                  "name": "Updated Phone",
                  "price": 150
                }
              },
              "expect": {
                "status": 200,
                "jsonMatch": {
                  "data.id": 1,
                  "data.name": "Updated Phone"
                }
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products/1"
              },
              "expect": {
                "jsonMatch": {
                  "data.price": 150
                }
              }
            }
          ]
        },
        {
          "name": "404, 409 และ 400",
          "steps": [
            {
              "request": {
                "method": "PUT",
                "path": "/products/999",
                "body": {
                  "sku": "PHONE-A",
                  "name": "Updated Phone",
                  "price": 150
                }
              },
              "expect": {
                "status": 404
              }
            },
            {
              "request": {
                "method": "PUT",
                "path": "/products/1",
                "body": {
                  "sku": "PHONE-B",
                  "name": "Duplicate",
                  "price": 1
                }
              },
              "expect": {
                "status": 409
              }
            },
            {
              "request": {
                "method": "PUT",
                "path": "/products/1",
                "body": {
                  "sku": "X",
                  "name": "Invalid",
                  "price": -1
                }
              },
              "expect": {
                "status": 400
              }
            }
          ]
        }
      ],
      "hint": "อ่าน method/path แล้วตรวจ params/query/body; เลือกฟิลด์ DTO และ status ตาม contract ข้างบน"
    },
    {
      "type": "exercise",
      "id": "x-exam-delete",
      "title": "D · DELETE: 204 และห้ามส่ง JSON body",
      "source": "โจทย์ฝึกเพิ่มเติมจากหัวข้อสอบ; Week-08 Practice Exam Simulation/exam-spec-*.md",
      "body": "<p><b>Contract:</b> DELETE /products/:id ที่พบส่ง 204 โดย body ว่าง ลบจริงจาก array จากนั้น GET รายตัวและ DELETE ซ้ำต้องส่ง 404 และจำนวน total ใน GET รายการต้องลดลง</p><p>แก้ route ที่มี TODO แล้วกดตรวจคำตอบ ข้อมูลและกติกาชุดนี้สร้างเพื่อฝึก ไม่ใช่ข้อสอบจริง</p>",
      "files": {
        "app.js": "import express from 'express';\nconst app = express();\napp.use(express.json());\nlet products = [{ id: 1, sku: 'PHONE-A', name: 'Phone A', price: 100, internalCost: 50 }, { id: 2, sku: 'PHONE-B', name: 'Phone B', price: 200, internalCost: 90 }];\nconst brands = [{ id: 1, name: 'Example Brand' }];\nconst dto = p => ({ id: p.id, sku: p.sku, name: p.name, price: p.price });\napp.post('/products', (req, res) => {\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.sku === sku)) return res.status(409).json({ success: false });\n  const item = { id: Math.max(0, ...products.map(p => p.id)) + 1, sku, name, price };\n  products.push(item);\n  res.status(201).json({ success: true, data: dto(item) });\n});\n\napp.get('/products', (req, res) => {\n  const page = req.query.page === undefined ? 1 : Number(req.query.page);\n  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger((page-1)*limit)) return res.status(400).json({ success: false });\n  const total = products.length;\n  res.json({ success: true, data: products.slice((page-1)*limit, page*limit).map(dto), pagination: { total, page, limit, totalPages: Math.ceil(total/limit), hasNextPage: page*limit<total, hasPrevPage: page>1 } });\n});\n\napp.get('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.get('/brands', (req, res) => res.json({ success: true, data: brands }));\n\napp.put('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.id !== item.id && p.sku === sku)) return res.status(409).json({ success: false });\n  Object.assign(item, { sku, name, price });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.delete('/products/:id', (req, res) => {\n  // TODO: เติม route นี้ตาม contract ด้านล่าง\n  res.status(501).json({ message: 'TODO' });\n});\napp.listen(3000);\n"
      },
      "solution": "import express from 'express';\nconst app = express();\napp.use(express.json());\nlet products = [{ id: 1, sku: 'PHONE-A', name: 'Phone A', price: 100, internalCost: 50 }, { id: 2, sku: 'PHONE-B', name: 'Phone B', price: 200, internalCost: 90 }];\nconst brands = [{ id: 1, name: 'Example Brand' }];\nconst dto = p => ({ id: p.id, sku: p.sku, name: p.name, price: p.price });\napp.post('/products', (req, res) => {\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.sku === sku)) return res.status(409).json({ success: false });\n  const item = { id: Math.max(0, ...products.map(p => p.id)) + 1, sku, name, price };\n  products.push(item);\n  res.status(201).json({ success: true, data: dto(item) });\n});\n\napp.get('/products', (req, res) => {\n  const page = req.query.page === undefined ? 1 : Number(req.query.page);\n  const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger((page-1)*limit)) return res.status(400).json({ success: false });\n  const total = products.length;\n  res.json({ success: true, data: products.slice((page-1)*limit, page*limit).map(dto), pagination: { total, page, limit, totalPages: Math.ceil(total/limit), hasNextPage: page*limit<total, hasPrevPage: page>1 } });\n});\n\napp.get('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.get('/brands', (req, res) => res.json({ success: true, data: brands }));\n\napp.put('/products/:id', (req, res) => {\n  const item = products.find(p => p.id === Number(req.params.id));\n  if (!item) return res.status(404).json({ success: false });\n  const { sku, name, price } = req.body;\n  if (!sku || !name || typeof price !== 'number' || price < 0) return res.status(400).json({ success: false });\n  if (products.some(p => p.id !== item.id && p.sku === sku)) return res.status(409).json({ success: false });\n  Object.assign(item, { sku, name, price });\n  res.json({ success: true, data: dto(item) });\n});\n\napp.delete('/products/:id', (req, res) => {\n  const index = products.findIndex(p => p.id === Number(req.params.id));\n  if (index < 0) return res.status(404).json({ success: false });\n  products.splice(index, 1);\n  res.status(204).end();\n});\napp.listen(3000);\n",
      "tests": [
        {
          "name": "ลบแล้วอ่านไม่พบและลบซ้ำไม่ได้",
          "steps": [
            {
              "request": {
                "method": "DELETE",
                "path": "/products/1"
              },
              "expect": {
                "status": 204,
                "text": ""
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products/1"
              },
              "expect": {
                "status": 404
              }
            },
            {
              "request": {
                "method": "DELETE",
                "path": "/products/1"
              },
              "expect": {
                "status": 404
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products"
              },
              "expect": {
                "jsonMatch": {
                  "pagination.total": 1
                }
              }
            }
          ]
        }
      ],
      "hint": "อ่าน method/path แล้วตรวจ params/query/body; เลือกฟิลด์ DTO และ status ตาม contract ข้างบน"
    }
  ]
};
