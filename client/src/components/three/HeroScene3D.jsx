import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

function LuxuryCenterpiece() {
  const groupRef = useRef();
  const outerRingRef = useRef();
  const innerRingRef = useRef();

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // Phan hoi xoay muot theo chuyen dong chuot
    const targetRotY = state.pointer.x * 0.55 + state.clock.elapsedTime * 0.12;
    const targetRotX = -state.pointer.y * 0.25;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotY,
      0.06
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetRotX,
      0.06
    );

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z += delta * 0.18;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.x -= delta * 0.22;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      {/* Vong den chum vang dong kien truc */}
      <mesh ref={outerRingRef} rotation={[Math.PI / 2.6, 0.2, 0]}>
        <torusGeometry args={[2.35, 0.045, 24, 100]} />
        <meshStandardMaterial
          color="#D4AF37"
          metalness={0.92}
          roughness={0.18}
          emissive="#8A6914"
          emissiveIntensity={0.28}
        />
      </mesh>

      <mesh ref={innerRingRef} rotation={[Math.PI / 3.2, -0.45, 0.3]}>
        <torusGeometry args={[1.65, 0.032, 24, 96]} />
        <meshStandardMaterial
          color="#E8CC6C"
          metalness={0.9}
          roughness={0.2}
          emissive="#A68621"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Be da den sang trong + nen am trung tam */}
      <Float speed={1.6} rotationIntensity={0.18} floatIntensity={0.35}>
        <group position={[0, -0.15, 0]}>
          {/* Mat ban tron cam thach den */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[1.05, 1.12, 0.12, 48]} />
            <meshStandardMaterial color="#16161C" metalness={0.5} roughness={0.25} />
          </mesh>
          {/* Vien vang dong */}
          <mesh position={[0, 0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.06, 0.02, 16, 64]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Chan ban vang */}
          <mesh position={[0, -0.65, 0]}>
            <cylinderGeometry args={[0.1, 0.38, 1.2, 32]} />
            <meshStandardMaterial color="#B89225" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Den nen pha le trung tam */}
          <mesh position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.34, 24]} />
            <meshStandardMaterial
              color="#FFF4D6"
              emissive="#FFBE55"
              emissiveIntensity={1.6}
              roughness={0.15}
            />
          </mesh>
          {/* Hai ly ruou vang cach dieu */}
          {[-0.45, 0.45].map((x, idx) => (
            <group key={idx} position={[x, 0.08, 0.18]}>
              <mesh position={[0, 0.14, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.26, 12]} />
                <meshStandardMaterial color="#E8CC6C" metalness={0.9} roughness={0.15} />
              </mesh>
              <mesh position={[0, 0.32, 0]}>
                <cylinderGeometry args={[0.1, 0.055, 0.2, 20]} />
                <meshStandardMaterial
                  color="#6B1020"
                  metalness={0.3}
                  roughness={0.12}
                  transparent
                  opacity={0.88}
                />
              </mesh>
              <mesh position={[0, 0.01, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.015, 16]} />
                <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      </Float>

      {/* Hat anh sang vang am lo lung */}
      <Sparkles
        count={70}
        scale={[7, 5, 6]}
        size={2.4}
        speed={0.35}
        opacity={0.75}
        color="#E8CC6C"
      />
    </group>
  );
}

export default function HeroScene3D() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 1.1, 6.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#0B0B0E']} />
        <fog attach="fog" args={['#0B0B0E', 7, 15]} />

        <ambientLight intensity={0.45} color="#FFE7C2" />
        <pointLight position={[3, 4, 3]} intensity={2.4} color="#FFD27D" distance={14} />
        <pointLight position={[-3.5, 2, 2.5]} intensity={1.4} color="#D4AF37" distance={12} />
        <spotLight
          position={[0, 6, 2]}
          angle={0.5}
          penumbra={0.8}
          intensity={2.8}
          color="#FFF0D4"
        />

        <LuxuryCenterpiece />
      </Canvas>
    </div>
  );
}
