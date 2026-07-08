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
import TopProgressBar from './TopProgressBar.jsx'
import FinalOutro from './FinalOutro.jsx'
import ScreenCenterMarker from './ScreenCenterMarker.jsx'
import CinematicIntro from '../CinematicIntro/CinematicIntro.jsx'
import { initIntroState } from '../../hooks/useCinematicIntro'
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
  const progressBarRef = useRef(null)
  const moonShellRef = useRef(null)
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
  const [introComplete, setIntroComplete] = useState(false)
  const [heroRevealing, setHeroRevealing] = useState(false)
  const [barActivated, setBarActivated] = useState(false)
  const [introPhase, setIntroPhase] = useState(0)
  const [moonEmerging, setMoonEmerging] = useState(false)
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

  const handleIntroPhase = useCallback((phase) => {
    setIntroPhase(phase)
    if (phase >= 3) setMoonEmerging(true)
    if (phase === 6) {
      setHeroRevealing(true)
      setTitleVisible(true)
      window.setTimeout(() => setTaglineVisible(true), 1100)
    }
  }, [])

  const handleBarActivate = useCallback(() => {
    setBarActivated(true)
  }, [])

  const { timelineRef, finalSequenceRef } = useCinematicTimeline({
    viewportRef,
    trackRef,
    cinematicStateRef,
    cardRefs,
    pathRefs,
    outroRefs: outroRefs.current,
    journeyFooterRef: progressBarRef,
    onChapterChange: handleChapterChange,
    onProgressChange: handleProgressChange,
    freeScrollRef,
    onCtaReveal: handleCtaReveal,
    onRestartReveal: handleRestartReveal,
  })

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true)
    scrollLockRef.current = false
    lenis?.start()
    timelineRef.current?.scrollTrigger?.enable()
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [lenis, timelineRef])

  useEffect(() => {
    initIntroState(cinematicStateRef.current)
  }, [])

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
    journeyFooterRef: progressBarRef,
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
      journeyFooterRef: progressBarRef,
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
    if (!lenis || introComplete) return undefined

    scrollLockRef.current = true
    lenis.stop()
    timelineRef.current?.scrollTrigger?.disable()

    const blockScroll = (event) => {
      if (!introComplete) event.preventDefault()
    }

    window.addEventListener('wheel', blockScroll, { passive: false })
    window.addEventListener('touchmove', blockScroll, { passive: false })

    return () => {
      window.removeEventListener('wheel', blockScroll)
      window.removeEventListener('touchmove', blockScroll)
    }
  }, [lenis, introComplete, timelineRef])

  useEffect(() => {
    if (!lenis) return undefined

    window.scrollTo(0, 0)
    setFinaleActive(false)
    setFinaleComplete(false)
    resetMarkers()

    if (introComplete) {
      scrollLockRef.current = false
      freeScrollRef.current = false
      lenis.start()
      lenis.scrollTo(0, { immediate: true })
    }

    const frame = requestAnimationFrame(() => {
      ScrollTrigger.refresh()
    })

    return () => cancelAnimationFrame(frame)
  }, [lenis, resetMarkers, introComplete])

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
    <div
      className={`cinematic ${!introComplete ? 'is-intro-active' : ''} ${!introComplete && introPhase < 3 ? 'is-intro-title-only' : ''}`}
    >
      <TopProgressBar
        ref={progressBarRef}
        progress={scrollProgress}
        activated={barActivated}
        introMode={!introComplete}
      />

      <div
        ref={viewportRef}
        className={`cinematic__viewport ${isExploring ? 'is-exploring' : ''} ${isMarkerFlow ? 'is-marker-flow' : ''} ${isCardNavigable ? 'is-card-navigable' : ''} ${finaleActive ? 'is-finale' : ''} ${finaleComplete ? 'is-finale-complete' : ''} ${isMoonDrag ? 'is-moon-drag' : ''} ${heroRevealing ? 'is-hero-revealing' : ''}`}
      >
        <div className="cinematic__vignette" aria-hidden="true" />
        <div ref={finaleShadeRef} className="cinematic__finale-shade" aria-hidden="true" />
        <div ref={finaleStarsRef} className="cinematic__finale-stars" aria-hidden="true" />

        <header
          className="cinematic__header"
          style={{
            opacity: introComplete ? headerOpacity : 0,
            visibility: !introComplete || headerOpacity < 0.02 ? 'hidden' : 'visible',
            pointerEvents: !introComplete || headerOpacity < 0.15 ? 'none' : 'auto',
          }}
        >
          <h2 className={titleVisible ? 'is-visible' : ''}>
          Desarrollo productos digitales que conectan ideas, personas y sistemas.
          </h2>
          <p className={`cinematic__tagline ${taglineVisible ? 'is-visible' : ''}`}>
            Explorá el universo de soluciones
          </p>
        </header>

        <div
          ref={moonShellRef}
          className={`cinematic__moon ${moonEmerging ? 'is-emerging' : ''} ${!introComplete && !moonEmerging ? 'is-intro-hidden' : ''}`}
        >
          <MoonHero
            visible
            introDormant={!introComplete}
            cinematicStateRef={cinematicStateRef}
            moonDragEnabled={moonDragEnabled && !finaleActive && introComplete}
          />
        </div>

        {!introComplete && !finaleActive && !isMoonDrag ? (
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
      </div>

      {!introComplete ? (
        <CinematicIntro
          cinematicStateRef={cinematicStateRef}
          progressBarRef={progressBarRef}
          moonShellRef={moonShellRef}
          onPhaseChange={handleIntroPhase}
          onBarActivate={handleBarActivate}
          onComplete={handleIntroComplete}
        />
      ) : null}

      <div
        ref={trackRef}
        className="cinematic__track"
        style={{ height: `${SCROLL_HEIGHT_VH}vh` }}
        aria-hidden="true"
      />
    </div>
  )
}
