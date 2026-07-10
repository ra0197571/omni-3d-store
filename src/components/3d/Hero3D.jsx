import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, Center, ContactShadows, RoundedBox, Environment } from '@react-three/drei';

function ProfessionalBag({ color }) {
  const brandColor = color || "#a855f7";

  return (
    <group scale={1.1}>
      {/* --- Bag Main Body --- */}
      <RoundedBox args={[1.2, 1.6, 0.5]} radius={0.06} smoothness={4}>
        <meshPhysicalMaterial 
          color={brandColor}
          thickness={1}
          roughness={0.2} 
          metalness={0.3}
          clearcoat={1} 
        />
      </RoundedBox>

      {/* --- Bag Handles --- */}
      <mesh position={[0, 0.8, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.03, 16, 40, Math.PI]} />
        <meshStandardMaterial color="#222" roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.8, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.03, 16, 40, Math.PI]} />
        <meshStandardMaterial color="#222" roughness={0.1} />
      </mesh>

      {/* --- Logo Space --- */}
      <mesh position={[0, -0.2, 0.26]}>
        <planeGeometry args={[0.7, 0.3]} />
        <meshStandardMaterial color="white" opacity={0.6} transparent />
      </mesh>
    </group>
  );
}

export default function Hero3D({ color }) {
  return (
    <div className="h-[450px] w-full">
      <Canvas 
        shadows 
        // Camera ko [0,0,7] rakha taake fast rotation mein bag cut na ho
        camera={{ position: [0, 0, 7], fov: 30, near: 0.1, far: 1000 }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        
        <Environment preset="city" />

        <Suspense fallback={null}>
          {/* 'top' hata diya taake bag vertical center mein ghoome */}
          <Center>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
              <ProfessionalBag color={color} />
            </Float>
          </Center>
          
          <ContactShadows 
            position={[0, -1.5, 0]} 
            opacity={0.4} 
            scale={10} 
            blur={2.5} 
          />
        </Suspense>

        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate={true}         // Khud ghoomega
          autoRotateSpeed={5}       // Tora fast (1.5 slow tha, 5 fast hai)
          makeDefault 
          minPolarAngle={Math.PI / 2.5} 
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
}