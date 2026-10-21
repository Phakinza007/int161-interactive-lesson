// ADAPT SQL: เปลี่ยน table/columns/PK/UNIQUE/JOIN ตาม schema ของโจทย์
export function createStudentRepository(db) {
  const fields = 'id,name,email,age';
  async function findById(id) {
    const [rows] = await db.execute(`SELECT ${fields} FROM students WHERE id=?`, [id]);
    return rows[0] ?? null;
  }
  async function findByEmail(email) {
    const [rows] = await db.execute(`SELECT ${fields} FROM students WHERE email=?`, [email]);
    return rows[0] ?? null;
  }
  async function findPage({limit, offset}, name) {
    // identifier/WHERE เป็น source ที่เรากำหนด ไม่ได้ต่อจาก request
    const where = name === undefined ? '' : "WHERE name LIKE ? ESCAPE '!'";
    const filter = name === undefined ? [] : [`%${name.replace(/[!%_]/g, char => '!' + char)}%`];
    const [rows] = await db.execute(
      `SELECT ${fields} FROM students ${where} ORDER BY id LIMIT ? OFFSET ?`,
      [...filter, limit, offset]
    );
    const [[count]] = await db.execute(`SELECT COUNT(*) AS total FROM students ${where}`, filter);
    return {rows, total: Number(count.total)};
  }
  async function insert(student) {
    const [result] = await db.execute(
      'INSERT INTO students (name,email,age) VALUES (?,?,?)',
      [student.name, student.email, student.age]
    );
    return result.insertId; // เฉพาะ auto increment; string PK ใช้ key ที่รับมา
  }
  async function update(id, student) {
    await db.execute('UPDATE students SET name=?,email=?,age=? WHERE id=?',
      [student.name, student.email, student.age, id]);
  }
  async function remove(id) {
    const [result] = await db.execute('DELETE FROM students WHERE id=?', [id]);
    return result.affectedRows;
  }
  return {findById, findByEmail, findPage, insert, update, remove};
}
