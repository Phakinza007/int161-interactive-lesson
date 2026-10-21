-- ฐานตัวอย่างแยกสำหรับเปิดโค้ด ไม่ใช้แทน SQL ข้อสอบโดยไม่ตรวจ schema
-- ไม่มี DROP / TRUNCATE / ข้อมูลบุคคลจริง
CREATE DATABASE IF NOT EXISTS int161_practice_students CHARACTER SET utf8mb4;
USE int161_practice_students;
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  age INT NOT NULL
);
