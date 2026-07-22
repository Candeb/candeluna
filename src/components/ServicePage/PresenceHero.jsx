import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { PRESENCIA_HERO } from '../../data/presenciaDigital'
import './PresenceHero.css'

export default function PresenceHero() {
  const rootRef = useRef(null)
  const topRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const top = topRef.current
    const bottom = bottomRef.current
    if (!root || !top || !bottom) return undefined

    const ctx = gsap.context(() => {
      gsap.set(top, { opacity: 0, y: -56 })
      gsap.set(bottom, { opacity: 0, y: 56 })

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      tl.to(top, { opacity: 1, y: 0, duration: 1.85 }, 0.35)
      tl.to(bottom, { opacity: 1, y: 0, duration: 1.85 }, 0.75)
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={rootRef}
      className="presence-hero"
      aria-labelledby="presence-hero-title"
    >
      <h1 id="presence-hero-title" className="presence-hero__title">
        <span ref={topRef} className="presence-hero__line presence-hero__line--top">
          {PRESENCIA_HERO.lineTop}
        </span>
        <span ref={bottomRef} className="presence-hero__line presence-hero__line--bottom">
          {PRESENCIA_HERO.lineBottom}
        </span>
      </h1>
      <p className="presence-hero__hint" aria-hidden="true">
        Desplazá para explorar
      </p>
    </section>
  )
}
