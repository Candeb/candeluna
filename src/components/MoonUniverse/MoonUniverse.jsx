import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLenis } from 'lenis/react'
import { useLocation } from 'react-router-dom'
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
import { applyPostIntroState, initIntroState } from '../../hooks/useCinematicIntro'
import {
  hasIntroCompleted,
  loadJourneyProgress,
  markIntroComplete,
  saveJourneyProgress,
} from '../../utils/journeySession'
import { setServiceMoonScrollHandler } from '../../utils/serviceMoonBridge'
import './MoonUniverse.css'

export default function MoonUniverse() {
  const location = useLocation()
  const serviceOverlayOpen = location.pathname.startsWith('/servicios/')
  const presenceMoonBackdrop = location.pathname.includes('/servicios/landing-pages')
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
  const restoreDoneRef = useRef(false)
  const skipIntroRef = useRef(hasIntroCompleted())
  const scrollProgressRef = useRef(loadJourneyProgress() ?? 0)
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

  const skipIntro = skipIntroRef.current

  const [titleVisible, setTitleVisible] = useState(skipIntro)
  const [taglineVisible, setTaglineVisible] = useState(skipIntro)
  const [introComplete, setIntroComplete] = useState(skipIntro)
  const [heroRevealing, setHeroRevealing] = useState(skipIntro)
  const [barActivated, setBarActivated] = useState(skipIntro)
  const [introPhase, setIntroPhase] = useState(skipIntro ? 6 : 0)
  const [moonEmerging, setMoonEmerging] = useState(skipIntro)
  const [activeChapter, setActiveChapter] = useState(-1)
  const [scrollProgress, setScrollProgress] = useState(() => loadJourneyProgress() ?? 0)
  const [finaleActive, setFinaleActive] = useState(false)
  const [finaleComplete, setFinaleComplete] = useState(false)
  const [ctaRevealed, setCtaRevealed] = useState(false)
  const [restartRevealed, setRestartRevealed] = useState(false)

  const handleChapterChange = useCallback((chapter) => {
    setActiveChapter(chapter)
  }, [])

  const handleProgressChange = useCallback((progress) => {
    scrollProgressRef.current = progress
    setScrollProgress(progress)
    if (hasIntroCompleted()) saveJourneyProgress(progress)
  }, [])

  const handleBeforeServiceNavigate = useCallback(() => {
    saveJourneyProgress(scrollProgressRef.current)
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
    markIntroComplete()
    setIntroComplete(true)
    scrollLockRef.current = false
    lenis?.start()
    timelineRef.current?.scrollTrigger?.enable()
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [lenis, timelineRef])

  useEffect(() => {
    if (skipIntro) {
      applyPostIntroState(cinematicStateRef.current)
    } else {
      initIntroState(cinematicStateRef.current)
    }
  }, [skipIntro])

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
    (progress, { immediate = false } = {}) => {
      if (finaleActive || finaleComplete) return

      const st = timelineRef.current?.scrollTrigger
      if (!st || !lenis) return

      const clamped = Math.min(1, Math.max(0, progress))
      const y = st.start + clamped * (st.end - st.start)

      freeScrollRef.current = true
      scrollLockRef.current = false
      lenis.start()
      cinematicStateRef.current.forceCameraSnap = true

      if (immediate) {
        window.scrollTo(0, y)
        lenis.scrollTo(y, { immediate: true })
        freeScrollRef.current = false
        return
      }

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
    saveJourneyProgress(0)

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

  /** Servicio abierto por encima: congelar luna y scroll; al volver todo sigue igual */
  useEffect(() => {
    if (!serviceOverlayOpen || !lenis) return undefined

    lenis.stop()
    cinematicStateRef.current.forceCameraSnap = true

    return () => {
      // Si la tarjeta sigue abierta, los markers mantienen el lock
      if (!scrollLockRef.current && introComplete) {
        lenis.start()
      }
    }
  }, [serviceOverlayOpen, lenis, introComplete])

  /** Presencia Digital: mismo zoom de la tarjeta + giro lento con scroll */
  useEffect(() => {
    if (!serviceOverlayOpen || !presenceMoonBackdrop) {
      setServiceMoonScrollHandler(null)
      const state = cinematicStateRef.current
      if (state) {
        state.serviceMoonSpin = false
        state.serviceMoonFreezeCamera = null
      }
      return undefined
    }

    const state = cinematicStateRef.current
    const hold = state.zoomHold
    const freezeCamera = hold
      ? {
          camera: { ...hold.camera },
          target: { ...hold.target },
          fov: hold.fov,
        }
      : {
          camera: { ...state.camera },
          target: { ...state.target },
          fov: state.fov,
        }

    state.serviceMoonSpin = true
    state.serviceMoonProgress = 0
    state.serviceMoonBaseX = state.moon?.x ?? 0.04
    state.serviceMoonBaseY = state.moon?.y ?? 0
    state.serviceMoonFreezeCamera = freezeCamera
    state.moonHold = null
    state.moonUserLocked = false
    state.forceCameraSnap = false

    setServiceMoonScrollHandler((progress) => {
      state.serviceMoonProgress = progress
    })

    return () => {
      setServiceMoonScrollHandler(null)
      state.serviceMoonSpin = false
      state.serviceMoonProgress = 0
      state.serviceMoonFreezeCamera = null
    }
  }, [serviceOverlayOpen, presenceMoonBackdrop])

  useEffect(() => {
    if (!lenis || !introComplete || restoreDoneRef.current) return undefined

    restoreDoneRef.current = true

    if (skipIntro) {
      const saved = loadJourneyProgress()
      const target = saved != null && saved > 0.002 ? saved : 0

      scrollLockRef.current = false
      freeScrollRef.current = true
      lenis.start()
      timelineRef.current?.scrollTrigger?.enable()

      let attempts = 0
      let raf = 0
      const tryRestore = () => {
        ScrollTrigger.refresh()
        const st = timelineRef.current?.scrollTrigger
        if (!st) {
          attempts += 1
          if (attempts < 40) raf = requestAnimationFrame(tryRestore)
          else freeScrollRef.current = false
          return
        }
        const y = st.start + target * (st.end - st.start)
        cinematicStateRef.current.forceCameraSnap = true
        window.scrollTo(0, y)
        lenis.scrollTo(y, { immediate: true })
        setScrollProgress(target)
        freeScrollRef.current = false
      }
      raf = requestAnimationFrame(tryRestore)
      return () => cancelAnimationFrame(raf)
    }

    scrollLockRef.current = false
    freeScrollRef.current = false
    lenis.start()
    timelineRef.current?.scrollTrigger?.enable()
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(frame)
  }, [lenis, introComplete, timelineRef, skipIntro])

  const headerOpacity = getHeaderOpacity(scrollProgress)
  const isExploring = scrollProgress > 0.04
  const isMoonDrag = moonDragEnabled && !finaleActive && !serviceOverlayOpen
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
      className={`cinematic ${!introComplete ? 'is-intro-active' : ''} ${!introComplete && introPhase < 3 ? 'is-intro-title-only' : ''} ${serviceOverlayOpen ? 'is-service-overlay' : ''} ${serviceOverlayOpen && presenceMoonBackdrop ? 'is-service-moon-backdrop' : ''}`}
      aria-hidden={serviceOverlayOpen && !presenceMoonBackdrop ? true : undefined}
      inert={serviceOverlayOpen ? '' : undefined}
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
       
          <h3 className={`cinematic__tagline ${taglineVisible ? 'is-visible' : ''}`}>
            Explorá el universo de soluciones
          </h3>
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

        {!finaleActive && !isMoonDrag && introComplete ? (
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
              onBeforeNavigate={handleBeforeServiceNavigate}
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
