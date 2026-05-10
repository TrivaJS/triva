const docLinks = [
  { label: 'Documentation', href: 'https://docs.trivajs.com/getting-started' },
  { label: 'Benchmarks', href: 'https://docs.trivajs.com/benchmarks' },
  { label: 'Guides', href: 'https://docs.trivajs.com/core/concepts' },
  { label: 'Examples', href: 'https://docs.trivajs.com/quick-start/examples' },
  { label: 'Extensions', href: 'https://docs.trivajs.com/extensions/overview' },
  { label: 'Production', href: 'https://docs.trivajs.com/deployment/production' },
]

const policyLinks = [
  { label: 'Privacy Policy', href: 'https://docs.trivajs.com/policies/privacy' },
  { label: 'Terms of Use', href: 'https://docs.trivajs.com/policies/terms' },
  { label: 'Code of Conduct', href: 'https://docs.trivajs.com/policies/code-of-conduct' },
  { label: 'Security Policy', href: 'https://docs.trivajs.com/policies/security' },
  { label: 'Issues', href: 'https://github.com/trivajs/triva/issues' },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-links">
          {docLinks.map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
          ))}
        </div>
        <div className="footer-links">
          {policyLinks.map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
          ))}
        </div>

        <div className="footer-divider" />

        <div className="footer-bottom">
          <p>&copy; 2026 Triva. Apache-2.0 License.</p>
          <div className="footer-social">
            <a href="https://twitter.com/trivajs" target="_blank" rel="noreferrer" aria-label="Twitter">
              <svg fill="currentColor" width="17" height="17" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <path d="M28.778 1.004h-25.56c-1.199 0-2.172.964-2.186 2.159v25.672c.014 1.196.987 2.161 2.186 2.161h25.555c1.2 0 2.175-.963 2.194-2.159v-25.672c-.019-1.197-.994-2.161-2.195-2.161h.006zM9.9 26.562h-4.454v-14.311h4.454zM7.674 10.293c-1.425 0-2.579-1.155-2.579-2.579s1.155-2.579 2.579-2.579c1.424 0 2.579 1.154 2.579 2.578 0 1.423-1.154 2.577-2.577 2.577l-.002.003zM26.556 26.562h-4.441v-6.959c0-1.66-.034-3.795-2.314-3.795-2.316 0-2.669 1.806-2.669 3.673v7.082h-4.441v-14.311h4.266v1.951h.058c.828-1.395 2.326-2.315 4.039-2.315 4.5 0 5.332 2.962 5.332 6.817v7.855l.17.002z" />
              </svg>
            </a>
            <a href="https://github.com/trivajs/triva" target="_blank" rel="noreferrer" aria-label="GitHub">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
