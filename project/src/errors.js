export class HttpError extends Error {
  constructor(status, message, code = 'VALIDATION_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// ส่ง Promise rejection ไป error middleware; Express 5 ทำได้เองด้วย
export const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ADAPT: status / code / envelope ต้องตรงกับโจทย์จริง
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const databaseErrors = {
    ER_DUP_ENTRY: [409, 'DUPLICATE_KEY', 'Student email already exists'],
    ER_NO_REFERENCED_ROW_2: [400, 'FOREIGN_KEY_NOT_FOUND', 'Referenced record does not exist'],
    ER_ROW_IS_REFERENCED_2: [409, 'RESOURCE_IN_USE', 'Record is referenced']
  };
  const [status, code, message] = databaseErrors[err.code] ??
    (err instanceof HttpError ? [err.status, err.code, err.message] :
      err.type === 'entity.parse.failed' ? [400, 'INVALID_JSON', 'Request body must be valid JSON'] :
      [500, 'INTERNAL_SERVER_ERROR', 'Internal server error']);
  // ไม่ส่ง SQL/stack/password หรือข้อความ DB กลับ client
  return res.status(status).json({success: false, error: {code, message}});
}
