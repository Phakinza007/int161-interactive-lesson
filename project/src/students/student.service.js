import {HttpError} from '../errors.js';
import {toStudentDTO} from './student.mapper.js';

function idFrom(raw) {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw) ||
      !Number.isSafeInteger(Number(raw)) || Number(raw) < 1)
    throw new HttpError(400, 'ID must be a positive integer');
  return Number(raw);
}
// ADAPT BODY: ชุดนี้ PUT ใช้ full body เหมือน POST
function studentFrom(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new HttpError(400, 'Body must be an object');
  const {name, email, age} = body;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100)
    throw new HttpError(400, 'Name is required (max 100 characters)');
  if (typeof email !== 'string' || email.trim().length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    throw new HttpError(400, 'Invalid email', 'INVALID_EMAIL');
  if (!Number.isInteger(age) || age < 0 || age > 150)
    throw new HttpError(400, 'Age must be an integer from 0 to 150');
  return {name: name.trim(), email: email.trim(), age}; // allowlist
}
function paginationFrom(query) {
  const positive = (value, fallback) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^\d+$/.test(value) ||
        !Number.isSafeInteger(Number(value)) || Number(value) < 1)
      throw new HttpError(400, 'Invalid pagination');
    return Number(value);
  };
  const page = positive(query.page, 1);
  const limit = Math.min(positive(query.limit, 10), 100);
  const offset = (page - 1) * limit;
  if (!Number.isSafeInteger(offset)) throw new HttpError(400, 'Pagination offset too large');
  return {page, limit, offset};
}
export function createStudentService(repo) {
  async function getById(rawId) {
    const entity = await repo.findById(idFrom(rawId));
    if (!entity) throw new HttpError(404, 'Student not found', 'STUDENT_NOT_FOUND');
    return toStudentDTO(entity);
  }
  async function list(query, search = false) {
    let name;
    if (search) {
      if (typeof query.name !== 'string' || !query.name.trim() || query.name.trim().length > 100)
        throw new HttpError(400, 'Search name is required (max 100 characters)');
      name = query.name.trim();
    }
    const p = paginationFrom(query);
    const {rows, total} = await repo.findPage(p, name);
    const totalPages = Math.ceil(total / p.limit);
    return {data: rows.map(toStudentDTO), pagination: {
      page: p.page, limit: p.limit, total, totalPages,
      hasNextPage: p.page < totalPages, hasPrevPage: p.page > 1
    }};
  }
  async function create(body) {
    const data = studentFrom(body);
    if (await repo.findByEmail(data.email)) throw new HttpError(409, 'Student email already exists', 'DUPLICATE_KEY');
    const id = await repo.insert(data);
    return getById(String(id));
  }
  async function update(rawId, body) {
    await getById(rawId); // not-found ก่อน UPDATE; ค่าเดิมยังตอบ200ได้
    const id = idFrom(rawId), data = studentFrom(body);
    const other = await repo.findByEmail(data.email);
    if (other && other.id !== id) throw new HttpError(409, 'Student email already exists', 'DUPLICATE_KEY');
    await repo.update(id, data);
    return getById(rawId); // ไม่ใช้ changedRows=0 ตัดสิน404
  }
  async function remove(rawId) {
    if (!await repo.remove(idFrom(rawId))) throw new HttpError(404, 'Student not found', 'STUDENT_NOT_FOUND');
  }
  return {list, getById, create, update, remove};
}
