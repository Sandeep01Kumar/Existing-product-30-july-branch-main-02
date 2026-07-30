const http = require('http');
const app = require('./app');

const hostname = '127.0.0.1';
const port = 3000;

// The express application is itself a valid (req, res) handler, so it drops
// straight into the existing server without changing the lifecycle shape.
const server = http.createServer(app);

// Bind only when this file is the process entry point. Requiring it from a test
// therefore yields a server that is not attached to port 3000, which is what
// lets the suite bind an ephemeral port instead. No 'error' handler is
// registered on purpose: a failed bind stays fatal, exactly as it was before.
if (require.main === module) {
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}

module.exports = server;
