import mysql from 'mysql2/promise';

// ADAPT: เปลี่ยนเฉพาะ .env ตามเครื่องและฐานโจทย์ ไม่ hardcode password ใน source
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'int161_practice_students',
  waitForConnections: true,
  connectionLimit: 5
});
export default pool;
