import { 
  build,
  middleware,
  use,
  get,
  post,
  listen,
  cookieParser
} from 'triva';

console.log('🚀 Triva Test Server\n');

// Initialize
build({ env: 'development' });

// Cookie parser
use(cookieParser());

// Custom middleware
use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Triva middleware
middleware({
  retention: { enabled: true, maxEntries: 1000 },
  throttle: { limit: 100, window_ms: 60000 }
});

// Routes
get('/', (req, res) => {
  res.json({
    message: 'Triva is working!',
    endpoints: {
      '/': 'This page',
      '/hello': 'Say hello',
      '/users/:id': 'Get user by ID',
      '/cookies/set': 'Set a cookie',
      '/cookies/get': 'Get cookies',
      '/download': 'Download a file',
      '/jsonp': 'JSONP example'
    }
  });
});

get('/hello', (req, res) => {
  const name = req.query.name || 'World';
  res.json({ message: `Hello, ${name}!` });
});

get('/users/:id', (req, res) => {
  res.json({ 
    userId: req.params.id,
    name: 'Test User'
  });
});

get('/cookies/set', (req, res) => {
  res.cookie('test', 'value123', { maxAge: 3600000 });
  res.json({ message: 'Cookie set' });
});

get('/cookies/get', (req, res) => {
  res.json({ 
    message: 'Your cookies',
    cookies: req.cookies 
  });
});

get('/download', (req, res) => {
  // Create a simple text file to download
  const fs = require('fs');
  const content = 'This is a test file from Triva!\n';
  fs.writeFileSync('./test-file.txt', content);
  res.download('./test-file.txt', 'download.txt');
});

get('/jsonp', (req, res) => {
  res.jsonp({ data: 'JSONP response', success: true });
});

post('/echo', async (req, res) => {
  const body = await req.json();
  res.json({ echo: body });
});

// Start server
listen(3000, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Server running on http://localhost:3000');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nTry:');
  console.log('  curl http://localhost:3000');
  console.log('  curl http://localhost:3000/hello?name=Triva');
  console.log('  curl http://localhost:3000/users/123');
  console.log('  curl http://localhost:3000/cookies/set');
  console.log('  curl http://localhost:3000/cookies/get');
  console.log('');
});
