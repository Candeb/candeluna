import { services } from './services'

/** Constantes compartidas con useCinematicTimeline — una sola fuente de verdad */
export const CINEMATIC_TIMING = {
  introDur: 1.4,
  introGap: 0.15,
  approachDur: 1.05,
  holdDur: 0.62,
  pullDur: 0.65,
  pullOutFactor: 0.9,
  cardInOffset: 0.1,
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
  } = CINEMATIC_TIMING

  let cursor = introDur + introGap
  const cardRevealAt = []

  for (let index = 0; index < services.length; index += 1) {
    if (index > 0) cursor += pullDur

    cardRevealAt.push(cursor + approachDur + cardInOffset)

    cursor += approachDur + holdDur
    if (index < services.length - 1) {
      cursor += pullDur * pullOutFactor
    }
  }

  const totalDuration = cursor
  const cardRevealProgress = cardRevealAt.map((t) => t / totalDuration)

  return {
    totalDuration,
    cardRevealAt,
    cardRevealProgress,
    introProgress: 0,
  }
}

const markers = buildTimelineMarkers()

export const CARD_REVEAL_PROGRESS = markers.cardRevealProgress
export const INTRO_WAYPOINT_PROGRESS = markers.introProgress
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

/** Progreso de scroll (0–1) alineado con la aparición de cada tarjeta */
export function getWaypointProgress(chapterIndex) {
  if (chapterIndex < 0) return INTRO_WAYPOINT_PROGRESS
  return CARD_REVEAL_PROGRESS[chapterIndex] ?? 1
}

export function getActiveChapterFromProgress(scrollProgress) {
  for (let i = CARD_REVEAL_PROGRESS.length - 1; i >= 0; i -= 1) {
    if (scrollProgress >= CARD_REVEAL_PROGRESS[i] - 0.008) return i
  }
  return -1
}
