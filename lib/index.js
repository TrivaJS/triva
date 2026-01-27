const { build } = require('./core/build');
const { getInstance } = require('./core/instance');

/* --------------------
   PUBLIC REQUEST API
--------------------- */

const req = {
  get(path, handler) {
    getInstance().router.get(path, handler);
  },
  post(path, handler) {
    getInstance().router.post(path, handler);
  },
  put(path, handler) {
    getInstance().router.put(path, handler);
  },
  delete(path, handler) {
    getInstance().router.delete(path, handler);
  }
};

/* --------------------
   MIDDLEWARE API
--------------------- */

function use(middleware) {
  getInstance().use(middleware);
}

/* --------------------
   SERVER CONTROL
--------------------- */

function listen(port, cb) {
  getInstance().listen(port, cb);
}

module.exports = {
  build,
  req,
  use,
  listen
};
