import { services } from './services'

/** Constantes compartidas con useCinematicTimeline — una sola fuente de verdad */
export const CINEMATIC_TIMING = {
  introDur: 1.4,
  introGap: 0.15,
  approachDur: 1.05,
  holdDur: 1.72,
  postCardHold: 0.38,
  contemplateDur: 0.62,
  pullDur: 0.65,
  pullOutFactor: 0.9,
  cardInOffset: 0.1,
  /** Scroll: fin del approach (inicio del hold) antes de revelar marcador */
  markerEmergeFraction: 1,
  /** Cámara visual: fracción mínima del zoom completado (1 = pico de zoom) */
  markerVisualMinT: 0.997,
  /** Tolerancia máx. entre cámara visual y objetivo GSAP (unidades mundo) */
  markerCameraSettleMaxZ: 0.022,
  markerCameraSettleMaxY: 0.016,
  /** Rotación lunar máx. (rad) para revelar marcador */
  markerMoonSettleMaxAngle: 0.045,
}

/** Umbrales de revelación en móvil — esperar aterrizaje visual antes de marcador */
export const MOBILE_MARKER_REVEAL = {
  markerVisualMinT: 0.995,
  markerCameraSettleMaxZ: 0.03,
  markerCameraSettleMaxY: 0.018,
  markerMoonSettleMaxAngle: 0.05,
}

export function getMarkerRevealConfig(isMobile) {
  if (!isMobile) {
    return {
      markerVisualMinT: CINEMATIC_TIMING.markerVisualMinT,
      markerCameraSettleMaxZ: CINEMATIC_TIMING.markerCameraSettleMaxZ,
      markerCameraSettleMaxY: CINEMATIC_TIMING.markerCameraSettleMaxY,
      markerMoonSettleMaxAngle: CINEMATIC_TIMING.markerMoonSettleMaxAngle,
    }
  }
  return MOBILE_MARKER_REVEAL
}

function buildTimelineMarkers() {
  const {
    introDur,
    introGap,
    approachDur,
    holdDur,
    pullDur,
    pullOutFactor,
    cardInOffset,
    markerEmergeFraction,
  } = CINEMATIC_TIMING

  let cursor = introDur + introGap
  const cardRevealAt = []
  const markerPullbackAt = []
  const sectionApproachAt = []
  const markerEmergeAt = []

  for (let index = 0; index < services.length; index += 1) {
    if (index > 0) cursor += pullDur

    sectionApproachAt.push(cursor)
    markerEmergeAt.push(cursor + approachDur * markerEmergeFraction)
    cardRevealAt.push(cursor + approachDur + cardInOffset)

    cursor += approachDur + holdDur
    markerPullbackAt.push(cursor)

    if (index < services.length - 1) {
      cursor += pullDur * pullOutFactor
    }
  }

  const totalDuration = cursor
  const cardRevealProgress = cardRevealAt.map((t) => t / totalDuration)
  const markerPullbackProgress = markerPullbackAt.map((t) => t / totalDuration)
  const sectionApproachProgress = sectionApproachAt.map((t) => t / totalDuration)
  const markerEmergeProgress = markerEmergeAt.map((t) => t / totalDuration)

  return {
    totalDuration,
    cardRevealAt,
    cardRevealProgress,
    markerPullbackAt,
    markerPullbackProgress,
    sectionApproachAt,
    sectionApproachProgress,
    markerEmergeAt,
    markerEmergeProgress,
    introProgress: 0,
    journeyEndProgress: 1,
  }
}

const markers = buildTimelineMarkers()

export const CARD_REVEAL_PROGRESS = markers.cardRevealProgress
export const MARKER_PULLBACK_PROGRESS = markers.markerPullbackProgress
export const SECTION_APPROACH_PROGRESS = markers.sectionApproachProgress
export const MARKER_EMERGE_PROGRESS = markers.markerEmergeProgress
export const INTRO_WAYPOINT_PROGRESS = markers.introProgress
export const JOURNEY_END_PROGRESS = markers.journeyEndProgress
export const LAST_CARD_PROGRESS =
  CARD_REVEAL_PROGRESS[CARD_REVEAL_PROGRESS.length - 1] ?? 1
export const SCROLL_SNAP_POINTS = [
  INTRO_WAYPOINT_PROGRESS,
  ...MARKER_EMERGE_PROGRESS,
]
export const HEADER_FADE_END_PROGRESS =
  (CINEMATIC_TIMING.introDur + CINEMATIC_TIMING.introGap) / markers.totalDuration

/** Opacidad del título: desaparece al iniciar el zoom hacia la luna */
export function getHeaderOpacity(scrollProgress) {
  const fadeStart = 0.015
  if (scrollProgress <= fadeStart) return 1
  if (scrollProgress >= HEADER_FADE_END_PROGRESS) return 0
  const t =
    (scrollProgress - fadeStart) / (HEADER_FADE_END_PROGRESS - fadeStart)
  return 1 - Math.min(1, t)
}

/** Progreso de scroll (0–1) alineado con la aparición del marcador en cada sección */
export function getWaypointProgress(chapterIndex) {
  if (chapterIndex < 0) return INTRO_WAYPOINT_PROGRESS
  return MARKER_EMERGE_PROGRESS[chapterIndex] ?? JOURNEY_END_PROGRESS
}

const SECTION_WINDOW_EPS = 0.002
const MARKER_EMERGE_EPS = 0.002

/** Sección cuya ventana approach→pull contiene el scroll actual */
export function getCurrentSectionFromProgress(scrollProgress) {
  for (let i = SECTION_APPROACH_PROGRESS.length - 1; i >= 0; i -= 1) {
    const approach = SECTION_APPROACH_PROGRESS[i]
    const pull = MARKER_PULLBACK_PROGRESS[i]
    if (
      scrollProgress >= approach - SECTION_WINDOW_EPS &&
      scrollProgress < pull - SECTION_WINDOW_EPS
    ) {
      return i
    }
  }
  return -1
}

/** Índice de sección cuyo marcador debe activarse (zoom visual terminado) */
export function getMarkerTargetFromProgress(scrollProgress, cinematicState = null) {
  const section = getCurrentSectionFromProgress(scrollProgress)
  if (section < 0) return -1

  if (scrollProgress < MARKER_EMERGE_PROGRESS[section] - MARKER_EMERGE_EPS) return -1
  if (!cinematicState) return -1

  const {
    markerVisualMinT,
    markerCameraSettleMaxZ,
    markerCameraSettleMaxY,
    markerMoonSettleMaxAngle,
  } = getMarkerRevealConfig(Boolean(cinematicState.isMobile))

  const visualT = cinematicState.visualApproachT ?? 0
  if (visualT < markerVisualMinT) return -1

  const zLag = cinematicState.cameraSettleZDelta ?? Infinity
  const yLag = cinematicState.cameraSettleYDelta ?? Infinity
  if (zLag > markerCameraSettleMaxZ || yLag > markerCameraSettleMaxY) return -1

  if (!cinematicState.moonUserLocked || section > 0) {
    const moonAngle = cinematicState.moonSettleAngle ?? Infinity
    if (moonAngle > markerMoonSettleMaxAngle) return -1
  }

  return section
}

export function getActiveChapterFromProgress(scrollProgress) {
  return getCurrentSectionFromProgress(scrollProgress)
}

export function isAtJourneyEnd(scrollProgress) {
  return scrollProgress >= JOURNEY_END_PROGRESS - 0.012
}
