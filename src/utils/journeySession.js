/** Solo en esta carga de página: la intro no se vuelve a reproducir al remountar Home */
let introCompletedThisLoad = false

const PROGRESS_KEY = 'candev-journey-progress'

export function hasIntroCompleted() {
  return introCompletedThisLoad
}

export function markIntroComplete() {
  introCompletedThisLoad = true
}

export function saveJourneyProgress(progress) {
  try {
    const value = Math.min(1, Math.max(0, Number(progress) || 0))
    sessionStorage.setItem(PROGRESS_KEY, String(value))
  } catch {
    /* ignore */
  }
}

export function loadJourneyProgress() {
  try {
    const raw = sessionStorage.getItem(PROGRESS_KEY)
    if (raw == null) return null
    const value = Number(raw)
    if (!Number.isFinite(value)) return null
    return Math.min(1, Math.max(0, value))
  } catch {
    return null
  }
}
