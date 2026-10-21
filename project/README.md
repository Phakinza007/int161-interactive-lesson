# Project: Students API — โค้ดครบตามโครงที่เห็นบนเว็บ

ตัวอย่างที่รันได้ในเครื่องสำหรับหยิบโครงไปปรับ มี1C/3R/1U/1D ไม่ใช่โจทย์ข้อสอบจริงหรือไฟล์พร้อมส่งโดยไม่แก้ สามReadของตัวอย่างคือlist/detail/search+pagination

อ่านขั้นตอนพร้อม flow, request/response และจุดแก้แต่ละไฟล์ใน [GUIDE.md](GUIDE.md)

## เปิดโปรเจกต์

ต้องเตรียมNode>=22.9,MySQLและdependenciesขณะยังมีอินเทอร์เน็ตก่อนสอบ

```sh
cd project
npm ci
cp .env.example .env
mysql -u root -p < database.sql
npm start
```

แก้.envให้ตรงDBของเครื่องก่อน database.sqlสร้างฐานตัวอย่างint161_practice_studentsและตารางstudentsแบบIF NOT EXISTS ไม่มีDROP/TRUNCATE ถ้าจะใช้กับฐานอาจารย์ให้ใช้SQL/คำสั่งอาจารย์และแก้schema/codeตามโจทย์ ไม่รันSQLตัวอย่างทับฐานที่ไม่รู้ที่มา

เปิด http://127.0.0.1:3000/api/demo001/students และเปลี่ยนSTUDENT_IDใน.envเป็นรหัสของตัวเอง โครงนี้ไม่สร้าง/resetฐานระหว่างเปิดserver ZIPไม่รวม.envจริงหรือnode_modules

## โครงและหน้าที่

- src/app.js ประกอบlayers/middleware/basepathและเปิดport
- src/db.js อ่าน.envและสร้างconnectionpool
- src/errors.js HttpError(status,message,code), asyncHandlerและerrorhandler
- students/student.routes.js method/pathและ/searchก่อน/:id
- students/student.controller.js รับreq/ส่งres
- students/student.service.js validation/businessrules/pagination/DTO
- students/student.repository.js SQL/parameterbinding/COUNT/UNIQUE
- students/student.mapper.js allowlistresponse

ค้นคอมเมนต์ADAPTเพื่อดูจุดเปลี่ยนตามโจทย์ แก้SQL → validation → DTO → route/status/envelopeให้ครบ

## Requestครบ6รูปแบบ

base=/api/demo001/students

| Method/path | ผลที่ต้องตรวจ |
| --- | --- |
| POST / | 201; emailซ้ำ409 |
| GET /?page=1&limit=10 | 200 dataarray+pagination |
| GET /:id | 200 หรือ404 |
| GET /search?name=Demo&page=1&limit=10 | 200 filterและCOUNTตรงกัน |
| PUT /:id | 200แม้ส่งค่าเดิม; missing404; emailชนอีกแถว409 |
| DELETE /:id | 204ว่าง; ลบซ้ำ404 |

POST/PUTใช้fullbody `{ "name":"Demo Student", "email":"demo@example.invalid", "age":20 }` ไม่รับidจากbody ชื่อrequiredmax100, emailตรวจรูปแบบพื้นฐานmax255, ageinteger0..150

Paginationdefaultpage1/limit10,max100แบบcap ค่าinvalid/ซ้ำ/offsetoverflow400 Searchnameห้ามว่างและค้นแบบcontainsตัวอักษรตรงตัว โดยescapeSQLwildcards%/_/! COUNTใช้filterเดียวกับรายการ ชื่อfield/envelopeเป็นของตัวอย่างนี้ หากโจทย์กำหนดsize/totalItemsหรือstatus/dataต้องแก้ตามนั้น

ดูerrors.jsเพื่อปรับ400/404/409/500และDBerrorsให้ตรง ชุดนี้เป็นExpress5แต่แสดงasyncHandlerให้เห็นการส่งerrorผ่านnext(err) คีย์AppErrorในtemplateอีกrepoอาจมีconstructorต่างกัน อย่าสลับclass/handlerโดยไม่แก้ให้ตรง
