/** Fases del marcador — una sola activa a la vez */
export const MARKER_PHASE = {
  HIDDEN: 'hidden',
  BEACON: 'beacon',
  LINE: 'line',
  CARD: 'card',
  EXITING: 'exiting',
}

export const MARKER_TIMING = {
  /** Pausa en pico de zoom antes de revelar marcador (desktop) */
  entryZoomHold: 0.26,
  peakSettleFrames: 4,
  beaconEmerge: 0.7,
  /** El marcador se sostiene solo antes de dibujar la línea */
  beaconToLinePause: 0.55,
  /** Tras la línea, un beat antes de la tarjeta */
  lineToCardPause: 0.38,
  beaconSink: 0.5,
  lineDraw: 0.62,
  cardReveal: 0.7,
  cardHide: 0.48,
  lineHide: 0.45,
  /** Luna sola entre secciones — vacío narrativo intencional (300–800 ms) */
  breathingPause: 0.55,
  sectionPause: 0.55,
  fastCardHide: 0.16,
  fastLineHide: 0.14,
  fastBeaconSink: 0.2,
}

/** Entrada más ágil en móvil, tras el aterrizaje del zoom */
export const MOBILE_MARKER_TIMING = {
  entryZoomHold: 0.22,
  peakSettleFrames: 7,
  beaconEmerge: 0.58,
  beaconToLinePause: 0.42,
  lineToCardPause: 0.28,
  lineDraw: 0.52,
  cardReveal: 0.58,
}

export function getMarkerTiming(isMobile) {
  if (!isMobile) return MARKER_TIMING
  return { ...MARKER_TIMING, ...MOBILE_MARKER_TIMING }
}

export function getPeakSettleFrames(isMobile) {
  return getMarkerTiming(isMobile).peakSettleFrames ?? 4
}
