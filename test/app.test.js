const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const app = require('../app');

// The application module exports the Express instance without binding anything,
// so this suite owns the whole lifecycle: it wraps the app in its own HTTP
// server, starts that server before the tests and shuts it down afterwards.
const server = http.createServer(app);

// Port 0 asks the operating system for an ephemeral port, so the suite never
// competes with a development server that is already bound to the fixed port.
before(() => new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)));

// Closing the listener is functionally required rather than cosmetic: a server
// handle that is still listening keeps the event loop alive, so without this
// hook the runner would report the results and then never exit.
after(() => new Promise((resolve) => server.close(resolve)));

// Minimal promisified GET client, which is why no HTTP testing package is
// needed. The assigned port is read lazily, inside the helper, because
// server.address() returns null until the before hook above has resolved.
const get = (path) => new Promise((resolve, reject) => {
  const request = http.get({ hostname: '127.0.0.1', port: server.address().port, path }, (res) => {
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
