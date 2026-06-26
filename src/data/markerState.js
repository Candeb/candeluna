/** Fases del marcador — una sola activa a la vez */
export const MARKER_PHASE = {
  HIDDEN: 'hidden',
  BEACON: 'beacon',
  LINE: 'line',
  CARD: 'card',
  EXITING: 'exiting',
}

export const MARKER_TIMING = {
  beaconEmerge: 0.52,
  beaconToLinePause: 0.22,
  beaconSink: 0.5,
  lineDraw: 0.48,
  cardReveal: 0.58,
  cardHide: 0.48,
  lineHide: 0.45,
  /** Luna sola entre secciones — vacío narrativo intencional (300–800 ms) */
  breathingPause: 0.55,
  sectionPause: 0.55,
  fastCardHide: 0.16,
  fastLineHide: 0.14,
  fastBeaconSink: 0.2,
}
