// Keep application construction side-effect-free so callers decide when and
// where to listen.
const express = require('express');

const app = express();
// Reduce framework fingerprinting by removing Express's default X-Powered-By
// header.
app.disable('x-powered-by');

// Use core response methods to preserve the exact media type and body without
// Express-added metadata.
app.get('/', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, World!\n');
});

app.get('/good-evening', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Good evening\n');
});

// Avoid a wildcard path: unnamed wildcard patterns throw during Express 5
// registration.
app.use((req, res) => {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Not Found\n');
});

// Express identifies error middleware by this four-argument signature;
// handling it here avoids the default HTML/stack response.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.statusCode = 500;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Internal Server Error\n');
});

module.exports = app;
