import { forwardRef, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './TopProgressBar.css'

const TopProgressBar = forwardRef(function TopProgressBar(
  { progress = 0, activated = false, introMode = false },
  ref,
) {
  const fillRef = useRef(null)
  const displayRef = useRef(0)

  useEffect(() => {
    const fill = fillRef.current
    if (!fill) return undefined

    const tick = () => {
      const target = Math.max(0, Math.min(1, progress))
      displayRef.current += (target - displayRef.current) * 0.14
      fill.style.transform = `scaleX(${Math.max(0.0001, displayRef.current)})`
    }

    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [progress])

  return (
    <div
      ref={ref}
      className={`top-progress ${activated ? 'is-active' : ''} ${introMode ? 'top-progress--intro' : ''}`}
      aria-hidden={!activated && !introMode}
    >
      <div className="top-progress__track" aria-hidden="true">
        <div ref={fillRef} className="top-progress__fill" />
      </div>
      <div
        className="top-progress__glow"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label="Progreso del recorrido"
      />
    </div>
  )
})

export default TopProgressBar
