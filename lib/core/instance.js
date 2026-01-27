let instance = null;

function setInstance(server) {
  instance = server;
}

function getInstance() {
  if (!instance) {
    throw new Error(
      'Server not initialized. Call build() before defining routes or listening.'
    );
  }
  return instance;
}

module.exports = {
  setInstance,
  getInstance
};
