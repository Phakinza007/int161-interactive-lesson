import { concepts as C } from './w2-concepts.js';
import { experiments as E, exercises as X } from './w2-labs.js';

export default {
  id: 'w2',
  title: 'HTTP Programming Basics',
  sources: ['week2/W02-http-programming-basics.md'],
  blocks: [
    C.webHttp,
    C.nodeArch, E.eventLoop,
    C.coreModules,
    C.esmCjs, E.esmCjs,
    C.httpClasses, E.httpServer, E.responseApi,
    X.echo, X.writeEnd,
    C.methodsUrl,
    E.query, X.queryName, X.queryAll,
    E.pathSegments, X.pathSegments, X.pathVar,
    X.multiplication, X.esm,
  ],
};
