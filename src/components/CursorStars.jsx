import { useEffect, useRef } from 'react'
import './CursorStars.css'

const STAR_COUNT = 48

export default function CursorStars() {
  const canvasRef = useRef(null)
  const starsRef = useRef([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const frameRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let width = window.innerWidth
    let height = window.innerHeight

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }

    resize()
    window.addEventListener('resize', resize)

    const onMove = (event) => {
      mouseRef.current = { x: event.clientX, y: event.clientY }
    }

    window.addEventListener('pointermove', onMove)

    const tick = () => {
      ctx.clearRect(0, 0, width, height)

      if (Math.random() < 0.35) {
        starsRef.current.push({
          x: mouseRef.current.x + (Math.random() - 0.5) * 12,
          y: mouseRef.current.y + (Math.random() - 0.5) * 12,
          life: 1,
          size: Math.random() * 2 + 0.5,
        })
      }

      starsRef.current = starsRef.current
        .map((star) => ({
          ...star,
          life: star.life - 0.02,
          y: star.y - 0.4,
        }))
        .filter((star) => star.life > 0)
        .slice(-STAR_COUNT)

      starsRef.current.forEach((star) => {
        ctx.beginPath()
        ctx.fillStyle = `rgba(220, 235, 255, ${star.life * 0.85})`
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
      })

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frameRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="cursor-stars"
      aria-hidden="true"
    />
  )
}
