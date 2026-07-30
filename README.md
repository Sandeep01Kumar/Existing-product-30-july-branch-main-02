# hao-backprop-test

Test project for backprop integration. Please keep changes to the minimum a
requested feature needs; this repository doubles as a Node.js teaching artifact,
so it is deliberately small.

A minimal HTTP service built on [Express](https://expressjs.com/) that serves two
plain-text greetings.

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

The server binds `127.0.0.1:3000` and prints its readiness line:

```
Server running at http://127.0.0.1:3000/
```

## Test

```bash
npm test
```

## Endpoints

| Method | Path | Status | Content-Type | Body |
|--------|------|--------|--------------|------|
| GET | `/` | 200 | `text/plain` | `Hello, World!` |
| GET | `/good-evening` | 200 | `text/plain` | `Good evening` |
| GET | anything else | 404 | `text/plain` | `Not Found` |

Each body ends with a trailing newline.

## Note on unmatched paths

Requests to any path other than the two routes above now return `404 Not Found`.
The previous server had no routing at all and answered every path with the
greeting, so this narrowing is the intended consequence of adding Express and is
not a regression.
