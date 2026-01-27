const http = require('http');
const { createRouter } = require('./router.js');
const { createRequest } = require('./request.js');
const { createResponse } = require('./response.js');
const { setInstance } = require('./instance.js');
const loadConfig = require('../config/index.js');

class Build {

  constructor(userConfig = {}) {
    this.config = loadConfig(userConfig);

    this.router = createRouter();
    this.middlewares = [];

    this.server = http.createServer((req, res) => {
      this._handleRequest(req, res);
    });
  }

  use(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('Middleware must be a function');
    }
    this.middlewares.push(fn);
  }

  _runMiddleware(req, res, handler) {
    let index = 0;

    const next = () => {
      const mw = this.middlewares[index++];
      if (mw) {
        mw(req, res, next);
      } else {
        handler(req, res);
      }
    };

    next();
  }

  _handleRequest(nodeReq, nodeRes) { // <-- renamed from _handle
    const req = createRequest(nodeReq);
    const res = createResponse(nodeRes, req);

    const handler = this.router.match(req.method, req.url);

    if (!handler) {
      res.status(404).send('Not Found');
      return;
    }

    try {
      this._runMiddleware(req, res, handler);
    } catch (err) {
      res.status(500).send('Internal Server Error');
    }
  }

  listen(port, cb) {
    this.server.listen(port, () => {
      if (cb) cb();
    });
  }
}

function build(config = {}) {
  const server = new Build(config);
  setInstance(server);
  return server;
}

module.exports = { build };
