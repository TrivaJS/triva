import Reveal from './Reveal'

export default function CTA() {
  return (
    <section className="cta">
      <div className="container">
        <Reveal>
          <div className="cta-inner">
            <h2>Ready to build?</h2>
            <p>Join developers shipping production applications with Triva.</p>
            <div className="cta-buttons">
              <a href="https://docs.trivajs.com/getting-started" className="btn-primary btn-lg">
                Get Started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <a href="https://github.com/trivajs/triva" className="btn-secondary btn-lg" target="_blank" rel="noreferrer">
                View on GitHub
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
