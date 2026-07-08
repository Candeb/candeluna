import { forwardRef, useCallback, useRef } from 'react'
import { moonShots } from '../../data/moonShots'
import { getWaypointProgress } from '../../data/cinematicTimeline'
import './JourneyProgress.css'

const JourneyProgress = forwardRef(function JourneyProgress(
  {
    progress,
    activeChapter,
    onSeek,
    introMode = false,
    barTrackRef: externalBarTrackRef,
  },
  ref,
) {
  const internalBarRef = useRef(null)
  const barTrackRef = externalBarTrackRef ?? internalBarRef

  const seekFromPointer = useCallback(
    (clientX) => {
      if (!onSeek || introMode) return
      const bar = barTrackRef.current?.closest('.journey__bar')
      if (!bar) return
      const rect = bar.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      onSeek(ratio)
    },
    [onSeek, introMode, barTrackRef],
  )

  const handleBarClick = (event) => {
    seekFromPointer(event.clientX)
  }

  const handleBarKeyDown = (event) => {
    if (introMode || !onSeek) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      const next = Math.min(moonShots.length - 1, activeChapter + 1)
      onSeek(getWaypointProgress(next))
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      const prev = activeChapter <= 0 ? -1 : activeChapter - 1
      onSeek(getWaypointProgress(prev))
    }
  }

  const hint =
    activeChapter < 0
      ? 'deslizá para iniciar el viaje'
      : activeChapter >= moonShots.length - 1
        ? 'última región · deslizá una vez más para el cierre'
        : `región ${String(activeChapter + 1).padStart(2, '0')} · ${moonShots[activeChapter].service.title}`

  const progressPercent = Math.round(progress * 100)

  return (
    <nav
      ref={ref}
      className={`journey ${introMode ? 'journey--intro' : ''}`}
      aria-label="Recorrido por la luna"
    >
      <p className={`journey__hint ${introMode ? 'journey__hint--hidden' : ''}`}>{hint}</p>

      <div className={`journey__controls ${introMode ? 'journey__controls--hidden' : ''}`}>
        <button
          type="button"
          className={`journey__stop ${activeChapter < 0 ? 'is-active' : progress > 0.04 ? 'is-passed' : ''}`}
          style={{ left: `${getWaypointProgress(-1) * 100}%` }}
          onClick={() => onSeek?.(getWaypointProgress(-1))}
          aria-label="Volver al inicio del viaje"
          aria-current={activeChapter < 0 ? 'step' : undefined}
          tabIndex={introMode ? -1 : 0}
        >
          <span className="journey__stop-dot" />
        </button>

        {moonShots.map((shot, index) => {
          const stopProgress = getWaypointProgress(index)
          const isActive = activeChapter === index
          const isPassed = progress >= stopProgress - 0.005

          return (
            <button
              key={shot.id}
              type="button"
              className={`journey__stop ${isActive ? 'is-active' : ''} ${isPassed ? 'is-passed' : ''}`}
              style={{ left: `${stopProgress * 100}%` }}
              onClick={() => onSeek?.(stopProgress)}
              aria-label={`Ir a ${shot.service.title}`}
              aria-current={isActive ? 'step' : undefined}
              tabIndex={introMode ? -1 : 0}
            >
              <span className="journey__stop-dot" />
            </button>
          )
        })}
      </div>

      <div
        className="journey__bar"
        role="slider"
        tabIndex={introMode ? -1 : 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        aria-label="Progreso del recorrido lunar"
        onClick={handleBarClick}
        onKeyDown={handleBarKeyDown}
      >
        <div ref={barTrackRef} className="journey__bar-track" aria-hidden="true">
          <div
            className="journey__bar-fill"
            style={{ transform: `scaleX(${introMode ? 0.02 : Math.max(0.02, progress)})` }}
          />
        </div>
      </div>

      <p className={`journey__meta ${introMode ? 'journey__meta--hidden' : ''}`} aria-live="polite">
        {progressPercent}% recorrido
      </p>
    </nav>
  )
})

export default JourneyProgress
