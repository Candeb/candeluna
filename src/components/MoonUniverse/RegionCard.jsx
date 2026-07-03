import { forwardRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './RegionCard.css'

function RegionCardContent({ service, index, side, regionLabel }) {
  const orbitNumber = String(index + 1).padStart(2, '0')

  return (
    <>
      <span className="region-card__index">{orbitNumber}</span>
      {regionLabel ? (
        <span className="region-card__region">{regionLabel}</span>
      ) : null}
      <span className="region-card__tag">{service.tag}</span>
      <h3 className="region-card__title">{service.title}</h3>
      <p className="region-card__summary">{service.summary}</p>
      <span className="region-card__cta">Explorar →</span>
    </>
  )
}

const RegionCard = forwardRef(function RegionCard(
  { service, index, side = 'right', regionLabel, isInteractive = false },
  ref,
) {
  const navigate = useNavigate()
  const className = `region-card region-card--${side} ${
    isInteractive ? 'is-interactive' : 'is-locked'
  }`

  const goToService = () => {
    if (!isInteractive) return
    navigate(`/servicios/${service.slug}`)
  }

  return (
    <div
      ref={ref}
      className={className}
      aria-hidden={!isInteractive}
      role={isInteractive ? 'link' : undefined}
      tabIndex={isInteractive ? 0 : -1}
      onClick={(event) => {
        if (!isInteractive) {
          event.preventDefault()
          event.stopPropagation()
          return
        }
        goToService()
      }}
      onKeyDown={(event) => {
        if (!isInteractive) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          goToService()
        }
      }}
    >
      <RegionCardContent
        service={service}
        index={index}
        side={side}
        regionLabel={regionLabel}
      />
    </div>
  )
})

export default RegionCard
