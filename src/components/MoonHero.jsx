import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { createMoonDragState, finishZoomHoldEgress } from '../hooks/useCinematicTimeline'
import { INTRO_SHOT, moonShots, getPullbackForShot, getShotCameraForDevice } from '../data/moonShots'
import { getCurrentSectionFromProgress } from '../data/cinematicTimeline'
import AmbientSpaceEffects, { MoonLimbGlow } from './MoonAmbience.jsx'
import './MoonHero.css'

const MOON_URL = '/models/moon.glb'
const CAMERA_SMOOTH = 0.055
const CAMERA_SMOOTH_MOBILE = 0.095
const MOON_SMOOTH = 0.05
const MOON_DRAG_SMOOTH = 0.32
const DRAG_RAD_PER_PX = 0.0029
const MOON_MESH_SCALE = 1.72

const _euler = new THREE.Euler(0, 0, 0, 'YXZ')
const _baseQuat = new THREE.Quaternion()
const _targetQuat = new THREE.Quaternion()
const _stepQuat = new THREE.Quaternion()
const _axisY = new THREE.Vector3()
const _axisX = new THREE.Vector3()

useGLTF.preload(MOON_URL)

function MoonModel({ acceptPointer = true }) {
  const { scene } = useGLTF(MOON_URL)
  const rootRef = useRef()

  const { parts, scale, limbRadius } = useMemo(() => {
    const clone = scene.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const moonScale = MOON_MESH_SCALE / maxDim

    clone.position.sub(center)

    const meshParts = []
    let radius = MOON_MESH_SCALE * 0.5

    clone.traverse((child) => {
      if (!child.isMesh) return
      child.geometry.computeBoundingSphere()
      radius = child.geometry.boundingSphere.radius
      meshParts.push({
        geometry: child.geometry,
        material: child.material,
      })
    })

    return { parts: meshParts, scale: moonScale, limbRadius: radius }
  }, [scene])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const meshes = []
    root.traverse((child) => {
      if (child.isMesh) meshes.push(child)
    })

    if (acceptPointer) {
      meshes.forEach((mesh) => {
        delete mesh.raycast
      })
      return undefined
    }

    const skipRaycast = () => {}
    meshes.forEach((mesh) => {
      mesh.raycast = skipRaycast
    })

    return () => {
      meshes.forEach((mesh) => {
        delete mesh.raycast
      })
    }
  }, [parts, acceptPointer])

  return (
    <group ref={rootRef} scale={scale}>
      {parts.map((part, index) => (
        <mesh key={index} geometry={part.geometry} material={part.material} />
      ))}
      <MoonLimbGlow radius={limbRadius} />
    </group>
  )
}

const LIGHT_SMOOTH = 0.06

function MoonDragTarget({ cinematicStateRef, dragEnabled }) {
  const dragging = useRef(false)
  const lastX = useRef(0)
  const lastY = useRef(0)
  const listenersRef = useRef(null)
  const { camera } = useThree()

  const canDrag = () => {
    const state = cinematicStateRef.current
    return dragEnabled && state?.dragEnabled
  }

  const applyDragDelta = (dx, dy) => {
    const state = cinematicStateRef.current
    if (!state) return
    const drag = state.moonDrag
    if (!drag.quaternion) drag.quaternion = new THREE.Quaternion()

    // Rotación en espacio de pantalla (acumula en mundo, no en local)
    _axisY.set(0, 1, 0)
    _axisX.set(1, 0, 0).applyQuaternion(camera.quaternion).normalize()

    _stepQuat.setFromAxisAngle(_axisY, dx * DRAG_RAD_PER_PX)
    drag.quaternion.premultiply(_stepQuat)

    _stepQuat.setFromAxisAngle(_axisX, dy * DRAG_RAD_PER_PX)
    drag.quaternion.premultiply(_stepQuat)

    drag.vx = 0
    drag.vy = 0
    drag.hasUserInput = true
  }

  const removeWindowListeners = () => {
    const listeners = listenersRef.current
    if (!listeners) return
    window.removeEventListener('pointermove', listeners.onMove)
    window.removeEventListener('pointerup', listeners.onUp)
    window.removeEventListener('pointercancel', listeners.onUp)
    listenersRef.current = null
  }

  const endDrag = () => {
    dragging.current = false
    const state = cinematicStateRef.current
    if (state?.moonDrag) state.moonDrag.active = false
    removeWindowListeners()
    document.body.style.cursor = canDrag() ? 'grab' : ''
  }

  useEffect(
    () => () => {
      endDrag()
      document.body.style.cursor = ''
    },
    [],
  )

  const onPointerDown = (event) => {
    if (!canDrag() || event.button !== 0) return
    event.stopPropagation()

    endDrag()
    dragging.current = true
    const state = cinematicStateRef.current
    if (state?.moonDrag) state.moonDrag.active = true
    lastX.current = event.clientX
    lastY.current = event.clientY
    document.body.style.cursor = 'grabbing'

    const onMove = (moveEvent) => {
      if (!dragging.current) return
      if (moveEvent.buttons !== 1) {
        endDrag()
        return
      }

      const dx = moveEvent.clientX - lastX.current
      const dy = moveEvent.clientY - lastY.current
      lastX.current = moveEvent.clientX
      lastY.current = moveEvent.clientY

      if (dx !== 0 || dy !== 0) applyDragDelta(dx, dy)
    }

    const onUp = () => endDrag()

    listenersRef.current = { onMove, onUp }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  if (!dragEnabled) return null

  return (
    <mesh
      onPointerDown={onPointerDown}
      onPointerOver={() => {
        if (canDrag() && !dragging.current) document.body.style.cursor = 'grab'
      }}
      onPointerOut={() => {
        if (!dragging.current) document.body.style.cursor = ''
      }}
    >
      <sphereGeometry args={[0.985, 48, 48]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

function CinematicLights({ cinematicStateRef, sunRef, fillRef, rimRef, ambientRef }) {
  useFrame(() => {
    const lighting = cinematicStateRef?.current?.lighting
    const introEmerging = Boolean(cinematicStateRef?.current?.introEmerging)
    if (!lighting) return

    const lightSmooth = introEmerging ? 1 : LIGHT_SMOOTH

    if (sunRef.current) {
      sunRef.current.position.x = THREE.MathUtils.lerp(
        sunRef.current.position.x,
        lighting.sunX,
        lightSmooth,
      )
      sunRef.current.position.y = THREE.MathUtils.lerp(
        sunRef.current.position.y,
        lighting.sunY,
        lightSmooth,
      )
      sunRef.current.position.z = THREE.MathUtils.lerp(
        sunRef.current.position.z,
        lighting.sunZ,
        lightSmooth,
      )
      sunRef.current.intensity = THREE.MathUtils.lerp(
        sunRef.current.intensity,
        lighting.sunIntensity,
        lightSmooth,
      )
    }

    if (fillRef.current) {
      fillRef.current.position.set(lighting.fillX, lighting.fillY, lighting.fillZ)
      fillRef.current.intensity = THREE.MathUtils.lerp(
        fillRef.current.intensity,
        lighting.fillIntensity,
        lightSmooth,
      )
    }

    if (rimRef.current) {
      rimRef.current.position.set(lighting.rimX, lighting.rimY, lighting.rimZ)
      rimRef.current.intensity = THREE.MathUtils.lerp(
        rimRef.current.intensity,
        lighting.rimIntensity,
        lightSmooth,
      )
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        lighting.ambient,
        lightSmooth,
      )
    }
  })

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.42} />
      <directionalLight
        ref={sunRef}
        position={[4, 2, 5]}
        intensity={1.55}
        color="#fff8ee"
      />
      <directionalLight
        ref={fillRef}
        position={[-3, -1, -2]}
        intensity={0.22}
        color="#8eb4ff"
      />
      <directionalLight ref={rimRef} position={[-1.2, 0.4, -3.5]} intensity={0.18} color="#c8d8ff" />
    </>
  )
}

function StarField({ cinematicStateRef }) {
  const starsRef = useRef()

  useFrame(() => {
    const opacity = cinematicStateRef?.current?.stars ?? 0
    const material = starsRef.current?.material
    if (!material) return

    material.opacity = opacity
    starsRef.current.visible = opacity > 0.02
  })

  return (
    <Stars
      ref={starsRef}
      radius={100}
      depth={70}
      count={5200}
      factor={2.2}
      saturation={0}
      fade
      speed={0.08}
    />
  )
}

function CinematicMoonScene({ cinematicStateRef, moonDragEnabled }) {
  const moonRef = useRef()
  const sunRef = useRef()
  const fillRef = useRef()
  const rimRef = useRef()
  const ambientRef = useRef()
  const lookAt = useMemo(() => new THREE.Vector3(), [])
  const { camera } = useThree()

  useFrame(() => {
    const state = cinematicStateRef?.current
    if (!state) return

    const isMobile = Boolean(state.isMobile)
    const cameraSmooth = isMobile ? CAMERA_SMOOTH_MOBILE : CAMERA_SMOOTH
    const snapNow = Boolean(state.forceCameraSnap)
    const introEmerging = Boolean(state.introEmerging)
    const egress = state.zoomHoldEgress
    const frozen =
      (state.approachFrozen || state.zoomHoldActive) && !egress
    const zoomHold = state.zoomHoldActive ? state.zoomHold : null

    if (egress && zoomHold) {
      const elapsed = performance.now() - egress.startTime
      const t = Math.min(1, elapsed / (egress.duration * 1000))
      const ease = t * t * (3 - 2 * t)
      camera.position.set(
        THREE.MathUtils.lerp(egress.fromCamera.x, state.camera.x, ease),
        THREE.MathUtils.lerp(egress.fromCamera.y, state.camera.y, ease),
        THREE.MathUtils.lerp(egress.fromCamera.z, state.camera.z, ease),
      )
      camera.fov = THREE.MathUtils.lerp(egress.fromFov, state.fov, ease)
      camera.updateProjectionMatrix()
      state.forceCameraSnap = false
      if (t >= 1) {
        finishZoomHoldEgress(state)
      }
    } else if (zoomHold) {
      camera.position.set(zoomHold.camera.x, zoomHold.camera.y, zoomHold.camera.z)
      camera.fov = zoomHold.fov
      camera.updateProjectionMatrix()
      state.forceCameraSnap = false
    } else if (frozen) {
      // Pausa en pico — sin lerp hasta fijar zoomHold
    } else if (introEmerging || snapNow) {
      camera.position.set(state.camera.x, state.camera.y, state.camera.z)
      camera.fov = state.fov
      camera.updateProjectionMatrix()
      if (snapNow && !introEmerging) state.forceCameraSnap = false
    } else {
      camera.position.x = THREE.MathUtils.lerp(
        camera.position.x,
        state.camera.x,
        cameraSmooth,
      )
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        state.camera.y,
        cameraSmooth,
      )
      camera.position.z = THREE.MathUtils.lerp(
        camera.position.z,
        state.camera.z,
        cameraSmooth,
      )

      const nextFov = THREE.MathUtils.lerp(camera.fov, state.fov, cameraSmooth)
      if (Math.abs(camera.fov - nextFov) > 0.001) {
        camera.fov = nextFov
        camera.updateProjectionMatrix()
      }
    }

    const lookTarget = zoomHold?.target ?? state.target
    lookAt.set(lookTarget.x, lookTarget.y, lookTarget.z)
    camera.lookAt(lookAt)

    const journeySection = getCurrentSectionFromProgress(state.scrollProgress ?? 0)
    if (state.zoomHoldEgress) {
      state.visualApproachT = THREE.MathUtils.lerp(
        1,
        state.visualApproachT ?? 1,
        0.08,
      )
    } else if (state.zoomHoldActive) {
      state.visualApproachT = 1
      state.cameraSettleZDelta = 0
      state.cameraSettleYDelta = 0
    } else if (journeySection >= 0 && moonShots[journeySection]) {
      const shot = moonShots[journeySection]
      const startZ =
        journeySection === 0
          ? INTRO_SHOT.camera.z
          : getPullbackForShot(shot, isMobile).z
      const endZ = getShotCameraForDevice(shot, isMobile).camera.z
      const span = startZ - endZ
      state.visualApproachT =
        span > 0.01
          ? THREE.MathUtils.clamp((startZ - camera.position.z) / span, 0, 1)
          : 1
      state.cameraSettleZDelta = Math.abs(camera.position.z - state.camera.z)
      state.cameraSettleYDelta = Math.abs(camera.position.y - state.camera.y)
    } else {
      state.visualApproachT = 0
      state.cameraSettleZDelta = Infinity
      state.cameraSettleYDelta = Infinity
    }

    if (moonRef.current) {
      const drag = state.moonDrag ?? createMoonDragState()

      if (state.moonUserLocked && state.moonUserQuat) {
        _targetQuat.copy(state.moonUserQuat)
      } else if (state.moonHold) {
        state.moon.x = state.moonHold.x
        state.moon.y = state.moonHold.y
        _euler.set(state.moonHold.x, state.moonHold.y, 0)
        _baseQuat.setFromEuler(_euler)
        _targetQuat.copy(_baseQuat)
      } else {
        _euler.set(state.moon.x, state.moon.y, 0)
        _baseQuat.setFromEuler(_euler)
        _targetQuat.copy(_baseQuat)
        if (drag.quaternion && moonDragEnabled) {
          _targetQuat.premultiply(drag.quaternion)
        }
      }

      const smooth =
        moonDragEnabled && state.dragEnabled
          ? MOON_DRAG_SMOOTH
          : state.moonUserLocked
            ? 1
            : MOON_SMOOTH

      if (snapNow) {
        moonRef.current.quaternion.copy(_targetQuat)
      } else if (!frozen) {
        moonRef.current.quaternion.slerp(_targetQuat, smooth)
      }

      if (state.moonUserLocked && journeySection === 0 && !state.moonHold) {
        // Primera sección con orientación del usuario
        state.moonSettleAngle = 0
      } else if (journeySection >= 0 && moonShots[journeySection] && !state.moonHold) {
        const targetMoon = moonShots[journeySection].moon
        _euler.set(targetMoon.x, targetMoon.y, 0)
        _stepQuat.setFromEuler(_euler)
        state.moonSettleAngle = moonRef.current.quaternion.angleTo(_stepQuat)
      } else if (state.moonHold) {
        state.moonSettleAngle = moonRef.current.quaternion.angleTo(_targetQuat)
      }
    }
  })

  return (
    <>
      <CinematicLights
        cinematicStateRef={cinematicStateRef}
        sunRef={sunRef}
        fillRef={fillRef}
        rimRef={rimRef}
        ambientRef={ambientRef}
      />
      <StarField cinematicStateRef={cinematicStateRef} />
      <AmbientSpaceEffects />
      <group ref={moonRef}>
        <Suspense fallback={null}>
          <MoonModel acceptPointer={false} />
        </Suspense>
        <MoonDragTarget cinematicStateRef={cinematicStateRef} dragEnabled={moonDragEnabled} />
      </group>
    </>
  )
}

export default function MoonHero({
  visible = true,
  introDormant = false,
  cinematicStateRef,
  moonDragEnabled = false,
}) {
  const [dprMax, setDprMax] = useState(1.75)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const update = () => setDprMax(mq.matches ? 1.35 : 1.75)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return (
    <div
      className={`moon-hero ${visible ? 'is-visible' : ''} ${introDormant ? 'is-intro-dormant' : ''} ${moonDragEnabled ? 'is-draggable' : ''}`}
    >
      <div className="moon-hero__flare" aria-hidden="true" />
      <Canvas
        className="moon-hero__canvas"
        camera={{
          position: [0, 0.06, 6.08],
          fov: 34,
        }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, dprMax]}
      >
        <CinematicMoonScene
          cinematicStateRef={cinematicStateRef}
          moonDragEnabled={moonDragEnabled}
        />
      </Canvas>
    </div>
  )
}
