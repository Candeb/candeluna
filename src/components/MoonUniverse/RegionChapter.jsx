import { forwardRef } from 'react'
import RegionCard from './RegionCard.jsx'
import RegionConnector from './RegionConnector.jsx'
import './RegionChapter.css'

const RegionChapter = forwardRef(function RegionChapter(
  { shot, index, side, cardInteractive = false, isActive = false, connectorRef, onBeforeNavigate },
  ref,
) {
  const placement = shot.cardPlacement ?? 'mid'

  return (
    <div
      ref={ref}
      className={`region-chapter region-chapter--${side} region-chapter--place-${placement} ${isActive ? 'is-active' : ''} ${cardInteractive ? 'is-navigable' : ''}`}
    >
      <RegionConnector ref={connectorRef} side={side} placement={placement} />
      <div className="region-card-shell">
        <div className="region-card-reveal">
          <RegionCard
            service={shot.service}
            index={index}
            side={side}
            regionLabel={shot.regionLabel}
            isInteractive={cardInteractive}
            onBeforeNavigate={onBeforeNavigate}
          />
        </div>
      </div>
    </div>
  )
})

export default RegionChapter
