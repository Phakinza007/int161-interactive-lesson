import { concepts as C } from './w4-concepts.js';
import { experiments as E, exercises as X } from './w4-labs.js';

export default {
  id: 'w4',
  title: 'Database Connection',
  sources: ['week4/W04-database-connection.md'],
  blocks: [
    C.goalsLayers, E.sqlConsole,
    C.connect, E.firstQuery, X.poolConfig,
    E.callbackPromise, E.resultShape,
    C.layersCode,
    X.findAll, X.findById, X.remove, X.create, X.update,
    X.asyncChain, X.getBody,
    E.crudApp, X.statusCodes,
    C.crudLogic,
    X.businessDup, X.sqlInjection,
  ],
};
