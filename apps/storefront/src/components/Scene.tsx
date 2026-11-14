'use client';
import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, useGLTF } from '@react-three/drei';
import type { Group } from 'three';
import type { Configuration } from '@nordhaus/domain';
import { base } from '../lib/client';
function Beam({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.68} />
    </mesh>
  );
}
function Louvres({ c, open }: { c: Configuration; open: boolean }) {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    ref.current?.children.forEach((child) => {
      child.rotation.x += ((open ? Math.PI / 3 : 0) - child.rotation.x) * Math.min(1, delta * 5);
    });
  });
  return (
    <group ref={ref}>
      {Array.from({ length: Math.round(c.depth / 0.23) }, (_, i) => (
        <Beam
          key={i}
          position={[0, c.height, c.depth / -2 + 0.13 + i * 0.23]}
          size={[c.width - 0.18, 0.04, 0.21]}
          color={c.ral}
        />
      ))}
    </group>
  );
}
function DetailModel() {
  const gltf = useGLTF(`${base}/models/planter.glb`);
  return <primitive object={gltf.scene.clone()} position={[2.8, 0, 1.6]} scale={0.7} />;
}
function Model({
  c,
  open,
  night,
  detail,
}: {
  c: Configuration;
  open: boolean;
  night: boolean;
  detail: boolean;
}) {
  return (
    <>
      <ambientLight intensity={night ? 0.24 : 1.5} />
      <directionalLight
        position={[5, 9, 4]}
        intensity={night ? 0.3 : 2.8}
        color={night ? '#8ba8ff' : '#fff8ec'}
      />
      <group>
        {[-1, 1].flatMap((x) =>
          [-1, 1].map((z) => (
            <Beam
              key={`${x}${z}`}
              position={[x * (c.width / 2 - 0.07), c.height / 2, z * (c.depth / 2 - 0.07)]}
              size={[0.14, c.height, 0.14]}
              color={c.ral}
            />
          )),
        )}
        {[-1, 1].map((z) => (
          <Beam
            key={`w${z}`}
            position={[0, c.height - 0.02, (z * c.depth) / 2]}
            size={[c.width + 0.14, 0.2, 0.14]}
            color={c.ral}
          />
        ))}
        {[-1, 1].map((x) => (
          <Beam
            key={`d${x}`}
            position={[(x * c.width) / 2, c.height - 0.02, 0]}
            size={[0.14, 0.2, c.depth]}
            color={c.ral}
          />
        ))}
        {c.roof === 'louvres' ? (
          <Louvres c={c} open={open} />
        ) : (
          <mesh position={[0, c.height + 0.06, 0]}>
            <boxGeometry args={[c.width, 0.04, c.depth]} />
            <meshStandardMaterial
              color={c.roof === 'glass' ? '#b7dbdf' : '#ede9da'}
              transparent
              opacity={c.roof === 'glass' ? 0.3 : 0.7}
              roughness={0.15}
            />
          </mesh>
        )}
        {c.blinds && (
          <mesh position={[0, c.height / 2, -c.depth / 2]}>
            <boxGeometry args={[c.width - 0.15, c.height - 0.2, 0.025]} />
            <meshStandardMaterial color={c.ral} transparent opacity={0.65} />
          </mesh>
        )}
        {c.led && (
          <>
            <mesh position={[0, c.height - 0.14, -c.depth / 2 + 0.1]}>
              <boxGeometry args={[c.width - 0.25, 0.025, 0.025]} />
              <meshStandardMaterial
                color="#ffdb9a"
                emissive="#ffb74f"
                emissiveIntensity={night ? 4 : 0.3}
              />
            </mesh>
            {night && (
              <pointLight
                position={[0, c.height - 0.3, 0]}
                intensity={14}
                color="#ffca7c"
                distance={8}
              />
            )}
          </>
        )}
        <Beam
          position={[0, -0.12, 0]}
          size={[c.width + 1.3, 0.18, c.depth + 1.3]}
          color="#c5b49a"
        />
        {Array.from({ length: 12 }, (_, i) => (
          <Beam
            key={`deck${i}`}
            position={[-(c.width + 1.2) / 2 + (i * (c.width + 1.2)) / 12, -0.022, 0]}
            size={[0.012, 0.004, c.depth + 1.2]}
            color="#ac987c"
          />
        ))}
        <Beam position={[0, 0.4, 0]} size={[1.65, 0.06, 0.85]} color="#b19b78" />
        {[-0.5, 0.5].map((x) => (
          <Beam key={x} position={[x, 0.19, 0]} size={[0.07, 0.4, 0.65]} color="#333b3a" />
        ))}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.23, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color={night ? '#303b3c' : '#e5e4d9'} roughness={1} />
        </mesh>
        {detail && (
          <Suspense fallback={null}>
            <DetailModel />
          </Suspense>
        )}
      </group>
      <ContactShadows
        position={[0, -0.22, 0]}
        opacity={0.35}
        scale={18}
        blur={2.5}
        far={8}
        resolution={128}
      />
    </>
  );
}
export default function Scene(props: {
  c: Configuration;
  open: boolean;
  night: boolean;
  detail: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'low-power' }}
      camera={{ position: [7, 5.4, 7], fov: 42 }}
      style={{ background: props.night ? '#243235' : '#e6e7df' }}
      aria-label="Interaktywny model pergoli 3D — obracaj przeciągając, przybliżaj gestem"
    >
      <Model {...props} />
      <OrbitControls
        target={[0, 1, 0]}
        minDistance={4}
        maxDistance={18}
        maxPolarAngle={Math.PI / 2 - 0.03}
        enablePan={false}
      />
    </Canvas>
  );
}
