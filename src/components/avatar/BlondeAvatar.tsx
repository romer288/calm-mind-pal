
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useLipSync } from '@/hooks/useLipSync';
import { VisemeTimeline } from '@/utils/viseme';

interface BlondeAvatarModelProps {
  timeline: VisemeTimeline | null;
  isPlaying: boolean;
  startTime: number;
}

function BlondeAvatarModel({ timeline, isPlaying, startTime }: BlondeAvatarModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [avatarMesh, setAvatarMesh] = useState<THREE.Mesh | null>(null);
  
  // Ready Player Me blonde avatar URL (verified working)
  const avatarUrl = 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934c6.glb?meshLod=0&textureAtlas=1024';
  
  let gltf;
  try {
    gltf = useGLTF(avatarUrl);
  } catch (error) {
    console.error('Failed to load blonde avatar:', error);
    return <FallbackBlondeModel />;
  }

  // Set up lip sync
  const { lipSyncState } = useLipSync({
    mesh: avatarMesh,
    timeline,
    isPlaying,
    startTime
  });

  // Enhanced idle animations with subtle "flirty" micro-gestures
  useFrame((state) => {
    if (groupRef.current) {
      // Breathing animation
      const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.015;
      groupRef.current.scale.set(breathingScale, breathingScale, breathingScale);
      
      // Subtle head movement with slight tilt
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.03;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.02; // Subtle head tilt
      
      // Gentle swaying motion
      groupRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.01;
    }
  });

  useEffect(() => {
    if (gltf && gltf.scene) {
      // Setup the model
      gltf.scene.position.set(0, -1.2, 0);
      gltf.scene.scale.set(1.6, 1.6, 1.6); // Slightly larger for presence
      
      // Find the head mesh for lip sync
      gltf.scene.traverse((child: any) => {
        if (child.isMesh && child.morphTargetDictionary) {
          console.log('Found morph targets for Vanessa:', Object.keys(child.morphTargetDictionary));
          setAvatarMesh(child);
          meshRef.current = child;
        }
        
        // Enhance materials for "sexy" look
        if (child.isMesh && child.material) {
          // Skin materials - make them more appealing
          if (child.material.name && child.material.name.toLowerCase().includes('skin')) {
            child.material.roughness = 0.5; // Realistic skin
            child.material.metalness = 0.1;
            child.material.clearcoat = 0.1; // Subtle glow
          }
          
          // Hair materials - blonde shimmer
          if (child.material.name && child.material.name.toLowerCase().includes('hair')) {
            child.material.roughness = 0.6;
            child.material.metalness = 0.3;
            // Add subtle blonde shimmer effect
            if (child.material.color) {
              child.material.color.setHex(0xF7E3B0); // Light blonde
            }
          }
          
          // Eye materials - make them more captivating
          if (child.material.name && child.material.name.toLowerCase().includes('eye')) {
            child.material.roughness = 0.1;
            child.material.metalness = 0.8;
          }
        }
      });
    }
  }, [gltf]);

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene} />
    </group>
  );
}

// Fallback model if Ready Player Me fails
function FallbackBlondeModel() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.02;
      meshRef.current.scale.set(breathingScale, breathingScale, breathingScale);
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group>
      {/* Enhanced geometric blonde avatar */}
      <mesh ref={meshRef} position={[0, -0.5, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshLambertMaterial color="#FFDBAC" />
      </mesh>
      
      {/* Blonde hair */}
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshLambertMaterial color="#F7E3B0" />
      </mesh>
      
      {/* Enhanced eyes */}
      <mesh position={[-0.3, 0.1, 0.6]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshLambertMaterial color="#4A90E2" />
      </mesh>
      <mesh position={[0.3, 0.1, 0.6]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshLambertMaterial color="#4A90E2" />
      </mesh>
      
      {/* Lips */}
      <mesh position={[0, -0.3, 0.6]}>
        <sphereGeometry args={[0.15, 16, 8]} />
        <meshLambertMaterial color="#FF6B9D" />
      </mesh>
    </group>
  );
}

interface BlondeAvatarProps {
  timeline: VisemeTimeline | null;
  isPlaying: boolean;
  startTime: number;
  className?: string;
}

export const BlondeAvatar: React.FC<BlondeAvatarProps> = ({
  timeline,
  isPlaying,
  startTime,
  className = ''
}) => {
  return (
    <div className={`${className} relative`}>
      <Canvas
        camera={{ position: [0, 1.6, 1.4], fov: 22 }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* Enhanced lighting for attractive rendering */}
        <ambientLight intensity={0.8} />
        <hemisphereLight intensity={0.6} />
        <directionalLight 
          position={[2, 2, 2]} 
          intensity={1.2} 
          castShadow
        />
        <pointLight 
          position={[-1, 1, 1]} 
          intensity={0.6} 
          color="#FFE4B5" // Warm light
        />
        <spotLight
          position={[0, 3, 2]}
          intensity={0.8}
          angle={0.3}
          penumbra={0.1}
          color="#FFF8DC" // Soft warm spotlight
        />
        
        <React.Suspense fallback={null}>
          <BlondeAvatarModel
            timeline={timeline}
            isPlaying={isPlaying}
            startTime={startTime}
          />
        </React.Suspense>
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
          autoRotate={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
      
      {/* Status indicator */}
      <div className="absolute top-2 right-2">
        <div className={`w-2 h-2 rounded-full ${
          isPlaying ? 'bg-pink-400 animate-pulse' : 'bg-gray-400'
        }`} />
      </div>
      
      {/* Vanessa branding */}
      <div className="absolute bottom-2 left-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
        Vanessa
      </div>
    </div>
  );
};

// Preload the Ready Player Me model
useGLTF.preload('https://models.readyplayer.me/64bfa15f0e72c63d7c3934c6.glb?meshLod=0&textureAtlas=1024');
