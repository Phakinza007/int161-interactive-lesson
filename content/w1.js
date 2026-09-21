import { concepts as C } from './w1-concepts.js';
import { experiments as E, exercises as X } from './w1-labs.js';

export default {
  id: 'w1',
  title: 'Introduction to Web Application & Node.js',
  sources: ['week1/W01-Introduction.md'],
  blocks: [
    C.agreements, C.courseEval, C.schedule, C.http,
    E.httpServer, E.contentType,
    C.architecture, E.archFlow,
    C.json, E.json,
    C.fullstack, C.webservice, C.nodejs, C.translators, E.translator,
    C.installFile,
    X.hello, X.user, X.notFound,
    C.backendSummary,
  ],
};
