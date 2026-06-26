import { useCallback, useEffect, useRef, useState } from 'react'

import { gsap } from 'gsap'

import { moonShots } from '../data/moonShots'

import {
  getCurrentSectionFromProgress,
  getMarkerTargetFromProgress,
  MARKER_EMERGE_PROGRESS,
  MARKER_PULLBACK_PROGRESS,
} from '../data/cinematicTimeline'

import { MARKER_PHASE, MARKER_TIMING } from '../data/markerState'

import {

  animateBeaconIn,

  animateBeaconOut,

  animateCardIn,

  animateLineDraw,

  animateMarkerExit,

  getMarkerElements,

  hideAllMarkers,

  resetMarkerDom,

  setBeaconTarget,

} from './markerAnimations'

import { createMoonDragState } from './useCinematicTimeline'



const INTRO_THRESHOLD = 0.035

const PULLBACK_EPS = 0.002

const APPROACH_EPS = 0.008



function hasVisibleMarker(phase) {

  return (

    phase === MARKER_PHASE.BEACON ||

    phase === MARKER_PHASE.LINE ||

    phase === MARKER_PHASE.CARD

  )

}



export function useMarkers({

  lenis,

  cinematicStateRef,

  cardRefs,

  pathRefs,

  scrollProgress,

  scrollLockRef,

  finaleActive,

  onSectionOpen,

}) {

  const [activeIndex, setActiveIndex] = useState(-1)

  const [phase, setPhase] = useState(MARKER_PHASE.HIDDEN)

  const [cardReady, setCardReady] = useState(false)

  const [moonDragEnabled, setMoonDragEnabled] = useState(true)



  const activeIndexRef = useRef(-1)

  const phaseRef = useRef(MARKER_PHASE.HIDDEN)

  const timelineRef = useRef(null)

  const armedRef = useRef(new Set())

  const busyRef = useRef(false)

  const prevScrollRef = useRef(0)

  const exitPendingRef = useRef(false)

  const breathingUntilRef = useRef(0)



  const setPhaseSync = useCallback((next) => {

    phaseRef.current = next

    setPhase(next)

  }, [])



  const setIndexSync = useCallback((next) => {

    activeIndexRef.current = next

    setActiveIndex(next)

  }, [])



  const killTimeline = useCallback(() => {

    timelineRef.current?.kill()

    timelineRef.current = null

  }, [])



  const lockScroll = useCallback(() => {

    scrollLockRef.current = true

    lenis?.stop()

  }, [lenis, scrollLockRef])



  const unlockScroll = useCallback(() => {

    scrollLockRef.current = false

    if (!finaleActive) lenis?.start()

  }, [lenis, scrollLockRef, finaleActive])



  const startBreathingPause = useCallback(() => {

    breathingUntilRef.current = Date.now() + MARKER_TIMING.breathingPause * 1000

  }, [])



  const isBreathingReady = useCallback(() => Date.now() >= breathingUntilRef.current, [])



  const runExit = useCallback(

    (index, hadCard, { fast = false } = {}) =>

      new Promise((resolve) => {

        const els = getMarkerElements(cardRefs.current[index], pathRefs, index)

        if (!els.chapterEl) {

          resolve()

          return

        }



        setPhaseSync(MARKER_PHASE.EXITING)

        setCardReady(false)

        killTimeline()



        timelineRef.current = animateMarkerExit({

          ...els,

          cinematicStateRef,

          hadCard,

          fast,

          onComplete: () => {

            resetMarkerDom(els)

            timelineRef.current = null

            resolve()

          },

        })

      }),

    [cardRefs, pathRefs, cinematicStateRef, killTimeline, setPhaseSync],

  )



  const triggerSectionExit = useCallback(

    (index, { fast = false } = {}) => {

      if (exitPendingRef.current) return Promise.resolve()

      if (phaseRef.current === MARKER_PHASE.EXITING) return Promise.resolve()

      if (phaseRef.current === MARKER_PHASE.HIDDEN && activeIndexRef.current < 0) {

        return Promise.resolve()

      }



      const hadCard =
        phaseRef.current === MARKER_PHASE.CARD ||
        phaseRef.current === MARKER_PHASE.LINE



      exitPendingRef.current = true

      killTimeline()

      armedRef.current.delete(index)

      for (let i = index + 1; i < moonShots.length; i += 1) {

        armedRef.current.delete(i)

      }



      return runExit(index, hadCard, { fast }).finally(() => {

        exitPendingRef.current = false

        setIndexSync(-1)

        setPhaseSync(MARKER_PHASE.HIDDEN)

        const state = cinematicStateRef.current
        if (state) state.moonHold = null

        startBreathingPause()

      })

    },

    [killTimeline, runExit, setIndexSync, setPhaseSync, startBreathingPause, cinematicStateRef],

  )



  const showBeacon = useCallback(

    (index) =>

      new Promise((resolve) => {

        const els = getMarkerElements(cardRefs.current[index], pathRefs, index)

        resetMarkerDom(els)



        setIndexSync(index)

        setPhaseSync(MARKER_PHASE.BEACON)

        setCardReady(false)

        lockScroll()



        const state = cinematicStateRef.current

        if (state) {

          state.markersEnabled = true

          state.dragEnabled = false

          const shot = moonShots[index]
          state.moonHold = { x: shot.moon.x, y: shot.moon.y }
          state.moon.x = shot.moon.x
          state.moon.y = shot.moon.y
          state.moonDrag = createMoonDragState()

        }

        setMoonDragEnabled(false)



        setBeaconTarget(cinematicStateRef, index)

        killTimeline()

        timelineRef.current = animateBeaconIn(cinematicStateRef)

        timelineRef.current.eventCallback('onComplete', () => {

          timelineRef.current = null

          resolve()

        })

      }),

    [

      cardRefs,

      pathRefs,

      cinematicStateRef,

      killTimeline,

      lockScroll,

      setIndexSync,

      setPhaseSync,

    ],

  )



  const revealLineAndCard = useCallback(

    (index) =>

      new Promise((resolve) => {

        if (activeIndexRef.current !== index) {

          resolve()

          return

        }

        if (phaseRef.current !== MARKER_PHASE.BEACON) {

          resolve()

          return

        }



        const els = getMarkerElements(cardRefs.current[index], pathRefs, index)

        if (!els.chapterEl) {

          resolve()

          return

        }



        setPhaseSync(MARKER_PHASE.LINE)

        setCardReady(false)

        killTimeline()



        const tl = gsap.timeline({

          onComplete: () => {

            timelineRef.current = null

            resolve()

          },

        })



        tl.to({}, { duration: MARKER_TIMING.beaconToLinePause })

        tl.add(animateLineDraw(els))

        tl.call(() => setPhaseSync(MARKER_PHASE.CARD))

        tl.add(

          animateCardIn({

            revealEl: els.revealEl,

            linkEl: els.linkEl,

            onReady: () => {

              setCardReady(true)

              onSectionOpen?.(index)

              unlockScroll()

            },

          }),

        )



        timelineRef.current = tl

      }),

    [

      cardRefs,

      pathRefs,

      killTimeline,

      onSectionOpen,

      setPhaseSync,

      unlockScroll,

    ],

  )



  const goToSection = useCallback(
    async (index) => {
      if (finaleActive || busyRef.current || exitPendingRef.current) return
      if (armedRef.current.has(index)) return

      const current = activeIndexRef.current
      const currentPhase = phaseRef.current

      if (current === index && hasVisibleMarker(currentPhase)) return
      if (!isBreathingReady()) return

      armedRef.current.add(index)
      busyRef.current = true

      try {
        if (current >= 0 && current !== index && hasVisibleMarker(currentPhase)) {
          await triggerSectionExit(current)
          await new Promise((resolve) => {
            const wait = Math.max(0, breathingUntilRef.current - Date.now())
            window.setTimeout(resolve, wait)
          })
        }

        if (!isBreathingReady()) {
          armedRef.current.delete(index)
          return
        }

        await showBeacon(index)

        if (phaseRef.current === MARKER_PHASE.BEACON) {
          await revealLineAndCard(index)
        }
      } finally {
        busyRef.current = false
      }
    },

    [

      finaleActive,

      isBreathingReady,

      showBeacon,

      revealLineAndCard,

      triggerSectionExit,

    ],

  )



  const onBeaconClick = useCallback(

    (index) => {

      if (activeIndexRef.current !== index) return

      if (phaseRef.current !== MARKER_PHASE.BEACON) return

      if (busyRef.current) return



      busyRef.current = true

      revealLineAndCard(index).finally(() => {

        busyRef.current = false

      })

    },

    [revealLineAndCard],

  )



  const resetMarkers = useCallback(() => {

    killTimeline()

    armedRef.current.clear()

    busyRef.current = false

    exitPendingRef.current = false

    breathingUntilRef.current = 0

    activeIndexRef.current = -1

    phaseRef.current = MARKER_PHASE.HIDDEN



    setActiveIndex(-1)

    setPhase(MARKER_PHASE.HIDDEN)

    setCardReady(false)

    hideAllMarkers(cardRefs, pathRefs)



    const state = cinematicStateRef.current

    if (state) {

      state.markersEnabled = true

      state.dragEnabled = true

      state.activeMarkerIndex = -1

      state.beaconOpacity = 0

      state.beaconYOffset = 0.14

      state.beaconScale = 0.55

      state.moonDrag = createMoonDragState()

      state.moonHold = null

    }



    setMoonDragEnabled(true)

    unlockScroll()

  }, [cardRefs, pathRefs, cinematicStateRef, killTimeline, unlockScroll])



  const hideForFinale = useCallback(() => {

    killTimeline()

    busyRef.current = false

    exitPendingRef.current = false



    const current = activeIndexRef.current

    const hadCard = phaseRef.current === MARKER_PHASE.CARD



    if (current >= 0) {

      const els = getMarkerElements(cardRefs.current[current], pathRefs, current)

      animateMarkerExit({ ...els, cinematicStateRef, hadCard })

      resetMarkerDom(els)

    } else {

      animateBeaconOut(cinematicStateRef)

    }



    activeIndexRef.current = -1

    phaseRef.current = MARKER_PHASE.HIDDEN

    setActiveIndex(-1)

    setPhase(MARKER_PHASE.HIDDEN)

    setCardReady(false)



    const state = cinematicStateRef.current

    if (state) {

      state.markersEnabled = false

      state.activeMarkerIndex = -1

      state.beaconOpacity = 0

      state.moonHold = null

    }

  }, [cardRefs, pathRefs, cinematicStateRef, killTimeline])



  useEffect(() => {

    if (finaleActive) return



    const prevScroll = prevScrollRef.current

    const scrollingBack = scrollProgress < prevScroll - 0.0008

    prevScrollRef.current = scrollProgress



    if (scrollProgress < INTRO_THRESHOLD) {

      if (armedRef.current.size > 0 || activeIndexRef.current >= 0) {

        resetMarkers()

      } else {

        setMoonDragEnabled(true)

        const state = cinematicStateRef.current

        if (state) state.dragEnabled = true

      }

      return

    }



    setMoonDragEnabled(false)

    const state = cinematicStateRef.current

    if (state) {

      state.dragEnabled = false

    }



    const current = activeIndexRef.current

    const currentPhase = phaseRef.current

    const chapterFromScroll = getCurrentSectionFromProgress(scrollProgress)

    if (current >= 0 && hasVisibleMarker(currentPhase) && !exitPendingRef.current) {
      const pullThreshold =
        MARKER_PULLBACK_PROGRESS[current] ?? MARKER_EMERGE_PROGRESS[current]

      const enteringPullback = scrollProgress >= pullThreshold - PULLBACK_EPS

      const leavingByScrollBack =
        scrollingBack &&
        (chapterFromScroll !== current ||
          scrollProgress < MARKER_EMERGE_PROGRESS[current] - APPROACH_EPS)

      if (enteringPullback || leavingByScrollBack) {
        if (busyRef.current) return
        triggerSectionExit(current).then(() => {})
      }
    }
  }, [
    scrollProgress,
    finaleActive,
    resetMarkers,
    cinematicStateRef,
    triggerSectionExit,
  ])

  useEffect(() => {
    if (finaleActive) return undefined

    const tryRevealMarker = () => {
      const state = cinematicStateRef.current
      const progress = state?.scrollProgress ?? 0

      if (progress < INTRO_THRESHOLD) return
      if (!isBreathingReady() || exitPendingRef.current || busyRef.current) return

      const stuckIndex = activeIndexRef.current
      if (
        phaseRef.current === MARKER_PHASE.BEACON &&
        stuckIndex >= 0 &&
        armedRef.current.has(stuckIndex) &&
        !timelineRef.current
      ) {
        busyRef.current = true
        revealLineAndCard(stuckIndex).finally(() => {
          busyRef.current = false
        })
        return
      }

      const target = getMarkerTargetFromProgress(progress, state)
      if (target < 0 || armedRef.current.has(target)) return

      const pullThreshold = MARKER_PULLBACK_PROGRESS[target]
      if (pullThreshold != null && progress >= pullThreshold - PULLBACK_EPS) return

      goToSection(target)
    }

    gsap.ticker.add(tryRevealMarker)
    return () => gsap.ticker.remove(tryRevealMarker)
  }, [finaleActive, goToSection, revealLineAndCard, cinematicStateRef, isBreathingReady])



  useEffect(() => {

    if (finaleActive) hideForFinale()

  }, [finaleActive, hideForFinale])



  useEffect(() => () => killTimeline(), [killTimeline])



  return {

    activeIndex,

    phase,

    cardReady,

    moonDragEnabled,

    onBeaconClick,

    resetMarkers,

    hideForFinale,

  }

}


