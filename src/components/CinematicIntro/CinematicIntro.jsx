import { useCallback, useEffect, useMemo, useRef } from 'react'
import { INTRO_BRAND, INTRO_BRAND_SUFFIX } from '../../data/introSequence'
import { useCinematicIntro } from '../../hooks/useCinematicIntro'
import './CinematicIntro.css'

const PARTICLE_CAP = 420
const PARTICLE_SPAWN_BURST = 220

function createParticle(cx, cy, angle, speed, tier) {
  const size =
    tier === 'dust'
      ? 0.35 + Math.random() * 0.7
      : tier === 'ember'
        ? 0.9 + Math.random() * 1.4
        : 1.6 + Math.random() * 1.8

  return {
    x: cx + (Math.random() - 0.5) * 52,
    y: cy + (Math.random() - 0.5) * 22,
    px: null,
    py: null,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1.15 + Math.random() * 1.55,
    decay: 0.0045 + Math.random() * 0.0045,
    size,
    tier,
  }
}

function pickTier() {
  const r = Math.random()
  if (r < 0.62) return 'dust'
  if (r < 0.9) return 'ember'
  return 'spark'
}

export default function CinematicIntro({
  cinematicStateRef,
  progressBarRef,
  moonShellRef,
  onComplete,
  onPhaseChange,
  onBarActivate,
}) {
  const overlayRef = useRef(null)
  const brandRef = useRef(null)
  const vignetteRef = useRef(null)
  const energyRef = useRef(null)
  const charRefs = useRef([])
  const particleCanvasRef = useRef(null)
  const particlesRef = useRef([])

  const setCharRef = useCallback((index) => (node) => {
    charRefs.current[index] = node
  }, [])

  useEffect(() => {
    const canvas = particleCanvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let animating = false

    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawnBurst = () => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const span = Math.max(window.innerWidth, window.innerHeight)

      particlesRef.current = Array.from({ length: PARTICLE_SPAWN_BURST }, () => {
        const tier = pickTier()
        const angle = Math.random() * Math.PI * 2
        const base =
          tier === 'dust'
            ? 0.35 + Math.random() * span * 0.0011
            : tier === 'ember'
              ? 0.7 + Math.random() * span * 0.0016
              : 1.1 + Math.random() * span * 0.002
        return createParticle(cx, cy, angle, base, tier)
      })
    }

    const spawnParticle = () => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const tier = pickTier()
      const angle = Math.random() * Math.PI * 2
      const speed =
        tier === 'dust'
          ? 0.4 + Math.random() * 1.8
          : tier === 'ember'
            ? 0.7 + Math.random() * 2.6
            : 1.1 + Math.random() * 3.4
      particlesRef.current.push(createParticle(cx, cy, angle, speed, tier))
      if (particlesRef.current.length > PARTICLE_CAP) {
        particlesRef.current.splice(0, particlesRef.current.length - PARTICLE_CAP)
      }
    }

    resize()
    window.addEventListener('resize', resize)
    spawnBurst()

    let frameId = 0

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      if (animating) {
        if (Math.random() < 0.78) spawnParticle()
        if (Math.random() < 0.35) spawnParticle()

        particlesRef.current = particlesRef.current
          .map((p) => ({
            ...p,
            px: p.x,
            py: p.y,
            x: p.x + p.vx,
            y: p.y + p.vy - (p.tier === 'dust' ? 0.08 : 0.14),
            vx: p.vx * 0.9985,
            vy: p.vy * 0.9985 - 0.004,
            life: p.life - p.decay,
          }))
          .filter(
            (p) =>
              p.life > 0 &&
              p.x > -40 &&
              p.x < window.innerWidth + 40 &&
              p.y > -40 &&
              p.y < window.innerHeight + 40,
          )

        particlesRef.current.forEach((p) => {
          const alpha = Math.min(1, p.life * 0.72)

          if (p.px != null && p.py != null && p.tier !== 'dust') {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(210, 228, 255, ${alpha * 0.28})`
            ctx.lineWidth = Math.max(0.25, p.size * 0.32)
            ctx.moveTo(p.px, p.py)
            ctx.lineTo(p.x, p.y)
            ctx.stroke()
          }

          ctx.beginPath()
          if (p.tier === 'dust') {
            ctx.fillStyle = `rgba(200, 220, 245, ${alpha * 0.55})`
          } else if (p.tier === 'ember') {
            ctx.fillStyle = `rgba(220, 235, 255, ${alpha * 0.85})`
          } else {
            ctx.fillStyle = `rgba(235, 245, 255, ${alpha})`
          }
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        })
      }

      frameId = requestAnimationFrame(draw)
    }

    draw()

    const observer = new MutationObserver(() => {
      const opacity = parseFloat(canvas.style.opacity || '0')
      const wasAnimating = animating
      animating = opacity > 0.05
      if (animating && !wasAnimating) spawnBurst()
    })
    observer.observe(canvas, { attributes: true, attributeFilter: ['style'] })

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [])

  const introRefs = useMemo(
    () => ({
      get brandEl() {
        return brandRef.current
      },
      get charEls() {
        return charRefs.current
      },
      get particleCanvas() {
        return particleCanvasRef.current
      },
      get vignetteEl() {
        return vignetteRef.current
      },
      get energyEl() {
        return energyRef.current
      },
      get progressBarEl() {
        return progressBarRef?.current
      },
      get cinematicState() {
        return cinematicStateRef?.current
      },
      get moonShellEl() {
        return moonShellRef?.current
      },
    }),
    [cinematicStateRef, progressBarRef, moonShellRef],
  )

  useCinematicIntro({
    active: true,
    refs: introRefs,
    onPhase: onPhaseChange,
    onBarActivate,
    onComplete,
  })

  return (
    <div ref={overlayRef} className="cinematic-intro" aria-hidden="true">
      <div ref={vignetteRef} className="cinematic-intro__vignette" />
      <canvas ref={particleCanvasRef} className="cinematic-intro__particles" />

      <div ref={brandRef} className="cinematic-intro__brand">
        <span className="cinematic-intro__brand-word" aria-hidden="true">
          {INTRO_BRAND.split('').map((char, index) => (
            <span
              key={`b-${char}-${index}`}
              ref={setCharRef(index)}
              className="cinematic-intro__char"
            >
              {char}
            </span>
          ))}
        </span>
        <span className="cinematic-intro__brand-suffix" aria-hidden="true">
          {INTRO_BRAND_SUFFIX.split('').map((char, index) => (
            <span
              key={`s-${char}-${index}`}
              ref={setCharRef(INTRO_BRAND.length + index)}
              className="cinematic-intro__char cinematic-intro__char--suffix"
            >
              {char}
            </span>
          ))}
        </span>
      </div>

      <div ref={energyRef} className="cinematic-intro__energy" aria-hidden="true" />
    </div>
  )
}
