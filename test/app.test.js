const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const app = require('../app');

// The application is exported without binding anything, so the suite owns the
// lifecycle. Port 0 asks the operating system for an ephemeral port, which means
// the tests never collide with a server already running on 3000.
const server = http.createServer(app);

const get = (path) => new Promise((resolve, reject) => {
  const req = http.get(
    { host: '127.0.0.1', port: server.address().port, path },
    (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks)
      }));
    }
  );
  req.on('error', reject);
});

before(() => new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)));
after(() => new Promise((resolve) => server.close(resolve)));

test('GET / returns the original greeting unchanged', async () => {
  const res = await get('/');
  assert.equal(res.status, 200);
  assert.equal(res.headers['content-type'], 'text/plain');
  assert.equal(res.body.toString(), 'Hello, World!\n');
  assert.equal(res.body.length, 14);
  assert.equal(res.headers['x-powered-by'], undefined);
  assert.equal(res.headers.etag, undefined);
});

test('GET /good-evening returns the evening greeting', async () => {
  const res = await get('/good-evening');
  assert.equal(res.status, 200);
  assert.equal(res.headers['content-type'], 'text/plain');
  assert.equal(res.body.toString(), 'Good evening\n');
  assert.equal(res.body.length, 13);
});

test('an unregistered path returns a plain-text 404', async () => {
  const res = await get('/no-such-endpoint');
  assert.equal(res.status, 404);
  assert.equal(res.headers['content-type'], 'text/plain');
  assert.equal(res.body.toString(), 'Not Found\n');
});
