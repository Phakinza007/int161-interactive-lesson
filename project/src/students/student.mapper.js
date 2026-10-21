// ADAPT DTO: allowlist เฉพาะฟิลด์ที่ response กำหนด ไม่ return {...entity}
export function toStudentDTO(entity) {
  return {id: entity.id, name: entity.name, email: entity.email, age: entity.age};
}
