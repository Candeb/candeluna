import { useCallback, useEffect, useRef, useState } from 'react'
import { useLenis } from 'lenis/react'
import { moonShots, SCROLL_HEIGHT_VH } from '../../data/moonShots'
import { getHeaderOpacity } from '../../data/cinematicTimeline'
import {
  createCinematicState,
  useCinematicTimeline,
} from '../../hooks/useCinematicTimeline'
import MoonHero from '../MoonHero.jsx'
import RegionCard from './RegionCard.jsx'
import JourneyProgress from './JourneyProgress.jsx'
import './MoonUniverse.css'

export default function MoonUniverse() {
  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const cinematicStateRef = useRef(createCinematicState())
  const cardRefs = useRef([])
  const lenis = useLenis()

  const [titleVisible, setTitleVisible] = useState(false)
  const [taglineVisible, setTaglineVisible] = useState(false)
  const [activeChapter, setActiveChapter] = useState(-1)
  const [scrollProgress, setScrollProgress] = useState(0)

  const handleChapterChange = useCallback((chapter) => {
    setActiveChapter(chapter)
  }, [])

  const handleProgressChange = useCallback((progress) => {
    setScrollProgress(progress)
  }, [])

  const timelineRef = useCinematicTimeline({
    viewportRef,
    trackRef,
    cinematicStateRef,
    cardRefs,
    onChapterChange: handleChapterChange,
    onProgressChange: handleProgressChange,
  })

  const seekToProgress = useCallback(
    (progress) => {
      const st = timelineRef.current?.scrollTrigger
      if (!st || !lenis) return

      const clamped = Math.min(1, Math.max(0, progress))
      const y = st.start + clamped * (st.end - st.start)
      lenis.scrollTo(y, { duration: 1.35 })
    },
    [lenis, timelineRef],
  )

  useEffect(() => {
    const titleFrame = requestAnimationFrame(() => setTitleVisible(true))
    const taglineTimer = window.setTimeout(() => setTaglineVisible(true), 900)
    return () => {
      cancelAnimationFrame(titleFrame)
      window.clearTimeout(taglineTimer)
    }
  }, [])

  const headerOpacity = getHeaderOpacity(scrollProgress)
  const isExploring = scrollProgress > 0.04

  return (
    <div className="cinematic">
      <div
        ref={viewportRef}
        className={`cinematic__viewport ${isExploring ? 'is-exploring' : ''}`}
      >
        <div className="cinematic__vignette" aria-hidden="true" />

        <header
          className="cinematic__header"
          style={{
            opacity: headerOpacity,
            visibility: headerOpacity < 0.02 ? 'hidden' : 'visible',
            pointerEvents: headerOpacity < 0.15 ? 'none' : 'auto',
          }}
        >
          <h1 className={titleVisible ? 'is-visible' : ''}>
            Hola, Soy Candela Bustos
          </h1>
          <p className={`cinematic__tagline ${taglineVisible ? 'is-visible' : ''}`}>
            Explorá el universo de soluciones
          </p>
        </header>

        <div className="cinematic__moon">
          <MoonHero
            visible={titleVisible}
            cinematicStateRef={cinematicStateRef}
          />
        </div>

        <div className="cinematic__cards" aria-hidden={activeChapter < 0}>
          {moonShots.map((shot, index) => (
            <RegionCard
              key={shot.id}
              ref={(node) => {
                cardRefs.current[index] = node
              }}
              service={shot.service}
              index={index}
              side={shot.cardSide}
            />
          ))}
        </div>

        <footer className="cinematic__footer">
          <JourneyProgress
            progress={scrollProgress}
            activeChapter={activeChapter}
            onSeek={seekToProgress}
          />
        </footer>
      </div>

      <div
        ref={trackRef}
        className="cinematic__track"
        style={{ height: `${SCROLL_HEIGHT_VH}vh` }}
        aria-hidden="true"
      />
    </div>
  )
}
