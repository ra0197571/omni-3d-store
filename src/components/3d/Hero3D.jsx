import { Canvas } from '@react-three/fiber';
import { OrbitControls, MeshDistortMaterial, Float, ContactShadows } from '@react-three/drei';

export default function Hero3D({ color }) {
  return (
    <div className="h-[500px] w-full cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        {/* Behtar Lighting taake cheez chamke */}
        <ambientLight intensity={1} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        
        {/* Floating Animation */}
        <Float speed={4} rotationIntensity={1} floatIntensity={2}>
          <mesh scale={1.4}>
            {/* Ye ek complex khubsurat shape hai jo professional lagta hai */}
            <torusKnotGeometry args={[1, 0.3, 128, 32]} />
            <MeshDistortMaterial
              color={color || "#a855f7"}
              speed={3}
              distort={0.4}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        </Float>

        {/* Neeche wali parchi (Shadow) */}
        <ContactShadows position={[0, -2.5, 0]} opacity={0.5} scale={10} blur={2.5} far={4.5} />
        
        <OrbitControls enableZoom={false} autoRotate />
      </Canvas>
    </div>
  );
}