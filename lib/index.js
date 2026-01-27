const { build } = require('./core/build');
const { getInstance } = require('./core/instance');

/* --------------------
   PUBLIC REQUEST API
--------------------- */

const req = new Proxy({}, {
  get(_, method) {
    // method = 'get', 'post', 'put', 'delete'
    return (path, handler) => {
      const instance = getInstance();
      if (!instance.router || typeof instance.router[method] !== 'function') {
        throw new Error(`Router not initialized for method ${method}`);
      }
      instance.router[method](path, handler);
    };
  }
});

/* --------------------
   MIDDLEWARE API
--------------------- */

function use(middleware) {
  const instance = getInstance();
  instance.use(middleware);
}

/* --------------------
   SERVER CONTROL
--------------------- */

function listen(port, cb) {
  const instance = getInstance();
  instance.listen(port, cb);
}

module.exports = {
  build,
  req,
  use,
  listen
};
