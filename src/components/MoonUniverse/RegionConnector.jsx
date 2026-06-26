import { forwardRef, useEffect, useState } from 'react'

import './RegionConnector.css'

function getCardLineY(placement) {
  switch (placement) {
    case 'high':
      return 26
    case 'edge':
      return 20
    case 'low':
      return 68
    case 'mid':
    default:
      return 42
  }
}

function getConnectorGeometry(side, placement, mobile) {
  const markerX = 50
  const markerY = mobile ? 38 : 54

  if (mobile) {
    const cardY = 70
    return {
      markerX,
      markerY,
      cardX: markerX,
      cardY,
      pathD: `M ${markerX} ${markerY} L ${markerX} ${cardY}`,
    }
  }

  const cardY = getCardLineY(placement)
  const cardX = side === 'left' ? 24 : 76

  return {
    markerX,
    markerY,
    cardX,
    cardY,
    pathD: `M ${markerX} ${markerY} L ${markerX} ${cardY} L ${cardX} ${cardY}`,
  }
}

const RegionConnector = forwardRef(function RegionConnector(
  { side, placement = 'mid', linePhase = 'hidden' },
  ref,
) {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const { pathD } = getConnectorGeometry(side, placement, mobile)



  return (

    <div

      className={`region-connector region-connector--${linePhase}`}

      aria-hidden="true"

    >

      <svg

        className="region-connector__svg"

        viewBox="0 0 100 100"

        preserveAspectRatio="none"

      >

        <path

          ref={ref}

          d={pathD}

          className="region-connector__line"

          vectorEffect="non-scaling-stroke"

        />

      </svg>

    </div>

  )

})



export default RegionConnector

