import { useCallback, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getServiceBySlug } from '../data/services'
import PresenceHero from '../components/ServicePage/PresenceHero.jsx'
import WhyPresenceSection from '../components/ServicePage/WhyPresenceSection.jsx'
import { useSmoothOverlayScroll } from '../hooks/useSmoothOverlayScroll'
import { reportServiceMoonScroll } from '../utils/serviceMoonBridge'
import './ServicePage.css'

export default function ServicePage() {
  const { slug } = useParams()
  const service = getServiceBySlug(slug)
  const scrollerRef = useRef(null)
  const isPresenciaDigital = slug === 'landing-pages'

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const handleOverlayProgress = useCallback((progress) => {
    if (isPresenciaDigital) reportServiceMoonScroll(progress)
  }, [isPresenciaDigital])

  useSmoothOverlayScroll(scrollerRef, {
    enabled: Boolean(service),
    lerp: isPresenciaDigital ? 0.065 : 0.085,
    onProgress: handleOverlayProgress,
  })

  useEffect(() => {
    if (!isPresenciaDigital) return undefined
    return () => reportServiceMoonScroll(0)
  }, [isPresenciaDigital, slug])

  if (!service) {
    return (
      <main
        ref={scrollerRef}
        className="service-page service-page--overlay"
        role="dialog"
        aria-modal="true"
      >
        <div className="service-page__panel">
          <p>Servicio no encontrado.</p>
          <Link className="service-page__back" to="/">
            ← Volver
          </Link>
        </div>
      </main>
    )
  }

  if (isPresenciaDigital) {
    return (
      <main
        ref={scrollerRef}
        className="service-page service-page--overlay service-page--expanded"
        role="dialog"
        aria-modal="true"
        aria-labelledby="presence-hero-title"
      >
        <Link className="service-page__back service-page__back--fixed" to="/">
          ← Volver
        </Link>
        <div className="service-page__panel service-page__panel--presence">
          <PresenceHero />
          <WhyPresenceSection scrollerRef={scrollerRef} />
        </div>
      </main>
    )
  }

  return (
    <main
      ref={scrollerRef}
      className="service-page service-page--overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-page-title"
    >
      <div className="service-page__panel">
        <Link className="service-page__back" to="/">
          ← Volver
        </Link>
        {service.tag ? <span className="service-page__tag">{service.tag}</span> : null}
        <h1 id="service-page-title">{service.title}</h1>
        <p className="service-page__summary">{service.summary}</p>
        <p className="service-page__placeholder">
          Contenido del servicio en construcción.
        </p>
      </div>
    </main>
  )
}
