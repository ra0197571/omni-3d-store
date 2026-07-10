import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, Center } from '@react-three/drei';

function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function Product3DViewer({ modelUrl }) {
  if (!modelUrl) return null;

  return (
    <div className="h-[400px] w-full bg-slate-50 rounded-[3rem] overflow-hidden border-4 border-white shadow-inner">
      <Canvas shadows camera={{ position: [0, 0, 150], fov: 40 }}>
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5} contactShadow={true} shadowBias={-0.001}>
            <Center>
               <Model url={modelUrl} />
            </Center>
          </Stage>
        </Suspense>
        <OrbitControls makeDefault autoRotate />
      </Canvas>
    </div>
  );
}