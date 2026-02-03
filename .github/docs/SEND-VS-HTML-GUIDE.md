# res.send() vs res.html()

Both methods can send HTML content! Here's how they differ:

## ✅ Yes, res.send() Can Send HTML!

**res.send()** now auto-detects content type:

```javascript
get('/page', (req, res) => {
  res.send('<h1>Hello World</h1>');
  // ✅ Auto-detected as HTML
  // Content-Type: text/html
});
```

## 🎯 How res.send() Works

**Smart Content Detection:**

1. **Objects** → JSON
2. **HTML** → HTML (auto-detected)
3. **Plain text** → Plain text

```javascript
// Sends as JSON (Content-Type: application/json)
res.send({ message: 'Hello' });

// Sends as HTML (Content-Type: text/html)
res.send('<div>Hello</div>');

// Sends as text (Content-Type: text/plain)
res.send('Hello world');
```

## 🔍 Auto-Detection Logic

HTML is detected when content:
- Starts with `<`
- Contains closing tags `</` or self-closing `/>`

```javascript
// ✅ Detected as HTML
res.send('<h1>Title</h1>');
res.send('<div>Content</div>');
res.send('<!DOCTYPE html><html>...</html>');
res.send('<img src="..." />');

// ❌ NOT detected as HTML (sent as plain text)
res.send('< 5');  // Doesn't contain </
res.send('Hello'); // Doesn't start with <
```

## 📝 res.html() - Explicit HTML

**res.html()** always sends as HTML, no detection needed:

```javascript
get('/page', (req, res) => {
  res.html('<h1>Hello World</h1>');
  // ✅ Explicitly sent as HTML
  // Content-Type: text/html
});
```

Even non-HTML content is sent as HTML:

```javascript
res.html('Plain text');
// Content-Type: text/html (even though it's plain text)
```

## 🎨 When to Use Each

| Scenario | Use | Why |
|----------|-----|-----|
| Full HTML page | `res.html()` | Clear intent, explicit |
| Template rendering | `res.html()` | Best practice |
| Quick HTML | `res.send()` | Auto-detection works |
| Mixed content | `res.send()` | Handles all types |
| JSON response | `res.send()` or `res.json()` | Both work |
| Plain text | `res.send()` | Auto-detects correctly |

## 💡 Examples

### Using res.send()

```javascript
// HTML page
get('/home', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <body><h1>Home</h1></body>
    </html>
  `);
  // ✅ Auto-detected as HTML
});

// JSON
get('/api/users', (req, res) => {
  res.send({ users: [] });
  // ✅ Auto-detected as JSON
});

// Text
get('/status', (req, res) => {
  res.send('OK');
  // ✅ Auto-detected as plain text
});
```

### Using res.html()

```javascript
// Template rendering
import { layout } from './templates.js';

get('/about', (req, res) => {
  const html = layout('About', content);
  res.html(html);
  // ✅ Explicitly HTML
});

// HTML fragment
get('/widget', (req, res) => {
  res.html('<div class="widget">...</div>');
  // ✅ Explicitly HTML
});
```

## 🔄 Method Comparison

```javascript
// All three do the same thing for HTML:

res.send('<h1>Title</h1>');     // Auto-detects
res.html('<h1>Title</h1>');     // Explicit
res.header('Content-Type', 'text/html').send('<h1>Title</h1>'); // Manual
```

## 🎯 Best Practices

### ✅ Recommended

```javascript
// Use res.html() for templates
get('/page', (req, res) => {
  const html = renderTemplate(data);
  res.html(html);
});

// Use res.send() for dynamic content
get('/dynamic', (req, res) => {
  if (req.query.format === 'json') {
    res.send({ data: 'value' });
  } else {
    res.send('<div>HTML content</div>');
  }
});

// Use res.json() for APIs
get('/api/data', (req, res) => {
  res.json({ data: 'value' });
});
```

### ⚠️ Works But Not Ideal

```javascript
// Using res.html() for JSON (works but confusing)
res.html(JSON.stringify({ data: 'value' }));

// Using res.send() for every HTML page (works but less clear)
res.send(template); // res.html(template) is clearer
```

## 📊 Feature Matrix

| Feature | res.send() | res.html() | res.json() |
|---------|-----------|-----------|-----------|
| Send HTML | ✅ Auto | ✅ Always | ❌ |
| Send JSON | ✅ Auto | ❌ | ✅ Always |
| Send Text | ✅ Auto | Via HTML | ❌ |
| Auto-detect | ✅ Yes | ❌ No | ❌ No |
| Explicit | ❌ No | ✅ Yes | ✅ Yes |
| Flexible | ✅ Most | ❌ HTML only | ❌ JSON only |

## 🚀 Performance

Both methods are equally fast. The auto-detection in `res.send()` is just a simple string check:

```javascript
// Pseudo-code for res.send()
if (typeof data === 'object') {
  return json(data);
}

const str = String(data);
if (str.startsWith('<') && (str.includes('</') || str.includes('/>'))) {
  contentType = 'text/html';
} else {
  contentType = 'text/plain';
}
```

## 🎓 Summary

**Answer: YES!** You can use `res.send()` to send HTML.

**Key Points:**
- ✅ `res.send()` auto-detects HTML, JSON, and text
- ✅ `res.html()` is explicit and always sends as HTML
- ✅ Both are valid for HTML content
- ✅ Use `res.html()` for templates (clearer intent)
- ✅ Use `res.send()` for mixed content types

**Quick Reference:**

```javascript
// All valid ways to send HTML:
res.send('<h1>Hello</h1>');        // ✅ Auto-detected
res.html('<h1>Hello</h1>');        // ✅ Explicit
res.json({ html: '<h1>Hello</h1>' }); // ❌ Wrong! This is JSON

// Best practices:
res.html(templateData);  // Templates → use res.html()
res.send(dynamicContent); // Dynamic → use res.send()
res.json(apiResponse);    // APIs → use res.json()
```

Try the demo: `node send-vs-html-demo.js`
