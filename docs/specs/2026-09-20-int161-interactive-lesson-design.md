# INT161 Interactive Lesson — Design Spec

วันที่: 2026-09-20 · สถานะ: รอ user review · ขอบเขต: INT161 Week 1–6

## 1. เป้าหมาย

เว็บบทเรียน INT161 (Basic Backend Development) ที่ผู้เรียน **เขียนโค้ดหน้าตา Node.js/Express จริง กด Run แล้วเห็นผลทันที** ในเบราว์เซอร์ โดยแต่ละโมดูลแบ่งสัดส่วนเนื้อหาเป็น 3 ประเภทอย่างชัดเจนและตรวจสอบได้

### กติกาเนื้อหา (ตาม `files/CLAUDE.md`)

- ใช้เฉพาะเนื้อหาจากสไลด์/โน้ต/transcript ของ W1–W6 ห้ามเพิ่ม method, command, concept ที่ไม่มีในต้นฉบับ
- ภาษาไทยเป็นหลัก ศัพท์เทคนิคคงเป็นอังกฤษ
- ทุกบล็อกระบุแหล่งที่มา (ไฟล์ + หัวข้อ) ใน metadata ของ `content/wN.js`
- ไม่ทำโหมดภาษาอังกฤษ (ไม่ได้ขอ)

### ไม่อยู่ในขอบเขต (Non-goals)

- รัน Node.js หรือ MySQL จริง / มี backend ฝั่งเซิร์ฟเวอร์
- ระบบ login, บัญชีผู้ใช้, การเก็บคะแนนบนเซิร์ฟเวอร์
- W7 เป็นต้นไป (Prisma, Validation, DTO, JWT ฯลฯ)
- เฉลยของงานส่ง (ดู §8)

## 2. สัดส่วนเนื้อหา

ทุกโมดูลมี **20 บล็อก** 1 บล็อก = 1 หน่วย = 5% ของโมดูล สัดส่วนคือจำนวนบล็อกแต่ละประเภท:

| โมดูล | 📖 แนวคิด | 🔬 ทดลอง | ⌨️ เขียนเอง | แนวคิด:ทดลอง:เขียนเอง |
|---|---:|---:|---:|---|
| W1 Intro & Node.js | 12 | 5 | 3 | 60 : 25 : 15 |
| W2 HTTP Basics | 6 | 6 | 8 | 30 : 30 : 40 |
| W3 REST API | 7 | 5 | 8 | 35 : 25 : 40 |
| W4 Database Connection | 4 | 5 | 11 | 20 : 25 : 55 |
| W5 Express | 6 | 5 | 9 | 30 : 25 : 45 |
| W6 Error Handling | 5 | 5 | 10 | 25 : 25 : 50 |
| **รวม (120 บล็อก)** | **40** | **31** | **49** | **≈ 33 : 26 : 41** |

- นิยามประเภทบล็อก
  - **แนวคิด (concept):** อ่าน + ไดอะแกรม/ภาพที่กดได้ ไม่มีช่องเขียนโค้ด
  - **ทดลอง (experiment):** โค้ดที่เขียนให้แล้ว ผู้เรียนแก้ 1–2 จุดแล้ว Run ดูผล ไม่มีการตรวจผ่าน/ไม่ผ่าน
  - **เขียนเอง (exercise):** โค้ดเริ่มต้น + ชุดทดสอบอัตโนมัติ ผ่านครบจึงถือว่าเสร็จ
- ข้อตรวจสอบตอน build: สคริปต์ `tests/check-ratio.mjs` นับบล็อกในแต่ละ `content/wN.js` และ **fail ถ้าไม่ตรงตารางนี้**
- หน้า hub แสดงแถบสัดส่วนของแต่ละโมดูลคำนวณจากจำนวนบล็อกจริง (ไม่ hard-code)

## 3. โครงสร้างโปรเจกต์

เว็บ static ไม่มี build step (HTML + CSS + ES modules) เสิร์ฟด้วย static server (`python3 -m http.server`) หรือ GitHub Pages (เปิดจาก `file://` ไม่ได้เพราะ module worker)

```
INT161/interactive-lesson/        ← root ที่จะ deploy
  index.html                      hub: 6 โมดูล, แถบสัดส่วน, ความคืบหน้า
  lesson.html                     หน้าเรียน (รับ ?m=w2)
  css/  js/                       UI (renderer ของบล็อก, editor, ผลการรัน, progress)
  engine/
    sandbox.js                    main-thread: สร้าง Worker, timeout, ส่งผลกลับ
    worker.js                     รันโค้ดผู้เรียน (module worker)
    loader.js                     virtual file system + module loader (แปลงซอร์ส ESM/CJS)
    node-sim.js                   http, url/URL, fs (จำลอง), process, console
    express-sim.js                express, Router, middleware, error middleware
    mysql-sim.js                  mysql2 / mysql2/promise + ตารางใน memory + constraint
    net-sim.js                    "เครือข่าย" ในหน่วยความจำ: listen() ลงทะเบียน handler, request() ยิงเข้า handler
  content/wN.js (+ wN-*.js)        บล็อกของแต่ละสัปดาห์ (ข้อมูล ไม่ใช่โค้ด logic; wN.js ประกอบจากไฟล์ย่อย)
  tests/                          node --test สำหรับ engine + check-ratio.mjs
  docs/specs/                     สเปกนี้
```

ของที่ **ไม่เข้า deploy:** สไลด์ (`.pdf/.pptx`), วิดีโอ/เสียง, `week6/express-template/src/configs/db-config.js` (มีรหัสผ่าน MySQL จริง)

## 4. เอนจินจำลอง

### 4.1 การรันโค้ด

- ทุกครั้งที่กด Run: สร้าง **module Web Worker** ใหม่ → ใส่ไฟล์ของผู้เรียนลง virtual FS → แปลงซอร์ส ESM/CJS เป็นฟังก์ชัน async ด้วย loader ของเรา (ไม่ใช้ blob URL เพื่อให้เทสต์ใน Node ได้) → เมื่อจบ/ครบเวลา `worker.terminate()`
- **Timeout 3 วินาที** กัน loop ไม่จบ แสดง "โค้ดรันนานเกินไป (อาจมี loop ไม่จบ)"
- รองรับ ESM (`import`/`export`, top-level `await`) ตามที่ template W5/W6 ใช้ และ CommonJS (`require`, `module.exports`) ตามที่สไลด์ W1–W4 ใช้ โดยตรวจจากรูปแบบไฟล์
- specifier ที่รองรับ: `http`, `node:http`, `fs`, `node:fs`, `express`, `mysql2`, `mysql2/promise`, path สัมพัทธ์ระหว่างไฟล์ผู้เรียน (`./`, `../`)
- โมดูลอื่นที่ผู้เรียน import → error ชัดเจน "simulator ยังไม่รองรับโมดูล X" (ไม่พังเงียบ)
- `console.log/error` ถูกดักไปแสดงในแผง Output พร้อมลำดับเวลา

### 4.2 node-sim / net-sim

- `http.createServer(handler)` + `server.listen(port, cb)`: ลงทะเบียน handler ใน net-sim ไม่เปิดพอร์ตจริง
- `req`: `method`, `url`, `headers`, `on('data'/'end')` (สำหรับอ่าน body แบบ stream ตาม W4 §14) `res`: `writeHead`, `setHeader`, `write`, `end`, `statusCode`
- `URL`, `URLSearchParams` ใช้ของ JS ที่มีอยู่
- `fs` จำลอง: virtual files ที่กำหนดต่อโจทย์; `readFileSync`/`promises.readFile` กับไฟล์ที่ไม่มี → throw error ที่มี `code: 'ENOENT'` ตามที่ตัวอย่าง W6 ใช้
- `net-sim.request({method, path, headers, body})` คืน `{status, headers, text, json}` ใช้ทั้งในแผง "ตัวยิง request" และในชุดทดสอบ

### 4.3 express-sim (อ้างอิงพฤติกรรม Express 5 ตาม template)

- `express()`, `app.use`, `app.get/post/put/delete`, `app.listen`, `express.Router()`, `express.json()`
- `req.params`, `req.query`, `req.body`, `req.method`, `req.url`, `req.originalUrl`
- `res.status(n)` (คืน `res` ให้ chain), `res.json`, `res.send`, `res.end`
- ลำดับ middleware ตามที่ลงทะเบียน; `next()` ไปตัวถัดไป; `next(err)` ข้ามไป error middleware
- error middleware = ฟังก์ชัน 4 พารามิเตอร์ `(err, req, res, next)` ต้องอยู่หลัง route (ถ้าอยู่ก่อนจะไม่จับ ตามที่ W6 สอน)
- **Express 5:** async handler ที่ throw / reject → ส่งเข้า error middleware อัตโนมัติ
- ไม่มี error handler → ตอบ default error (500) เป็น HTML พร้อมข้อความว่าเป็น default ของ Express เพื่อให้ผู้เรียนเห็นผลตามที่ W6 เตือน
- ไม่พบ route → 404 default

### 4.4 mysql-sim

- API: `mysql2/promise` (`createPool`, `createConnection`, `getConnection`, `release`, `end`, `query`, `execute`) และ callback API ของ `mysql2` (สำหรับเทียบ callback vs async/await ใน W4)
- ผลลัพธ์รูปแบบเดียวกับ mysql2: SELECT → `[rows, fields]`; INSERT/UPDATE/DELETE → `[ResultSetHeader { insertId, affectedRows }]`
- SQL ที่รองรับ (ขั้นต่ำ ตามที่ปรากฏใน W4/W5/W6 และ template): `SELECT … FROM t [WHERE col = ?]`, `INSERT INTO t SET ?`, `INSERT INTO t (cols) VALUES (?, …)`, `UPDATE t SET ? WHERE …`, `DELETE FROM t WHERE …`, placeholder `?` แบบ prepared statement รายการจริงจะเก็บให้ครบจากโน้ต W4 ตอนเขียน `content/w4.js`
- ตารางเป็น JS object ใน memory; **seed จากโจทย์**และ **รีเซ็ตทุกครั้งที่กด Run**
- constraint ที่บังคับ: primary key (รวม composite), unique, foreign key (แบบ restrict) → throw error ที่มี `code`/`errno` ตรงกับ MySQL
  - `ER_DUP_ENTRY` / 1062
  - `ER_NO_REFERENCED_ROW_2` / 1452
  - `ER_ROW_IS_REFERENCED_2` / 1451
- SQL นอกชุดที่รองรับ → error "simulator ยังไม่รองรับ SQL นี้" พร้อมยกตัว statement

## 5. โครงข้อมูลบทเรียน

`content/wN.js` export `{ id, title, sources, blocks: [...] }` แต่ละ block:

```js
{ type: 'concept' | 'experiment' | 'exercise',
  id, title, source: 'week2/W02-….md §06',
  body,                       // concept: เนื้อหา + ไดอะแกรม
  files: { 'server.js': '…' },// experiment/exercise: โค้ดเริ่มต้น (หลายไฟล์ได้)
  fixtures: { tables, fs },   // ข้อมูลจำลองเริ่มต้น
  hint, solution,             // solution มีเฉพาะบล็อกที่ไม่ใช่งานส่ง (§8)
  tests: [ { name, steps: [ {request}, {expect: {status, json|text}} ] } ] }
```

- ชุดทดสอบของ exercise = ลำดับ request → ผลที่คาดหวัง (status + body) รันบน net-sim หลังโค้ดผู้เรียน start server แล้ว
- ผลลัพธ์แสดงเป็นรายการผ่าน/ไม่ผ่านต่อกรณี พร้อม "ได้อะไร / คาดหวังอะไร"

## 6. UI และความคืบหน้า

- **Hub:** การ์ด 6 โมดูล แต่ละใบมีแถบสัดส่วน 3 สี (แนวคิด/ทดลอง/เขียนเอง) + จำนวนบล็อกที่ทำแล้ว
- **หน้าเรียน:** รายการบล็อกเรียงตามลำดับ (sticky progress) บล็อก experiment/exercise มีตัวแก้โค้ด (CodeMirror 6 จาก CDN, fallback เป็น `<textarea>` ถ้าโหลดไม่ได้), ปุ่ม Run/Reset, แผง Output, แผงตัวยิง request, แผงผลทดสอบ, ปุ่ม Hint/เฉลย
- **ความคืบหน้า:** เก็บใน `localStorage` (ครอบด้วย try/catch หน้าเว็บต้องใช้ได้แม้ storage ใช้ไม่ได้) เก็บว่าบล็อกไหนเสร็จ และโค้ดที่ผู้เรียนแก้ไว้
- **สไตล์:** ยึดโทนเดียวกับ `files/summary-format-reference.html` (dark/light, สีประจำประเภทเนื้อหา) รายละเอียดสุดท้ายกำหนดตอนเขียน UI
- ใช้ได้บนมือถือ (ไม่มี horizontal scroll)

## 7. โครงเนื้อหารายโมดูล (ชื่อบล็อกเป็นร่าง ยืนยันจากโน้ตตอนเขียนแต่ละโมดูล)

- **W1 Intro & Node.js** — แนวคิด 12: ข้อตกลง/การประเมินผล/ตารางเรียน, Web Application ภาพรวม, MPA/SPA/Hybrid, MVC+SPA, Fullstack, HTTP request/response/cycle, compile vs interpret, Node.js, แนวคิด backend ทดลอง 5: ดู request/response แบบกดขยาย, สลับ MPA↔SPA, compile vs interpret, `console.log` แรก, ทดลองแก้ข้อความใน server ตัวอย่าง เขียนเอง 3: `/` → "Hello World"; `/user` → JSON `{name:'John Doe'}`; path อื่น → 404
- **W2 HTTP Basics** — Node architecture/event loop phases, core modules, http module + core classes, `createServer`, HTTP methods, อ่านค่าจาก URL, แบบฝึกหัดสูตรคูณ (`/multiply?num=7`)
- **W3 REST API** — REST principles, Uniform Interface, กติกาตั้งชื่อ endpoint, Layered System, โครงไฟล์ router/service/repository, โค้ดตัวอย่างที่แจก และ **หา/แก้บั๊กในโค้ดที่แจก**
- **W4 Database** — สร้าง table `subjects`, ขั้นตอนเชื่อม DB, `mysql2`, Connection vs Pool, callback vs async/await, `db/pool.js`, CRUD ด้วย prepared statement, async/await ลามทั้งเส้น, `getBody()`/`writeResponse()`, POST/PUT `/subjects`, business logic กันข้อมูลซ้ำ, วิธีคิดเรื่อง error
- **W5 Express** — Express คืออะไร/Key concepts, raw Node vs Express, `req.params/query/body`, `res.json`/`res.status`, layer Controller/Service/Repository, Router, middleware (application/router/error/built-in/third-party), โครงโปรเจกต์ ESM
- **W6 Error Handling** — exception/error คืออะไร, ประเภท error, error propagation, `try…catch`, Error object (`message/name/stack/code`), custom `AppError`, middleware chain, `next(err)`, error middleware 4 พารามิเตอร์ (ต้องอยู่ท้ายสุด), ตาราง status code, แปลง MySQL error → 400/404/409

## 8. งานส่ง `express_crud_exception_assignment.md`

- ใช้ข้อกำหนด + ตารางทดสอบ (§3 ของไฟล์นั้น) สร้างโจทย์ฝึกที่มี **ตัวตรวจอัตโนมัติ** (self-check) ให้ผู้เรียนทดสอบงานของตัวเอง
- **ไม่มีเฉลย ไม่มี hint ที่เผยโค้ดคำตอบ** สำหรับโจทย์กลุ่มนี้ (`solution` ไม่ถูกใส่)
- ผู้เรียนกรอกรหัสนักศึกษาของตัวเองในช่องบนหน้าเว็บ (เก็บใน localStorage ในเครื่อง ไม่ส่งไปไหน) ไม่มีรหัสจริงอยู่ในโค้ดหรือ repo
- ตัวตรวจเช็คตามข้อห้ามของงาน: path ต้องเป็น static prefix ที่ผู้เรียนพิมพ์เอง (ไม่ใช้ `:studentId`), ไม่หลุดเป็น default HTML error page, JSON ต้องมี `status`/`data`/`error` ตามสเปก
- เพื่อพิสูจน์ว่าตัวตรวจถูกต้อง ผมจะเขียน reference solution ชั่วคราวใน scratchpad รันกับตัวตรวจ แล้ว **ไม่บันทึกลง vault หรือ repo**
- โจทย์ "เขียนเอง" อื่น ๆ ของ W6 สร้างจากสไลด์บนตาราง `subjects` และมีเฉลยได้ตามปกติ

## 9. ความไม่ตรงกันในต้นฉบับ W6 (โมดูลต้องสอนให้เห็นทั้งหมด)

| แหล่ง | error field | รูป response |
|---|---|---|
| สไลด์ | `err.status`, `err.code` | `{error, statusCode, message, path, timestamp}` |
| `express-template/src/app.js` | `err.statusCode`, `err.code` | `{status: <number>, error, message, resource, timestamp}` |
| งานส่ง | `AppError(message, statusCode, errorCode)` | `{status: "error", error: {code, message}}` |

บล็อก W6 ระบุชัดว่ากำลังใช้แบบไหน และโจทย์ที่ตรวจอัตโนมัติจะประกาศรูป JSON ที่ต้องการไว้ในตัวโจทย์เสมอ (งานส่งใช้รูปตามงานส่ง)

## 10. การทดสอบ

- **Engine:** `node --test` (Node 26) ครอบ express-sim (ลำดับ middleware, `next(err)`, async throw, error handler อยู่ก่อน/หลัง), mysql-sim (ผลลัพธ์แต่ละ statement, constraint 3 แบบ, SQL ไม่รองรับ), node-sim (http handler, URL, fs ENOENT), loader (ESM/CJS, specifier ไม่รองรับ), sandbox timeout
- **เนื้อหา:** `tests/check-ratio.mjs` (สัดส่วน §2) + ตรวจว่าทุกบล็อกมี `source` และทุก exercise ที่มี `solution` ผ่านชุดทดสอบของตัวเองเมื่อรันบนเอนจินจริง
- **UI:** ตรวจในเบราว์เซอร์จริงทีละโมดูล (Run โค้ดตัวอย่าง, ทำโจทย์ผ่าน/ไม่ผ่าน, มือถือ, dark/light) ก่อนขึ้นโมดูลถัดไป

## 11. ลำดับการสร้าง

1. engine (node-sim, net-sim, loader, sandbox) + เทสต์ → UI เปล่า + hub → **W1**
2. mysql-sim ยังไม่ต้องทำจนถึง W4
3. **W2** → **W3** → **W4** (+ mysql-sim) → **W5** (+ express-sim) → **W6** (+ constraint + ตัวตรวจงานส่ง)
4. แต่ละโมดูลจบเมื่อ: เทสต์ engine ผ่าน, `check-ratio` ผ่าน, ตรวจในเบราว์เซอร์แล้ว

## 12. Deploy (หลังสร้างครบ W1–W6)

- `gh` login อยู่แล้ว (บัญชี Phakinza007) แต่ **จะถามชื่อ repo และ public/private แล้วขอยืนยันอีกครั้งก่อน push** เพราะเป็นการเผยแพร่ออกไปข้างนอก
- repo มีเฉพาะเนื้อหาของ `interactive-lesson/` (ไม่รวมสไลด์ วิดีโอ ไฟล์ประชุม `db-config.js`) → (git init ในเครื่องทำไว้แล้วตั้งแต่ Plan 1) → push → เปิด GitHub Pages (branch `main`, root)
- ตรวจ URL ที่ deploy แล้วเปิดได้จริงและ Run โค้ดตัวอย่างได้ก่อนรายงานว่าเสร็จ

## 13. ความเสี่ยงที่รู้แล้ว

| ความเสี่ยง | แนวทาง |
|---|---|
| จำลอง Node/Express/MySQL ไม่ตรง 100% | รองรับเฉพาะที่อยู่ในต้นฉบับ นอกเหนือจากนั้น error ชัดเจน ระบุไว้ในหน้า hub ว่าเป็นตัวจำลอง |
| Module Worker + blob import ต่างกันบางเบราว์เซอร์ | ทดสอบบน Chrome/Safari ล่าสุด ถ้าไม่ได้ให้ fallback เป็น loader แบบ transform |
| CodeMirror จาก CDN โหลดไม่ได้ | fallback เป็น `<textarea>` |
| สัดส่วนเบี้ยวเมื่อเขียนเนื้อหาจริง | `check-ratio` fail ตอน build บังคับให้ตรงตาราง |
