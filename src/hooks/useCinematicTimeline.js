import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { INTRO_SHOT, moonShots, getPullbackForShot } from '../data/moonShots'
import { CINEMATIC_TIMING, getActiveChapterFromProgress } from '../data/cinematicTimeline'

gsap.registerPlugin(ScrollTrigger)

export function createCinematicState() {
  return {
    camera: { ...INTRO_SHOT.camera },
    target: { ...INTRO_SHOT.target },
    moon: { ...INTRO_SHOT.moon },
    fov: INTRO_SHOT.fov,
  }
}

function setCardHidden(el) {
  if (!el) return
  gsap.set(el, {
    opacity: 0,
    filter: 'blur(14px)',
    pointerEvents: 'none',
  })
}

/**
 * Timeline GSAP con dos capas:
 * 1) Cámara + luna (scrub continuo)
 * 2) Tarjetas (fade/blur en DOM, desacoplado)
 */
export function useCinematicTimeline({
  viewportRef,
  trackRef,
  cinematicStateRef,
  cardRefs,
  onChapterChange,
  onProgressChange,
}) {
  const timelineRef = useRef(null)

  useEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    const state = cinematicStateRef.current
    if (!track || !state) return undefined

    const isMobile = window.matchMedia('(max-width: 768px)').matches

    cardRefs.current.forEach(setCardHidden)

    let chapter = -1
    const reportChapter = (next) => {
      if (next === chapter) return
      chapter = next
      onChapterChange?.(next)
    }

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          onProgressChange?.(self.progress)
          reportChapter(getActiveChapterFromProgress(self.progress))
        },
      },
    })

    timelineRef.current = tl

    const introDur = CINEMATIC_TIMING.introDur
    tl.to(
      state.camera,
      { x: 0, y: INTRO_SHOT.camera.y, z: INTRO_SHOT.camera.z, duration: introDur },
      0,
    )
    tl.to(state.moon, { x: INTRO_SHOT.moon.x, y: INTRO_SHOT.moon.y, duration: introDur }, 0)
    tl.to(state, { fov: INTRO_SHOT.fov, duration: introDur }, 0)

    let cursor = introDur + CINEMATIC_TIMING.introGap

    moonShots.forEach((shot, index) => {
      const cardEl = cardRefs.current[index]
      const prevCard = index > 0 ? cardRefs.current[index - 1] : null
      const pullback = getPullbackForShot(shot, isMobile)
      const approachDur = CINEMATIC_TIMING.approachDur
      const holdDur = CINEMATIC_TIMING.holdDur
      const pullDur = CINEMATIC_TIMING.pullDur
      const travelEase = 'power1.inOut'
      const cardHide = {
        opacity: 0,
        filter: 'blur(12px)',
        pointerEvents: 'none',
      }

      if (index > 0) {
        if (prevCard) {
          tl.to(
            prevCard,
            { ...cardHide, duration: pullDur * 0.55, ease: 'power1.in' },
            cursor,
          )
        }
        tl.to(
          state.camera,
          {
            x: 0,
            y: pullback.y,
            z: pullback.z,
            duration: pullDur,
            ease: travelEase,
          },
          cursor,
        )
        cursor += pullDur
      }

      tl.to(
        state.camera,
        {
          x: shot.camera.x,
          y: shot.camera.y,
          z: shot.camera.z,
          duration: approachDur,
          ease: travelEase,
        },
        cursor,
      )
      tl.to(
        state.moon,
        {
          x: shot.moon.x,
          y: shot.moon.y,
          duration: approachDur + 0.12,
          ease: travelEase,
        },
        cursor,
      )
      tl.to(
        state,
        { fov: shot.fov, duration: approachDur, ease: travelEase },
        cursor,
      )

      const cardIn = cursor + approachDur + CINEMATIC_TIMING.cardInOffset
      if (cardEl) {
        cardRefs.current.forEach((el, i) => {
          if (el && i !== index) {
            tl.set(el, cardHide, cardIn)
          }
        })
        tl.to(
          cardEl,
          {
            opacity: 1,
            filter: 'blur(0px)',
            pointerEvents: 'auto',
            duration: 0.45,
            ease: 'power2.out',
          },
          cardIn,
        )
      }

      cursor += approachDur + holdDur

      if (index < moonShots.length - 1 && cardEl) {
        tl.to(
          cardEl,
          { ...cardHide, duration: pullDur * 0.6, ease: 'power1.in' },
          cursor,
        )
        tl.to(
          state.camera,
          {
            x: 0,
            y: pullback.y,
            z: pullback.z,
            duration: pullDur * CINEMATIC_TIMING.pullOutFactor,
            ease: travelEase,
          },
          cursor,
        )
        cursor += pullDur * CINEMATIC_TIMING.pullOutFactor
      }
    })

    ScrollTrigger.refresh()

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
      timelineRef.current = null
    }
  }, [viewportRef, trackRef, cinematicStateRef, cardRefs, onChapterChange, onProgressChange])

  return timelineRef
}
