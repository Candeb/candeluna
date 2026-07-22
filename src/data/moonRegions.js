/**
 * Perfiles por servicio: rotación lunar, punto de anclaje y personalidad de región.
 * anchor: offset % desde el centro del viewport hacia el punto en la luna.
 * cardPlacement: posición vertical de la tarjeta (alta / media / baja / borde).
 */
export const MOON_REGIONS = {
  'landing-pages': {
    region: 'mares',
    moon: { x: 0.05, y: 0.38 },
    contemplateRotate: 0.22,
    hotspot: { lat: 0.52, lon: 0.42, radius: 0.9 },
    anchor: { x: 18, y: -22 },
    cardSide: 'right',
    cardPlacement: 'high',
    connector: 'diagonal',
    camera: { x: 0, y: 0.01, z: 2.08 },
    fov: 31,
  },
  automatizacion: {
    region: 'crater',
    moon: { x: 0.34, y: 1.68 },
    contemplateRotate: 0.26,
    hotspot: { lat: -0.28, lon: 1.65, radius: 0.94 },
    anchor: { x: -22, y: 14 },
    cardSide: 'left',
    cardPlacement: 'low',
    connector: 'diagonal',
    camera: { x: 0, y: 0.04, z: 2.12 },
    fov: 33,
  },
  'integracion-apis': {
    region: 'rugosa',
    moon: { x: 0.5, y: 2.88 },
    contemplateRotate: 0.24,
    hotspot: { lat: 0.62, lon: 3.28, radius: 0.88 },
    anchor: { x: 20, y: 18 },
    cardSide: 'right',
    cardPlacement: 'edge',
    connector: 'diagonal',
    camera: { x: 0, y: 0.06, z: 2.18 },
    fov: 31,
  },
  'desarrollo-a-medida': {
    region: 'meseta',
    moon: { x: 0.24, y: 4.05 },
    contemplateRotate: 0.28,
    hotspot: { lat: -0.55, lon: 4.22, radius: 0.91 },
    anchor: { x: -12, y: -20 },
    cardSide: 'left',
    cardPlacement: 'mid',
    connector: 'diagonal',
    camera: { x: 0, y: 0.05, z: 2.14 },
    fov: 33,
  },
  contacto: {
    region: 'terminador',
    moon: { x: 0.1, y: 5.15 },
    contemplateRotate: 0.2,
    hotspot: { lat: 0.08, lon: 5.55, radius: 0.89 },
    anchor: { x: 8, y: 24 },
    cardSide: 'right',
    cardPlacement: 'edge',
    connector: 'diagonal',
    camera: { x: 0, y: 0.07, z: 2.2 },
    fov: 32,
  },
}

export function hotspotToPosition({ lat, lon, radius }) {
  const cosLat = Math.cos(lat)
  return {
    x: radius * cosLat * Math.sin(lon),
    y: radius * Math.sin(lat),
    z: radius * cosLat * Math.cos(lon),
  }
}
