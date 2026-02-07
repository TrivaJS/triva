# Debugging Guide: Guide Folder Not Loading

## The Problem

Markdown files in `/guide/` folder don't render, but root-level files (CODE_OF_CONDUCT.md, CONTRIBUTING.md) work fine.

## What Was Fixed

### 1. **Fetch Logic** - Multiple Path Attempts

The JavaScript now tries multiple paths in order:

```javascript
const pathsToTry = [
    `/${filename}`,              // Root level
    `/guide/${filename}`,        // Guide folder
    `/docs/${filename}`,         // Docs folder (fallback)
];
```

### 2. **Better Logging**

Added console.log statements to help debug:

```javascript
console.log('Trying to fetch:', filename);
console.log('Paths to try:', pathsToTry);
console.log('Attempting:', path);
console.log('Success! Loaded from:', path);
```

### 3. **Proper Error Handling**

Now catches errors per-path instead of failing immediately.

## How to Debug

### Step 1: Open Browser Console

1. Visit your page (e.g., `/getting-started`)
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for log messages

### Step 2: Check Console Output

**Expected output for working page:**
```
Trying to fetch: getting-started.md
Paths to try: ["/getting-started.md", "/guide/getting-started.md", "/docs/getting-started.md"]
Attempting: /getting-started.md
Not found at: /getting-started.md (Status: 404)
Attempting: /guide/getting-started.md
Success! Loaded from: /guide/getting-started.md
```

**If you see errors:**
```
Error fetching from: /guide/getting-started.md TypeError: Failed to fetch
```

### Step 3: Common Issues & Solutions

#### Issue 1: 404 on all paths

**Symptom:**
```
Not found at: /getting-started.md (Status: 404)
Not found at: /guide/getting-started.md (Status: 404)
Not found at: /docs/getting-started.md (Status: 404)
```

**Cause:** File doesn't exist or wrong location

**Solution:**
1. Check file exists: `guide/getting-started.md`
2. Check it's committed to git
3. Check Cloudflare Pages deployed it
4. Check case-sensitivity (Linux servers are case-sensitive!)

#### Issue 2: Redirect not working

**Symptom:** Browser goes to `/guide/getting-started.md` instead of `/getting-started`

**Cause:** `_redirects` not deployed or wrong format

**Solution:**
1. Ensure `_redirects` is in repository root
2. Redeploy to Cloudflare Pages
3. Check Cloudflare Pages build logs
4. Add explicit redirect in `_redirects`:
   ```
   /getting-started    /docs.html    200
   ```

#### Issue 3: CORS errors

**Symptom:**
```
Access to fetch at 'file:///guide/getting-started.md' from origin 'null' has been blocked by CORS
```

**Cause:** Running from `file://` protocol (local file)

**Solution:** Must use HTTP server, not open HTML file directly

**Local testing:**
```bash
# Python
python -m http.server 8000

# Node.js
npx http-server

# Then visit: http://localhost:8000/getting-started
```

#### Issue 4: File case mismatch

**Symptom:** Works locally (Windows/Mac) but not on Cloudflare (Linux)

**Cause:** Case-sensitive filesystem on Linux servers

**Solution:**
- Filename: `getting-started.md` (lowercase)
- URL: `/getting-started` (lowercase)
- Match exactly!

### Step 4: Check Network Tab

1. Open DevTools → Network tab
2. Reload page
3. Look for markdown file request

**Check:**
- ✅ Request URL: Should be `/guide/getting-started.md`
- ✅ Status: Should be `200 OK`
- ✅ Type: Should be `text/markdown` or `text/plain`
- ❌ Status `404`: File doesn't exist
- ❌ Status `301/302`: Wrong redirect

### Step 5: Verify File Structure

Your repository should look like:

```
/
├── docs.html
├── _redirects
├── CODE_OF_CONDUCT.md      ← Root level (works)
├── CONTRIBUTING.md          ← Root level (works)
└── guide/
    ├── getting-started.md   ← Guide folder
    ├── api-reference.md     ← Guide folder
    └── examples.md          ← Guide folder
```

### Step 6: Test Direct Access

Try accessing the markdown file directly:

```
https://your-site.pages.dev/guide/getting-started.md
```

**If this works:** Redirect/routing issue  
**If this fails:** File deployment issue

## Manual Testing Checklist

- [ ] File exists in correct folder (`guide/getting-started.md`)
- [ ] File is committed to git
- [ ] File is pushed to GitHub
- [ ] Cloudflare Pages has redeployed
- [ ] `_redirects` file is in repository root
- [ ] `_redirects` has correct rules
- [ ] Filename case matches URL exactly
- [ ] Testing with HTTP server (not file://)
- [ ] Browser console shows fetch attempts
- [ ] No CORS errors in console

## Quick Fix: Add Explicit Redirects

If automatic detection isn't working, add explicit redirects:

**In `_redirects`:**
```
/getting-started          /docs.html    200
/api-reference            /docs.html    200
/examples                 /docs.html    200
```

**In `docs.html` mappings:**
```javascript
const mappings = {
    'code-of-conduct': 'CODE_OF_CONDUCT.md',
    'contributing': 'CONTRIBUTING.md',
    'getting-started': 'guide/getting-started.md',  // Add this
    'api-reference': 'guide/api-reference.md',      // Add this
};
```

## Still Not Working?

### Last Resort Debugging

Add this to the top of `loadPage()` function in `docs.html`:

```javascript
async function loadPage() {
    // DEBUGGING
    console.log('=== PAGE LOAD DEBUG ===');
    console.log('Current URL:', window.location.href);
    console.log('Pathname:', window.location.pathname);
    console.log('Page:', getPageFromPath());
    console.log('Filename:', pageToMarkdownFile(getPageFromPath()));
    console.log('======================');
    
    try {
        // ... rest of function
```

This will show exactly what's happening at each step.

## Contact

If none of this helps, open an issue with:
1. Browser console output
2. Network tab screenshot
3. Your `_redirects` file content
4. Your file structure (`ls -R`)
