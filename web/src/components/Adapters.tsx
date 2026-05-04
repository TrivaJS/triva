import { useState, useCallback, useEffect, useRef } from 'react'
import Reveal from './Reveal'
import { adapters } from '../data/adapters'

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ArrowIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

export default function Adapters() {
  const [activeId, setActiveId] = useState('redis')
  const [fading, setFading] = useState(false)
  const [displayedId, setDisplayedId] = useState('redis')
  const pendingId = useRef<string | null>(null)

  const switchAdapter = useCallback((id: string) => {
    if (id === activeId) return
    pendingId.current = id
    setActiveId(id)
    setFading(true)
  }, [activeId])

  useEffect(() => {
    if (!fading) return
    const timer = setTimeout(() => {
      if (pendingId.current) setDisplayedId(pendingId.current)
      setFading(false)
    }, 180)
    return () => clearTimeout(timer)
  }, [fading])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const section = document.getElementById('adapters')
      if (!section) return
      const { top, bottom } = section.getBoundingClientRect()
      if (top >= window.innerHeight || bottom <= 0) return

      const idx = adapters.findIndex(a => a.id === activeId)
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        switchAdapter(adapters[(idx + 1) % adapters.length].id)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        switchAdapter(adapters[(idx - 1 + adapters.length) % adapters.length].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeId, switchAdapter])

  const current = adapters.find(a => a.id === displayedId)!

  return (
    <section className="adapters" id="adapters">
      <div className="container">
        <Reveal>
          <div className="section-header">
            <h2>One API. <span className="gradient-text">Nine Adapters.</span></h2>
            <p>Change your database backend without changing your application code.</p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="adapter-showcase">
            <div className="adapter-tabs" role="tablist">
              {adapters.map(a => (
                <button
                  key={a.id}
                  role="tab"
                  aria-selected={activeId === a.id}
                  className={`adapter-tab${activeId === a.id ? ' active' : ''}`}
                  onClick={() => switchAdapter(a.id)}
                >
                  <span
                    className="adapter-tab-icon"
                    dangerouslySetInnerHTML={{ __html: a.icon }}
                  />
                  <span>{a.name}</span>
                </button>
              ))}
            </div>

            <div className="adapter-body">
              <div className={`adapter-code-pane${fading ? ' fading' : ''}`}>
                <div className="code-window">
                  <div className="window-controls">
                    <span /><span /><span />
                  </div>
                  <div className="code-content">
                    <pre><code dangerouslySetInnerHTML={{ __html: current.code }} /></pre>
                  </div>
                </div>
              </div>

              <div className={`adapter-info${fading ? ' fading' : ''}`}>
                <h4>{current.name}</h4>
                <ul>
                  {current.features.map(f => (
                    <li key={f}>
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="https://docs.trivajs.com/database/adapters" target="_blank" rel="noreferrer" className="adapter-link">
                  Learn more <ArrowIcon />
                </a>
              </div>
            </div>

            <Reveal delay={120}>
              <p className="adapters-bio">
                New database adapters are released regularly as part of content updates. Keep up with our available adapters via{' '}
                <a href="https://docs.trivajs.com" target="_blank" rel="noreferrer">docs.trivajs.com</a>
                <br />
                Learn how to configure a database adapter into your operations with a short few steps{' '}
                <a href="https://docs.trivajs.com/database/adapters" target="_blank" rel="noreferrer">here</a>
              </p>
            </Reveal>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
