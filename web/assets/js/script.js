/**
 * Triva Landing Page - Interactive Features
 */

// SVG Icons
lucide.createIcons();

document.querySelectorAll('svg.lucide').forEach(svg => {
  const tooltip = svg.dataset.tooltip;
  if (!tooltip) return;

  const titleEl = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'title'
  );
  titleEl.textContent = tooltip;

  svg.querySelector('title')?.remove();
  svg.prepend(titleEl);
});

(function() {
    'use strict';

    // ===================================
    // Navigation Scroll Effect
    // ===================================

    const nav = document.getElementById('nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // ===================================
    // Mobile Menu Toggle
    // ===================================

    const mobileMenu = document.getElementById('mobileMenu');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });
    }

    // ===================================
    // Database Adapter Switcher
    // ===================================

    const adapterData = {
        redis: {
            name: 'Redis',
            code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const <span class="token-function">app</span> = new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'redis'</span>,
    database: {
      host: <span class="token-string">'localhost'</span>,
      port: <span class="token-number">6379</span>
    }
  }
});`,
            features: [
                'Sub-millisecond latency',
                'Distributed caching',
                'Production-grade reliability'
            ]
        },
        mongodb: {
            name: 'MongoDB',
            code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const <span class="token-function">app</span> = new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'mongodb'</span>,
    database: {
      uri: <span class="token-string">'mongodb://localhost:27017'</span>
    }
  }
});`,
            features: [
                'Flexible document storage',
                'Rich query capabilities',
                'Horizontal scaling'
            ]
        },
        postgresql: {
            name: 'PostgreSQL',
            code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const <span class="token-function">app</span> = new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'postgresql'</span>,
    database: {
      host: <span class="token-string">'localhost'</span>,
      database: <span class="token-string">'triva'</span>
    }
  }
});`,
            features: [
                'ACID compliance',
                'Advanced querying',
                'Enterprise reliability'
            ]
        },
        mysql: {
            name: 'MySQL',
            code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const <span class="token-function">app</span> = new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'mysql'</span>,
    database: {
      host: <span class="token-string">'localhost'</span>,
      database: <span class="token-string">'triva'</span>
    }
  }
});`,
            features: [
                'Wide adoption',
                'Proven reliability',
                'Great performance'
            ]
        },
        sqlite: {
            name: 'SQLite',
            code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const <span class="token-function">app</span> = new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'sqlite'</span>,
    database: {
      filename: <span class="token-string">'./cache.db'</span>
    }
  }
});`,
            features: [
                'Zero configuration',
                'File-based storage',
                'Perfect for development'
            ]
        },
        'better-sqlite3': {
            name: 'Better SQLite3',
            code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const <span class="token-function">app</span> = new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'better-sqlite3'</span>,
    database: {
      filename: <span class="token-string">'./cache.db'</span>
    }
  }
});`,
            features: [
                'Synchronous API',
                'Faster than node-sqlite3',
                'Simple and efficient'
            ]
        },
        supabase: {
            name: 'Supabase',
            code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const <span class="token-function">app</span> = new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'supabase'</span>,
    database: {
      url: process.env.<span class="token-string">SUPABASE_URL</span>
    }
  }
});`,
            features: [
                'Serverless PostgreSQL',
                'Real-time subscriptions',
                'Auto-generated APIs'
            ]
        },
        embedded: {
            name: 'Embedded',
            code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const <span class="token-function">app</span> = new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'embedded'</span>,
    database: {
      path: <span class="token-string">'./data'</span>
    }
  }
});`,
            features: [
                'Encrypted file storage',
                'No external dependencies',
                'Privacy-focused'
            ]
        },
        memory: {
            name: 'Memory',
            code: `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-keyword">const <span class="token-function">app</span> = new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'memory'</span>
  }
});`,
            features: [
                'Instant access',
                'Zero setup required',
                'Perfect for testing'
            ]
        }
    };

    const adapterTabs = document.querySelectorAll('.adapter-tab');
    const adapterCode = document.getElementById('adapterCode');
    const adapterName = document.getElementById('adapterName');
    const adapterFeatures = document.getElementById('adapterFeatures');

    adapterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const adapter = tab.dataset.adapter;
            const data = adapterData[adapter];

            if (!data) return;

            // Update active state
            adapterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Fade out
            adapterCode.style.opacity = '0';
            adapterName.style.opacity = '0';
            adapterFeatures.style.opacity = '0';

            setTimeout(() => {
                // Update content
                adapterCode.innerHTML = data.code;
                adapterName.textContent = data.name;

                adapterFeatures.innerHTML = data.features.map(feature => `
                    <li>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        ${feature}
                    </li>
                `).join('');

                // Fade in
                adapterCode.style.opacity = '1';
                adapterName.style.opacity = '1';
                adapterFeatures.style.opacity = '1';
            }, 200);
        });
    });

    // Add transition styles
    if (adapterCode) {
        adapterCode.style.transition = 'opacity 0.2s ease';
        adapterName.style.transition = 'opacity 0.2s ease';
        adapterFeatures.style.transition = 'opacity 0.2s ease';
    }

    // ===================================
    // Intersection Observer for Animations
    // ===================================

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all animated elements
    document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
    });

    // ===================================
    // Smooth Scroll for Anchor Links
    // ===================================

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);

            if (target) {
                const navHeight = document.querySelector('.nav').offsetHeight;
                const targetPosition = target.offsetTop - navHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===================================
    // Keyboard Navigation for Adapters
    // ===================================

    let currentAdapterIndex = 0;
    const adapterTabsArray = Array.from(adapterTabs);

    document.addEventListener('keydown', (e) => {
        // Only if user is focused on adapter section
        const adapterSection = document.querySelector('.adapters');
        if (!adapterSection) return;

        const rect = adapterSection.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom >= 0;

        if (!isInView) return;

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            currentAdapterIndex = (currentAdapterIndex + 1) % adapterTabsArray.length;
            adapterTabsArray[currentAdapterIndex].click();
            adapterTabsArray[currentAdapterIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            currentAdapterIndex = (currentAdapterIndex - 1 + adapterTabsArray.length) % adapterTabsArray.length;
            adapterTabsArray[currentAdapterIndex].click();
            adapterTabsArray[currentAdapterIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    });

    // ===================================
    // Auto-rotate Adapters (Optional)
    // ===================================

    let autoRotateInterval;
    const AUTO_ROTATE_DELAY = 5000; // 5 seconds
    let isAutoRotating = false;

    function startAutoRotate() {
        if (isAutoRotating) return;
        isAutoRotating = true;

        autoRotateInterval = setInterval(() => {
            currentAdapterIndex = (currentAdapterIndex + 1) % adapterTabsArray.length;
            adapterTabsArray[currentAdapterIndex].click();
        }, AUTO_ROTATE_DELAY);
    }

    function stopAutoRotate() {
        isAutoRotating = false;
        clearInterval(autoRotateInterval);
    }

    // Start auto-rotate when adapter section is in view
    const adapterSection = document.querySelector('.adapters');
    if (adapterSection) {
        const adapterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Uncomment to enable auto-rotate
                    // startAutoRotate();
                } else {
                    stopAutoRotate();
                }
            });
        }, { threshold: 0.5 });

        adapterObserver.observe(adapterSection);
    }

    // Stop auto-rotate on user interaction
    adapterTabs.forEach(tab => {
        tab.addEventListener('click', stopAutoRotate);
    });

    // ===================================
    // Performance: Reduce Motion
    // ===================================

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (prefersReducedMotion.matches) {
        // Disable animations for users who prefer reduced motion
        document.querySelectorAll('[data-animate]').forEach(el => {
            el.style.animation = 'none';
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    }

    // ===================================
    // Console Easter Egg
    // ===================================

    console.log('%c🚀 Triva', 'font-size: 24px; font-weight: bold; color: #3b82f6;');
    console.log('%cThe Modern Node.js Framework', 'font-size: 14px; color: #a1a1aa;');
    console.log('%c\nInterested in contributing?\nVisit: https://github.com/trivajs/triva', 'font-size: 12px; color: #71717a;');

})();
