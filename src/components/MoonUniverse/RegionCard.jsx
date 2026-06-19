import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import './RegionCard.css'

const RegionCard = forwardRef(function RegionCard(
  { service, index, side = 'right' },
  ref,
) {
  const orbitNumber = String(index + 1).padStart(2, '0')

  return (
    <Link
      ref={ref}
      to={`/servicios/${service.slug}`}
      className={`region-card region-card--${side}`}
    >
      <span className="region-card__index">{orbitNumber}</span>
      <span className="region-card__tag">{service.tag}</span>
      <h3 className="region-card__title">{service.title}</h3>
      <p className="region-card__summary">{service.summary}</p>
      <span className="region-card__cta">Explorar →</span>
    </Link>
  )
})

export default RegionCard
