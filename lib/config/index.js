const defaults = require('./defaults');
const merge = require('./merge');
const validate = require('./validate');

let frozenConfig = null;

module.exports = function loadConfig(userConfig = {}) {
  if (frozenConfig) {
    return frozenConfig;
  }

  const env = userConfig.env || process.env.NODE_ENV || defaults.env;

  const envOverrides =
    userConfig.envOverrides && userConfig.envOverrides[env]
      ? userConfig.envOverrides[env]
      : {};

  const merged = merge(defaults, userConfig);
  const finalConfig = merge(merged, envOverrides);

  finalConfig.env = env;

  validate(finalConfig);

  frozenConfig = Object.freeze(finalConfig);

  return frozenConfig;
};
