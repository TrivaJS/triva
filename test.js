const { build, req, res, listen } = require('./lib/index.js'); // Public API from your package

const server = build({
  env: 'development',
  logging: { enabled: true },
  storage: { enabled: false },
  security: { enabled: true, rateLimit: true, policies: false }
});

server.use((req, res, next) => {
  console.log(`[Middleware] Request ${req.context.id} started at ${req.context.startTime}`);
  next();
});

// Routes
req.get('/test', (req, res) => {
  res.send('test');
});

req.get('/status', (req, res) => {
  res.json({
    requestId: req.context.id,
    timestamp: req.context.startTime,
    env: req.context.config.env
  });
});

// Start the server
listen(3000);
