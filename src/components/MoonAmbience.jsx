import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function MoonLimbGlow({ radius }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          innerOpacity: { value: 0.05 },
          outerOpacity: { value: 0.02 },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewDir = normalize(-mvPosition.xyz);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float innerOpacity;
          uniform float outerOpacity;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float fresnel = 1.0 - clamp(dot(vNormal, vViewDir), 0.0, 1.0);

            float inner = smoothstep(0.84, 0.995, fresnel);
            inner = inner * inner * innerOpacity;

            float outer = smoothstep(0.45, 0.9, fresnel);
            outer = outer * outer * outerOpacity;

            float alpha = min(1.0, inner + outer);
            if (alpha < 0.003) discard;
            gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.NormalBlending,
        side: THREE.FrontSide,
      }),
    [],
  )

  useFrame(({ clock }) => {
    const breathe = Math.sin(clock.elapsedTime * 0.55) * 0.006
    material.uniforms.innerOpacity.value = 0.08 + breathe
    material.uniforms.outerOpacity.value = 0.04 + breathe * 0.5
  })

  return (
    <mesh scale={radius * 1.008} renderOrder={1000} material={material}>
      <sphereGeometry args={[1, 64, 64]} />
    </mesh>
  )
}

function SpaceDust() {
  const pointsRef = useRef()
  const count = 120

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 14
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = clock.elapsedTime * 0.012
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.012}
        color="#d8e8ff"
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

export default function AmbientSpaceEffects() {
  return <SpaceDust />
}
