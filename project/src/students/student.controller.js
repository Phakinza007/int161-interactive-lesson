import {asyncHandler} from '../errors.js';
// ADAPT HTTP: อ่าน input ที่ถูกช่อง และเลือก status/envelope ตามโจทย์
export function createStudentController(service) {
  return {
    getAll: asyncHandler(async (req, res) => {
      const result = await service.list(req.query);
      res.status(200).json({success: true, ...result});
    }),
    getById: asyncHandler(async (req, res) => {
      res.status(200).json({success: true, data: await service.getById(req.params.id)});
    }),
    search: asyncHandler(async (req, res) => {
      const result = await service.list(req.query, true);
      res.status(200).json({success: true, ...result});
    }),
    create: asyncHandler(async (req, res) => {
      res.status(201).json({success: true, data: await service.create(req.body)});
    }),
    update: asyncHandler(async (req, res) => {
      res.status(200).json({success: true, data: await service.update(req.params.id, req.body)});
    }),
    remove: asyncHandler(async (req, res) => {
      await service.remove(req.params.id);
      res.status(204).end(); // 204 ห้ามมี body
    })
  };
}
