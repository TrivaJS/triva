const http = require('http');
const { Router } = require('./router');
const { createRequest } = require('./request');
const { createResponse } = require('./response');
const { setInstance } = require('./instance');

class Build {
  constructor(config = {}) {
    this.config = config;
    this.router = new Router();
    this.middlewares = [];
    this.server = http.createServer(this._handle.bind(this));
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

  _handle(nodeReq, nodeRes) {
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
      console.log(`Server listening on port ${port}`);
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
