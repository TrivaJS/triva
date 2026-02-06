# Triva Documentation Deployment Guide

This directory contains the dynamic markdown documentation system for Triva.

## How It Works

### Architecture

1. **Single HTML File** (`docs.html`) - Serves all documentation pages
2. **Client-Side Rendering** - Fetches markdown and renders it in the browser
3. **Cloudflare Pages Redirects** - Routes all doc pages to the HTML file
4. **Zero Server-Side Code** - Pure static hosting with dynamic behavior

### Flow

```
User visits /code-of-conduct
    ↓
Cloudflare redirects to /docs.html (200 status)
    ↓
docs.html JavaScript:
  - Reads URL path (/code-of-conduct)
  - Fetches CODE_OF_CONDUCT.md
  - Renders markdown to HTML
  - Displays content
```

## File Structure

```
/
├── docs.html              # Main documentation viewer
├── _redirects             # Cloudflare Pages routing
├── CODE_OF_CONDUCT.md     # Code of Conduct (root level)
├── CONTRIBUTING.md        # Contribution guidelines (optional)
├── README.md              # Project README (optional)
├── CHANGELOG.md           # Version history (optional)
└── docs/                  # Additional documentation
    ├── getting-started.md
    ├── api-reference.md
    └── ...
```

## Setup

### 1. Cloudflare Pages Deployment

```bash
# Build command (if needed)
# Leave blank for static site

# Output directory
/

# Environment variables
# None needed
```

### 2. Add Redirects

Upload `_redirects` file to your repository root. Cloudflare Pages will automatically use it.

### 3. Add Markdown Files

Place your markdown files:
- **Root level**: `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, etc.
- **Docs folder**: `docs/getting-started.md`, `docs/api.md`, etc.

### 4. Access URLs

```
https://yourdomain.com/code-of-conduct  → CODE_OF_CONDUCT.md
https://yourdomain.com/contributing     → CONTRIBUTING.md
https://yourdomain.com/getting-started  → docs/getting-started.md
```

## URL to File Mapping

The JavaScript automatically maps URLs to markdown files:

| URL | Markdown File |
|-----|---------------|
| `/code-of-conduct` | `CODE_OF_CONDUCT.md` |
| `/contributing` | `CONTRIBUTING.md` |
| `/readme` | `README.md` |
| `/license` | `LICENSE.md` |
| `/changelog` | `CHANGELOG.md` |
| `/custom-page` | `docs/custom-page.md` |

### Custom Mappings

Edit the `pageToMarkdownFile()` function in `docs.html`:

```javascript
const mappings = {
    'code-of-conduct': 'CODE_OF_CONDUCT.md',
    'your-page': 'YOUR_FILE.md',
    // Add more mappings here
};
```

## Adding New Pages

### Method 1: Root Level Files (Recommended for main docs)

1. Create `YOUR_FILE.md` in repository root
2. Add mapping to `docs.html`:
   ```javascript
   'your-page': 'YOUR_FILE.md'
   ```
3. Add redirect to `_redirects`:
   ```
   /your-page    /docs.html    200
   ```

### Method 2: Docs Folder (For additional documentation)

1. Create `docs/your-page.md`
2. No changes needed - automatically works at `/your-page`

## Styling

### Customizing Colors

Edit CSS variables in `docs.html`:

```css
:root {
    --primary: #6366f1;        /* Brand color */
    --dark: #0f172a;           /* Text color */
    --gray-lighter: #f1f5f9;   /* Background */
}
```

### Adding Custom Styles

Add styles to the `<style>` section in `docs.html`:

```css
#markdown-content .custom-class {
    /* Your styles */
}
```

## Markdown Features

Supported via [marked.js](https://marked.js.org/):

- ✅ Headers (H1-H6)
- ✅ Bold, Italic, Strikethrough
- ✅ Lists (ordered, unordered)
- ✅ Links
- ✅ Code blocks with syntax highlighting
- ✅ Tables
- ✅ Blockquotes
- ✅ Horizontal rules
- ✅ GitHub Flavored Markdown (GFM)

## Testing Locally

### Option 1: Simple HTTP Server

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# Then visit: http://localhost:8000/code-of-conduct
```

### Option 2: Cloudflare Pages Dev

```bash
npm install -g wrangler
wrangler pages dev .
```

## Troubleshooting

### Page Shows 404

**Problem**: Markdown file not found

**Solutions**:
1. Check file exists in correct location
2. Check filename matches mapping in `docs.html`
3. Check browser console for fetch errors

### Styles Not Loading

**Problem**: CSS not applied

**Solutions**:
1. Clear browser cache
2. Check for JavaScript errors in console
3. Ensure marked.js CDN is accessible

### Redirects Not Working

**Problem**: Going to actual file instead of docs.html

**Solutions**:
1. Ensure `_redirects` is in repository root
2. Redeploy to Cloudflare Pages
3. Check Cloudflare Pages build logs

### Can't Fetch Markdown

**Problem**: CORS or network errors

**Solutions**:
1. Ensure markdown files are in public directory
2. Check Cloudflare Pages build output
3. Verify file is committed to repository

## Advanced Configuration

### Adding Analytics

Add to `<head>` in `docs.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID"></script>
```

### Adding Search

Use a service like Algolia or implement client-side search:

```javascript
// In docs.html
function searchDocs(query) {
    // Implement search logic
}
```

### Custom 404 Page

Create `404.html` for true 404s:

```html
<!DOCTYPE html>
<html>
<head>
    <title>404 - Not Found</title>
</head>
<body>
    <h1>Page Not Found</h1>
    <a href="/">Go Home</a>
</body>
</html>
```

## Performance

### Optimization Tips

1. **Markdown Caching**: Browser automatically caches fetched markdown
2. **CDN**: Cloudflare Pages serves from edge locations worldwide
3. **Lazy Loading**: Markdown only loads when page is visited
4. **Minimal JavaScript**: Only marked.js library needed (~20KB)

### Load Times

- Initial page load: ~200-500ms (depends on CDN)
- Markdown fetch: ~50-100ms (cached after first load)
- Render time: ~10-50ms (depends on document size)

## Security

### Best Practices

- ✅ All markdown rendered client-side (no XSS from server)
- ✅ marked.js sanitizes HTML by default
- ✅ No server-side code execution
- ✅ Content Security Policy compatible

### Content Security Policy

Add to `<head>` in `docs.html`:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline';">
```

## Maintenance

### Updating Dependencies

Update marked.js version in `docs.html`:

```html
<!-- Current -->
<script src="https://cdn.jsdelivr.net/npm/marked@11.1.1/marked.min.js"></script>

<!-- Update to latest -->
<script src="https://cdn.jsdelivr.net/npm/marked@latest/marked.min.js"></script>
```

### Backup

Always keep markdown files in version control (Git). The HTML is just a viewer.

## Example Markdown Files

### CODE_OF_CONDUCT.md

Already created - comprehensive community guidelines.

### CONTRIBUTING.md

```markdown
# Contributing to Triva

## Getting Started
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Code Style
- Follow existing patterns
- Write tests
- Update documentation
```

### docs/api.md

```markdown
# API Reference

## build()

Configure and initialize Triva server.

\`\`\`javascript
await build({
  cache: { type: 'memory' }
});
\`\`\`
```

## License

This documentation system is part of Triva and uses the same license (MIT).
