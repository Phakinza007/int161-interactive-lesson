import {Router} from 'express';
export function createStudentRouter(controller) {
  const router = Router();
  // ADAPT ROUTES: /search ต้องมาก่อน /:id
  router.get('/search', controller.search);
  router.get('/', controller.getAll); // R1: list + pagination
  router.get('/:id', controller.getById); // R2: detail
  // search เป็น R3; routes ถูก mount ที่ static student base path
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}
