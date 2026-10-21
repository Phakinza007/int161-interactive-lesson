# INT161 Interactive Lesson

บทเรียนแบบ interactive สำหรับวิชา INT161 Basic Backend Development — เขียนโค้ดแบบ Node.js แล้วกด Run ในเบราว์เซอร์ได้เลย

**สถานะ:** W1–W7 และบทเตรียมสอบกลางภาค พร้อมใช้งาน เปิดเรียนได้ที่ [GitHub Pages](https://phakinza007.github.io/int161-interactive-lesson/)

## หมายเหตุ

- โค้ดรันบน **simulator ในเบราว์เซอร์** (ไม่ใช่ Node.js จริง) รองรับเฉพาะสิ่งที่ปรากฏในเนื้อหาวิชา (`http`, `fs`, `process`, `require`/`import`)
- เนื้อหาสรุปจากสไลด์และบันทึกคาบเรียนของวิชา INT161 เพื่อการเรียนรู้ส่วนตัว
- ความคืบหน้าและโค้ดที่แก้เก็บใน `localStorage` ของเบราว์เซอร์เท่านั้น ไม่ส่งไปที่ใด

## เผยแพร่

GitHub Pages ของรีโปนี้เผยแพร่จากโฟลเดอร์รากของ branch `main` โดยตรง หลัง push ไปที่ `main` เว็บไซต์จะอัปเดตอัตโนมัติ

## รันในเครื่อง

เปิดจาก `file://` ไม่ได้ (ใช้ module worker) ให้เสิร์ฟด้วย static server:

```bash
python3 -m http.server 8161
# เปิด http://localhost:8161
```

## ทดสอบ

ต้องใช้ Node.js 20+:

```bash
npm test            # engine, store, และเนื้อหา
npm run check-ratio # ตรวจสัดส่วนแนวคิด:ทดลอง:เขียนเอง ของแต่ละโมดูล
```

## โครงสร้าง

| โฟลเดอร์ | หน้าที่ |
|---|---|
| `engine/` | simulator: network, http/fs/process, module loader, Web Worker sandbox |
| `js/` `css/` | UI: hub, หน้าเรียน, editor, ตัวยิง request, ความคืบหน้า |
| `content/` | เนื้อหารายสัปดาห์ (ข้อมูลล้วน ๆ) |
| `tests/` | `node --test` สำหรับ engine/store/content |

## พื้นที่ฝึกรวม

บทเรียนและแบบฝึก W1–W6 อยู่ใน [Knowledge Web](https://knowledge-web-one.vercel.app/practice#int161) แล้ว เว็บเดิมยังใช้งานได้ กด **ส่งออกงานเพื่อย้ายเข้าเว็บรวม** ที่หน้าแรก แล้วนำไฟล์ JSON ไปนำเข้าในเว็บรวม

## Learning navigation and editor

- The home page highlights completion and passed exercises. **เรียนต่อจากครั้งล่าสุด** returns to the last reading position in this browser.
- A table of contents is available from the sticky **สารบัญ** button. Each topic shows whether it was read, tried, or passed; previous/next links move between topics.
- Run panels separate Console and HTTP Response, show server state, and invalidate old request controls when code changes. Exercise results show each check and Expected/Actual where applicable.
- CodeMirror autocomplete opens while typing JavaScript and familiar backend receivers such as `req.`, `request.`, `res.`, `response.`, `app.`, and `http.`. Press **Ctrl+Space** to open suggestions, **Enter/Tab** to accept, or **Esc** to dismiss.
- Snippets: `clg`, `express-route`, and `http-server`. These are JavaScript and lesson API suggestions, not the complete VS Code TypeScript language service.
- The editor loads from the existing esm.sh CDN. If unavailable, a labeled textarea remains usable for editing and running code, with a notice that autocomplete could not load.
- Progress and code continue to use `int161-progress-v1`; the optional `lastVisited` field preserves existing saved work. Progress is local to the browser and origin.

## Transcript-guided learning

W1–W6 include 22 selected topics enriched from the course transcripts, with 13 prediction questions, experiment steps, summaries, misconceptions, takeaways and source references. Six exercises reveal two conceptual hints before the original technical hint. Source dates and available VTT timestamps are shown in the lesson; raw transcripts are not included in this repository.

The source mapping and accuracy notes are in [the transcript audit](docs/reviews/2026-10-13-transcript-content-audit.md). Recording weeks are matched by topic: the 1 October Error Handling transcript supplements module W6. That earlier audit covered W1–W6; the October update adds Pagination/DTO as W7 using the supplied Week-07 slides.

## October midterm material

- W7: six concepts, three experiments and three checked exercises on pagination input, SQL LIMIT/OFFSET/COUNT, DTOs and response metadata.
- Midterm review: official rules supplied by the user, theory topic links, template gaps, offline preparation, one complete in-memory example and six invented tasks (1C/3R/1U/1D).
- The practice tasks use fictional data and in-memory storage. They are not an official exam or a substitute for practising with MySQL.
- `diagrams/pagination-dto.html` is a self-contained architecture figure created with Diagram Design, using the INT161 profile and system fonts. It is also embedded in W7.
- Notes and labs are mirrored into the local Knowledge Web project as `int161/w07-pagination-and-dto` and `int161/w08-midterm-review`.
- The standalone simulator now binds integer LIMIT/OFFSET placeholders. The integrated Knowledge Web simulator already supports them.
- Validation and source distinctions: [October review](docs/reviews/2026-10-21-midterm-content-review.md).

## Backend Visual Guide

เปิด [backend-guide.html](backend-guide.html) จากหน้าแรกหรือบท theory/midterm เพื่อดูแผนภาพ Backend แบบกดเลือกcomponent มีหน้าที่/input-output/โค้ด/ข้อควรระวัง พร้อม7request traces, Pagination playground และ9หัวข้ออ่านต่อ ภาพSVGและscriptอยู่ในHTMLเดียว ไม่มีCDN การเดินrequestเป็นการจำลองเพื่ออธิบาย ไม่ใช่การqueryฐานจริง บันทึกHTMLไว้เปิดอ่านออฟไลน์ได้

### โครงงาน Students API พร้อมโค้ด

เปิด [Visual guide → Project](backend-guide.html#project) เพื่อเลือกอ่านแต่ละไฟล์พร้อมสีโค้ด หรือดาวน์โหลด [project.zip](project.zip) ซึ่งมี folder `project/` พร้อม `package.json`, `src/app.js`, `db.js`, `errors.js` และ student routes/controller/service/repository/mapper ครบทุกไฟล์ ดูขั้นตอนรันใน [project/README.md](project/README.md)

โครงนี้เป็นตัวอย่างที่จัดทำเพิ่มสำหรับอ้างอิง 1C/3R/1U/1D ไม่ใช่โจทย์หรือเฉลยจริงของอาจารย์ ปรับ schema, DTO, route และ status ให้ตรงสเปกสอบก่อนใช้
