module.exports = {
  env: 'development',

  logging: {
    enabled: true
  },

  storage: {
    enabled: true,
    type: 'local', // local | mongodb | redis | etc
    options: {}
  },

  security: {
    enabled: true,
    rateLimit: true,
    policies: true
  }
};
