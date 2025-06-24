
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { AICompanion } from '@/types/chat';

interface ReadyPlayerMeModelProps {
  url: string;
  isAnimating: boolean;
  emotion: 'neutral' | 'empathetic' | 'concerned' | 'supportive';
}

const ReadyPlayerMeModel: React.FC<ReadyPlayerMeModelProps> = ({ url, isAnimating, emotion }) => {
  const modelRef = useRef<THREE.Group>(null);
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
  const [morphTargets, setMorphTargets] = useState<any>(null);
  
  // Load the GLTF model with error handling
  const gltf = useLoader(GLTFLoader, url, (loader) => {
    loader.manager.onError = (url) => {
      console.error('Failed to load model:', url);
    };
  });

  useEffect(() => {
    if (gltf && modelRef.current) {
      try {
        // Set up animation mixer
        const animationMixer = new THREE.AnimationMixer(gltf.scene);
        setMixer(animationMixer);

        // Find morph targets for facial expressions
        gltf.scene.traverse((child: any) => {
          if (child.isMesh && child.morphTargetDictionary) {
            setMorphTargets(child);
          }
        });

        // Position and scale the model
        gltf.scene.position.set(0, -1, 0);
        gltf.scene.scale.set(1.2, 1.2, 1.2);
      } catch (error) {
        console.error('Error setting up model:', error);
      }
    }
  }, [gltf]);

  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }

    if (modelRef.current) {
      // Subtle breathing animation
      const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 0.4) * 0.002;
      modelRef.current.scale.set(breathingScale, breathingScale, breathingScale);

      // Head movement
      const headMovement = Math.sin(state.clock.elapsedTime * 0.3) * 0.01;
      modelRef.current.rotation.y = headMovement;
    }

    // Lip-sync animation using morph targets
    if (isAnimating && morphTargets) {
      const time = state.clock.elapsedTime;
      const speechIntensity = (Math.sin(time * 8) + Math.sin(time * 12)) * 0.5;
      
      // Animate mouth morph targets for speech
      if (morphTargets.morphTargetDictionary.mouthOpen !== undefined) {
        morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.mouthOpen] = 
          Math.max(0, speechIntensity * 0.6);
      }
      
      if (morphTargets.morphTargetDictionary.jawOpen !== undefined) {
        morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.jawOpen] = 
          Math.max(0, speechIntensity * 0.4);
      }
    }

    // Emotion-based expressions using morph targets
    if (morphTargets && morphTargets.morphTargetDictionary) {
      const emotionIntensity = 0.3;
      
      // Reset all emotion morph targets
      Object.keys(morphTargets.morphTargetDictionary).forEach((key, index) => {
        if (key.includes('smile') || key.includes('frown') || key.includes('brow')) {
          morphTargets.morphTargetInfluences[index] = 0;
        }
      });

      // Apply emotion-specific morph targets
      switch (emotion) {
        case 'empathetic':
          if (morphTargets.morphTargetDictionary.browDownLeft !== undefined) {
            morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.browDownLeft] = emotionIntensity * 0.3;
          }
          if (morphTargets.morphTargetDictionary.browDownRight !== undefined) {
            morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.browDownRight] = emotionIntensity * 0.3;
          }
          break;
        case 'concerned':
          if (morphTargets.morphTargetDictionary.browInnerUp !== undefined) {
            morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.browInnerUp] = emotionIntensity;
          }
          break;
        case 'supportive':
          if (morphTargets.morphTargetDictionary.mouthSmile !== undefined) {
            morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.mouthSmile] = emotionIntensity * 0.5;
          }
          break;
      }
    }
  });

  return (
    <group ref={modelRef}>
      <primitive object={gltf.scene} />
    </group>
  );
};

interface ReadyPlayerMeAvatarProps {
  companion: AICompanion;
  isAnimating: boolean;
  emotion?: 'neutral' | 'empathetic' | 'concerned' | 'supportive';
  className?: string;
}

const ReadyPlayerMeAvatar: React.FC<ReadyPlayerMeAvatarProps> = ({ 
  companion, 
  isAnimating, 
  emotion = 'neutral',
  className = ''
}) => {
  // Updated with valid Ready Player Me avatar URLs
  const avatarUrls = {
    vanessa: 'https://models.readyplayer.me/6549ba77ed1bbeef73b47ba5.glb', // Female avatar
    monica: 'https://models.readyplayer.me/654f3c6d77bb8ecdbe3b9f0a.glb'   // Female avatar (Spanish)
  };

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleModelLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleModelError = (error: any) => {
    console.error('Error loading Ready Player Me avatar:', error);
    setError('Failed to load avatar');
    setIsLoading(false);
  };

  // Fallback component when avatar fails to load
  const FallbackAvatar = () => (
    <group>
      {/* Simple geometric avatar as fallback */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshLambertMaterial color="#FDBCB4" />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.2, 0.1, 0.7]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0.2, 0.1, 0.7]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* Mouth */}
      <mesh position={[0, -0.15, 0.7]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#CD5C5C" />
      </mesh>
    </group>
  );

  return (
    <div className={`w-48 h-48 ${className} relative`}>
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <p className="text-sm text-red-500 text-center px-2">Using fallback avatar</p>
        </div>
      )}

      <Canvas 
        camera={{ position: [0, 0, 2], fov: 50 }}
        onCreated={() => {
          if (!error) handleModelLoad();
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[2, 2, 2]} 
          intensity={1} 
          castShadow
        />
        <pointLight 
          position={[-1, 1, 1]} 
          intensity={0.4} 
        />
        
        <React.Suspense 
          fallback={<FallbackAvatar />}
        >
          {error ? (
            <FallbackAvatar />
          ) : (
            <ReadyPlayerMeModel
              url={avatarUrls[companion]}
              isAnimating={isAnimating}
              emotion={emotion}
            />
          )}
        </React.Suspense>
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </div>
  );
};

export default ReadyPlayerMeAvatar;
