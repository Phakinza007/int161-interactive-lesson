import { concepts as C } from './w6-concepts.js';
import { experiments as E, exercises as X } from './w6-labs.js';

export default {
  id: 'w6',
  title: 'Error Handling',
  sources: ['week6/06-INT161-Error Handling.pdf', 'week6/express-template/src', 'week6/express_crud_exception_assignment.md'],
  blocks: [
    C.whatError, E.tryCatch, X.tryCatch,
    C.propagation, E.customError, X.appError, X.throwCustom,
    C.errorFlow, E.errorMiddleware, X.errorMiddleware, X.nextErr,
    C.statusResponse,
    C.layersAssignment, E.layeredErrors, E.mysqlErrors,
    X.a1, X.a2, X.a3, X.a4, X.a5,
  ],
};
