# GUIDE — เปิด อ่าน และปรับ Students API ทีละขั้น

คู่มือนี้ตรงกับโค้ดใน folder `project/` ที่มี `src/students/student.*.js` ใช้ Node.js, Express ESM และ MySQL โครงนี้เป็นตัวอย่างอ้างอิงที่จัดทำเพิ่ม ไม่ใช่โจทย์หรือเฉลยข้อสอบจริงของอาจารย์

มี 6 endpoints หลัก: 1 Create, 3 Read (list/detail/search), 1 Update, 1 Delete พร้อม DTO, Pagination และ Exception Handling ต้องปรับตาม schema และสเปกสอบจริงก่อนนำไปใช้

## สารบัญ

1. เปิดโปรเจกต์และตั้งค่าฐานข้อมูล
2. แต่ละไฟล์ทำงานอย่างไร
3. ไล่หนึ่ง request ผ่านโค้ด
4. ทดลองครบ 6 endpoints พร้อมผลที่คาดหวัง
5. แก้ template ตามสเปกจริง
6. DTO และ Pagination แบบเข้าใจผลลัพธ์
7. Error เดินทางอย่างไร
8. แก้ปัญหาและเตรียมใช้ offline

## 1. เปิดโปรเจกต์และตั้งค่าฐานข้อมูล

### 1.1 เข้า folder ให้ถูก

แตก `project.zip` แล้วเปิด Terminal ใน folder `project` ที่มี package.json:

```text
project/
├── package.json          dependencies + npm start
├── package-lock.json     ล็อกเวอร์ชันสำหรับ npm ci
├── .env.example         ตัวอย่าง config
├── database.sql         ฐานและตารางตัวอย่าง
├── GUIDE.md             คู่มือนี้
└── src/
    ├── app.js           ประกอบ app และเปิด port
    ├── db.js            connection pool
    ├── errors.js        custom error / handler
    └── students/
        ├── student.routes.js
        ├── student.controller.js
        ├── student.service.js
        ├── student.repository.js
        └── student.mapper.js
```

### 1.2 ติดตั้ง dependencies ก่อนตัดอินเทอร์เน็ต

เตรียม Node >=22.9, npm และ MySQL ที่เปิดใช้งานไว้:

```sh
cd project
npm ci
cp .env.example .env
```

หาก Terminal อยู่ใน project แล้ว ไม่ต้อง cd ซ้ำ `npm ci` ใช้ package-lock.json และต้องเชื่อมต่อ registry เมื่อยังไม่มี dependencies เตรียมขั้นนี้ในช่วงที่อนุญาตก่อนสอบ ZIP ไม่รวม node_modules

### 1.3 แก้ .env

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=int161_practice_students
PORT=3000
STUDENT_ID=demo001
```

- DB_USER/DB_PASSWORD: บัญชี MySQL เครื่องตัวเอง ไม่ใช่บัญชี GitHub/LEB2
- DB_PORT: port ของ MySQL ส่วน PORT: port ที่ API จะเปิด
- DB_NAME: ต้องตรงฐานที่นำเข้า SQL
- STUDENT_ID: เปลี่ยน prefix เช่น demo001 → รหัสตัวเอง แล้ว URL ทุก request ต้องเปลี่ยนตาม
- เก็บ .env ในเครื่อง ไม่ใส่รหัสผ่านจริงใน source/Git

### 1.4 สร้างฐานตัวอย่างและเริ่ม API

```sh
mysql -u root -p < database.sql
npm start
```

คำสั่ง mysql ถามรหัสผ่าน MySQL แล้วนำเข้า database.sql; ถ้าเครื่องไม่มี mysql CLI ใช้เครื่องมือ MySQL ที่ติดตั้งอยู่เปิดและรันไฟล์เดียวกัน หาก account ไม่ใช่ root ให้เปลี่ยนชื่อ user ตามจริง

database.sql ใช้ CREATE IF NOT EXISTS ไม่ลบตารางเดิม และไม่แก้ตารางเก่าให้ตรง schema ใหม่โดยอัตโนมัติ ใช้ฐานฝึกของตัวเอง หากใช้ฐานอาจารย์ให้ทำตาม SQL อาจารย์และแก้ DB_NAME/code แทนการนำเข้าตัวอย่างนี้

เมื่อเห็น `Student API: http://127.0.0.1:3000` ให้ปล่อย Terminal ทำงานอยู่ เปิด URL:

```text
http://127.0.0.1:3000/api/demo001/students
```

ควรได้ 200 และ data=[] เมื่อฐานยังว่าง app ตรวจการเชื่อมต่อก่อน listen แต่ไม่สร้างตารางเอง กด Ctrl+C เพื่อหยุด หลังแก้ source/.env ต้องเริ่ม npm start ใหม่ เพราะโครงนี้ไม่ได้ใช้ watch mode

## 2. แต่ละไฟล์ทำงานอย่างไร

| ไฟล์ | หน้าที่ | จุดปรับตามโจทย์ |
| --- | --- | --- |
| [app.js](src/app.js) | สร้าง repo → service → controller → router, JSON parser, error handler, listen | base path, config, entrypoint |
| [db.js](src/db.js) | อ่าน config แล้วสร้าง pool ของ mysql2/promise | host/user/password/database |
| [errors.js](src/errors.js) | HttpError, asyncHandler และ errorHandler | status/code/message/envelope |
| [routes](src/students/student.routes.js) | จับ method + path กับ controller | endpoint/params |
| [controller](src/students/student.controller.js) | อ่าน req เรียก service ส่ง res | params/query/body/status |
| [service](src/students/student.service.js) | ตรวจ input, duplicate/not-found, pagination, เรียก mapper | required/type/rules |
| [repository](src/students/student.repository.js) | SQL เท่านั้น ไม่รู้จัก req/res | table/columns/key/filter |
| [mapper](src/students/student.mapper.js) | เลือก field ออกจาก entity เป็น DTO | ชื่อ field และชนิด response |

ฟังก์ชัน `createStudentService(repo)` รับ repository ที่สร้างจาก app.js จึงเรียก repo ได้โดยไม่ต้อง import pool ใน service วิธีนี้ทำให้ SQL รวมอยู่ใน repository ส่วน controller ไม่ต้องรู้ชื่อตาราง

## 3. ไล่หนึ่ง Request ผ่านโค้ด

ตัวอย่าง `GET /api/demo001/students/7`:

```text
Client ส่ง HTTP GET
 → app.js: express.json และ base path /api/demo001/students
 → router: /:id ตรงกับ 7
 → controller.getById: อ่าน req.params.id = "7"
 → service.getById: idFrom ตรวจและแปลงเป็นเลข 7
 → repo.findById: SELECT ... WHERE id=? [7]
 ← rows[0] หรือ null
 → service: ถ้าไม่มี throw 404; ถ้ามี toStudentDTO
 ← controller: HTTP 200 + {success:true,data:DTO}
```

โค้ดหลักที่เชื่อมกัน:

```js
// Controller: HTTP
const data = await service.getById(req.params.id);
res.status(200).json({success: true, data});

// Service: กฎ + รูปแบบข้อมูล
const entity = await repo.findById(idFrom(rawId));
if (!entity) throw new HttpError(404, 'Student not found', 'STUDENT_NOT_FOUND');
return toStudentDTO(entity);

// Repository: SQL
const [rows] = await db.execute(
  'SELECT id,name,email,age FROM students WHERE id=?', [id]
);
return rows[0] ?? null;
```

`[rows]` ดึงผลตัวแรกที่ mysql2 คืนมา ส่วน `rows[0]` คือแถวแรกในผล SELECT ห้ามสลับกัน ถ้าลืม await จะได้ Promise แทนข้อมูลที่พร้อมใช้

## 4. ทดลองครบ 6 endpoints พร้อมผลที่คาดหวัง

ใช้ Postman หรือ HTTP client ที่มีในเครื่อง Browser address bar เหมาะสำหรับ GET ส่วน POST/PUT/DELETE ให้ใช้ HTTP client ทุกครั้งที่ส่ง JSON ตั้ง Content-Type: application/json

Base URL ตัวอย่างคือ `http://127.0.0.1:3000/api/demo001/students` หากเปลี่ยน PORT/STUDENT_ID ให้เปลี่ยนตาม

### C1 — POST สร้างข้อมูล

```http
POST /api/demo001/students
Content-Type: application/json

{"name":"Demo Student","email":"demo@example.invalid","age":20}
```

Flow: controller อ่าน req.body → studentFrom ตรวจค่า/allowlist → เช็ก email ซ้ำ → INSERT → รับ insertId → อ่านกลับ → DTO

คาดหวัง 201 เช่น:

```json
{"success":true,"data":{"id":1,"name":"Demo Student","email":"demo@example.invalid","age":20}}
```

ID อาจไม่ใช่ 1 ให้จด data.id ที่ได้จริงไว้ใช้ขั้นต่อไป ส่ง email เดิมซ้ำได้ 409 ส่ง age เป็น "20" หรือ name ว่างได้ 400 ตาม validation ของโครงนี้

### R1 — GET รายการและแบ่งหน้า

```http
GET /api/demo001/students?page=1&limit=10
```

คาดหวัง 200:

```json
{
  "success":true,
  "data":[{"id":1,"name":"Demo Student","email":"demo@example.invalid","age":20}],
  "pagination":{"page":1,"limit":10,"total":1,"totalPages":1,"hasNextPage":false,"hasPrevPage":false}
}
```

data เป็น array แม้มีแค่แถวเดียว ค่าจริงขึ้นกับข้อมูลในฐาน ไม่ควร hardcode total เป็นจำนวนในตัวอย่าง

### R2 — GET รายตัว

```http
GET /api/demo001/students/1
```

แทน 1 ด้วย ID ที่ได้จาก POST คาดหวัง 200 และ data เป็น object ไม่ใช่ array ถ้า ID ไม่มีได้ 404; ID เช่น abc ได้ 400

### R3 — GET ค้นหาและแบ่งหน้า

```http
GET /api/demo001/students/search?name=Demo&page=1&limit=10
```

คาดหวัง 200 รูป response เหมือน list แต่ total นับเฉพาะชื่อที่ตรงกับ filter หากไม่พบส่ง data=[] และ total=0 name ต้องไม่ว่าง โครงนี้ค้นแบบ contains ตัวอักษรตรงตัว โดย escape %, _ และ ! ที่เป็น wildcard/escape ใน SQL

`/search` ต้องประกาศก่อน `/:id` มิฉะนั้น search อาจถูกอ่านเป็น ID

### U1 — PUT แก้ไข

```http
PUT /api/demo001/students/1
Content-Type: application/json

{"name":"Demo Updated","email":"demo@example.invalid","age":21}
```

แทน ID ของแถวตัวเอง ส่ง **ครบทั้ง name/email/age** เพราะ PUT ของชุดนี้รับ full body Flow: existing → validate → เช็ก email ที่ชนแถวอื่น → UPDATE → อ่านกลับ → DTO

คาดหวัง 200 มีข้อมูลใหม่ GET ID เดิมอีกครั้งต้องเห็นค่าที่แก้ ส่งค่าเดิมซ้ำยังได้ 200 ไม่ใช้จำนวนแถวที่เปลี่ยนค่าเป็นตัวตัดสินว่าไม่พบ

### D1 — DELETE

```http
DELETE /api/demo001/students/1
```

ลบแถวที่สร้างเอง คาดหวัง 204 และ body ว่าง ไม่มี success JSON; DELETE ซ้ำหรือ GET ID เดิมได้ 404

### วิธีตรวจจาก Terminal

```sh
curl -i 'http://127.0.0.1:3000/api/demo001/students?page=1&limit=10'
curl -i -X POST 'http://127.0.0.1:3000/api/demo001/students' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Demo Student","email":"another@example.invalid","age":20}'
```

`-i` แสดง HTTP status/headers ด้วย เปลี่ยน email หากเคยสร้างแล้ว ดูแถวใน DB ด้วย ID ที่ได้ เพื่อยืนยันว่ามีการเขียนจริง ไม่ตรวจแค่ response

## 5. แก้ template ตามสเปกจริง

ก่อนแก้จดตารางนี้สำหรับทุก endpoint:

```text
Method/path:
Params/query/body: ชื่อ + ชนิด + required + null/default
Table/columns: PK, FK, UNIQUE
Success: status + DTO + envelope
Errors: เงื่อนไข → status/code/message
Pagination: page เริ่มเท่าไร, size/limit, max, หน้าที่เกิน
```

จากนั้นแก้ตามลำดับ:

1. **Repository**: เปลี่ยน students/columns/WHERE/SQL ให้ตรง schema รวม SELECT และ COUNT
2. **Service**: แก้ studentFrom, idFrom, paginationFrom, uniqueness และเงื่อนไขไม่พบ
3. **Mapper**: เปลี่ยน field/type ที่ส่งออก
4. **Controller**: เปลี่ยน input ที่อ่านและ status/envelope
5. **Routes/app**: เปลี่ยน path และ mount prefix พร้อมแก้ import หาก rename ไฟล์
6. **errors.js**: จับคู่ error contract
7. **Requests**: แก้ URL/body ที่ใช้ทดสอบให้ตรงโครงใหม่

ค้น comment `ADAPT` ในโค้ดเพื่อเริ่ม ไม่จำเป็นต้องเปลี่ยนทุกไฟล์ทุกครั้ง ถ้าเปลี่ยนเฉพาะชื่อ response field ให้ดู mapper แต่ถ้าต้องดึงข้อมูลอีกตารางต้องแก้ SQL JOIN/alias ด้วย

`?` ใช้ bind ค่าข้อมูล ไม่ใช้แทนชื่อตาราง/คอลัมน์ ชื่อเหล่านั้นแก้ใน source ตามสเปกเอง อย่าต่อ SQL จาก input ตรง ๆ และอย่าส่ง req.body ทั้งก้อนลง repository

auto increment ใช้ insertId; string PK เช่น NA ต้องเก็บเป็น string และอ่านกลับด้วย key นั้น Composite key ต้องใช้ทุกส่วนใน WHERE การเปลี่ยน resource ไม่ใช่แค่ rename students แล้วจบ

หากย้ายเข้า template อาจารย์ คง package/scripts/โครงส่งของอาจารย์ รวมเฉพาะ source/dependencies ที่ต้องใช้ ไม่ทับ package.json ทั้งไฟล์โดยไม่เทียบ

## 6. DTO และ Pagination แบบเข้าใจผลลัพธ์

### DTO

`toStudentDTO` เลือก id/name/email/age เท่านั้น หากเพิ่มคอลัมน์ภายในในตาราง ไม่ควรส่งออกโดยอัตโนมัติ ไม่ใช้ `{...entity}` แทน allowlist

ถ้า API กำหนด fullName แต่ DB ใช้ first_name/last_name ให้ repository SELECT สอง field แล้ว mapper รวมเป็น fullName ถ้า field เป็น DECIMAL อาจต้อง Number ตาม contract และ nullable ต้องรักษา null ไม่แปลงเป็น 0 โดยไม่ตั้งใจ

DTO อยู่ใน data ส่วน `{success,data,pagination}` คือ envelope ถ้าแก้ envelope ให้แก้ทุก success controller และ error handler ให้เข้าคู่กัน ชุดนี้ไม่มี timestamp ต่างจาก exam-kit อีก repo

### Pagination

โครงปัจจุบัน: default page=1, limit=10, cap limit=100, query ผิด/ซ้ำได้ 400

```js
offset = (page - 1) * limit;
totalPages = Math.ceil(total / limit);
```

ตัวอย่าง total=23, page=3, limit=10 → offset=20, มีได้ไม่เกิน 3 แถว, totalPages=3 หน้า 4 ตอบ 200 กับ [] แต่ total ยังเป็น 23 ฐานว่าง total=0 และ totalPages=0

limit ที่ใช้คำนวณ offset/SQL/metadata ต้องเป็นค่าหลัง cap เดียวกัน ต้องมี ORDER BY ที่แน่นอน และ SELECT/COUNT ใช้ filter เหมือนกัน ไม่ใช้ rows.length ของหน้าเดียวแทน total

ถ้าสเปกใช้ size แทน limit ต้องแก้ทั้ง query parser, SQL input, metadata และ request ตัวอย่าง ไม่เปลี่ยนเฉพาะชื่อ key ใน JSON

## 7. Error เดินทางอย่างไร

```text
Service โยน HttpError หรือ Repository reject ด้วย DB error
 → asyncHandler.catch(next)
 → errorHandler หลัง routes
 → เลือก HTTP status + {success:false,error:{code,message}}
```

constructor ของชุดนี้ใช้ **status, message, code**:

```js
throw new HttpError(404, 'Student not found', 'STUDENT_NOT_FOUND');
```

อย่าสลับกับ AppError(message,status,code) ใน int161-exam-kit

| กรณี | HTTP ในโครงนี้ |
| --- | --- |
| Body/ID/query ผิด | 400 |
| JSON เขียนผิดรูปแบบ | 400 INVALID_JSON |
| ID ไม่พบ | 404 STUDENT_NOT_FOUND |
| Email ซ้ำ / ER_DUP_ENTRY | 409 DUPLICATE_KEY |
| FK ไม่มี / ER_NO_REFERENCED_ROW_2 | 400 FOREIGN_KEY_NOT_FOUND |
| ถูก FK อ้างอิง / ER_ROW_IS_REFERENCED_2 | 409 RESOURCE_IN_USE |
| Error ที่ไม่ได้คาดหมาย | 500 INTERNAL_SERVER_ERROR |

ตาราง students ตัวอย่างไม่มี FK; สอง mapping ของ FK เตรียมไว้สำหรับกรณีปรับ schema ที่มีความสัมพันธ์ ไม่ได้แปลว่าทุก error จะเกิดกับฐานเดิม

ไม่จับทุก error แล้วตอบ 409 ไม่ส่ง SQL/stack/password ไป client ไม่ catch แล้วกลืน error จน request ค้าง และ handler ต้องอยู่หลัง routes

## 8. แก้ปัญหาและเตรียมใช้ offline

| อาการ | ตรวจและแก้ |
| --- | --- |
| npm หา package.json ไม่เจอ | เข้า folder project ที่มีไฟล์จริง |
| ERR_MODULE_NOT_FOUND | ติดตั้ง dependencies ก่อนตัดเน็ต; ตรวจ .js/import/path |
| ECONNREFUSED | เปิด MySQL และตรวจ DB_HOST/DB_PORT |
| ACCESS_DENIED | แก้ user/password ของ MySQL ใน .env |
| Unknown database / table ไม่พบ | import SQL และตั้ง DB_NAME ให้ตรง |
| EADDRINUSE | หยุด server เดิม หรือเปลี่ยน PORT และ URL |
| 404 ทุก request | ตรวจ STUDENT_ID/base path/method/port |
| Body ไม่เข้า | Content-Type และ express.json ก่อน router |
| POST ผ่าน แต่ field หาย | ตรวจ SQL columns → entity → mapper |
| PUT ส่งแต่ name แล้ว 400 | โครงใช้ full body ต้องส่ง email/age ด้วย |
| โค้ดแก้แล้วผลไม่เปลี่ยน | Ctrl+C แล้ว npm start ใหม่ |

ก่อนสอบทดลอง: Create → Detail → List → Search → Update → Delete และ negative cases ข้างต้น แล้วตัดอินเทอร์เน็ตและเปิด API/คู่มือได้จริง เตรียม dependencies ในช่วงที่อนุญาต รับ/ส่งงานตาม LEB2 และข้อกำหนดอาจารย์

การรันตัวอย่างผ่านช่วยยืนยันว่าเข้าใจโครง แต่ต้องตรวจ status, key/type, DTO และ persistence ตามสเปกสอบจริงอีกครั้ง
