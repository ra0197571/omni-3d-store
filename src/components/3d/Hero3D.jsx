import { Canvas } from '@react-three/fiber';
import { OrbitControls, MeshDistortMaterial, Sphere } from '@react-three/drei';

export default function Hero3D({ color }) {
  return (
    <div className="h-[500px] w-full cursor-grab active:cursor-grabbing">
      <Canvas>
        <OrbitControls enableZoom={false} />
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} />
        <Sphere args={[1, 100, 200]} scale={2.4}>
          <MeshDistortMaterial
            color={color || "#3b82f6"} // Ab ye wahi color lega jo admin mein set hoga
            attach="material"
            distort={0.4}
            speed={2}
            roughness={0.2}
            metalness={0.8}
          />
        </Sphere>
      </Canvas>
    </div>
  );
}