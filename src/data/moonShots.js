import { services } from './services'
import { MOON_REGIONS } from './moonRegions'

/** Estado inicial: cámara alejada, luna completa (z mayor = luna más pequeña) */
export const INTRO_SHOT = {
  camera: { x: 0, y: 0.06, z: 6.08 },
  target: { x: 0, y: 0, z: 0 },
  moon: { x: 0.04, y: 0 },
  fov: 34,
}

export function getPullbackForShot(shot, isMobile) {
  if (!isMobile) return shot.pullback
  return shot.pullbackMobile ?? shot.pullback
}

/** Cámara centrada; cada región apunta a una zona distinta de la luna. */
export const moonShots = services.map((service, index) => {
  const profile = MOON_REGIONS[service.slug]
  const cardSide = profile.cardSide ?? (index % 2 === 0 ? 'right' : 'left')
  const cardPlacement = profile.cardPlacement ?? 'mid'

  return {
    id: service.slug,
    service,
    region: profile.region,
    regionLabel: profile.label,
    camera: { ...profile.camera },
    target: { x: 0, y: 0, z: 0 },
    moon: { ...profile.moon },
    contemplateRotate: profile.contemplateRotate,
    hotspot: profile.hotspot,
    anchor: profile.anchor,
    connector: profile.connector,
    fov: profile.fov,
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
    cardSide,
    cardPlacement,
  }
})

export const SCROLL_CHAPTER_VH = 220
export const SCROLL_HEIGHT_VH = (1 + services.length) * SCROLL_CHAPTER_VH
