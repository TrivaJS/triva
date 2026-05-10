import Reveal from './Reveal'

interface Feature {
  icon: string
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: `<path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>`,
    title: 'Zero Dependencies',
    description: 'Pure Node.js with no external dependencies. Fast, secure, and maintainable from day one.',
  },
  {
    icon: `<circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M1 12h6m6 0h6"/><circle cx="12" cy="12" r="10"/>`,
    title: 'Universal Cache API',
    description: 'One API, nine adapters. Switch from Redis to MongoDB without changing a line of code.',
  },
  {
    icon: `<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>`,
    title: 'Built-in Middleware',
    description: 'Rate limiting, logging, error tracking, and auto-redirects included by default.',
  },
  {
    icon: `<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>`,
    title: 'Type Safe',
    description: 'Full TypeScript support with intelligent type inference. Get autocompletion everywhere.',
  },
  {
    icon: `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>`,
    title: 'Production Ready',
    description: 'Battle-tested monitoring, error tracking, and performance features built-in.',
  },
  {
    icon: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>`,
    title: 'Great DX',
    description: 'Intuitive API, excellent documentation, and helpful error messages that actually help.',
  },
]

export default function Features() {
  return (
    <section className="features" id="features">
      <div className="container">
        <Reveal>
          <div className="section-header">
            <h2>Everything you need. <span className="gradient-text">Built-in.</span></h2>
            <p>Stop piecing together packages. Start building.</p>
          </div>
        </Reveal>

        <div className="features-grid">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 70}>
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" dangerouslySetInnerHTML={{ __html: f.icon }} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <p className="features-bio">
            Our team &amp; our community are constantly shipping new features, prioritizing enterprise enhancing infrastructure.
            <br />
            If your organization is seeking specific features for enterprise operations, please submit a ticket via our{' '}
            <a href="https://github.com/trivajs/triva/issues">GitHub Issues</a>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
