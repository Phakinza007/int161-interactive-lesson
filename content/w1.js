export default {
  id: 'w1',
  title: 'Introduction to Web Application & Node.js',
  sources: ['week1/W01-Introduction.md'],
  blocks: [
    { type: 'concept', id: 'c-scaffold', title: 'ตัวอย่างบล็อกแนวคิด', source: 'scaffold',
      body: '<p>บล็อกนี้เป็นตัวอย่างชั่วคราว</p>' },
    { type: 'experiment', id: 'e-scaffold', title: 'ตัวอย่างบล็อกทดลอง', source: 'scaffold',
      body: '<p>กด Run แล้วลองส่ง request</p>',
      files: { 'app.js': "const http = require('node:http');\nhttp.createServer((req, res) => {\n  res.writeHead(200);\n  res.end('Hello World');\n}).listen(3000);\nconsole.log('Server running');\n" } },
    { type: 'exercise', id: 'x-scaffold', title: 'ตัวอย่างบล็อกเขียนเอง', source: 'scaffold',
      body: '<p>ทำให้ <code>/</code> ตอบ <code>Hello World</code></p>',
      files: { 'app.js': "const http = require('node:http');\nhttp.createServer((req, res) => {\n  // เขียนโค้ดตรงนี้\n  res.end('');\n}).listen(3000);\n" },
      solution: "const http = require('node:http');\nhttp.createServer((req, res) => {\n  res.writeHead(200);\n  res.end('Hello World');\n}).listen(3000);\n",
      tests: [{ name: 'GET / → Hello World', steps: [{ request: { path: '/' }, expect: { status: 200, text: 'Hello World' } }] }] },
  ],
};
