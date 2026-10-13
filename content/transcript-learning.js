// Summaries and teaching activities adapted from course transcripts, not verbatim quotes.
const doc = (week, date, topic) => ({ file: `week${week}/INT161_G2_${date.replaceAll('-', '')}.docx`, date, locator: `ค้นช่วงที่อธิบาย: ${topic}` });
const vtt = (locator) => ({ file: 'week8/INT161_G2_20261001.vtt', date: '2026-10-01', locator });
const predict = (question, choices, answer, explanation) => ({ question, choices, answer, explanation });
const note = (references, context, emphasis, misconception, takeaway, extra = {}) => ({ references, context, emphasis, misconception, takeaway, ...extra });
const w1 = (topic) => [doc(1, '2026-08-06', topic)];
const w2 = (topic) => [doc(2, '2026-08-13', topic)];
const w3 = (topic) => [doc(3, '2026-08-20', topic)];
const w4 = (topic) => [doc(4, '2026-08-27', topic)];
const w5 = (topic) => [doc(5, '2026-09-03', topic)];

export const TRANSCRIPT_LEARNING = {
  w1: {
    'c-architecture': note(w1('SPA, JavaScript ฝั่ง front-end เรียก backend แล้วรับ JSON'),
      'หน้าเว็บต้องแสดงข้อมูลใหม่เมื่อผู้ใช้กด โดยไม่จำเป็นต้องโหลดทั้งหน้าใหม่',
      'อาจารย์เปรียบเทียบการส่ง HTML กับการให้ JavaScript เรียก backend เพื่อรับ JSON แล้วนำไปแสดงผล',
      'Backend ที่ส่ง JSON ไม่ได้เป็นผู้วาด DOM ใน browser ให้เอง',
      'แยกให้ออกว่าใครขอข้อมูล ใครจัดการข้อมูล และใครนำข้อมูลไปแสดง', {
        prediction: predict('ใน SPA เมื่อ backend ตอบ JSON ใครนำข้อมูลไปปรับ DOM?', ['JavaScript ฝั่ง browser', 'MySQL', 'Node.js แก้ DOM ใน browser โดยตรง'], 0, 'JavaScript ฝั่ง front-end รับ JSON แล้วปรับหน้า ส่วน backend จัดการข้อมูลและส่ง response'),
      }),
    'e-http-server': note(w1('HTTP request/response และการสร้าง server'),
      'เขียน server ได้แล้ว แต่ยังต้องแยกให้ออกว่าการเปิด server กับการรับ request เป็นคนละเหตุการณ์',
      'เชื่อมภาพ front-end เรียก backend กับตัวอย่าง server ที่รับ request และส่งข้อมูลกลับ',
      'กด Run เพื่อเปิด server ยังไม่เท่ากับ browser ได้ส่ง request เข้า handler แล้ว',
      'ทดลองเปลี่ยนข้อความตอบกลับแล้วส่ง request ใหม่ สังเกตผลจากฝั่ง client', {
        steps: ['Run เพื่อเปิด server', 'ส่ง GET / แล้วอ่าน HTTP Response', 'เปลี่ยนข้อความใน response.end แล้ว Run และส่ง request ใหม่'],
        prediction: predict('ถ้าเปลี่ยนข้อความในโค้ด แต่ยังไม่ได้ Run ใหม่ request จะใช้โค้ดชุดใด?', ['โค้ดที่เพิ่งพิมพ์', 'โค้ดที่ Run ครั้งล่าสุด'], 1, 'การแก้ editor ไม่ได้เปลี่ยน server ที่รันอยู่ ต้อง Run ใหม่เพื่อใช้โค้ดใหม่'),
      }),
    'x-user': note(w1('backend ส่ง JSON ให้ front-end'),
      'Front-end ต้องอ่านข้อมูลผู้ใช้เป็น object จึงต้องตกลงรูปแบบ response กับ backend',
      'นำแนวคิด backend จัดการข้อมูลและส่ง JSON มาฝึกใน endpoint ขนาดเล็ก',
      'JavaScript object กับข้อความ JSON เป็นคนละค่า ต้องแปลงก่อนส่งผ่าน HTTP ในตัวอย่าง node:http',
      'อ่านทั้ง Content-Type และ body อย่าดูเฉพาะข้อความที่มองเห็น', {
        hints: ['ดูว่าโจทย์ต้องการ object ใด และ path ใด', 'node:http ส่งข้อความได้ จึงต้องแปลง object เป็น JSON และกำหนด Content-Type ให้ตรง'],
      }),
  },
  w2: {
    'c-web-http': note(w2('HTTP request เป็น input ของโปรแกรม'),
      'Client ส่งข้อมูลหลายตำแหน่งใน request โปรแกรมต้องอ่านตำแหน่งให้ถูกก่อนประมวลผล',
      'อาจารย์อธิบายว่า HTTP request คือ input ของโปรแกรม ไม่ใช่แค่ URL ที่พิมพ์ใน browser',
      'ข้อมูลทุกชนิดไม่ได้อยู่ใน body เสมอไป: method, headers และ URL มีหน้าที่ต่างกัน',
      'ก่อนเขียน handler ให้ระบุว่าจะอ่านข้อมูลจากส่วนไหนของ request'),
    'e-http-server': note(w2('อ่าน method, URL และ request ที่ client ส่งมา'),
      'URL เดียวกันอาจใช้คนละ method และให้ความหมายต่างกัน',
      'ฝึกอ่าน request ที่เข้ามาจริง ก่อนเชื่อมไปสู่ REST API',
      'การเปลี่ยน method ไม่ได้เปลี่ยน path ตามไปด้วย ทั้งสองเป็น input แยกกัน',
      'อธิบาย response จากค่า request.method และ request.url ที่ส่งจริง', {
        steps: ['Run แล้วส่ง GET /user/5', 'เปลี่ยนเป็น PUT โดยคง path เดิม', 'เทียบ HTTP Response กับบรรทัด Request received ใน Console'],
        prediction: predict('ส่ง PUT /user/5 ให้ตัวอย่างนี้ จะตอบข้อความใด?', ['You made a GET request to /user/5', 'You made a PUT request to /user/5', 'You made a PUT request to /'], 1, 'handler อ่าน method และ url จาก request แต่ละตัว ไม่ได้ยึดค่าจาก request ก่อนหน้า'),
      }),
    'e-query': note(w2('ข้อมูลจาก URL, query string และการอ่าน parameter'),
      'ผู้ใช้ส่ง fav_subj ซ้ำหลายค่า จึงต้องตัดสินใจว่าจะอ่านค่าเดียวหรือทุกค่า',
      'ต่อยอดการอ่าน input ใน URL ให้เห็นความต่างของ get กับ getAll',
      'get ไม่ได้คืน array ของทุกค่าที่ชื่อเหมือนกัน',
      'ใช้ get สำหรับค่าเดียว และ getAll เมื่อชื่อ parameter ซ้ำได้', {
        prediction: predict('URL มี fav_subj=A&fav_subj=B แล้ว getAll("fav_subj") ได้อะไร?', ['"A"', '["A", "B"]', '"B"'], 1, 'getAll รวมค่าทั้งหมดของชื่อเดียวกัน ส่วน get คืนค่าแรก'),
        steps: ['ส่ง query ที่มี fav_subj สองค่า', 'สังเกต array ที่แสดงใน response', 'ลบค่าที่สองแล้วส่งใหม่ เปรียบเทียบกับ get ของ name'],
      }),
  },
  w3: {
    'c-layered': note(w3('แบ่งโฟลเดอร์ตาม layer; repository, service และ router'),
      'เมื่อโค้ดโตขึ้น การอ่าน HTTP การตัดสินใจทางธุรกิจ และการเก็บข้อมูลไม่ควรปะปนในฟังก์ชันเดียว',
      'อาจารย์สร้างโฟลเดอร์ตาม layer และให้ router เรียก service แล้ว service เรียก repository',
      'แยกไฟล์อย่างเดียวไม่พอ ถ้า router ยังข้ามไปจัดการข้อมูลเองก็ยังผูกหน้าที่ไว้ด้วยกัน',
      'ไล่เส้นทาง Router → Service → Repository และอธิบายหน้าที่ของแต่ละชั้น', {
        prediction: predict('ใครควรอ่าน request.method และเลือก HTTP response?', ['Repository', 'Router', 'ฐานข้อมูล'], 1, 'Router รับผิดชอบ HTTP ส่วน service จัดการกฎธุรกิจ และ repository อ่านเขียนข้อมูล'),
      }),
    'e-project-run': note(w3('server ส่ง request ไป handleUserRequest ใน router'),
      'โปรเจกต์มีหลายไฟล์ ลองเริ่มไล่จากจุดรับ request แทนการอ่านทุกไฟล์พร้อมกัน',
      'ในคาบแยก router ออกจาก server แล้ว import ฟังก์ชันของแต่ละชั้นมาใช้งานต่อกัน',
      'ชื่อไฟล์หรือโฟลเดอร์ไม่ได้ทำให้เรียกกันเอง ต้องต่อ import/export และการเรียกฟังก์ชันจริง',
      'ตาม request หนึ่งตัวจนถึง response แล้วจึงลอง endpoint ถัดไป', {
        steps: ['เปิด server.js แล้วหา handler ที่รับ request', 'ตามการเรียกไป router, service และ repository', 'ส่ง GET /api/subjects แล้วเทียบข้อมูลกับ repository'],
      }),
    'x-layers': note(w3('service import repository; router import service'),
      'Router ทำงานได้แต่ข้าม service อยู่ ทำให้เมื่อกฎธุรกิจเปลี่ยนอาจใช้กฎไม่ครบ',
      'ฝึกแก้การเชื่อมชั้นให้ตรงกับโครงที่สอน โดยยังรักษา response เดิม',
      'ผลลัพธ์เหมือนเดิมไม่ได้แปลว่าโครงสร้างของโปรแกรมตรงตามโจทย์',
      'ตรวจทั้ง endpoint และ code check ที่ตรวจการเรียก service', {
        hints: ['หา import และการเรียกที่ทำให้ router ข้าม service', 'ให้ router เรียกฟังก์ชันของ service แล้วให้ service เป็นผู้เรียก repository'],
      }),
  },
  w4: {
    'c-goals-layers': note(w4('เปลี่ยนจาก array เป็นฐานข้อมูลและหน้าที่แต่ละชั้น'),
      'จากบทก่อนเก็บข้อมูลใน array บทนี้ย้ายการอ่านเขียนไป MySQL',
      'อาจารย์เน้นให้เข้าใจและปรับชื่อให้ตรงกับโปรเจกต์ของตนเอง ไม่คัดลอกชื่อจากสไลด์อย่างเดียว',
      'ข้อมูลใน memory ไม่คงอยู่หลังโปรแกรมปิด ส่วนฐานข้อมูลจริงเก็บข้อมูลแยกจากโปรเซสแอป',
      'ชั้นบนควรรู้สัญญาของ repository มากกว่ารายละเอียดการเก็บข้อมูล', {
        prediction: predict('ข้อมูลที่สร้างใน simulator นี้จะคงอยู่เมื่อกด Run ใหม่หรือไม่?', ['คงอยู่เสมอเหมือน MySQL จริง', 'เริ่มจาก fixtures ใหม่'], 1, 'ตัวจำลองสร้าง session ใหม่ทุกครั้งที่ Run ส่วนฐานข้อมูล MySQL จริงอยู่นอกโปรเซสแอปและมีข้อมูลคงอยู่'),
      }),
    'e-result-shape': note(w4('ผลของ INSERT, insertId และผลลัพธ์ query สองช่อง'),
      'INSERT ไม่ได้คืน object วิชาที่สร้างมาให้เหมือน SELECT',
      'ในคาบทดลองพิมพ์ผล query และนำ insertId ที่ฐานข้อมูลคืนมาไปใช้ต่อ',
      'affectedRows คือจำนวนแถวที่ได้รับผล ไม่ใช่ id ของแถวใหม่',
      'เลือกอ่าน rows, insertId หรือ affectedRows ให้ตรงกับคำสั่ง SQL', {
        steps: ['Run แล้วอ่าน insert, update และ delete ใน Console', 'เทียบ insertId กับ affectedRows', 'ดูว่าโค้ดใช้ inserted.insertId ส่งต่อให้ UPDATE และ DELETE อย่างไร'],
        prediction: predict('ต้องนำค่าใดจากผล INSERT ไปค้น object ที่เพิ่งสร้าง?', ['affectedRows', 'insertId', 'fields'], 1, 'insertId คือ id ที่ auto_increment จัดให้ ส่วน affectedRows บอกจำนวนแถวที่เปลี่ยน'),
      }),
    'x-async-chain': note(w4('async/await และการเรียก service ใน router'),
      'ฐานข้อมูลมีข้อมูล แต่ response ไม่มีข้อมูลที่คาดไว้ ทั้งที่ไม่เห็นข้อความ error',
      'การเปลี่ยน repository ให้เป็น async ทำให้ผู้เรียกต้องจัดการ Promise ก่อนนำผลไปใช้',
      'Promise ไม่ใช่ข้อมูลที่ query เสร็จแล้ว และการไม่มี error ไม่ได้ยืนยันว่า response ถูกต้อง',
      'แก้การรอผลให้ครบตามเส้นทางเรียก แล้วทดสอบทั้งรายการและข้อมูลตัวเดียว', {
        prediction: predict('ถ้า serialize Promise แทนข้อมูลที่ resolve แล้ว ควรเชื่อว่าได้ข้อมูลครบหรือยัง?', ['ครบแล้วเพราะไม่มี error', 'ยัง ต้องรอผลก่อนตอบ'], 1, 'การ serialize ไม่ได้รอ Promise ให้อัตโนมัติ ต้อง await ค่าที่จะใช้ก่อนสร้าง response'),
        hints: ['เริ่มจาก router: ฟังก์ชัน service ที่เรียกคืนค่าทันทีหรือคืน Promise?', 'เพิ่ม async ให้ handler ที่ต้องรอ และ await ผล service ก่อนส่งให้ writeResponse'],
      }),
    'x-business-dup': note(w4('เพิ่ม findBySubjectCode ที่ repository และตรวจซ้ำใน service ก่อน insert'),
      'POST รหัสวิชาที่มีอยู่แล้วทำให้ฐานข้อมูลปฏิเสธ UNIQUE constraint',
      'ในคาบแก้โดยค้นรหัสก่อนสร้างและให้ service ตัดสินใจว่าข้อมูลซ้ำ',
      'การเช็กซ้ำก่อน INSERT ช่วยอธิบายกฎธุรกิจ แต่ในระบบจริงยังต้องรับมือ DB error เมื่อมี request พร้อมกัน',
      'หลังตอบ 409 แล้ว request ถัดไปต้องยังใช้งานได้ และข้อมูลเดิมต้องไม่ถูกแก้', {
        prediction: predict('ตามสัญญาของ service ในโจทย์นี้ ถ้าพบรหัสเดิมควรทำอะไร?', ['INSERT ต่อแล้วค่อยตรวจ', 'คืน null โดยไม่สร้าง แล้วให้ router ตอบ 409'], 1, 'Repository ค้นข้อมูล service ตัดสินกฎซ้ำ และ router แปลงผลเป็น HTTP status'),
        hints: ['ตรวจว่าฟังก์ชันใดค้นด้วย subject_code และคืนอะไรเมื่อพบข้อมูล', 'await ผลค้นก่อนตัดสินใจ ถ้าพบให้หยุดก่อน repo.create; ถ้าไม่พบจึงสร้าง'],
      }),
  },
  w5: {
    'c-middleware': note(w5('middleware ส่งต่องานตามลำดับ'),
      'มีงานร่วมกันก่อนเข้า route เช่นอ่าน JSON หรือบันทึก request',
      'อาจารย์อธิบายการเสียบ middleware และส่งต่องานตามลำดับใน Express',
      'Middleware ที่ยังไม่ส่ง response และไม่ส่งต่องาน อาจทำให้ request ค้าง',
      'ทุกเส้นทางต้องรู้ว่าจะส่งต่อด้วย next หรือจบด้วย response'),
    'e-first-express': note(w5('params, query และ request body ใน Express'),
      'Request เดียวมีทั้ง id ใน path ตัวกรองใน query และข้อมูลแก้ไขใน body',
      'Express ช่วยแยกข้อมูลเหล่านี้ให้เข้าถึงผ่าน req.params, req.query และ req.body',
      'ค่า id ใน path ไม่ใช่ตัวเดียวกับ field id ที่ client อาจส่งใน body',
      'อ่าน input จากแหล่งที่ API กำหนด แล้วตรวจค่าก่อนนำไปใช้', {
        steps: ['ส่ง PUT /api/subjects/5?filter=web&page=2&size=10 พร้อม JSON body', 'เทียบ id, query และ body ใน response', 'เปลี่ยนเฉพาะ path id แล้วสังเกตว่าค่าใดเปลี่ยน'],
        prediction: predict('สำหรับ /api/subjects/5?page=2 ค่า req.params.id และ req.query.page คืออะไร?', ['id="5", page="2"', 'id="2", page="5"', 'ทั้งสองอยู่ใน req.body'], 0, 'params อ่านจาก route placeholder ส่วน query อ่านจากส่วนหลัง ? และค่าทั้งสองเริ่มต้นเป็น string'),
      }),
    'e-middleware-order': note(w5('middleware และการส่งต่องานก่อน router'),
      'Logger ต้องเห็น request และ parser ต้องทำงานก่อน route ใช้ body',
      'ลำดับ app.use มีผลต่อสิ่งที่ middleware และ route ถัดไปอ่านได้',
      'express.json ที่อยู่หลัง route ไม่ได้ย้อนกลับมาเติม body ให้ route ก่อนหน้า',
      'ลองเปลี่ยนลำดับทีละจุดแล้วแยกดู Console กับ HTTP Response', {
        steps: ['ส่ง POST /echo พร้อม {"name":"Somchai"}', 'สังเกต log แล้วดู received ใน response', 'ย้าย JSON parser หลัง route แล้ว Run และส่ง request ใหม่ จากนั้นคืนลำดับเดิม'],
        prediction: predict('ถ้าลบ next() จาก logger ที่ไม่ได้ตอบ response จะเกิดอะไร?', ['Route ยังทำงานตามเดิม', 'Request ไม่ถูกส่งต่อไป route'], 1, 'Logger ต้องเรียก next เพื่อส่งต่องาน มิฉะนั้นเส้นทางนี้ยังไม่มีผู้จบ response'),
      }),
    'x-middleware-logger': note(w5('middleware ส่งต่อให้โมดูลถัดไป'),
      'Console มี log แล้ว แต่ client ยังไม่ได้ response เพราะ logger ไม่ส่งต่องาน',
      'ฝึกทั้งหน้าที่ของ logger และการเชื่อมไป middleware หรือ route ถัดไป',
      'เห็น console.log แล้วไม่ได้แปลว่า request เสร็จสมบูรณ์',
      'ทดสอบว่ามีทั้ง log ที่ถูกต้องและ response จาก route', {
        hints: ['ดูว่า logger รับพารามิเตอร์ครบ req, res, next หรือยัง', 'หลังบันทึก method และ URL ให้ส่งต่องานด้วย next() โดยไม่ตอบซ้ำจาก logger'],
      }),
  },
  w6: {
    'c-what-error': note([vtt('00:22:26–00:23:30 · input จาก front-end และ database constraints')],
      'Backend อาจได้รับข้อมูลผิดหรือไม่ครบ แม้ front-end จะมีการตรวจข้อมูลแล้ว',
      'อาจารย์เริ่มจากข้อมูลที่ client ส่งกับ constraint ของฐานข้อมูล เพื่ออธิบายว่าทำไมต้องจัดการ error',
      'การตรวจ input ฝั่ง front-end อย่างเดียวไม่รับประกันว่า backend จะไม่มี error',
      'แยกการป้องกัน input ที่ผิด การรับ DB error และการตอบ client ออกจากกัน'),
    'e-try-catch': note([vtt('00:28:47–00:29:58 · throw กับการดักจับและส่ง error ขึ้นตามชั้น')],
      'ฟังก์ชันชั้นล่างเปิดไฟล์ที่ไม่มี แล้วผู้เรียกต้องเลือกว่าจะจัดการตรงไหน',
      'อาจารย์แยกการโยน error ออกจากการจับ error และอธิบายว่าจับในชั้นที่เหมาะสมได้',
      'throw ไม่ได้แปลว่าจัดการสำเร็จแล้ว และ catch ไม่ได้ทำให้ try กลับไปทำบรรทัดถัดจากจุดที่พัง',
      'อ่านลำดับ log เพื่อหาเส้นทางปกติกับเส้นทาง error', {
        steps: ['ก่อน Run ทายว่า After main error จะถูกพิมพ์หรือไม่', 'Run แล้วหา Message, Code และข้อความจบโปรแกรม', 'ลบ try/catch ทดลองอีกครั้ง แล้วคืนโค้ดเดิม'],
        prediction: predict('เมื่อ main() โยน error ใน try บรรทัด After main error ภายใน try จะทำงานหรือไม่?', ['ทำงานต่อหลังจับ error', 'ถูกข้าม แล้วไป catch'], 1, 'การ throw ขัดจังหวะ try ทันที หลัง catch จึงค่อยทำคำสั่งที่อยู่นอก try/catch ต่อ'),
      }),
    'x-try-catch': note([vtt('00:28:47–00:29:58 · การโยนและดักจับ error')],
      'อยากให้โปรแกรมรายงานสาเหตุที่อ่านไฟล์ไม่ได้และยังเดินถึงข้อความจบโปรแกรม',
      'ฝึกวาง catch ให้ตรงจุดรับผิดชอบ แทนการใส่ catch ทุกฟังก์ชันโดยไม่มีแผน',
      'การพิมพ์ข้อความเฉย ๆ โดยไม่จับ error ไม่ได้หยุดการส่ง error ขึ้นไป',
      'ตรวจว่า log หลังจุดที่พังภายใน try ไม่ปรากฏ แต่ log หลัง catch ยังปรากฏ', {
        hints: ['หา main() ที่ทำให้เกิด ENOENT และบรรทัดที่ต้องทำต่อหลังจัดการ error', 'ครอบชุดเรียกที่อาจพังด้วย try แล้วอ่าน e.message และ e.code ใน catch; เก็บข้อความจบไว้ด้านนอก'],
      }),
    'e-error-middleware': note([vtt('01:19:11–01:20:48 · ลำดับ middleware, JSON parser และ next'), vtt('01:21:35–01:22:02 · middleware สำหรับ error handling')],
      'หลาย route มี error ต่างกัน แต่ client ควรได้ response ที่อ่านรูปแบบได้สม่ำเสมอ',
      'เชื่อมกลไก middleware ในคาบกับ error handler กลางที่ใช้ในสไลด์และ template',
      'next() ส่งงานตามทางปกติ ส่วน next(err) ส่งงานเข้าทาง error; error handler ต้องอยู่หลัง route ที่ส่ง error มา',
      'ทดสอบทั้ง route ที่พังและ /ok เพื่อยืนยันว่าเส้นทางปกติยังทำงาน', {
        steps: ['Run แล้วส่ง GET /next และ GET /ok', 'เทียบ status และรูป JSON ของทั้งสองเส้นทาง', 'ย้าย error handler ไว้ก่อน route แล้ว Run และส่ง /next อีกครั้ง จากนั้นคืนตำแหน่งท้ายสุด'],
        prediction: predict('เมื่อ route เรียก next(err) Express จะเลือกงานประเภทใดต่อ?', ['Middleware ปกติทุกตัว', 'Error-handling middleware ที่อยู่ถัดไป'], 1, 'next(err) เลือกเส้นทางจัดการ error ต่างจาก next() ที่เดินทางปกติ'),
      }),
    'e-layered-errors': note([doc(7, '2026-09-24', 'ทดสอบ template ทีละ layer และ findOne ก่อน update/remove'), vtt('01:21:35–01:22:02 · error middleware')],
      'ต้องแยกว่าปัญหาเกิดตอนค้นข้อมูล ตอนตรวจ business rule หรือตอน query ฐานข้อมูล',
      'คาบ template แนะนำทดสอบทีละ layer ก่อนรวมหลายชั้นเข้าด้วยกัน',
      'HTTP 404 ไม่ได้หมายความว่า database ต่อไม่ได้ และ duplicate key ไม่ใช่กรณีเดียวกับไม่พบข้อมูล',
      'ไล่ Repository → Service → Route → Error middleware แล้วแยกทดสอบ 200, 404 และ 409', {
        steps: ['ส่ง GET /examples/1 แล้ว GET /examples/999', 'ส่ง POST รหัส INT 100 ที่มีอยู่แล้ว', 'ส่ง GET /examples/1 อีกครั้ง เพื่อดูว่า request หลัง error ยังใช้ได้'],
      }),
  },
};

export function enrichModule(mod) {
  const notes = TRANSCRIPT_LEARNING[mod.id] || {};
  for (const id of Object.keys(notes)) {
    if (!mod.blocks.some((b) => b.id === id)) throw new Error(`Unknown transcript activity: ${mod.id}/${id}`);
  }
  return {
    ...mod,
    sources: [...new Set([...mod.sources, ...Object.values(notes).flatMap((n) => n.references.map((r) => r.file))])],
    blocks: mod.blocks.map((b) => notes[b.id] ? { ...b, learning: notes[b.id] } : b),
  };
}
