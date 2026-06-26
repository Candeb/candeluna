import { useEffect, useId, useRef } from 'react'
import { gsap } from 'gsap'
import { MARKER_PHASE } from '../../data/markerState'
import './ScreenCenterMarker.css'

export default function ScreenCenterMarker({
  cinematicStateRef,
  activeIndex,
  markerPhase,
  onBeaconClick,
}) {
  const rootRef = useRef(null)
  const gradientId = useId().replace(/:/g, '')

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const tick = () => {
      const state = cinematicStateRef?.current
      if (!state || state.activeMarkerIndex < 0 || !state.markersEnabled) {
        root.style.opacity = '0'
        root.style.visibility = 'hidden'
        root.style.pointerEvents = 'none'
        return
      }

      const show =
        markerPhase === MARKER_PHASE.BEACON ||
        markerPhase === MARKER_PHASE.LINE ||
        markerPhase === MARKER_PHASE.CARD ||
        markerPhase === MARKER_PHASE.EXITING

      if (!show || (state.beaconOpacity ?? 0) <= 0.01) {
        root.style.opacity = '0'
        root.style.visibility = 'hidden'
        root.style.pointerEvents = 'none'
        return
      }

      const y = (state.beaconYOffset ?? 0) * 100
      const scale = state.beaconScale ?? 1
      const opacity = state.beaconOpacity ?? 0

      root.style.opacity = String(opacity)
      root.style.visibility = 'visible'
      root.style.transform = `translate(-50%, calc(-50% + ${y}vh)) scale(${scale})`
      root.style.pointerEvents =
        markerPhase === MARKER_PHASE.BEACON && opacity > 0.35 ? 'auto' : 'none'
    }

    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [cinematicStateRef, markerPhase])

  const clickable = markerPhase === MARKER_PHASE.BEACON

  return (
    <div
      ref={rootRef}
      className={`screen-marker ${clickable ? 'is-clickable' : ''}`}
      aria-hidden={activeIndex < 0}
      onClick={() => {
        if (clickable && activeIndex >= 0) onBeaconClick?.(activeIndex)
      }}
      onKeyDown={(event) => {
        if (!clickable || activeIndex < 0) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onBeaconClick?.(activeIndex)
        }
      }}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : -1}
    >
      <span className="screen-marker__glow" aria-hidden="true" />
      <span className="screen-marker__pin" aria-hidden="true">
        <svg viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 1C7.03 1 3 5.03 3 10c0 6.75 9 20 9 20s9-13.25 9-20c0-4.97-4.03-9-9-9Z"
            fill={`url(#marker-pin-${gradientId})`}
          />
          <circle cx="12" cy="10" r="3.2" fill="rgba(255,255,255,0.92)" />
          <defs>
            <radialGradient
              id={`marker-pin-${gradientId}`}
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(12 10) rotate(90) scale(14)"
            >
              <stop stopColor="#c49bff" />
              <stop offset="1" stopColor="#7c3aed" />
            </radialGradient>
          </defs>
        </svg>
      </span>
    </div>
  )
}
