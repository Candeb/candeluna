import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLenis } from 'lenis/react'
import { moonShots, SCROLL_HEIGHT_VH } from '../../data/moonShots'
import { getHeaderOpacity } from '../../data/cinematicTimeline'
import {
  createCinematicState,
  resetJourneyToStart,
  useCinematicTimeline,
} from '../../hooks/useCinematicTimeline'
import { useFinaleAutoplay } from '../../hooks/useFinaleAutoplay'
import { useMarkers } from '../../hooks/useMarkers'
import { MARKER_PHASE } from '../../data/markerState'
import MoonHero from '../MoonHero.jsx'
import RegionChapter from './RegionChapter.jsx'
import JourneyProgress from './JourneyProgress.jsx'
import FinalOutro from './FinalOutro.jsx'
import ScreenCenterMarker from './ScreenCenterMarker.jsx'
import './MoonUniverse.css'

export default function MoonUniverse() {
  const viewportRef = useRef(null)
  const trackRef = useRef(null)
  const cinematicStateRef = useRef(createCinematicState())
  const cardRefs = useRef([])
  const pathRefs = useRef([])
  const freeScrollRef = useRef(false)
  const scrollLockRef = useRef(false)
  const journeyRestartingRef = useRef(false)
  const journeyFooterRef = useRef(null)
  const lenis = useLenis()

  const outroMessageRef = useRef(null)
  const outroCtaRef = useRef(null)
  const outroRestartRef = useRef(null)
  const finaleShadeRef = useRef(null)
  const finaleStarsRef = useRef(null)

  const outroRefs = useRef({
    message: outroMessageRef,
    cta: outroCtaRef,
    restart: outroRestartRef,
    shade: finaleShadeRef,
    stars: finaleStarsRef,
  })

  const [titleVisible, setTitleVisible] = useState(false)
  const [taglineVisible, setTaglineVisible] = useState(false)
  const [activeChapter, setActiveChapter] = useState(-1)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [finaleActive, setFinaleActive] = useState(false)
  const [finaleComplete, setFinaleComplete] = useState(false)
  const [ctaRevealed, setCtaRevealed] = useState(false)
  const [restartRevealed, setRestartRevealed] = useState(false)

  const handleChapterChange = useCallback((chapter) => {
    setActiveChapter(chapter)
  }, [])

  const handleProgressChange = useCallback((progress) => {
    setScrollProgress(progress)
  }, [])

  const handleFinaleStart = useCallback(() => {
    setFinaleActive(true)
    setCtaRevealed(false)
    setRestartRevealed(false)
  }, [])

  const handleFinaleComplete = useCallback(() => {
    setFinaleActive(true)
    setFinaleComplete(true)
  }, [])

  const handleCtaReveal = useCallback(() => {
    setCtaRevealed(true)
  }, [])

  const handleRestartReveal = useCallback(() => {
    setRestartRevealed(true)
  }, [])

  const { timelineRef, finalSequenceRef } = useCinematicTimeline({
    viewportRef,
    trackRef,
    cinematicStateRef,
    cardRefs,
    pathRefs,
    outroRefs: outroRefs.current,
    journeyFooterRef,
    onChapterChange: handleChapterChange,
    onProgressChange: handleProgressChange,
    freeScrollRef,
    onCtaReveal: handleCtaReveal,
    onRestartReveal: handleRestartReveal,
  })

  const {
    activeIndex,
    phase,
    cardReady,
    moonDragEnabled,
    onBeaconClick,
    resetMarkers,
    hideForFinale,
  } = useMarkers({
    lenis,
    scrollTimelineRef: timelineRef,
    cinematicStateRef,
    cardRefs,
    pathRefs,
    scrollProgress,
    scrollLockRef,
    finaleActive,
    onSectionOpen: handleChapterChange,
  })

  const { resetFinale } = useFinaleAutoplay({
    lenis,
    cinematicStateRef,
    timelineRef,
    finalSequenceRef,
    outroRefs: outroRefs.current,
    journeyFooterRef,
    cardRefs,
    pathRefs,
    scrollProgress,
    freeScrollRef,
    scrollLockRef,
    journeyRestartingRef,
    onFinaleStart: () => {
      hideForFinale()
      handleFinaleStart()
    },
    onFinaleComplete: handleFinaleComplete,
  })

  const seekToProgress = useCallback(
    (progress) => {
      if (finaleActive || finaleComplete) return

      const st = timelineRef.current?.scrollTrigger
      if (!st || !lenis) return

      const clamped = Math.min(1, Math.max(0, progress))
      const y = st.start + clamped * (st.end - st.start)

      freeScrollRef.current = true
      scrollLockRef.current = false
      lenis.start()
      lenis.scrollTo(y, {
        duration: 1.35,
        onComplete: () => {
          freeScrollRef.current = false
        },
      })
    },
    [lenis, timelineRef, finaleActive, finaleComplete],
  )

  const restartJourney = useCallback(() => {
    if (!lenis) return

    journeyRestartingRef.current = true

    resetFinale()
    resetMarkers()
    resetJourneyToStart({
      state: cinematicStateRef.current,
      timelineRef,
      outroRefs: outroRefs.current,
      journeyFooterRef,
      cardRefs,
      pathRefs,
      onProgressChange: handleProgressChange,
      onChapterChange: handleChapterChange,
    })

    setFinaleActive(false)
    setFinaleComplete(false)
    setCtaRevealed(false)
    setRestartRevealed(false)
    setScrollProgress(0)
    setActiveChapter(-1)

    document.documentElement.style.setProperty('--finale-video-dim', '1')
    document.documentElement.style.removeProperty('--moon-backdrop-opacity')

    freeScrollRef.current = true
    scrollLockRef.current = false
    lenis.start()
    window.scrollTo(0, 0)
    lenis.scrollTo(0, { immediate: true })

    requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      freeScrollRef.current = false
      journeyRestartingRef.current = false
    })
  }, [
    lenis,
    timelineRef,
    resetFinale,
    resetMarkers,
    handleProgressChange,
    handleChapterChange,
  ])

  useEffect(() => {
    if (!lenis) return undefined

    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const options = lenis.options ?? {}

    const previous = {
      wheelMultiplier: options.wheelMultiplier,
      touchMultiplier: options.touchMultiplier,
      lerp: options.lerp,
      duration: options.duration,
    }

    options.wheelMultiplier = isMobile ? 0.42 : 0.5
    options.touchMultiplier = isMobile ? 0.72 : 0.85
    options.lerp = 0.075
    options.duration = 1.85

    return () => {
      options.wheelMultiplier = previous.wheelMultiplier
      options.touchMultiplier = previous.touchMultiplier
      options.lerp = previous.lerp
      options.duration = previous.duration
    }
  }, [lenis])

  useEffect(() => {
    if (!lenis) return undefined

    window.scrollTo(0, 0)
    scrollLockRef.current = false
    freeScrollRef.current = false
    setFinaleActive(false)
    setFinaleComplete(false)
    lenis.start()
    lenis.scrollTo(0, { immediate: true })
    resetMarkers()

    const frame = requestAnimationFrame(() => {
      ScrollTrigger.refresh()
    })

    return () => cancelAnimationFrame(frame)
  }, [lenis, resetMarkers])

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
  const isMoonDrag = moonDragEnabled && !finaleActive
  const journeyChapter =
    phase === MARKER_PHASE.CARD && cardReady
      ? activeIndex
      : phase === MARKER_PHASE.BEACON
        ? activeIndex
        : -1

  useEffect(() => {
    if (!finaleActive) return undefined

    const state = cinematicStateRef.current
    const tick = () => {
      const moonOpacity = state.moonVisible ?? 1
      document.documentElement.style.setProperty(
        '--finale-video-dim',
        String(state.videoDim ?? 1),
      )
      document.documentElement.style.setProperty(
        '--moon-backdrop-opacity',
        String(moonOpacity),
      )
    }

    tick()

    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      document.documentElement.style.removeProperty('--moon-backdrop-opacity')
    }
  }, [finaleActive])

  const isMarkerFlow =
    !finaleActive &&
    activeIndex >= 0 &&
    (phase === MARKER_PHASE.BEACON ||
      phase === MARKER_PHASE.LINE ||
      phase === MARKER_PHASE.CARD ||
      phase === MARKER_PHASE.EXITING)

  const isCardNavigable =
    !finaleActive &&
    phase === MARKER_PHASE.CARD &&
    cardReady &&
    activeIndex >= 0

  return (
    <div className="cinematic">
      <div
        ref={viewportRef}
        className={`cinematic__viewport ${isExploring ? 'is-exploring' : ''} ${isMarkerFlow ? 'is-marker-flow' : ''} ${isCardNavigable ? 'is-card-navigable' : ''} ${finaleActive ? 'is-finale' : ''} ${finaleComplete ? 'is-finale-complete' : ''} ${isMoonDrag ? 'is-moon-drag' : ''}`}
      >
        <div className="cinematic__vignette" aria-hidden="true" />
        <div ref={finaleShadeRef} className="cinematic__finale-shade" aria-hidden="true" />
        <div ref={finaleStarsRef} className="cinematic__finale-stars" aria-hidden="true" />

        <header
          className="cinematic__header"
          style={{
            opacity: headerOpacity,
            visibility: headerOpacity < 0.02 ? 'hidden' : 'visible',
            pointerEvents: headerOpacity < 0.15 ? 'none' : 'auto',
          }}
        >
          <h2 className={titleVisible ? 'is-visible' : ''}>
          Desarrollo productos digitales que conectan ideas, personas y sistemas.
          </h2>
          <p className={`cinematic__tagline ${taglineVisible ? 'is-visible' : ''}`}>
            Explorá el universo de soluciones
          </p>
        </header>

        <div className="cinematic__moon">
          <MoonHero
            visible={titleVisible}
            cinematicStateRef={cinematicStateRef}
            moonDragEnabled={moonDragEnabled && !finaleActive}
          />
        </div>

        {!finaleActive && !isMoonDrag ? (
          <ScreenCenterMarker
            cinematicStateRef={cinematicStateRef}
            activeIndex={activeIndex}
            markerPhase={phase}
            onBeaconClick={onBeaconClick}
          />
        ) : null}

        <div
          className="cinematic__cards"
          aria-hidden={journeyChapter < 0 || finaleActive || isMoonDrag}
          inert={isMoonDrag ? '' : undefined}
        >
          {moonShots.map((shot, index) => (
            <RegionChapter
              key={shot.id}
              ref={(node) => {
                cardRefs.current[index] = node
              }}
              connectorRef={(node) => {
                pathRefs.current[index] = node
              }}
              shot={shot}
              index={index}
              side={shot.cardSide}
              cardInteractive={
                index === activeIndex && phase === MARKER_PHASE.CARD && cardReady
              }
              isActive={
                index === activeIndex &&
                (phase === MARKER_PHASE.LINE ||
                  phase === MARKER_PHASE.CARD ||
                  phase === MARKER_PHASE.EXITING)
              }
            />
          ))}
        </div>

        <FinalOutro
          messageRef={outroMessageRef}
          ctaRef={outroCtaRef}
          restartRef={outroRestartRef}
          onRestart={restartJourney}
          ctaInteractive={ctaRevealed}
          restartInteractive={restartRevealed}
          aria-hidden={!finaleActive}
        />

        <footer
          ref={journeyFooterRef}
          className="cinematic__footer"
          aria-hidden={finaleActive || finaleComplete}
        >
          <JourneyProgress
            progress={scrollProgress}
            activeChapter={journeyChapter}
            onSeek={finaleActive || finaleComplete ? undefined : seekToProgress}
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
