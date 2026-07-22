import { useEffect } from 'react'

/**
 * Scroll suave tipo Lenis sobre un contenedor overflow,
 * mientras el Lenis raíz del journey está pausado.
 */
export function useSmoothOverlayScroll(
  scrollerRef,
  { lerp = 0.075, enabled = true, onProgress } = {},
) {
  useEffect(() => {
    if (!enabled) return undefined

    const scroller = scrollerRef?.current
    if (!scroller) return undefined

    let target = scroller.scrollTop
    let current = scroller.scrollTop
    let rafId = 0
    let running = true

    const maxScroll = () => Math.max(0, scroller.scrollHeight - scroller.clientHeight)

    const clampTarget = (value) => Math.min(maxScroll(), Math.max(0, value))

    const emitProgress = (scrollTop) => {
      if (!onProgress) return
      const max = maxScroll()
      onProgress(max > 0 ? scrollTop / max : 0)
    }

    const tick = () => {
      if (!running) return
      const delta = target - current
      if (Math.abs(delta) < 0.15) {
        current = target
        scroller.scrollTop = current
      } else {
        current += delta * lerp
        scroller.scrollTop = current
      }
      emitProgress(current)
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    const onWheel = (event) => {
      if (event.ctrlKey) return
      event.preventDefault()
      event.stopPropagation()
      target = clampTarget(target + event.deltaY)
    }

    const onScroll = () => {
      if (Math.abs(scroller.scrollTop - current) > 2) {
        current = scroller.scrollTop
        target = scroller.scrollTop
        emitProgress(current)
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false, capture: true })
    scroller.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      running = false
      cancelAnimationFrame(rafId)
      window.removeEventListener('wheel', onWheel, { capture: true })
      scroller.removeEventListener('scroll', onScroll)
    }
  }, [scrollerRef, lerp, enabled, onProgress])
}
