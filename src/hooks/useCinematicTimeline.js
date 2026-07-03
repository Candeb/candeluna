import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import { INTRO_SHOT, moonShots, getPullbackForShot, getShotCameraForDevice } from '../data/moonShots'
import {
  FINAL_SEQUENCE_TIMING,
  FINALE_CAMERA,
  FINALE_LIGHT_END,
  FINALE_LIGHT_MID,
  FINALE_LIGHT_START,
  FINALE_MOON_DRIFT,
} from '../data/finalMoonSequence'
import { CINEMATIC_TIMING, getActiveChapterFromProgress, SCROLL_SNAP_POINTS } from '../data/cinematicTimeline'

gsap.registerPlugin(ScrollTrigger)

export function createMoonDragState() {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    active: false,
    hasUserInput: false,
    quaternion: new THREE.Quaternion(),
  }
}

const _freezeEuler = new THREE.Euler(0, 0, 0, 'YXZ')
const _freezeBase = new THREE.Quaternion()
const _freezeTarget = new THREE.Quaternion()

/** Congela la orientación manual de la luna al empezar el scroll */
export function freezeUserMoonOrientation(state) {
  if (!state?.moonDrag?.hasUserInput || state.moonUserLocked) {
    return Boolean(state.moonUserLocked)
  }

  _freezeEuler.set(state.moon.x, state.moon.y, 0)
  _freezeBase.setFromEuler(_freezeEuler)
  _freezeTarget.copy(_freezeBase)
  if (state.moonDrag.quaternion) {
    _freezeTarget.premultiply(state.moonDrag.quaternion)
  }

  if (!state.moonUserQuat) {
    state.moonUserQuat = new THREE.Quaternion()
  }
  state.moonUserQuat.copy(_freezeTarget)
  state.moonUserLocked = true
  return true
}

export function clearUserMoonOrientation(state) {
  if (!state) return
  state.moonUserLocked = false
  state.moonUserQuat = null
}

/** Tras la primera sección, retoma rotación cinematográfica por región */
export function releaseUserMoonForCinematicJourney(state, sectionIndex = 0) {
  if (!state?.moonUserLocked || sectionIndex !== 0) return false

  const shot = moonShots[sectionIndex]
  if (shot) {
    state.moon.x = shot.moon.x
    state.moon.y = shot.moon.y
  }

  state.moonDrag = createMoonDragState()
  clearUserMoonOrientation(state)
  return true
}

/** Congela cámara en el pico de zoom mientras marcador + tarjeta están visibles */
export function beginZoomHold(state, sectionIndex) {
  if (!state || sectionIndex < 0) return

  const shot = moonShots[sectionIndex]
  if (!shot) return

  const { camera: shotCamera, fov: shotFov } = getShotCameraForDevice(
    shot,
    Boolean(state.isMobile),
  )

  state.zoomHoldActive = true
  state.zoomHold = {
    camera: { x: shotCamera.x, y: shotCamera.y, z: shotCamera.z },
    target: { x: 0, y: 0, z: 0 },
    fov: shotFov,
  }
  state.camera.x = shotCamera.x
  state.camera.y = shotCamera.y
  state.camera.z = shotCamera.z
  state.fov = shotFov
  state.approachFrozen = true
  state.forceCameraSnap = true
  state.visualApproachT = 1
  state.cameraSettleZDelta = 0
  state.cameraSettleYDelta = 0
}

export function endZoomHold(state) {
  if (!state) return
  state.zoomHoldActive = false
  state.zoomHold = null
  state.zoomHoldEgress = null
  state.approachFrozen = false
}

/** Alinea el timeline GSAP con el scroll actual (sin scrub) */
export function syncScrollTimelineProgress(timelineRef, lenis) {
  const tl = timelineRef?.current
  const st = tl?.scrollTrigger
  if (!tl || !st || !lenis) return tl?.progress?.() ?? 0

  const span = st.end - st.start
  if (span <= 0) return tl.progress()

  const progress = gsap.utils.clamp(0, 1, (lenis.scroll - st.start) / span)
  tl.progress(progress)
  return progress
}

/** Transición suave del pico de zoom al pullback — sincronizada con salida de tarjeta */
export function releaseZoomHoldForExit(state, duration = 0.48) {
  if (!state?.zoomHoldActive || !state.zoomHold) {
    endZoomHold(state)
    return
  }

  state.zoomHoldEgress = {
    fromCamera: { ...state.zoomHold.camera },
    fromFov: state.zoomHold.fov,
    duration: Math.max(0.22, duration),
    startTime: performance.now(),
  }
}

export function finishZoomHoldEgress(state) {
  if (!state) return
  if (!state.zoomHoldEgress) return
  endZoomHold(state)
}

export function createCinematicState() {
  return {
    camera: { ...INTRO_SHOT.camera },
    target: { ...INTRO_SHOT.target },
    moon: { ...INTRO_SHOT.moon },
    fov: INTRO_SHOT.fov,
    lighting: { ...FINALE_LIGHT_START },
    stars: 0,
    darkness: 0,
    videoDim: 1,
    moonVisible: 1,
    moonDrag: createMoonDragState(),
    dragEnabled: true,
    markersEnabled: true,
    activeMarkerIndex: -1,
    beaconOpacity: 0,
    beaconYOffset: 0.14,
    beaconScale: 0.55,
    scrollProgress: 0,
    visualApproachT: 0,
    cameraSettleZDelta: Infinity,
    cameraSettleYDelta: Infinity,
    moonSettleAngle: Infinity,
    moonHold: null,
    moonUserLocked: false,
    moonUserQuat: null,
    isMobile: false,
    forceCameraSnap: false,
    approachFrozen: false,
    zoomHoldActive: false,
    zoomHold: null,
    zoomHoldEgress: null,
  }
}

import { hideAllMarkers } from './markerAnimations'

export function buildFinalMoonSequence({
  state,
  lastShot,
  outroRefs,
  journeyFooterRef,
  onCtaReveal,
  onRestartReveal,
}) {
  const {
    pauseDur,
    dollyDur,
    lightDur,
    starsDur,
    starsDelay,
    shadeMaxOpacity,
    messageDur,
    ctaDelay,
    ctaDur,
    restartHold,
    restartDur,
  } = FINAL_SEQUENCE_TIMING

  const ease = 'sine.inOut'
  const finalMoonSequence = gsap.timeline({ defaults: { ease }, paused: true })

  const dollyStart = pauseDur
  const lightStart = pauseDur + 0.4
  const starsStart = lightStart + lightDur * 0.45
  const messageStart = dollyStart + dollyDur + 0.5
  const ctaStart = messageStart + ctaDelay
  const restartStart = ctaStart + ctaDur + restartHold

  finalMoonSequence.call(() => {
    state.markersEnabled = false
    state.activeMarkerIndex = -1
    state.beaconOpacity = 0
  }, null, 0)

  if (journeyFooterRef?.current) {
    finalMoonSequence.to(
      journeyFooterRef.current,
      { opacity: 0, pointerEvents: 'none', duration: 0.8, ease: 'power1.inOut' },
      0,
    )
  }

  finalMoonSequence.to({}, { duration: pauseDur }, 0)

  finalMoonSequence.to(
    state.camera,
    {
      x: FINALE_CAMERA.x,
      y: FINALE_CAMERA.y,
      z: FINALE_CAMERA.z,
      duration: dollyDur,
      ease,
    },
    dollyStart,
  )
  finalMoonSequence.to(
    state,
    { fov: FINALE_CAMERA.fov, duration: dollyDur, ease },
    dollyStart,
  )

  if (lastShot) {
    finalMoonSequence.to(
      state.moon,
      {
        y: lastShot.moon.y + FINALE_MOON_DRIFT,
        duration: dollyDur,
        ease,
      },
      dollyStart,
    )
  }

  finalMoonSequence.to(
    state.lighting,
    { ...FINALE_LIGHT_MID, duration: lightDur * 0.5, ease },
    lightStart,
  )
  finalMoonSequence.to(
    state.lighting,
    { ...FINALE_LIGHT_END, duration: lightDur * 0.5, ease },
    lightStart + lightDur * 0.45,
  )

  finalMoonSequence.to(
    state,
    { stars: 1, darkness: 1, videoDim: 0.38, duration: lightDur, ease },
    lightStart,
  )

  // Luna se aleja en luminosidad — permanece atrás, oscura, sin desaparecer
  finalMoonSequence.to(
    state,
    { moonVisible: 0.52, duration: dollyDur, ease },
    dollyStart,
  )
  finalMoonSequence.to(
    state,
    { moonVisible: 0.18, duration: lightDur, ease },
    lightStart,
  )

  const { message, cta, restart, shade, stars } = outroRefs ?? {}

  if (shade?.current) {
    finalMoonSequence.to(
      shade.current,
      { opacity: shadeMaxOpacity, duration: lightDur, ease },
      lightStart,
    )
  }

  if (stars?.current) {
    finalMoonSequence.to(
      stars.current,
      { opacity: 0.9, duration: starsDur, ease },
      starsStart,
    )
  }

  if (message?.current) {
    finalMoonSequence.to(
      message.current,
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: messageDur, ease: 'power2.out' },
      messageStart,
    )
  }

  if (cta?.current) {
    finalMoonSequence.to(
      cta.current,
      {
        opacity: 1,
        y: 0,
        duration: ctaDur,
        ease: 'power2.out',
        onStart: () => onCtaReveal?.(),
      },
      ctaStart,
    )
  }

  if (restart?.current) {
    finalMoonSequence.to(
      restart.current,
      {
        opacity: 1,
        y: 0,
        duration: restartDur,
        ease: 'power1.out',
        onStart: () => onRestartReveal?.(),
      },
      restartStart,
    )
  }

  return finalMoonSequence
}

export function resetFinaleVisuals({ state, outroRefs, journeyFooterRef, cardRefs, pathRefs }) {
  gsap.set(state, {
    stars: 0,
    darkness: 0,
    videoDim: 1,
    moonVisible: 1,
    markersEnabled: true,
    activeMarkerIndex: -1,
    beaconOpacity: 0,
    beaconYOffset: 0.14,
    beaconScale: 0.55,
    dragEnabled: true,
    moonDrag: createMoonDragState(),
  })
  gsap.set(state.lighting, { ...FINALE_LIGHT_START })

  const { message, cta, restart, shade, stars } = outroRefs ?? {}

  if (message?.current) {
    gsap.set(message.current, { opacity: 0, y: 22, filter: 'blur(8px)' })
  }
  if (cta?.current) {
    gsap.set(cta.current, { opacity: 0, y: 16 })
  }
  if (restart?.current) {
    gsap.set(restart.current, { opacity: 0, y: 10 })
  }
  if (shade?.current) {
    gsap.set(shade.current, { opacity: 0 })
  }
  if (stars?.current) {
    gsap.set(stars.current, { opacity: 0 })
  }
  if (journeyFooterRef?.current) {
    gsap.set(journeyFooterRef.current, { opacity: 1, pointerEvents: 'auto' })
  }

  if (cardRefs && pathRefs) {
    hideAllMarkers(cardRefs, pathRefs)
  }
}

/** Restaura cámara, luna, timeline y scroll al estado inicial del viaje */
export function resetJourneyToStart({
  state,
  timelineRef,
  outroRefs,
  journeyFooterRef,
  cardRefs,
  pathRefs,
  onProgressChange,
  onChapterChange,
}) {
  if (!state) return

  gsap.set(state.camera, { ...INTRO_SHOT.camera })
  gsap.set(state.target, { ...INTRO_SHOT.target })
  gsap.set(state.moon, { ...INTRO_SHOT.moon })
  gsap.set(state, {
    fov: INTRO_SHOT.fov,
    scrollProgress: 0,
    visualApproachT: 0,
    cameraSettleZDelta: Infinity,
    cameraSettleYDelta: Infinity,
    moonSettleAngle: Infinity,
    moonHold: null,
  })
  clearUserMoonOrientation(state)
  endZoomHold(state)
  state.moonDrag = createMoonDragState()
  state.forceCameraSnap = true

  resetFinaleVisuals({ state, outroRefs, journeyFooterRef, cardRefs, pathRefs })

  const tl = timelineRef?.current
  if (tl) {
    const st = tl.scrollTrigger
    st?.enable()
    tl.progress(0)
    if (st) {
      st.scroll(st.start)
    }
  }

  state.scrollProgress = 0
  onProgressChange?.(0)
  onChapterChange?.(-1)
  ScrollTrigger.update()
}

/**
 * Timeline GSAP con dos capas:
 * 1) Cámara + luna (scrub continuo)
 * 2) Tarjetas (fade/blur en DOM, desacoplado)
 * finalMoonSequence — timeline independiente, se reproduce al terminar el scroll
 */
export function useCinematicTimeline({
  viewportRef,
  trackRef,
  cinematicStateRef,
  cardRefs,
  pathRefs,
  outroRefs,
  journeyFooterRef,
  onChapterChange,
  onProgressChange,
  freeScrollRef,
  onCtaReveal,
  onRestartReveal,
}) {
  const timelineRef = useRef(null)
  const finalSequenceRef = useRef(null)
  const onCtaRevealRef = useRef(onCtaReveal)
  const onRestartRevealRef = useRef(onRestartReveal)

  onCtaRevealRef.current = onCtaReveal
  onRestartRevealRef.current = onRestartReveal

  useEffect(() => {
    const track = trackRef.current
    const state = cinematicStateRef.current
    if (!track || !state) return undefined

    const isMobile = window.matchMedia('(max-width: 768px)').matches
    state.isMobile = isMobile

    hideAllMarkers(cardRefs, pathRefs)

    resetFinaleVisuals({
      state,
      outroRefs,
      journeyFooterRef,
      cardRefs,
      pathRefs,
    })

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
        scrub: isMobile ? 2.5 : 3.4,
        invalidateOnRefresh: true,
        snap: {
          snapTo: (progress) => {
            if (freeScrollRef?.current) return progress

            let nearest = SCROLL_SNAP_POINTS[0]
            let minDist = Infinity

            for (const point of SCROLL_SNAP_POINTS) {
              const dist = Math.abs(point - progress)
              if (dist < minDist) {
                minDist = dist
                nearest = point
              }
            }

            return nearest
          },
          duration: isMobile ? 0.82 : 0.65,
          delay: isMobile ? 0.06 : 0.12,
          ease: 'power2.inOut',
        },
        onUpdate: (self) => {
          state.scrollProgress = self.progress
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
    tl.to(state.lighting, { ...FINALE_LIGHT_START, duration: introDur }, 0)
    tl.to(state, { stars: 0, darkness: 0, videoDim: 1, duration: introDur }, 0)

    let cursor = introDur + CINEMATIC_TIMING.introGap

    moonShots.forEach((shot, index) => {
      const pullback = getPullbackForShot(shot, isMobile)
      const approachDur = CINEMATIC_TIMING.approachDur
      const holdDur = CINEMATIC_TIMING.holdDur
      const pullDur = CINEMATIC_TIMING.pullDur
      const travelEase = 'sine.inOut'

      if (index > 0) {
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

      const { camera: shotCamera, fov: shotFov } = getShotCameraForDevice(shot, isMobile)

      tl.to(
        state.camera,
        {
          x: shotCamera.x,
          y: shotCamera.y,
          z: shotCamera.z,
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
          duration: approachDur,
          ease: travelEase,
        },
        cursor,
      )
      tl.to(
        state,
        { fov: shotFov, duration: approachDur, ease: travelEase },
        cursor,
      )

      cursor += approachDur + holdDur

      if (index < moonShots.length - 1) {
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

    const lastShot = moonShots[moonShots.length - 1]

    finalSequenceRef.current = buildFinalMoonSequence({
      state,
      lastShot,
      outroRefs,
      journeyFooterRef,
      onCtaReveal: () => onCtaRevealRef.current?.(),
      onRestartReveal: () => onRestartRevealRef.current?.(),
    })

    ScrollTrigger.refresh()

    return () => {
      finalSequenceRef.current?.kill()
      tl.scrollTrigger?.kill()
      tl.kill()
      timelineRef.current = null
      finalSequenceRef.current = null
    }
  }, [
    viewportRef,
    trackRef,
    cinematicStateRef,
    cardRefs,
    pathRefs,
    outroRefs,
    journeyFooterRef,
    onChapterChange,
    onProgressChange,
    freeScrollRef,
    onCtaReveal,
    onRestartReveal,
  ])

  return { timelineRef, finalSequenceRef }
}
