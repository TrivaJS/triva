function assert(condition, message) {
  if (!condition) {
    throw new Error(`[Config Error] ${message}`);
  }
}

module.exports = function validateConfig(config) {
  assert(typeof config.env === 'string', 'env must be a string');

  assert(
    ['development', 'production', 'test'].includes(config.env),
    'env must be development | production | test'
  );

  assert(typeof config.logging.enabled === 'boolean', 'logging.enabled must be boolean');

  assert(typeof config.storage.enabled === 'boolean', 'storage.enabled must be boolean');

  if (config.storage.enabled) {
    assert(
      typeof config.storage.type === 'string',
      'storage.type must be defined when storage is enabled'
    );
  }

  assert(typeof config.security.enabled === 'boolean', 'security.enabled must be boolean');

  if (config.security.enabled) {
    assert(typeof config.security.rateLimit === 'boolean', 'security.rateLimit must be boolean');
    assert(typeof config.security.policies === 'boolean', 'security.policies must be boolean');
  }

  return true;
};
