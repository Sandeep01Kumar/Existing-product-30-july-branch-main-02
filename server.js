const http = require('http');
const app = require('./app');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer(app);

// The listener only starts when this file is run directly, so requiring the
// module (from a test, for instance) binds no port.
if (require.main === module) {
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}

module.exports = server;
