import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PRESENCIA_WHY } from '../../data/presenciaDigital'
import './WhyPresenceSection.css'

gsap.registerPlugin(ScrollTrigger)

/**
 * Sticky a la izquierda + revelación de respuestas por scroll del overlay.
 * La respuesta activa queda nítida (opacity 1); las demás se atenúan sin blur.
 */
export default function WhyPresenceSection({ scrollerRef }) {
  const rootRef = useRef(null)
  const promptRef = useRef(null)
  const itemRefs = useRef([])

  useEffect(() => {
    const root = rootRef.current
    const scroller = scrollerRef?.current
    const prompt = promptRef.current
    if (!root || !scroller || !prompt) return undefined

    const items = itemRefs.current.filter(Boolean)
    if (items.length === 0) return undefined

    const ctx = gsap.context(() => {
      gsap.set(prompt, { opacity: 0, y: 22 })

      ScrollTrigger.create({
        scroller,
        trigger: root,
        start: 'top 75%',
        end: 'top 40%',
        scrub: 1.1,
        onUpdate: (self) => {
          const p = Math.min(1, self.progress * 1.1)
          const eased = p * p * (3 - 2 * p)
          gsap.set(prompt, {
            opacity: eased,
            y: 22 * (1 - eased),
          })
        },
      })

      items.forEach((item) => {
        gsap.set(item, { opacity: 0.22, y: 28 })

        ScrollTrigger.create({
          scroller,
          trigger: item,
          start: 'top 85%',
          end: 'bottom 15%',
          scrub: 1.15,
          onUpdate: (self) => {
            const p = self.progress
            // Entrada suave → meseta nítida al centro → salida suave
            let visibility = 1
            if (p < 0.18) visibility = p / 0.18
            else if (p > 0.82) visibility = (1 - p) / 0.18
            const eased = visibility * visibility * (3 - 2 * visibility)
            gsap.set(item, {
              opacity: 0.22 + eased * 0.78,
              y: 28 * (1 - eased),
              filter: 'none',
            })
          },
        })
      })
    }, root)

    const refresh = () => ScrollTrigger.refresh()
    const frame = requestAnimationFrame(refresh)
    const delayed = window.setTimeout(refresh, 160)
    scroller.addEventListener('scroll', ScrollTrigger.update, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(delayed)
      scroller.removeEventListener('scroll', ScrollTrigger.update)
      ctx.revert()
    }
  }, [scrollerRef])

  return (
    <section ref={rootRef} className="why-presence" aria-label="Por qué una presencia digital">
      <div className="why-presence__grid">
        <div className="why-presence__prompt-sticky">
          <div ref={promptRef} className="why-presence__prompt">
            <p className="why-presence__prompt-main">{PRESENCIA_WHY.prompt}</p>
            {PRESENCIA_WHY.promptSub ? (
              <p className="why-presence__prompt-sub">{PRESENCIA_WHY.promptSub}</p>
            ) : null}
          </div>
        </div>

        <div className="why-presence__answers">
          {/* Beat: la pregunta se ve sola antes de las respuestas */}
          <div className="why-presence__solo-beat" aria-hidden="true" />

          {PRESENCIA_WHY.answers.map((answer, index) => (
            <article
              key={answer.id}
              ref={(node) => {
                itemRefs.current[index] = node
              }}
              className="why-presence__item"
            >
              <h3 className="why-presence__title">{answer.title}</h3>
              <p className="why-presence__body">{answer.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
