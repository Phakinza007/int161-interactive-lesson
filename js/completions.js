const methods = (items) => items.map(([label, detail]) => ({ label, detail, type: 'method', apply: label }));
const response = methods([
  ['status', '(code) → response · Express'], ['json', '(data) · Express'], ['send', '(body) · Express'],
  ['sendStatus', '(code) · Express'], ['setHeader', '(name, value) · HTTP'], ['writeHead', '(code, headers) · HTTP'],
  ['write', '(chunk) · HTTP'], ['end', '(body) · HTTP'], ['redirect', '(url) · Express'],
]);
const request = ['method', 'url', 'headers', 'params', 'query', 'body'].map((label) => ({ label, type: 'property', detail: 'Request' }));
const members = {
  res: response, response, req: request, request,
  app: methods([['get', '(path, handler)'], ['post', '(path, handler)'], ['put', '(path, handler)'], ['patch', '(path, handler)'], ['delete', '(path, handler)'], ['use', '(middleware)'], ['listen', '(port, callback)']]),
  http: methods([['createServer', '(listener)']]),
  server: methods([['listen', '(port, callback)'], ['on', '(event, listener)'], ['close', '()']]),
  console: methods([['log', '(...values)'], ['error', '(...values)'], ['warn', '(...values)']]),
  fs: methods([['readFileSync', '(path, encoding)'], ['writeFileSync', '(path, data)']]),
  params: methods([['get', '(name)'], ['getAll', '(name)'], ['has', '(name)']]),
};
export function backendCompletions(context) {
  const member = context.matchBefore(/\b[A-Za-z_$][\w$]*\.[\w$]*/);
  if (member) {
    const [object] = member.text.split('.');
    const options = members[object];
    return options ? { from: member.from + object.length + 1, options, validFor: /^[\w$]*$/ } : null;
  }
  return null;
}
