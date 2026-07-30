const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const app = require('../app');

// The application module exports the Express instance without binding anything,
// so this suite owns the whole lifecycle. Only the `test` export of node:test is
// used: the standalone before/after hooks arrived in Node.js 18.8.0, while
// package.json permits any Node.js 18 release, so every test starts and stops its
// own server instead of sharing one opened by a hook.

// Minimal promisified GET client, which is why no HTTP testing package is
// needed. The port is a parameter because the caller below owns the listener and
// only learns the assigned port once it is bound.
const httpGet = (port, path) => new Promise((resolve, reject) => {
  const request = http.get({ hostname: '127.0.0.1', port, path }, (res) => {
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => resolve({
      status: res.statusCode,
      headers: res.headers,
      body: Buffer.concat(chunks).toString(),
    }));
  });
  request.on('error', reject);
});

// Port 0 asks the operating system for an ephemeral port, so the suite never
// competes with a development server that is already bound to the fixed port.
// Closing the listener is functionally required rather than cosmetic: an open
// server handle keeps the event loop alive and the runner would never finish, so
// the finally block releases it even when an assertion throws.
const get = async (path) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    return await httpGet(server.address().port, path);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
};

// Regression guard for the pre-existing response contract. Every value is
// compared with strict equality against the exact literal, including the
// trailing newline, so a body of 13 or 15 bytes fails instead of passing
// quietly. The two header assertions pin the absence of the metadata Express
// would add on its own: the framework banner and an entity tag.
test('GET / returns the original greeting, byte-identical', async () => {
  const response = await get('/');
  assert.equal(response.status, 200);
  assert.equal(response.headers['content-type'], 'text/plain');
  assert.equal(response.body, 'Hello, World!\n');
  assert.equal(response.headers['x-powered-by'], undefined);
  assert.equal(response.headers.etag, undefined);
});

// Acceptance test for the endpoint this change adds.
test('GET /good-evening returns the new greeting', async () => {
  const response = await get('/good-evening');
  assert.equal(response.status, 200);
  assert.equal(response.headers['content-type'], 'text/plain');
  assert.equal(response.body, 'Good evening\n');
});

// Routing narrows the response surface: paths that match no route now reach the
// terminal handler, which answers in plain text instead of the framework's HTML
// default. This also proves the pathless handler registration dispatches.
test('GET on an unregistered path returns 404', async () => {
  const response = await get('/no-such-route');
  assert.equal(response.status, 404);
  assert.equal(response.headers['content-type'], 'text/plain');
  assert.equal(response.body, 'Not Found\n');
});
