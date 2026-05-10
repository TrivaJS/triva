import Nav from './components/Nav'
import Hero from './components/Hero'
import Features from './components/Features'
import Adapters from './components/Adapters'
import CTA from './components/CTA'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Features />
        <Adapters />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
