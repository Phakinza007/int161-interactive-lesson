import { concepts as C } from './w5-concepts.js';
import { experiments as E, exercises as X } from './w5-labs.js';

export default {
  id: 'w5',
  title: 'Express.js Framework',
  sources: ['week5/05-INT161-Express-Framework.pdf', 'week6/06-INT161-Error Handling.pdf (ตัวอย่าง logger)'],
  blocks: [
    C.expressWhat, E.firstExpress, X.hello,
    C.installProject,
    C.reqRes, X.params, E.statusChain, X.statusChain,
    C.layersExpress,
    C.routing, E.routerMount, X.router,
    C.middleware, E.middlewareOrder, X.middlewareLogger,
    E.layeredCrud, X.routeRead, X.routeCreate, X.routeUpdateDelete, X.appWiring,
  ],
};
