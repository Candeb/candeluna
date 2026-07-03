import { gsap } from 'gsap'

import { getMarkerTiming, MARKER_TIMING } from '../data/markerState'



function pathLength(pathEl) {

  if (!pathEl?.getTotalLength) return 100

  return pathEl.getTotalLength()

}



export function getMarkerElements(chapterEl, pathRefs, index) {

  if (!chapterEl) {

    return { chapterEl: null, pathEl: null, connectorEl: null, revealEl: null, linkEl: null }

  }

  return {

    chapterEl,

    pathEl: pathRefs.current?.[index] ?? null,

    connectorEl: chapterEl.querySelector('.region-connector'),

    revealEl: chapterEl.querySelector('.region-card-reveal'),

    linkEl: chapterEl.querySelector('.region-card'),

  }

}



export function resetMarkerDom({ chapterEl, pathEl, connectorEl, revealEl, linkEl }) {

  if (chapterEl) {

    gsap.set(chapterEl, { opacity: 0, visibility: 'hidden', pointerEvents: 'none' })

    if (connectorEl) {

      gsap.set(connectorEl, { opacity: 0, clipPath: 'inset(0 0 0 0)' })

    }

  }

  if (revealEl) {

    gsap.set(revealEl, {

      opacity: 0,

      y: 20,

      pointerEvents: 'none',

      clearProps: 'pointerEvents',

    })

  }

  if (linkEl) {

    gsap.set(linkEl, { pointerEvents: 'none', clearProps: 'pointerEvents' })

  }

  if (pathEl) {

    const len = pathLength(pathEl)

    gsap.set(pathEl, {

      strokeDasharray: len,

      strokeDashoffset: len,

      opacity: 0,

    })

  }

}



export function hideAllMarkers(cardRefs, pathRefs) {

  cardRefs.current?.forEach((chapterEl, index) => {

    resetMarkerDom(getMarkerElements(chapterEl, pathRefs, index))

  })

}



export function setBeaconTarget(cinematicStateRef, index) {

  const state = cinematicStateRef?.current

  if (!state) return

  state.activeMarkerIndex = index

  state.beaconOpacity = 0

  state.beaconYOffset = 0.14

  state.beaconScale = 0.55

}



export function animateBeaconIn(cinematicStateRef) {

  const state = cinematicStateRef?.current

  if (!state) return gsap.timeline()

  const timing = getMarkerTiming(state.isMobile)

  state.beaconYOffset = 0.14

  state.beaconScale = 0.55

  state.beaconOpacity = 0



  return gsap.to(state, {

    beaconOpacity: 1,

    beaconYOffset: 0,

    beaconScale: 1,

    duration: timing.beaconEmerge,

    ease: 'power3.out',

  })

}



export function animateBeaconOut(cinematicStateRef, { fast = false } = {}) {

  const state = cinematicStateRef?.current

  if (!state) return gsap.timeline()

  const duration = fast ? MARKER_TIMING.fastBeaconSink : MARKER_TIMING.beaconSink

  return gsap.to(state, {

    beaconOpacity: 0,

    beaconYOffset: 0.16,

    beaconScale: 0.62,

    duration,

    ease: fast ? 'power2.in' : 'power2.in',

    onComplete: () => {

      state.activeMarkerIndex = -1

      state.beaconYOffset = 0.14

      state.beaconScale = 0.55

    },

  })

}



export function animateLineDraw({ chapterEl, pathEl, connectorEl, cinematicStateRef }) {
  const timing = getMarkerTiming(cinematicStateRef?.current?.isMobile)
  const tl = gsap.timeline()



  if (chapterEl) {

    gsap.set(chapterEl, { opacity: 1, visibility: 'visible', pointerEvents: 'none' })

    if (connectorEl) {

      gsap.set(connectorEl, { opacity: 1, clipPath: 'inset(0 0 0 0)' })

    }

  }



  if (!pathEl) return tl



  const len = pathLength(pathEl)

  gsap.set(pathEl, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 })



  tl.to(pathEl, {

    strokeDashoffset: 0,

    duration: timing.lineDraw,

    ease: 'power1.inOut',

  })



  return tl

}



export function animateCardIn({ revealEl, linkEl, onReady, cinematicStateRef }) {
  const timing = getMarkerTiming(cinematicStateRef?.current?.isMobile)
  const tl = gsap.timeline({ onComplete: onReady })



  if (!revealEl) {

    onReady?.()

    return tl

  }



  gsap.set(revealEl, {

    opacity: 0,

    y: 20,

    pointerEvents: 'none',

  })

  if (linkEl) gsap.set(linkEl, { pointerEvents: 'none' })



  tl.to(revealEl, {

    opacity: 1,

    y: 0,

    duration: timing.cardReveal,

    ease: 'power2.out',

    onComplete: () => {

      gsap.set(revealEl, { pointerEvents: 'auto' })

      if (linkEl) gsap.set(linkEl, { pointerEvents: 'auto' })

    },

  })



  return tl

}



/** Salida: tarjeta → línea (arriba→abajo) → marcador se hunde */

export function animateMarkerExit({

  chapterEl,

  pathEl,

  connectorEl,

  revealEl,

  linkEl,

  cinematicStateRef,

  hadCard,

  fast = false,

  onComplete,

}) {

  const tl = gsap.timeline({ onComplete })

  const cardHide = fast ? MARKER_TIMING.fastCardHide : MARKER_TIMING.cardHide
  const lineHide = fast ? MARKER_TIMING.fastLineHide : MARKER_TIMING.lineHide
  const beaconSink = fast ? MARKER_TIMING.fastBeaconSink : MARKER_TIMING.beaconSink



  tl.call(() => {

    if (linkEl) gsap.set(linkEl, { pointerEvents: 'none' })

    if (revealEl) gsap.set(revealEl, { pointerEvents: 'none' })

  })



  if (hadCard && revealEl) {

    tl.to(

      revealEl,

      {

        opacity: 0,

        y: 10,

        duration: cardHide,

        ease: 'power1.inOut',

      },

      0,

    )

  }



  const lineAt = hadCard ? (fast ? cardHide * 0.35 : cardHide) : 0

  if (hadCard && connectorEl) {

    tl.fromTo(

      connectorEl,

      { clipPath: 'inset(0 0 0 0)' },

      {

        clipPath: 'inset(100% 0 0 0)',

        duration: lineHide,

        ease: 'power1.inOut',

      },

      lineAt,

    )

  } else if (hadCard && pathEl) {

    const len = pathLength(pathEl)

    tl.to(

      pathEl,

      {

        strokeDashoffset: len,

        opacity: 0,

        duration: lineHide,

        ease: 'power1.inOut',

      },

      lineAt,

    )

  }



  const beaconAt = lineAt + (hadCard ? (fast ? lineHide * 0.4 : lineHide) : 0)

  tl.add(animateBeaconOut(cinematicStateRef, { fast }), beaconAt)



  tl.set(chapterEl, { opacity: 0, visibility: 'hidden' }, beaconAt + beaconSink)



  return tl

}

