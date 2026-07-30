/**
 * Express application for the hello_world tutorial.
 *
 * This module owns request handling and nothing else: it builds the
 * application, registers the routes, and exports the result. It deliberately
 * binds no socket and has no other side effects, so `require('./app')` is safe
 * to call from both the process bootstrap (server.js) and the test suite, which
 * attaches the application to an ephemeral port of its own.
 *
 * Response contract (byte-exact, guarded by test/app.test.js):
 *   GET /             -> 200, Content-Type: text/plain, 'Hello, World!\n' (14 bytes)
 *   GET /good-evening -> 200, Content-Type: text/plain, 'Good evening\n'  (13 bytes)
 *   anything else     -> 404, Content-Type: text/plain, 'Not Found\n'     (10 bytes)
 *   unexpected error  -> 500, Content-Type: text/plain, 'Internal Server Error\n'
 *
 * Every handler writes its response with the raw `res.statusCode` /
 * `res.setHeader` / `res.end` triple carried over verbatim from the original
 * `http`-only implementation. That is deliberate rather than old-fashioned:
 * Express's `res.send` helper appends '; charset=utf-8' to the media type and
 * generates a weak ETag, either of which would change the response surface this
 * service has emitted since its first commit.
 *
 * Path matching uses the framework defaults, so case-insensitive and
 * trailing-slash variants such as /Good-Evening and /good-evening/ also match.
 * That is standard behaviour and is documented rather than overridden.
 *
 * @module app
 */
const express = require('express');

// Express advertises itself with an `X-Powered-By: Express` response header by
// default. Suppressing it as soon as the application exists keeps the response
// header set identical to the five headers this service has always returned,
// and follows the framework's own reduce-fingerprinting security guidance.
const app = express();
app.disable('x-powered-by');

// The original greeting, preserved byte-for-byte so existing consumers see no
// change whatsoever: same status, same bare media type, same 14-byte body.
app.get('/', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello, World!\n');
});

// The second greeting. Path dispatch is exactly what Express contributes here:
// the previous implementation never inspected the request, so every path
// received the same constant body and a second endpoint was not expressible.
app.get('/good-evening', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Good evening\n');
});

// Terminal not-found handler. Registration order is load-bearing: Express walks
// its middleware stack in registration order, so this must be registered after
// both routes, otherwise it would answer them instead of falling through.
//
// It is registered without a path on purpose. Express 5 requires wildcards to be
// named (the '/*splat' form), so the Express 4 catch-all idiom of a bare '*'
// path now raises a PathError while the route is being registered and takes the
// whole application down before it can serve a single request. Pathless
// middleware needs no path syntax at all and therefore cannot trip that failure
// mode. One consequence is that unmatched methods on a known path, POST / for
// example, land here too, so every unmatched request gets a uniform text/plain
// 404 instead of a mixture of response shapes.
app.use((req, res) => {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Not Found\n');
});

// Error handler, registered last so that it sees failures raised anywhere above
// it. The four-parameter signature is mandatory and `next` must remain even
// though it is unused: Express identifies error-handling middleware purely by
// function arity, and a three-parameter function is silently registered as
// ordinary middleware that never fires. Without this handler, Express's built-in
// one replies with an HTML page containing the stack trace whenever NODE_ENV is
// not 'production', which would both leak internals and break the text/plain
// contract. The stack is written to stderr instead, where it belongs.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.statusCode = 500;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Internal Server Error\n');
});

module.exports = app;
