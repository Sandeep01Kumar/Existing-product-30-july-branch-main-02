# hao-backprop-test

Test project for backprop integration.
The blanket "do not touch" note is superseded by the owner's explicit request for
the Express integration described below. Changes are still kept to the minimum a
requested feature needs, because this repository doubles as a small Node.js
teaching artifact.

A minimal HTTP service built on [Express](https://expressjs.com/) 5, declared as
`^5.2.1` and locked to 5.2.1, serving two plain-text greetings.

## Requirements

Node.js 18 or higher.

## Install

```bash
npm install
```

## Run

```bash
npm start
```

`npm start` runs `node server.js`, so `node .` and `node server.js` start the same
server. The host and port are fixed literals: it binds `127.0.0.1:3000` and prints
its readiness line:

```text
Server running at http://127.0.0.1:3000/
```

## Test

```bash
npm test
```

`npm test` runs `node --test`, which discovers `test/**/*.test.js`. The suite uses
Node's built-in test runner and assertions, so no test framework is installed and
the project has no development dependencies.

## Endpoints

| Method | Path | Status | Content-Type | Body |
|--------|------|--------|--------------|------|
| GET | `/` | 200 | `text/plain` | `Hello, World!` |
| GET | `/good-evening` | 200 | `text/plain` | `Good evening` |
| GET | anything else | 404 | `text/plain` | `Not Found` |

Each body ends with a trailing newline, so the three responses are 14, 13 and 10
bytes. Express's default routing is neither case-sensitive nor strict about a
trailing slash, so `/good-evening/` and `/Good-Evening` also return 200.

## Note on unmatched paths

Requests to any path other than the two routes above now return `404 Not Found`.
The previous server had no routing at all and answered every path with the
greeting, so this narrowing is the intended consequence of adding Express and is
not a regression.

The same applies to methods: only `GET`, and the `HEAD` handling Express derives
from it, matches the two routes, so `POST`, `PUT`, `DELETE`, `OPTIONS` and `PATCH`
receive the identical plain-text 404 where previously every method returned the
greeting.
