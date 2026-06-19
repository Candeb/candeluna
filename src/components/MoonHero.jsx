import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import './MoonHero.css'

const MOON_URL = '/models/moon.glb'
const CAMERA_SMOOTH = 0.055
const MOON_SMOOTH = 0.05

useGLTF.preload(MOON_URL)

function MoonModel() {
  const { scene } = useGLTF(MOON_URL)

  const moon = useMemo(() => {
    const clone = scene.clone(true)
    const box = new THREE.Box3().setFromObject(clone)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)

    clone.position.sub(center)
    clone.scale.setScalar(1.85 / maxDim)

    return clone
  }, [scene])

  return <primitive object={moon} />
}

function CinematicMoonScene({ cinematicStateRef }) {
  const moonRef = useRef()
  const lookAt = useMemo(() => new THREE.Vector3(), [])
  const { camera } = useThree()

  useFrame(() => {
    const state = cinematicStateRef?.current
    if (!state) return

    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      state.camera.x,
      CAMERA_SMOOTH,
    )
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      state.camera.y,
      CAMERA_SMOOTH,
    )
    camera.position.z = THREE.MathUtils.lerp(
      camera.position.z,
      state.camera.z,
      CAMERA_SMOOTH,
    )

    lookAt.set(state.target.x, state.target.y, state.target.z)
    camera.lookAt(lookAt)

    const nextFov = THREE.MathUtils.lerp(camera.fov, state.fov, CAMERA_SMOOTH)
    if (Math.abs(camera.fov - nextFov) > 0.001) {
      camera.fov = nextFov
      camera.updateProjectionMatrix()
    }

    if (moonRef.current) {
      moonRef.current.rotation.y = THREE.MathUtils.lerp(
        moonRef.current.rotation.y,
        state.moon.y,
        MOON_SMOOTH,
      )
      moonRef.current.rotation.x = THREE.MathUtils.lerp(
        moonRef.current.rotation.x,
        state.moon.x,
        MOON_SMOOTH,
      )
    }
  })

  return (
    <>
      <ambientLight intensity={0.42} />
      <directionalLight position={[4, 2, 5]} intensity={1.55} color="#fff8ee" />
      <directionalLight position={[-3, -1, -2]} intensity={0.22} color="#8eb4ff" />
      <pointLight position={[0, 0, 2]} intensity={0.3} color="#ffffff" />
      <group ref={moonRef}>
        <Suspense fallback={null}>
          <MoonModel />
        </Suspense>
      </group>
    </>
  )
}

export default function MoonHero({ visible = true, cinematicStateRef }) {
  const [dprMax, setDprMax] = useState(1.75)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const update = () => setDprMax(mq.matches ? 1.35 : 1.75)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return (
    <div className={`moon-hero ${visible ? 'is-visible' : ''}`}>
      <Canvas
        className="moon-hero__canvas"
        camera={{
          position: [0, 0.06, 5.68],
          fov: 35,
        }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, dprMax]}
      >
        <CinematicMoonScene cinematicStateRef={cinematicStateRef} />
      </Canvas>
    </div>
  )
}
