import { paginationDiagram } from '../js/pagination-diagram.js';
const lesson = {
  "id": "w7",
  "title": "Pagination & DTO",
  "sources": [
    "Week-07 API Pagination & DTO/07-INT161-Pagination and DTO.pdf",
    "midterm-exam-esm-template.zip/src"
  ],
  "blocks": [
    {
      "type": "concept",
      "id": "c-why-pagination",
      "title": "ทำไม API ต้องแบ่งหน้า",
      "body": "<p>การส่งทุกรายการเพิ่มงานฐานข้อมูล หน่วยความจำ และข้อมูลที่ส่งผ่านเครือข่าย Pagination ช่วยให้ขนาด response คาดเดาได้ โดยดึงเฉพาะรายการที่ต้องใช้</p><p><b>เป้าหมาย:</b> คำนวณ offset, เขียน LIMIT/OFFSET/COUNT(*), ตรวจ query และออกแบบ DTO ที่ไม่เปิดเผยข้อมูลเกินจำเป็น</p>",
      "source": "Week-07 API Pagination & DTO/07-INT161-Pagination and DTO.pdf"
    },
    {
      "type": "concept",
      "id": "c-page-limit-offset",
      "title": "page, limit, offset: เริ่มหน้าแรกที่ 1",
      "body": "<p><code>GET /products?page=2&amp;limit=10</code> หมายถึงข้าม 10 รายการ แล้วอ่านสูงสุด 10 รายการ</p><pre><code>offset = (page - 1) * limit</code></pre><table><tr><th>page</th><th>limit</th><th>offset</th><th>ลำดับรายการ</th></tr><tr><td>1</td><td>10</td><td>0</td><td>1–10</td></tr><tr><td>2</td><td>10</td><td>10</td><td>11–20</td></tr><tr><td>3</td><td>10</td><td>20</td><td>21–30</td></tr></table><p>ตัวอย่างฝึกนี้ใช้ default page=1, limit=20; รับจำนวนเต็มบวกและจำกัด limit ไม่เกิน 100 นี่เป็นนโยบายตัวอย่างที่เพิ่มการตรวจ input ให้ชัดเจน ต้องยึดสเปกที่ได้รับจริงก่อนเสมอ</p><pre><code>export function parsePagination(query = {}) {\n  const page = query.page === undefined ? 1 : Number(query.page);\n  const requestedLimit = query.limit === undefined ? 20 : Number(query.limit);\n  if (!Number.isSafeInteger(page) || page &lt; 1 ||\n      !Number.isSafeInteger(requestedLimit) || requestedLimit &lt; 1) {\n    throw Object.assign(new Error(&#x27;page and limit must be positive integers&#x27;), { status: 400 });\n  }\n  const limit = Math.min(requestedLimit, 100);\n  const offset = (page - 1) * limit;\n  if (!Number.isSafeInteger(offset)) {\n    throw Object.assign(new Error(&#x27;offset is too large&#x27;), { status: 400 });\n  }\n  return { page, limit, offset };\n}\n</code></pre><p><b>จุดพลาดใน template:</b> จำกัด limit แล้วต้องใช้ limit ที่จำกัดแล้วคำนวณ offset; ไม่ใช้ pageSize เดิม และไม่ใช้ parseInt อย่างเดียวเพราะค่าประเภท 2abc อาจถูกแปลงเป็น 2</p>",
      "source": "Week-07 API Pagination & DTO/07-INT161-Pagination and DTO.pdf"
    },
    {
      "type": "concept",
      "id": "c-pagination-sql",
      "title": "MySQL: ORDER BY, LIMIT, OFFSET และ COUNT(*)",
      "body": "<p>Repository รับค่าที่ตรวจแล้วและผูกค่าด้วย placeholders เพื่อไม่ต่อ query input ลง SQL โดยตรง เรียงตามคีย์ที่แน่นอนเพื่อให้ผลแบ่งหน้าคงที่เมื่อข้อมูลไม่เปลี่ยน</p><pre><code>const [rows] = await db.query(\n  &#x27;SELECT id, name, price FROM products ORDER BY id LIMIT ? OFFSET ?&#x27;,\n  [limit, offset]\n);\nconst [[{ total }]] = await db.query(&#x27;SELECT COUNT(*) AS total FROM products&#x27;);\nreturn { items: rows, total };</code></pre><p>COUNT(*) คือจำนวนรายการทั้งหมดที่ตรงเงื่อนไข ไม่ใช่จำนวนรายการในหน้าปัจจุบัน ถ้ามี WHERE ในรายการ ต้องใช้เงื่อนไขเดียวกันกับ COUNT ด้วย</p><p>การใช้ index ช่วยคอลัมน์ที่ filter/sort; หน้าที่ลึกมากอาจพิจารณา cursor pagination ตามที่สไลด์กล่าวถึง</p>",
      "source": "Week-07 API Pagination & DTO/07-INT161-Pagination and DTO.pdf"
    },
    {
      "type": "concept",
      "id": "c-pagination-metadata",
      "title": "Metadata: หน้าสุดท้าย หน้าว่าง และ total=0",
      "body": "<p>ตัวอย่างนี้ใช้ชื่อฟิลด์ตามชุดฝึก Week 08: total, page, limit, totalPages, hasNextPage, hasPrevPage</p><pre><code>export function paginationMeta(total, { page, limit }) {\n  return { total, page, limit, totalPages: Math.ceil(total / limit),\n    hasNextPage: page * limit &lt; total, hasPrevPage: page &gt; 1 };\n}\n</code></pre><p>total=75, limit=10 → totalPages=8; หน้า 8 มีได้ 5 รายการ ส่วนหน้า 9 ส่ง data=[] ได้ตามนโยบายตัวอย่าง เมื่อ total=0 ให้ยังส่ง total:0 และ totalPages:0</p><p>อย่าตรวจ <code>if (total)</code> เพื่อเลือกเก็บ metadata เพราะค่า 0 เป็น falsy และอย่าใส่ total เป็น property ของ array แล้วคาดว่าจะถูกแสดงใน JSON; แยก metadata เป็น object</p><p>ภาพตัวอย่างหนึ่งในสไลด์มี page=2 แต่ hasPreviousPage=false ซึ่งไม่ตรงสูตร page&gt;1; บทนี้ยึดสูตรและตัวอย่างโค้ดที่สอดคล้องกัน</p>",
      "source": "Week-07 API Pagination & DTO/07-INT161-Pagination and DTO.pdf"
    },
    {
      "type": "concept",
      "id": "c-entity-dto",
      "title": "Entity, Request DTO และ Response DTO",
      "body": "<p><b>Entity</b> แทนข้อมูลภายใน/ฐานข้อมูล เช่น password_hash, stock_quantity ส่วน <b>Request DTO</b> กำหนดข้อมูลที่รับเข้า และ <b>Response DTO</b> กำหนดข้อมูลที่จะส่งออก</p><p>Summary ใช้กับรายการ; Detail ใช้กับข้อมูลรายตัว ฟิลด์ขึ้นกับสเปก ไม่จำเป็นต้องเหมือนกันทุก endpoint ตัวอย่างเล็กนี้ใช้ allowlist เลือกฟิลด์อย่างชัดเจน</p><pre><code>export function toSummaryDTO(entity) {\n  return { id: entity.id, name: entity.name, price: entity.price };\n}\nexport function toDetailDTO(entity) {\n  return { id: entity.id, name: entity.name, price: entity.price, stockQuantity: entity.stock_quantity };\n}\n</code></pre><p>ไม่ควรใช้ <code>{...entity}</code> เป็น response ทันทีเพราะฟิลด์ใหม่ในฐานข้อมูลอาจหลุดออกไป ไม่รับทั้ง req.body เข้า INSERT/UPDATE โดยไม่เลือกฟิลด์ก่อน</p>",
      "source": "Week-07 API Pagination & DTO/07-INT161-Pagination and DTO.pdf"
    },
    {
      "type": "concept",
      "id": "c-pagination-layers",
      "title": "ต่อ Middleware → Repository → Mapper → Response",
      "body": "<ol><li>ติดตั้ง query parser ก่อน router</li><li>Route อ่าน req.pagination และเลือก view</li><li>Service ส่ง pagination ให้ repository</li><li>Repository ดึง items และ total</li><li>Mapper แปลงแต่ละ entity เป็น DTO</li><li>Response helper ใส่ data และ pagination metadata</li></ol><p>สไลด์, template และชุดฝึกใช้ response envelope ไม่เหมือนกันทุกจุด เช่น timestamp และ total/totalItems ให้ตรวจสเปกของงานนั้น ไม่จำชื่อจากตัวอย่างเดียว</p><p>ตัวอย่างรันในบทนี้ใช้ array เพื่อดูผลเร็ว; SQL ทดลองอยู่แยกต่างหาก งานสอบที่กำหนด MySQL ต้องต่อฐานข้อมูลจริง</p>",
      "source": "Week-07 API Pagination & DTO/07-INT161-Pagination and DTO.pdf"
    },
    {
      "type": "experiment",
      "id": "e-pagination-api",
      "title": "ทดลอง API: เปลี่ยน page และ limit",
      "source": "Week-07 API Pagination & DTO/07-INT161-Pagination and DTO.pdf",
      "body": "<p>กด Run แล้วส่ง GET /products?page=2&amp;limit=2 ลอง page=0, limit=500, page=9 และ /empty ดู metadata ควบคู่กับ data</p>",
      "files": {
        "app.js": "import express from 'express';\nimport { parsePagination } from './pagination.js';\nimport { toSummaryDTO, toDetailDTO } from './mapper.js';\nimport { paginationMeta } from './metadata.js';\nconst app = express();\nconst entities = [\n  { id: 1, name: 'Phone A', price: 100, stock_quantity: 4, password_hash: 'private-a' },\n  { id: 2, name: 'Phone B', price: 200, stock_quantity: 8, password_hash: 'private-b' },\n  { id: 3, name: 'Phone C', price: 300, stock_quantity: 0, password_hash: 'private-c' }\n];\napp.get('/products', (req, res, next) => {\n  try {\n    const pagination = parsePagination(req.query);\n    const { offset, limit } = pagination;\n    const items = entities.slice(offset, offset + limit).map(toSummaryDTO);\n    res.json({ success: true, data: items, pagination: paginationMeta(entities.length, pagination) });\n  } catch (err) { next(err); }\n});\napp.get('/products/:id', (req, res) => {\n  const entity = entities.find(item => item.id === Number(req.params.id));\n  if (!entity) return res.status(404).json({ success: false, message: 'Product not found' });\n  res.json({ success: true, data: toDetailDTO(entity) });\n});\napp.get('/empty', (req, res, next) => {\n  try { res.json({ success: true, data: [], pagination: paginationMeta(0, parsePagination(req.query)) }); }\n  catch (err) { next(err); }\n});\napp.use((err, req, res, next) => {\n  res.status(err.status || 500).json({ success: false, message: err.message });\n});\napp.listen(3000);\n",
        "pagination.js": "export function parsePagination(query = {}) {\n  const page = query.page === undefined ? 1 : Number(query.page);\n  const requestedLimit = query.limit === undefined ? 20 : Number(query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 ||\n      !Number.isSafeInteger(requestedLimit) || requestedLimit < 1) {\n    throw Object.assign(new Error('page and limit must be positive integers'), { status: 400 });\n  }\n  const limit = Math.min(requestedLimit, 100);\n  const offset = (page - 1) * limit;\n  if (!Number.isSafeInteger(offset)) {\n    throw Object.assign(new Error('offset is too large'), { status: 400 });\n  }\n  return { page, limit, offset };\n}\n",
        "mapper.js": "export function toSummaryDTO(entity) {\n  return { id: entity.id, name: entity.name, price: entity.price };\n}\nexport function toDetailDTO(entity) {\n  return { id: entity.id, name: entity.name, price: entity.price, stockQuantity: entity.stock_quantity };\n}\n",
        "metadata.js": "export function paginationMeta(total, { page, limit }) {\n  return { total, page, limit, totalPages: Math.ceil(total / limit),\n    hasNextPage: page * limit < total, hasPrevPage: page > 1 };\n}\n"
      },
      "requests": [
        {
          "method": "GET",
          "path": "/products?page=2&limit=2"
        }
      ]
    },
    {
      "type": "experiment",
      "id": "e-dto-api",
      "title": "ทดลอง DTO: เปรียบเทียบ list กับ detail",
      "source": "Week-07 API Pagination & DTO/07-INT161-Pagination and DTO.pdf",
      "body": "<p>เปรียบเทียบ GET /products กับ /products/1 ตรวจว่า stockQuantity อยู่เฉพาะ detail และ password_hash ไม่หลุดออกมา แก้ mapper แล้ว Run ใหม่เพื่อดูการเปลี่ยนแปลง</p>",
      "files": {
        "app.js": "import express from 'express';\nimport { parsePagination } from './pagination.js';\nimport { toSummaryDTO, toDetailDTO } from './mapper.js';\nimport { paginationMeta } from './metadata.js';\nconst app = express();\nconst entities = [\n  { id: 1, name: 'Phone A', price: 100, stock_quantity: 4, password_hash: 'private-a' },\n  { id: 2, name: 'Phone B', price: 200, stock_quantity: 8, password_hash: 'private-b' },\n  { id: 3, name: 'Phone C', price: 300, stock_quantity: 0, password_hash: 'private-c' }\n];\napp.get('/products', (req, res, next) => {\n  try {\n    const pagination = parsePagination(req.query);\n    const { offset, limit } = pagination;\n    const items = entities.slice(offset, offset + limit).map(toSummaryDTO);\n    res.json({ success: true, data: items, pagination: paginationMeta(entities.length, pagination) });\n  } catch (err) { next(err); }\n});\napp.get('/products/:id', (req, res) => {\n  const entity = entities.find(item => item.id === Number(req.params.id));\n  if (!entity) return res.status(404).json({ success: false, message: 'Product not found' });\n  res.json({ success: true, data: toDetailDTO(entity) });\n});\napp.get('/empty', (req, res, next) => {\n  try { res.json({ success: true, data: [], pagination: paginationMeta(0, parsePagination(req.query)) }); }\n  catch (err) { next(err); }\n});\napp.use((err, req, res, next) => {\n  res.status(err.status || 500).json({ success: false, message: err.message });\n});\napp.listen(3000);\n",
        "pagination.js": "export function parsePagination(query = {}) {\n  const page = query.page === undefined ? 1 : Number(query.page);\n  const requestedLimit = query.limit === undefined ? 20 : Number(query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 ||\n      !Number.isSafeInteger(requestedLimit) || requestedLimit < 1) {\n    throw Object.assign(new Error('page and limit must be positive integers'), { status: 400 });\n  }\n  const limit = Math.min(requestedLimit, 100);\n  const offset = (page - 1) * limit;\n  if (!Number.isSafeInteger(offset)) {\n    throw Object.assign(new Error('offset is too large'), { status: 400 });\n  }\n  return { page, limit, offset };\n}\n",
        "mapper.js": "export function toSummaryDTO(entity) {\n  return { id: entity.id, name: entity.name, price: entity.price };\n}\nexport function toDetailDTO(entity) {\n  return { id: entity.id, name: entity.name, price: entity.price, stockQuantity: entity.stock_quantity };\n}\n",
        "metadata.js": "export function paginationMeta(total, { page, limit }) {\n  return { total, page, limit, totalPages: Math.ceil(total / limit),\n    hasNextPage: page * limit < total, hasPrevPage: page > 1 };\n}\n"
      }
    },
    {
      "type": "experiment",
      "id": "e-pagination-sql",
      "title": "ทดลอง SQL: จำนวนทั้งหมดต่างจากจำนวนในหน้า",
      "source": "Week-07 API Pagination & DTO/07-INT161-Pagination and DTO.pdf",
      "body": "<p>Run แล้วดู console: rows มี 2 รายการ แต่ total เป็น 3 ลองเปลี่ยน offset เป็น 2 หรือ 10</p>",
      "files": {
        "app.js": "import mysql from 'mysql2/promise';\nconst db = mysql.createPool({database:'paging'});\nconst [rows] = await db.query('SELECT * FROM products ORDER BY id LIMIT ? OFFSET ?', [2,0]);\nconst [count] = await db.query('SELECT COUNT(*) AS total FROM products');\nconsole.log('items:', rows);\nconsole.log('count:', count);\nawait db.end();"
      },
      "fixtures": {
        "mysql": {
          "seed": "CREATE DATABASE paging; USE paging; CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR(50)); INSERT INTO products VALUES (1,'A'),(2,'B'),(3,'C');"
        }
      }
    },
    {
      "type": "exercise",
      "id": "x-pagination",
      "title": "เขียน query parser ให้รับมือ input ผิด",
      "source": "Week-07 API Pagination & DTO/07-INT161-Pagination and DTO.pdf",
      "body": "<p>แปลงเป็น Number ตรวจจำนวนเต็มบวก จำกัด limit แล้วจึงคำนวณ offset — แก้ไฟล์แรก แล้วกดตรวจคำตอบ</p>",
      "files": {
        "pagination.js": "export function parsePagination(query = {}) {\n  return { page: 1, limit: 20, offset: 0 };\n}",
        "app.js": "import express from 'express';\nimport { parsePagination } from './pagination.js';\nimport { toSummaryDTO, toDetailDTO } from './mapper.js';\nimport { paginationMeta } from './metadata.js';\nconst app = express();\nconst entities = [\n  { id: 1, name: 'Phone A', price: 100, stock_quantity: 4, password_hash: 'private-a' },\n  { id: 2, name: 'Phone B', price: 200, stock_quantity: 8, password_hash: 'private-b' },\n  { id: 3, name: 'Phone C', price: 300, stock_quantity: 0, password_hash: 'private-c' }\n];\napp.get('/products', (req, res, next) => {\n  try {\n    const pagination = parsePagination(req.query);\n    const { offset, limit } = pagination;\n    const items = entities.slice(offset, offset + limit).map(toSummaryDTO);\n    res.json({ success: true, data: items, pagination: paginationMeta(entities.length, pagination) });\n  } catch (err) { next(err); }\n});\napp.get('/products/:id', (req, res) => {\n  const entity = entities.find(item => item.id === Number(req.params.id));\n  if (!entity) return res.status(404).json({ success: false, message: 'Product not found' });\n  res.json({ success: true, data: toDetailDTO(entity) });\n});\napp.get('/empty', (req, res, next) => {\n  try { res.json({ success: true, data: [], pagination: paginationMeta(0, parsePagination(req.query)) }); }\n  catch (err) { next(err); }\n});\napp.use((err, req, res, next) => {\n  res.status(err.status || 500).json({ success: false, message: err.message });\n});\napp.listen(3000);\n",
        "mapper.js": "export function toSummaryDTO(entity) {\n  return { id: entity.id, name: entity.name, price: entity.price };\n}\nexport function toDetailDTO(entity) {\n  return { id: entity.id, name: entity.name, price: entity.price, stockQuantity: entity.stock_quantity };\n}\n",
        "metadata.js": "export function paginationMeta(total, { page, limit }) {\n  return { total, page, limit, totalPages: Math.ceil(total / limit),\n    hasNextPage: page * limit < total, hasPrevPage: page > 1 };\n}\n"
      },
      "entry": "app.js",
      "solution": "export function parsePagination(query = {}) {\n  const page = query.page === undefined ? 1 : Number(query.page);\n  const requestedLimit = query.limit === undefined ? 20 : Number(query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 ||\n      !Number.isSafeInteger(requestedLimit) || requestedLimit < 1) {\n    throw Object.assign(new Error('page and limit must be positive integers'), { status: 400 });\n  }\n  const limit = Math.min(requestedLimit, 100);\n  const offset = (page - 1) * limit;\n  if (!Number.isSafeInteger(offset)) {\n    throw Object.assign(new Error('offset is too large'), { status: 400 });\n  }\n  return { page, limit, offset };\n}\n",
      "tests": [
        {
          "name": "หน้าแรกและหน้าถัดไป",
          "steps": [
            {
              "request": {
                "method": "GET",
                "path": "/products?page=1&limit=2"
              },
              "expect": {
                "status": 200,
                "jsonMatch": {
                  "data.0.id": 1,
                  "pagination.limit": 2
                }
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products?page=2&limit=2"
              },
              "expect": {
                "status": 200,
                "jsonMatch": {
                  "data.0.id": 3
                }
              }
            }
          ]
        },
        {
          "name": "ปฏิเสธค่าที่ใช้แบ่งหน้าไม่ได้",
          "steps": [
            {
              "request": {
                "method": "GET",
                "path": "/products?page=0"
              },
              "expect": {
                "status": 400
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products?page=-1"
              },
              "expect": {
                "status": 400
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products?page=1.5"
              },
              "expect": {
                "status": 400
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products?page=abc"
              },
              "expect": {
                "status": 400
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products?page=2abc"
              },
              "expect": {
                "status": 400
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products?limit=0"
              },
              "expect": {
                "status": 400
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products?limit=-2"
              },
              "expect": {
                "status": 400
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products?limit="
              },
              "expect": {
                "status": 400
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products?limit=1.5"
              },
              "expect": {
                "status": 400
              }
            }
          ]
        },
        {
          "name": "ค่า default และเพดาน limit",
          "steps": [
            {
              "request": {
                "method": "GET",
                "path": "/products"
              },
              "expect": {
                "status": 200,
                "jsonMatch": {
                  "pagination.page": 1,
                  "pagination.limit": 20
                }
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products?page=2&limit=500"
              },
              "expect": {
                "status": 200,
                "jsonMatch": {
                  "data": [],
                  "pagination.limit": 100
                }
              }
            }
          ]
        }
      ],
      "hint": "แปลงเป็น Number ตรวจจำนวนเต็มบวก จำกัด limit แล้วจึงคำนวณ offset"
    },
    {
      "type": "exercise",
      "id": "x-dto",
      "title": "เขียน Summary/Detail DTO แบบเลือกฟิลด์",
      "source": "Week-07 API Pagination & DTO/07-INT161-Pagination and DTO.pdf",
      "body": "<p>เลือกฟิลด์ทีละตัว อย่า spread entity; detail เปลี่ยน stock_quantity เป็น stockQuantity — แก้ไฟล์แรก แล้วกดตรวจคำตอบ</p>",
      "files": {
        "mapper.js": "export function toSummaryDTO(entity) { return entity; }\nexport function toDetailDTO(entity) { return entity; }",
        "app.js": "import express from 'express';\nimport { parsePagination } from './pagination.js';\nimport { toSummaryDTO, toDetailDTO } from './mapper.js';\nimport { paginationMeta } from './metadata.js';\nconst app = express();\nconst entities = [\n  { id: 1, name: 'Phone A', price: 100, stock_quantity: 4, password_hash: 'private-a' },\n  { id: 2, name: 'Phone B', price: 200, stock_quantity: 8, password_hash: 'private-b' },\n  { id: 3, name: 'Phone C', price: 300, stock_quantity: 0, password_hash: 'private-c' }\n];\napp.get('/products', (req, res, next) => {\n  try {\n    const pagination = parsePagination(req.query);\n    const { offset, limit } = pagination;\n    const items = entities.slice(offset, offset + limit).map(toSummaryDTO);\n    res.json({ success: true, data: items, pagination: paginationMeta(entities.length, pagination) });\n  } catch (err) { next(err); }\n});\napp.get('/products/:id', (req, res) => {\n  const entity = entities.find(item => item.id === Number(req.params.id));\n  if (!entity) return res.status(404).json({ success: false, message: 'Product not found' });\n  res.json({ success: true, data: toDetailDTO(entity) });\n});\napp.get('/empty', (req, res, next) => {\n  try { res.json({ success: true, data: [], pagination: paginationMeta(0, parsePagination(req.query)) }); }\n  catch (err) { next(err); }\n});\napp.use((err, req, res, next) => {\n  res.status(err.status || 500).json({ success: false, message: err.message });\n});\napp.listen(3000);\n",
        "pagination.js": "export function parsePagination(query = {}) {\n  const page = query.page === undefined ? 1 : Number(query.page);\n  const requestedLimit = query.limit === undefined ? 20 : Number(query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 ||\n      !Number.isSafeInteger(requestedLimit) || requestedLimit < 1) {\n    throw Object.assign(new Error('page and limit must be positive integers'), { status: 400 });\n  }\n  const limit = Math.min(requestedLimit, 100);\n  const offset = (page - 1) * limit;\n  if (!Number.isSafeInteger(offset)) {\n    throw Object.assign(new Error('offset is too large'), { status: 400 });\n  }\n  return { page, limit, offset };\n}\n",
        "metadata.js": "export function paginationMeta(total, { page, limit }) {\n  return { total, page, limit, totalPages: Math.ceil(total / limit),\n    hasNextPage: page * limit < total, hasPrevPage: page > 1 };\n}\n"
      },
      "entry": "app.js",
      "solution": "export function toSummaryDTO(entity) {\n  return { id: entity.id, name: entity.name, price: entity.price };\n}\nexport function toDetailDTO(entity) {\n  return { id: entity.id, name: entity.name, price: entity.price, stockQuantity: entity.stock_quantity };\n}\n",
      "tests": [
        {
          "name": "Summary ส่งเฉพาะฟิลด์ที่ตกลง",
          "steps": [
            {
              "request": {
                "method": "GET",
                "path": "/products?limit=1"
              },
              "expect": {
                "status": 200,
                "jsonMatch": {
                  "data": [
                    {
                      "id": 1,
                      "name": "Phone A",
                      "price": 100
                    }
                  ]
                },
                "textExcludes": "password_hash"
              }
            }
          ]
        },
        {
          "name": "Detail แปลง snake_case โดยไม่เปิดข้อมูลภายใน",
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
                    "name": "Phone A",
                    "price": 100,
                    "stockQuantity": 4
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
      "hint": "เลือกฟิลด์ทีละตัว อย่า spread entity; detail เปลี่ยน stock_quantity เป็น stockQuantity"
    },
    {
      "type": "exercise",
      "id": "x-metadata",
      "title": "เขียน metadata ให้หน้าว่างยังมี total",
      "source": "Week-07 API Pagination & DTO/07-INT161-Pagination and DTO.pdf",
      "body": "<p>ใช้ Math.ceil(total/limit), page*limit<total และ page>1 โดยไม่ทิ้ง total=0 — แก้ไฟล์แรก แล้วกดตรวจคำตอบ</p>",
      "files": {
        "metadata.js": "export function paginationMeta(total, { page, limit }) {\n  return { total, page, limit, totalPages: 0, hasNextPage: false, hasPrevPage: false };\n}",
        "app.js": "import express from 'express';\nimport { parsePagination } from './pagination.js';\nimport { toSummaryDTO, toDetailDTO } from './mapper.js';\nimport { paginationMeta } from './metadata.js';\nconst app = express();\nconst entities = [\n  { id: 1, name: 'Phone A', price: 100, stock_quantity: 4, password_hash: 'private-a' },\n  { id: 2, name: 'Phone B', price: 200, stock_quantity: 8, password_hash: 'private-b' },\n  { id: 3, name: 'Phone C', price: 300, stock_quantity: 0, password_hash: 'private-c' }\n];\napp.get('/products', (req, res, next) => {\n  try {\n    const pagination = parsePagination(req.query);\n    const { offset, limit } = pagination;\n    const items = entities.slice(offset, offset + limit).map(toSummaryDTO);\n    res.json({ success: true, data: items, pagination: paginationMeta(entities.length, pagination) });\n  } catch (err) { next(err); }\n});\napp.get('/products/:id', (req, res) => {\n  const entity = entities.find(item => item.id === Number(req.params.id));\n  if (!entity) return res.status(404).json({ success: false, message: 'Product not found' });\n  res.json({ success: true, data: toDetailDTO(entity) });\n});\napp.get('/empty', (req, res, next) => {\n  try { res.json({ success: true, data: [], pagination: paginationMeta(0, parsePagination(req.query)) }); }\n  catch (err) { next(err); }\n});\napp.use((err, req, res, next) => {\n  res.status(err.status || 500).json({ success: false, message: err.message });\n});\napp.listen(3000);\n",
        "pagination.js": "export function parsePagination(query = {}) {\n  const page = query.page === undefined ? 1 : Number(query.page);\n  const requestedLimit = query.limit === undefined ? 20 : Number(query.limit);\n  if (!Number.isSafeInteger(page) || page < 1 ||\n      !Number.isSafeInteger(requestedLimit) || requestedLimit < 1) {\n    throw Object.assign(new Error('page and limit must be positive integers'), { status: 400 });\n  }\n  const limit = Math.min(requestedLimit, 100);\n  const offset = (page - 1) * limit;\n  if (!Number.isSafeInteger(offset)) {\n    throw Object.assign(new Error('offset is too large'), { status: 400 });\n  }\n  return { page, limit, offset };\n}\n",
        "mapper.js": "export function toSummaryDTO(entity) {\n  return { id: entity.id, name: entity.name, price: entity.price };\n}\nexport function toDetailDTO(entity) {\n  return { id: entity.id, name: entity.name, price: entity.price, stockQuantity: entity.stock_quantity };\n}\n"
      },
      "entry": "app.js",
      "solution": "export function paginationMeta(total, { page, limit }) {\n  return { total, page, limit, totalPages: Math.ceil(total / limit),\n    hasNextPage: page * limit < total, hasPrevPage: page > 1 };\n}\n",
      "tests": [
        {
          "name": "หน้าแรก หน้าสุดท้าย และเกินหน้า",
          "steps": [
            {
              "request": {
                "method": "GET",
                "path": "/products?page=1&limit=2"
              },
              "expect": {
                "jsonMatch": {
                  "pagination": {
                    "total": 3,
                    "page": 1,
                    "limit": 2,
                    "totalPages": 2,
                    "hasNextPage": true,
                    "hasPrevPage": false
                  }
                }
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products?page=2&limit=2"
              },
              "expect": {
                "jsonMatch": {
                  "pagination.hasNextPage": false,
                  "pagination.hasPrevPage": true
                }
              }
            },
            {
              "request": {
                "method": "GET",
                "path": "/products?page=3&limit=2"
              },
              "expect": {
                "jsonMatch": {
                  "data": [],
                  "pagination.total": 3
                }
              }
            }
          ]
        },
        {
          "name": "total=0 ต้องไม่หาย",
          "steps": [
            {
              "request": {
                "method": "GET",
                "path": "/empty"
              },
              "expect": {
                "jsonMatch": {
                  "pagination.total": 0,
                  "pagination.totalPages": 0,
                  "pagination.hasNextPage": false,
                  "pagination.hasPrevPage": false
                }
              }
            }
          ]
        }
      ],
      "hint": "ใช้ Math.ceil(total/limit), page*limit<total และ page>1 โดยไม่ทิ้ง total=0"
    }
  ]
};

const flow = lesson.blocks.find(block => block.id === 'c-pagination-layers');
flow.diagram = paginationDiagram;
flow.diagramCaption = 'Middleware ตรวจค่า → repository อ่าน items/total → mapper เลือกฟิลด์ → response ส่งข้อมูลและ metadata กลับ';
export default lesson;
