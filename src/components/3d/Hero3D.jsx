import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, MeshDistortMaterial, Float, Sphere } from '@react-three/drei';

export default function Hero3D({ color }) {
  return (
    <div className="h-[400px] w-full">
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={1} />
        <pointLight position={[10, 10, 10]} />
        <Float speed={3} rotationIntensity={1.5} floatIntensity={2}>
          <Sphere args={[1, 100, 200]} scale={2}>
            <MeshDistortMaterial
              color={color || "#3b82f6"}
              distort={0.4}
              speed={2}
              metalness={0.8}
              roughness={0.2}
            />
          </Sphere>
        </Float>
        <OrbitControls enableZoom={false} autoRotate />
      </Canvas>
    </div>
  );
}