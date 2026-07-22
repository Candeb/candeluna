import { FINALE_LIGHT_START } from './finalMoonSequence'
import { INTRO_SHOT } from './moonShots'

/** Timings de la intro cinematográfica (segundos) */
export const INTRO_TIMING = {
  /** Universo dormido: solo estrellas tenues */
  silenceHold: 0.95,
  brandBuild: 1.35,
  brandHold: 0.85,
  brandDisperse: 2.4,
  /** Puente breve: polvo → luna */
  moonEmergeDelay: 0.55,
  moonEmerge: 4.2,
  moonReveal: 2.8,
  energyAscend: 1.25,
  barActivate: 0.55,
  heroReveal: 1.4,
}

export const INTRO_BRAND = 'candev'
export const INTRO_BRAND_SUFFIX = '</>'

/** Cámara lejana: la luna ya está ahí, solo lejos y en penumbra */
export const INTRO_MOON_CAMERA_FAR = {
  x: INTRO_SHOT.camera.x,
  y: INTRO_SHOT.camera.y,
  z: 72,
}
export const INTRO_MOON_FOV_FAR = 26

export const INTRO_EASE = {
  soft: 'power2.inOut',
  reveal: 'power2.out',
  build: 'power3.out',
  morph: 'power3.inOut',
  disperse: 'power1.out',
  ascend: 'power1.inOut',
  emerge: 'power1.inOut',
  light: 'sine.inOut',
}

/** Penumbra: solo un relieve casi invisible */
export const INTRO_LIGHT_SILHOUETTE = {
  sunX: 4,
  sunY: 2.2,
  sunZ: 5,
  sunIntensity: 0.04,
  fillX: -3,
  fillY: -1,
  fillZ: -2,
  fillIntensity: 0.01,
  ambient: 0.025,
  rimX: -1.2,
  rimY: 0.4,
  rimZ: -3.5,
  rimIntensity: 0.02,
}

/** Cráteres empiezan a sugerirse */
export const INTRO_LIGHT_RELIEF = {
  sunX: 4,
  sunY: 2,
  sunZ: 5,
  sunIntensity: 0.28,
  fillX: -3,
  fillY: -1,
  fillZ: -2,
  fillIntensity: 0.06,
  ambient: 0.1,
  rimX: -1.2,
  rimY: 0.4,
  rimZ: -3.5,
  rimIntensity: 0.06,
}

/** Detalle lunar ya legible */
export const INTRO_LIGHT_CRATERS = {
  sunX: 4,
  sunY: 2,
  sunZ: 5,
  sunIntensity: 0.85,
  fillX: -3,
  fillY: -1,
  fillZ: -2,
  fillIntensity: 0.14,
  ambient: 0.26,
  rimX: -1.2,
  rimY: 0.4,
  rimZ: -3.5,
  rimIntensity: 0.12,
}

export const INTRO_LIGHT_DARK = INTRO_LIGHT_SILHOUETTE
export const INTRO_LIGHT_FULL = { ...FINALE_LIGHT_START }

/** Oscuridad del universo dormido / during intro */
export const INTRO_ATMOSPHERE = {
  luminance: 0.12,
  videoDim: 0.085,
  shade: 0.7,
  stars: 0.22,
}

export const INTRO_LUMINANCE_END = 1
export const INTRO_VIDEO_DIM_END = 1
export const INTRO_SHADE_JOURNEY = 0.7
