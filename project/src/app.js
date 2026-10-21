import express from 'express';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import pool from './db.js';
import {HttpError, errorHandler} from './errors.js';
import {createStudentRepository} from './students/student.repository.js';
import {createStudentService} from './students/student.service.js';
import {createStudentController} from './students/student.controller.js';
import {createStudentRouter} from './students/student.routes.js';

export function createApp(db = pool, studentId = process.env.STUDENT_ID || 'demo001') {
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(studentId)) throw new Error('Invalid static STUDENT_ID');
  const app = express();
  const repo = createStudentRepository(db);
  const service = createStudentService(repo);
  const controller = createStudentController(service);
  app.use(express.json());
  // ADAPT: กำหนดรหัสตัวเองใน.env ไม่ใช้ /api/:studentId
  app.use(`/api/${studentId}/students`, createStudentRouter(controller));
  app.use((req, res, next) => next(new HttpError(404, 'Route not found', 'ROUTE_NOT_FOUND')));
  app.use(errorHandler); // error middleware ท้ายสุด
  return app;
}
// เมื่อ npm start เปิด port; เมื่อ import เพื่อทดสอบไม่เปิด server อัตโนมัติ
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const port = Number(process.env.PORT || 3000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
    await pool.query('SELECT 1');
    const server = createApp().listen(port, '127.0.0.1', () => console.log(`Student API: http://127.0.0.1:${port}`));
    server.on('error', async err => {console.error('Start failed:', err.code || 'SERVER_ERROR');await pool.end();process.exitCode = 1;});
    for (const signal of ['SIGINT','SIGTERM']) process.once(signal, () => server.close(async () => {await pool.end();process.exit();}));
  } catch (err) {
    console.error('Start failed:', err.code || err.message);
    await pool.end();process.exitCode = 1;
  }
}
