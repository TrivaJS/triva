// Factory-based router: ultra-fast, minimal overhead
function createRouter() {
  // Store routes by HTTP method and path
  const routes = {
    GET: Object.create(null),
    POST: Object.create(null),
    PUT: Object.create(null),
    DELETE: Object.create(null)
  };

  return {
    // Register route
    get(path, handler) {
      routes.GET[path] = handler;
    },
    post(path, handler) {
      routes.POST[path] = handler;
    },
    put(path, handler) {
      routes.PUT[path] = handler;
    },
    delete(path, handler) {
      routes.DELETE[path] = handler;
    },

    // Match route: exact lookup, returns handler or undefined
    match(method, path) {
      const m = method.toUpperCase();
      return routes[m]?.[path];
    }
  };
}

export { createRouter };
