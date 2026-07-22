import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import {
  INTRO_BRAND,
  INTRO_ATMOSPHERE,
  INTRO_EASE,
  INTRO_LIGHT_CRATERS,
  INTRO_LIGHT_FULL,
  INTRO_LIGHT_RELIEF,
  INTRO_LIGHT_SILHOUETTE,
  INTRO_LUMINANCE_END,
  INTRO_MOON_CAMERA_FAR,
  INTRO_MOON_FOV_FAR,
  INTRO_SHADE_JOURNEY,
  INTRO_TIMING,
  INTRO_VIDEO_DIM_END,
} from '../data/introSequence'
import { INTRO_SHOT } from '../data/moonShots'

function waitForRefs(getRefs, maxAttempts = 50) {
  return new Promise((resolve) => {
    let attempts = 0
    const tick = () => {
      const refs = getRefs()
      const ready =
        refs.brandEl &&
        refs.charEls?.length > 0 &&
        refs.charEls.every(Boolean) &&
        refs.cinematicState &&
        refs.moonShellEl &&
        refs.energyEl &&
        refs.progressBarEl
      if (ready || attempts >= maxAttempts) {
        resolve(ready)
        return
      }
      attempts += 1
      requestAnimationFrame(tick)
    }
    tick()
  })
}

function applyLighting(state, values) {
  if (!state?.lighting) return
  Object.assign(state.lighting, values)
}

function setUniverseLuminance(value) {
  document.documentElement.style.setProperty('--intro-luminance', String(value))
}

function setIntroShade(value) {
  document.documentElement.style.setProperty('--intro-shade-opacity', String(value))
}

function applyIntroAtmosphere(state) {
  setUniverseLuminance(INTRO_ATMOSPHERE.luminance)
  setIntroShade(INTRO_ATMOSPHERE.shade)
  state.videoDim = INTRO_ATMOSPHERE.videoDim
  state.stars = INTRO_ATMOSPHERE.stars
  document.documentElement.style.setProperty(
    '--finale-video-dim',
    String(INTRO_ATMOSPHERE.videoDim),
  )
}

function lerpIntroAtmosphere(state, progress) {
  const p = Math.min(1, Math.max(0, progress))
  setUniverseLuminance(
    INTRO_ATMOSPHERE.luminance + (INTRO_LUMINANCE_END - INTRO_ATMOSPHERE.luminance) * p,
  )
  setIntroShade(INTRO_ATMOSPHERE.shade + (INTRO_SHADE_JOURNEY - INTRO_ATMOSPHERE.shade) * p)
  const dim = INTRO_ATMOSPHERE.videoDim + (INTRO_VIDEO_DIM_END - INTRO_ATMOSPHERE.videoDim) * p
  state.videoDim = dim
  document.documentElement.style.setProperty('--finale-video-dim', String(dim))
}

function lerpLighting(from, to, t) {
  const out = {}
  for (const key of Object.keys(from)) {
    out[key] = from[key] + (to[key] - from[key]) * t
  }
  return out
}

function radialOffset(maxRadius) {
  const angle = Math.random() * Math.PI * 2
  const dist = maxRadius * (0.45 + Math.random() * 0.9)
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
  }
}

/**
 * Intro cine: silencio → construcción marca → polvo → revelación lunar → experiencia.
 */
export function useCinematicIntro({
  active,
  refs,
  onPhase,
  onBarActivate,
  onComplete,
}) {
  const timelineRef = useRef(null)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!active) return undefined

    let cancelled = false
    let tl = null

    const run = async () => {
      const ready = await waitForRefs(() => refs)
      if (!ready || cancelled) return

      const {
        brandEl,
        charEls,
        particleCanvas,
        moonShellEl,
        energyEl,
        progressBarEl,
        cinematicState,
      } = refs

      const state = cinematicState
      const chars = charEls?.filter(Boolean) ?? []
      if (!brandEl || chars.length === 0 || !state || !moonShellEl || !energyEl || !progressBarEl) {
        return
      }

      completedRef.current = false
      const maxSpread = Math.max(window.innerWidth, window.innerHeight) * 0.95

      applyLighting(state, INTRO_LIGHT_SILHOUETTE)
      state.moonVisible = 0
      state.introEmerging = false
      Object.assign(state.camera, INTRO_MOON_CAMERA_FAR)
      Object.assign(state.target, INTRO_SHOT.target)
      Object.assign(state.moon, INTRO_SHOT.moon)
      state.fov = INTRO_MOON_FOV_FAR
      state.forceCameraSnap = true
      applyIntroAtmosphere(state)

      gsap.set(moonShellEl, {
        opacity: 0,
        visibility: 'hidden',
      })

      tl = gsap.timeline({
        paused: true,
        defaults: { ease: INTRO_EASE.soft },
        onComplete: () => {
          if (completedRef.current || cancelled) return
          completedRef.current = true
          setUniverseLuminance(INTRO_LUMINANCE_END)
          setIntroShade(INTRO_SHADE_JOURNEY)
          document.documentElement.style.setProperty(
            '--finale-video-dim',
            String(INTRO_VIDEO_DIM_END),
          )
          applyLighting(state, INTRO_LIGHT_FULL)
          state.moonVisible = 1
          state.introEmerging = false
          state.forceCameraSnap = false
          state.stars = 0
          Object.assign(state.camera, INTRO_SHOT.camera)
          state.fov = INTRO_SHOT.fov
          gsap.set(moonShellEl, { clearProps: 'opacity,visibility,transform' })
          onComplete?.()
        },
      })

      timelineRef.current = tl

      const t = INTRO_TIMING
      const silenceStart = 0
      const brandStart = silenceStart + t.silenceHold
      const disperseStart = brandStart + t.brandBuild + t.brandHold
      const moonEmergeStart = disperseStart + t.moonEmergeDelay
      const moonLightMid = moonEmergeStart + t.moonEmerge * 0.42
      const moonLightFull = moonEmergeStart + t.moonEmerge * 0.72
      const energyStart = moonEmergeStart + t.moonEmerge + t.moonReveal * 0.35
      const barStart = energyStart + t.energyAscend
      const heroStart = barStart + t.barActivate

      // —— FASE 0: universo dormido ——
      onPhase?.(0)
      gsap.set(brandEl, { opacity: 1 })
      gsap.set(chars, {
        opacity: 0,
        x: 28,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
      })
      chars.forEach((char, index) => {
        gsap.set(char, { x: 18 + index * 2.5 + Math.random() * 6 })
      })
      if (particleCanvas) gsap.set(particleCanvas, { opacity: 0 })
      gsap.set(energyEl, { opacity: 0, scale: 0.4, y: 0 })
      gsap.set(progressBarEl, { opacity: 0 })

      tl.to({}, { duration: t.silenceHold }, silenceStart)

      // —— FASE 1: construcción elegante del nombre ——
      tl.call(() => onPhase?.(1), null, brandStart)

      chars.forEach((char, index) => {
        tl.to(
          char,
          {
            opacity: 1,
            x: 0,
            duration: 0.72,
            ease: INTRO_EASE.build,
          },
          brandStart + index * 0.09,
        )
      })

      // —— FASE 2: desintegración → polvo espacial ——
      tl.call(() => onPhase?.(2), null, disperseStart)

      if (particleCanvas) {
        tl.to(particleCanvas, { opacity: 1, duration: 0.5, ease: INTRO_EASE.reveal }, disperseStart)
      }

      chars.forEach((char, index) => {
        const { x, y } = radialOffset(maxSpread * 0.9)
        tl.to(
          char,
          {
            x,
            y,
            opacity: 0,
            scale: 0.08 + Math.random() * 0.2,
            filter: 'blur(12px)',
            duration: t.brandDisperse * (0.85 + Math.random() * 0.55),
            ease: INTRO_EASE.disperse,
          },
          disperseStart + index * 0.036,
        )
      })

      tl.to(
        brandEl,
        { opacity: 0, duration: t.brandDisperse * 0.45 },
        disperseStart + t.brandDisperse * 0.42,
      )

      if (particleCanvas) {
        tl.to(
          particleCanvas,
          { opacity: 0, duration: t.brandDisperse * 0.9, ease: 'power1.out' },
          disperseStart + t.brandDisperse * 0.55,
        )
      }

      // —— FASE 3–4: la luna siempre estuvo; se revela por la luz ——
      tl.call(() => {
        state.introEmerging = true
        applyLighting(state, INTRO_LIGHT_SILHOUETTE)
        Object.assign(state.camera, INTRO_MOON_CAMERA_FAR)
        state.fov = INTRO_MOON_FOV_FAR
        state.forceCameraSnap = true
        state.moonVisible = 1
        gsap.set(moonShellEl, { visibility: 'visible', opacity: 0, clearProps: 'transform,scale' })
        onPhase?.(3)
      }, null, moonEmergeStart)

      tl.to(
        moonShellEl,
        { opacity: 1, duration: 1.4, ease: INTRO_EASE.light },
        moonEmergeStart,
      )

      tl.to(
        state.camera,
        {
          x: INTRO_SHOT.camera.x,
          y: INTRO_SHOT.camera.y,
          z: INTRO_SHOT.camera.z,
          duration: t.moonEmerge,
          ease: INTRO_EASE.emerge,
        },
        moonEmergeStart,
      )

      tl.to(
        state,
        {
          fov: INTRO_SHOT.fov,
          duration: t.moonEmerge,
          ease: INTRO_EASE.emerge,
        },
        moonEmergeStart,
      )

      tl.to(
        state,
        {
          stars: 0.42,
          duration: t.moonEmerge * 0.9,
          ease: INTRO_EASE.light,
        },
        moonEmergeStart,
      )

      // Relive → cráteres → luz plena (la luna no “aparece”: se descubre)
      tl.to(
        {},
        {
          duration: t.moonEmerge * 0.42,
          ease: INTRO_EASE.light,
          onUpdate() {
            applyLighting(
              state,
              lerpLighting(INTRO_LIGHT_SILHOUETTE, INTRO_LIGHT_RELIEF, this.progress()),
            )
          },
        },
        moonEmergeStart,
      )

      tl.call(() => onPhase?.(4), null, moonLightMid)

      tl.to(
        {},
        {
          duration: t.moonEmerge * 0.3,
          ease: INTRO_EASE.light,
          onUpdate() {
            applyLighting(
              state,
              lerpLighting(INTRO_LIGHT_RELIEF, INTRO_LIGHT_CRATERS, this.progress()),
            )
          },
        },
        moonLightMid,
      )

      tl.to(
        {},
        {
          duration: t.moonReveal,
          ease: INTRO_EASE.light,
          onUpdate() {
            applyLighting(
              state,
              lerpLighting(INTRO_LIGHT_CRATERS, INTRO_LIGHT_FULL, this.progress()),
            )
          },
        },
        moonLightFull,
      )

      // —— FASE 5: energía → barra (puente a la experiencia) ——
      tl.call(() => onPhase?.(5), null, energyStart)

      const moonTopY = -window.innerHeight * 0.08
      const bandTopY = -(window.innerHeight * 0.5 - 1)

      tl.to(energyEl, { opacity: 1, scale: 1, duration: 0.4, ease: INTRO_EASE.reveal }, energyStart)
      tl.to(
        energyEl,
        { y: moonTopY, duration: t.energyAscend * 0.35, ease: INTRO_EASE.ascend },
        energyStart + 0.08,
      )
      tl.to(
        energyEl,
        {
          y: bandTopY,
          scale: 0.55,
          duration: t.energyAscend * 0.65,
          ease: INTRO_EASE.ascend,
        },
        energyStart + t.energyAscend * 0.35,
      )
      tl.to(energyEl, { opacity: 0, scale: 0.2, duration: 0.28, ease: 'power2.in' }, barStart - 0.06)

      tl.call(() => onBarActivate?.(), null, barStart)
      tl.to(progressBarEl, { opacity: 1, duration: t.barActivate, ease: INTRO_EASE.reveal }, barStart)

      // —— FASE 6: el universo se despierta ——
      tl.call(() => onPhase?.(6), null, heroStart)
      tl.to(
        {},
        {
          duration: t.heroReveal,
          ease: INTRO_EASE.reveal,
          onUpdate() {
            lerpIntroAtmosphere(state, this.progress())
          },
        },
        heroStart,
      )

      tl.play()
    }

    run()

    return () => {
      cancelled = true
      tl?.kill()
      timelineRef.current = null
    }
  }, [active, refs, onPhase, onBarActivate, onComplete])

  return timelineRef
}

export function splitBrandChars(brand = INTRO_BRAND, suffix = '</>') {
  return [...brand.split(''), ...suffix.split('')]
}

export function initIntroState(state) {
  if (!state) return
  applyLighting(state, INTRO_LIGHT_SILHOUETTE)
  state.moonVisible = 0
  state.introEmerging = false
  Object.assign(state.camera, INTRO_MOON_CAMERA_FAR)
  Object.assign(state.target, INTRO_SHOT.target)
  Object.assign(state.moon, INTRO_SHOT.moon)
  state.fov = INTRO_MOON_FOV_FAR
  state.forceCameraSnap = true
  applyIntroAtmosphere(state)
}

/** Estado listo para el recorrido (sin volver a pasar la intro) */
export function applyPostIntroState(state) {
  if (!state) return
  applyLighting(state, INTRO_LIGHT_FULL)
  state.moonVisible = 1
  state.introEmerging = false
  state.stars = 0
  Object.assign(state.camera, INTRO_SHOT.camera)
  Object.assign(state.target, INTRO_SHOT.target)
  Object.assign(state.moon, INTRO_SHOT.moon)
  state.fov = INTRO_SHOT.fov
  state.forceCameraSnap = true
  state.videoDim = INTRO_VIDEO_DIM_END
  setUniverseLuminance(INTRO_LUMINANCE_END)
  setIntroShade(INTRO_SHADE_JOURNEY)
  document.documentElement.style.setProperty(
    '--finale-video-dim',
    String(INTRO_VIDEO_DIM_END),
  )
}
