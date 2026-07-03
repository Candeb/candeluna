/** Secuencia final contemplativa — sin giros bruscos */
export const FINAL_SEQUENCE_TIMING = {
  pauseDur: 0.35,
  dollyDur: 5.5,
  lightDur: 6.5,
  starsDur: 4,
  starsDelay: 2.5,
  shadeMaxOpacity: 0.78,
  messageDur: 1.2,
  ctaDelay: 0.5,
  ctaDur: 0.9,
  restartHold: 1.8,
  restartDur: 0.8,
}

/** Momento en que deben aparecer los CTAs del outro (segundos desde inicio del finale) */
export function getFinaleCtaRevealDelayMs() {
  const { pauseDur, dollyDur, ctaDelay } = FINAL_SEQUENCE_TIMING
  const messageStart = pauseDur + dollyDur + 0.5
  const ctaStart = messageStart + ctaDelay
  return ctaStart * 1000
}

/** Momento en que debe aparecer el botón de reinicio (después de los CTAs) */
export function getFinaleRestartRevealDelayMs() {
  const { pauseDur, dollyDur, ctaDelay, ctaDur, restartHold } = FINAL_SEQUENCE_TIMING
  const messageStart = pauseDur + dollyDur + 0.5
  const ctaStart = messageStart + ctaDelay
  const restartStart = ctaStart + ctaDur + restartHold
  return restartStart * 1000
}

export const FINALE_CAMERA = {
  x: 0,
  y: 0.05,
  z: 4.35,
  fov: 33,
}

export const FINALE_LIGHT_START = {
  sunX: 4,
  sunY: 2,
  sunZ: 5,
  sunIntensity: 1.55,
  fillX: -3,
  fillY: -1,
  fillZ: -2,
  fillIntensity: 0.22,
  ambient: 0.42,
  rimX: -1.2,
  rimY: 0.4,
  rimZ: -3.5,
  rimIntensity: 0.18,
}

export const FINALE_LIGHT_MID = {
  sunX: 1.2,
  sunY: 1,
  sunZ: 1.5,
  sunIntensity: 0.55,
  fillX: -1.2,
  fillY: 0.05,
  fillZ: -0.8,
  fillIntensity: 0.1,
  ambient: 0.18,
  rimX: 1.5,
  rimY: 0.4,
  rimZ: -2,
  rimIntensity: 0.42,
}

export const FINALE_LIGHT_END = {
  sunX: -5.2,
  sunY: 0.3,
  sunZ: -4.5,
  sunIntensity: 0.03,
  fillX: 1.8,
  fillY: 0.15,
  fillZ: 2.8,
  fillIntensity: 0.025,
  ambient: 0.04,
  rimX: 4,
  rimY: 0.5,
  rimZ: 5.2,
  rimIntensity: 0.88,
}

/** Máximo ~5° de rotación lunar en todo el final */
export const FINALE_MOON_DRIFT = 0.087
