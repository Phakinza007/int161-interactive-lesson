# INT161 Interactive Lesson

บทเรียนแบบ interactive สำหรับวิชา INT161 Basic Backend Development — เขียนโค้ดแบบ Node.js แล้วกด Run ในเบราว์เซอร์ได้เลย

**สถานะ:** W1 พร้อมใช้งาน (20 บล็อก: แนวคิด 12 / ทดลอง 5 / เขียนเอง 3) — W2–W6 กำลังจัดทำ

## หมายเหตุ

- โค้ดรันบน **simulator ในเบราว์เซอร์** (ไม่ใช่ Node.js จริง) รองรับเฉพาะสิ่งที่ปรากฏในเนื้อหาวิชา (`http`, `fs`, `process`, `require`/`import`)
- เนื้อหาสรุปจากสไลด์และบันทึกคาบเรียนของวิชา INT161 เพื่อการเรียนรู้ส่วนตัว
- ความคืบหน้าและโค้ดที่แก้เก็บใน `localStorage` ของเบราว์เซอร์เท่านั้น ไม่ส่งไปที่ใด

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
