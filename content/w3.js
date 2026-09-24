import { concepts as C } from './w3-concepts.js';
import { experiments as E, exercises as X } from './w3-labs.js';

export default {
  id: 'w3',
  title: 'Introduction to RESTful API',
  sources: ['week3/W03-introduction-to-rest-api.md', 'week3/basic-rest/src/src (โค้ดที่แจก)'],
  blocks: [
    C.spaRest,
    C.constraints,
    C.uniform, E.verbs,
    C.naming, X.endpoints,
    C.url, E.urlAnatomy,
    C.layered, E.layers,
    C.project, E.projectRun, E.status,
    X.repoRead, X.repoRemove, X.routerDelete, X.layers,
    X.bugRouterElse, X.bugInsert, X.bugUpdate,
  ],
};
