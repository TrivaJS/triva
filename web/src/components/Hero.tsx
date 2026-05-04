export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg" />
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-pulse" />
              <span>Now in production</span>
            </div>

            <h1 className="hero-title">
              The Framework for{' '}
              <span className="gradient-text">Modern Node.js</span>
            </h1>

            <p className="hero-subtitle">
              Build production-ready applications with zero configuration.
              Built-in caching, 9 database adapters, enterprise features out of the box.
            </p>

            <div className="hero-cta">
              <a href="https://docs.trivajs.com/getting-started" className="btn-primary">
                Get Started
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a href="https://docs.trivajs.com/getting-started" className="btn-secondary">
                Documentation
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="code-window">
              <div className="window-controls">
                <span /><span /><span />
              </div>
              <div className="code-content">
                <pre><code dangerouslySetInnerHTML={{ __html: heroCode }} /></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const heroCode = `<span class="token-import">import</span> { build } <span class="token-import">from</span> <span class="token-string">'triva'</span>;

<span class="token-comment">// Zero configuration needed</span>
<span class="token-keyword">const</span> <span class="token-function">app</span> = <span class="token-keyword">new</span> <span class="token-function">build</span>({
  cache: {
    type: <span class="token-string">'redis'</span>,
    database: { host: <span class="token-string">'localhost'</span> }
  }
});

<span class="token-comment">// Define your routes</span>
<span class="token-function">app</span>.<span class="token-keyword">get</span>(<span class="token-string">'/'</span>, (<span class="token-number">req</span>, <span class="token-number">res</span>) =&gt; {
  res.<span class="token-function">json</span>({ hello: <span class="token-string">'world'</span> });
});

<span class="token-comment">// Start your server</span>
<span class="token-function">app</span>.<span class="token-keyword">listen</span>(<span class="token-number">3000</span>);`
