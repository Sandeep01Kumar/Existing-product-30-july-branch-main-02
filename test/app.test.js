const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const app = require('../app');

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

test('GET / returns the original greeting, byte-identical', async () => {
  const response = await get('/');
  assert.equal(response.status, 200);
  assert.equal(response.headers['content-type'], 'text/plain');
  assert.equal(response.body, 'Hello, World!\n');
  assert.equal(response.headers['x-powered-by'], undefined);
  assert.equal(response.headers.etag, undefined);
});

test('GET /good-evening returns the new greeting', async () => {
  const response = await get('/good-evening');
  assert.equal(response.status, 200);
  assert.equal(response.headers['content-type'], 'text/plain');
  assert.equal(response.body, 'Good evening\n');
});

test('GET on an unregistered path returns 404', async () => {
  const response = await get('/no-such-route');
  assert.equal(response.status, 404);
  assert.equal(response.headers['content-type'], 'text/plain');
  assert.equal(response.body, 'Not Found\n');
});
