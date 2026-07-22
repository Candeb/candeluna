/** Puente liviano: scroll de Presencia Digital → rotación de la luna */
let scrollHandler = null

export function setServiceMoonScrollHandler(handler) {
  scrollHandler = typeof handler === 'function' ? handler : null
}

export function reportServiceMoonScroll(progress) {
  scrollHandler?.(Math.min(1, Math.max(0, progress)))
}
