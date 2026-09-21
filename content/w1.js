export default {
  id: 'w1',
  title: 'Introduction to Web Application & Node.js',
  sources: ['week1/W01-Introduction.md'],
  // TEMPORARY (Task 8): replaced by the 20-block assembly in Task 9
  blocks: Object.values((await import('./w1-concepts.js')).concepts),
};
