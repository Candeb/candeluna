import { services } from './services'

/** Estado inicial: cámara alejada, luna completa (z mayor = luna más pequeña) */
export const INTRO_SHOT = {
  camera: { x: 0, y: 0.06, z: 5.68 },
  target: { x: 0, y: 0, z: 0 },
  moon: { x: 0.04, y: 0 },
  fov: 35,
}

export function getPullbackForShot(shot, isMobile) {
  if (!isMobile) return shot.pullback
  return shot.pullbackMobile ?? shot.pullback
}

/** Cámara centrada; zoom cercano original. Rotación lunar por región. */
export const moonShots = services.map((service, index) => {
  const phase = index / Math.max(1, services.length - 1)

  return {
    id: service.slug,
    service,
    camera: {
      x: 0,
      y: 0.02 + phase * 0.08,
      z: 2.05 + (index % 2) * 0.14,
    },
    target: { x: 0, y: 0, z: 0 },
    moon: {
      x: 0.1 + (index % 2) * 0.07,
      y: -0.55 + phase * Math.PI * 1.35,
    },
    fov: 31 + (index % 2) * 2,
    pullback: {
      x: 0,
      y: 0.05,
      z: 3.45,
    },
    pullbackMobile: {
      x: 0,
      y: 0.05,
      z: 4.55,
    },
    cardSide: index % 2 === 0 ? 'right' : 'left',
  }
})

export const SCROLL_CHAPTER_VH = 125
export const SCROLL_HEIGHT_VH = (1 + services.length) * SCROLL_CHAPTER_VH
