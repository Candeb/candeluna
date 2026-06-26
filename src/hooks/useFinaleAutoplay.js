import { useCallback, useEffect, useRef } from 'react'
import { isAtJourneyEnd } from '../data/cinematicTimeline'
import { resetFinaleVisuals } from './useCinematicTimeline'

const SCROLL_END_THRESHOLD = 14
const FINALE_AUTO_DELAY_MS = 380

/**
 * Al llegar al final del recorrido: bloquea el scroll y reproduce la secuencia
 * final automáticamente. El recorrido solo se reinicia con el botón dedicado.
 */
export function useFinaleAutoplay({
  lenis,
  cinematicStateRef,
  timelineRef,
  finalSequenceRef,
  outroRefs,
  journeyFooterRef,
  cardRefs,
  pathRefs,
  scrollProgress,
  freeScrollRef,
  scrollLockRef,
  onFinaleStart,
  onFinaleComplete,
}) {
  const atJourneyEndRef = useRef(false)
  const journeyLockedRef = useRef(false)
  const finalePlayingRef = useRef(false)
  const finalePlayedRef = useRef(false)
  const finaleScheduledRef = useRef(false)
  const finaleTimerRef = useRef(null)

  const lockJourneyScroll = useCallback(() => {
    journeyLockedRef.current = true
    scrollLockRef.current = true
    lenis?.stop()
    timelineRef?.current?.scrollTrigger?.disable()
  }, [lenis, scrollLockRef, timelineRef])

  const unlockJourneyScroll = useCallback(() => {
    journeyLockedRef.current = false
    scrollLockRef.current = false
    timelineRef?.current?.scrollTrigger?.enable()
    lenis?.start()
  }, [lenis, scrollLockRef, timelineRef])

  const playFinale = useCallback(() => {
    if (finalePlayingRef.current || finalePlayedRef.current) return

    const finale = finalSequenceRef.current
    if (!finale) return

    finalePlayingRef.current = true
    lockJourneyScroll()
    onFinaleStart?.()

    finale.eventCallback('onComplete', () => {
      finalePlayingRef.current = false
      finalePlayedRef.current = true
      lockJourneyScroll()
      onFinaleComplete?.()
    })

    finale.restart()
    finale.play()
  }, [finalSequenceRef, lockJourneyScroll, onFinaleStart, onFinaleComplete])

  const scheduleAutoFinale = useCallback(() => {
    if (
      freeScrollRef?.current ||
      finaleScheduledRef.current ||
      finalePlayingRef.current ||
      finalePlayedRef.current
    ) {
      return
    }

    finaleScheduledRef.current = true
    lockJourneyScroll()

    finaleTimerRef.current = window.setTimeout(() => {
      finaleTimerRef.current = null
      playFinale()
    }, FINALE_AUTO_DELAY_MS)
  }, [freeScrollRef, lockJourneyScroll, playFinale])

  const clearFinaleTimer = useCallback(() => {
    if (finaleTimerRef.current != null) {
      window.clearTimeout(finaleTimerRef.current)
      finaleTimerRef.current = null
    }
    finaleScheduledRef.current = false
  }, [])

  const resetFinale = useCallback(() => {
    clearFinaleTimer()
    finalSequenceRef.current?.pause(0).progress(0)
    finalePlayingRef.current = false
    finalePlayedRef.current = false
    atJourneyEndRef.current = false
    journeyLockedRef.current = false

    resetFinaleVisuals({
      state: cinematicStateRef.current,
      outroRefs,
      journeyFooterRef,
      cardRefs,
      pathRefs,
    })

    unlockJourneyScroll()
  }, [
    clearFinaleTimer,
    finalSequenceRef,
    cinematicStateRef,
    outroRefs,
    journeyFooterRef,
    cardRefs,
    pathRefs,
    unlockJourneyScroll,
  ])

  const tryAutoFinale = useCallback(
    (atEnd) => {
      atJourneyEndRef.current = atEnd
      if (!atEnd) return
      scheduleAutoFinale()
    },
    [scheduleAutoFinale],
  )

  useEffect(() => {
    tryAutoFinale(isAtJourneyEnd(scrollProgress))
  }, [scrollProgress, tryAutoFinale])

  useEffect(() => {
    if (!lenis) return undefined

    const syncScrollEnd = ({ scroll, limit }) => {
      if (finalePlayingRef.current || finalePlayedRef.current) return
      if (freeScrollRef?.current) return

      const reachedEnd = scroll >= limit - SCROLL_END_THRESHOLD
      const atEnd = reachedEnd || isAtJourneyEnd(scrollProgress)

      if (atEnd) {
        tryAutoFinale(true)
      } else if (!journeyLockedRef.current && !scrollLockRef?.current) {
        lenis.start()
      }
    }

    const blockScroll = (event) => {
      if (freeScrollRef?.current) return
      if (
        journeyLockedRef.current ||
        finalePlayingRef.current ||
        finalePlayedRef.current
      ) {
        event.preventDefault()
      }
    }

    lenis.on('scroll', syncScrollEnd)
    window.addEventListener('wheel', blockScroll, { passive: false })
    window.addEventListener('touchmove', blockScroll, { passive: false })

    return () => {
      lenis.off('scroll', syncScrollEnd)
      window.removeEventListener('wheel', blockScroll)
      window.removeEventListener('touchmove', blockScroll)
      clearFinaleTimer()
    }
  }, [
    lenis,
    scrollProgress,
    freeScrollRef,
    scrollLockRef,
    tryAutoFinale,
    clearFinaleTimer,
  ])

  return {
    playFinale,
    resetFinale,
    finalePlayingRef,
    finalePlayedRef,
    journeyLockedRef,
  }
}
