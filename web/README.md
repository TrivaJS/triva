# Triva Landing Page

Modern, production-ready landing page inspired by Next.js and Fuse.ai design principles.

## Features

✨ **Modern Design**
- Dark theme with vibrant gradients
- Smooth animations and transitions
- Responsive across all devices
- Accessibility-first approach

🎨 **Design Inspiration**
- Next.js - Clean, minimal aesthetic
- Fuse.ai - Modern SaaS styling
- Production-quality UI/UX

⚡ **Performance**
- Zero dependencies (vanilla JS)
- Optimized animations
- Lazy loading
- Reduced motion support

🔧 **Interactive Features**
- Database adapter switcher with smooth transitions
- Scroll-triggered animations
- Mobile-friendly navigation
- Keyboard navigation support

## File Structure

```
triva-landing/
├── index.html       # Main HTML file
├── style.css        # All styles (dark theme, responsive)
├── script.js        # Interactive features
└── README.md        # This file
```

## Quick Start

1. **Open the page:**
   ```bash
   # Just open index.html in your browser
   open index.html
   ```

2. **Or run a local server:**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Visit:** `http://localhost:8000`

## Customization

### Colors

Edit the CSS variables in `style.css`:

```css
:root {
    --bg-primary: #000000;
    --accent-primary: #3b82f6;
    --accent-secondary: #8b5cf6;
    /* ... */
}
```

### Content

Edit `index.html` to change:
- Hero title and description
- Feature cards
- Database adapters
- Footer links

### Adapters

Add or modify adapters in `script.js`:

```javascript
const adapterData = {
    yourAdapter: {
        name: 'Your Adapter',
        code: `...`, // Code sample with syntax highlighting
        features: [
            'Feature 1',
            'Feature 2',
            'Feature 3'
        ]
    }
};
```

## Features in Detail

### 🎯 Navigation
- Fixed header with blur effect
- Smooth scroll to sections
- Mobile hamburger menu
- GitHub link with icon

### 🚀 Hero Section
- Animated gradient background
- Fade-in animations
- Interactive stats
- Syntax-highlighted code window

### ⚡ Features Grid
- 6 feature cards
- Hover effects with lift
- Icon gradients
- Staggered animations

### 💾 Database Adapters
- 9 switchable adapters
- Smooth code transitions
- Keyboard navigation (← →)
- Feature highlights per adapter

### 📱 Responsive Design

**Breakpoints:**
- Desktop: 1024px+
- Tablet: 768px - 1024px
- Mobile: < 768px

**Optimizations:**
- Flexible grid layouts
- Touch-friendly buttons
- Readable font sizes
- Optimized spacing

## Browser Support

✅ Chrome 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Edge 90+  
✅ Mobile browsers

## Accessibility

- Semantic HTML5
- ARIA labels where needed
- Keyboard navigation
- Reduced motion support
- High contrast ratios
- Focus indicators

## Performance

- **No external dependencies** - 100% vanilla
- **Optimized animations** - 60fps with GPU acceleration
- **Lazy loading** - Images and content
- **Minimal JS** - ~6KB minified

## Deployment

### Netlify
```bash
# Drop the entire folder into Netlify
```

### Vercel
```bash
vercel --prod
```

### GitHub Pages
```bash
# Push to gh-pages branch
git subtree push --prefix triva-landing origin gh-pages
```

### Static Hosting
Upload `index.html`, `style.css`, and `script.js` to any static host.

## SEO Optimization

The page includes:
- Meta descriptions
- Semantic HTML structure
- Open Graph tags (can be added)
- Fast load times
- Mobile-friendly design

### Add Open Graph tags:

```html
<!-- Add to <head> in index.html -->
<meta property="og:title" content="Triva - The Modern Node.js Framework">
<meta property="og:description" content="Build production-ready Node.js applications with zero configuration.">
<meta property="og:image" content="/og-image.png">
<meta property="og:url" content="https://trivajs.com">
<meta name="twitter:card" content="summary_large_image">
```

## Customization Examples

### Change Gradient Colors

```css
/* In style.css */
--gradient-primary: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
```

### Add New Feature Card

```html
<!-- In index.html, inside .features-grid -->
<div class="feature-card" data-animate="fade-up">
    <div class="feature-icon">
        <svg><!-- Your icon --></svg>
    </div>
    <h3>Your Feature</h3>
    <p>Feature description</p>
</div>
```

### Change Hero Stats

```html
<!-- In index.html, inside .hero-stats -->
<div class="stat">
    <div class="stat-number">100k+</div>
    <div class="stat-label">Downloads</div>
</div>
```

## Animation Controls

### Disable Auto-Rotate

In `script.js`, comment out:

```javascript
// startAutoRotate(); // Line ~280
```

### Adjust Animation Speed

In `style.css`:

```css
[data-animate] {
    animation: fadeInUp 0.6s ease forwards; /* Change 0.6s */
}
```

## Tips

1. **Test on real devices** - Not just browser DevTools
2. **Optimize images** - Use WebP format
3. **Add favicons** - Generate full set
4. **Setup analytics** - Google Analytics or Plausible
5. **Add sitemap** - For better SEO

## License

MIT - Feel free to use for your project!

## Credits

Design inspired by:
- Next.js (https://nextjs.org)
- Fuse.ai (https://tryfuse.ai)

Built with ❤️ for Triva

---

**Questions?** Open an issue or PR at [github.com/trivajs/triva](https://github.com/trivajs/triva)
