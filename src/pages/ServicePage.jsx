import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLenis } from 'lenis/react'
import { getServiceBySlug } from '../data/services'
import './ServicePage.css'

export default function ServicePage() {
  const { slug } = useParams()
  const service = getServiceBySlug(slug)
  const lenis = useLenis()

  useEffect(() => {
    lenis?.start()
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''

    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [lenis])

  if (!service) {
    return (
      <main className="service-page">
        <p>Servicio no encontrado.</p>
        <Link to="/">Volver al inicio</Link>
      </main>
    )
  }

  return (
    <main className="service-page">
      <Link className="service-page__back" to="/">
        ← Volver
      </Link>
      <span className="service-page__tag">{service.tag}</span>
      <h1>{service.title}</h1>
      <p className="service-page__summary">{service.summary}</p>
      <p className="service-page__placeholder">
        Contenido del servicio en construcción.
      </p>
    </main>
  )
}
