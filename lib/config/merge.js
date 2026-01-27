function isObject(val) {
  return val && typeof val === 'object' && !Array.isArray(val);
}

function deepMerge(base, override) {
  const result = { ...base };

  for (const key in override) {
    if (isObject(override[key]) && isObject(base[key])) {
      result[key] = deepMerge(base[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }

  return result;
}

module.exports = deepMerge;
