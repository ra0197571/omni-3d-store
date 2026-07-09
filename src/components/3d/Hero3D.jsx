import { Canvas } from '@react-three/fiber';
import { OrbitControls, Float, MeshDistortMaterial, useGLTF, Stage } from '@react-three/drei';
import { Suspense } from 'react';

// Ye function ek generic 3D Bag load karega
function ShoppingBag() {
  // Maine ek public 3D Bag ka link dala hai, aap baad mein apni file bhi laga sakte hain
  const { scene } = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/shopping-bag/model.gltf');
  return <primitive object={scene} scale={2} />;
}

export default function Hero3D({ color }) {
  return (
    <div className="h-[500px] w-full cursor-grab active:cursor-grabbing">
      <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5}>
            <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
               <ShoppingBag />
            </Float>
          </Stage>
        </Suspense>
        <OrbitControls enableZoom={false} autoRotate />
      </Canvas>
    </div>
  );
}