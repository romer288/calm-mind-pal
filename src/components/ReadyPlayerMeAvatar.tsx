
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
  onError: () => void;
}

const ReadyPlayerMeModel: React.FC<ReadyPlayerMeModelProps> = ({ url, isAnimating, emotion, onError }) => {
  const modelRef = useRef<THREE.Group>(null);
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
  const [morphTargets, setMorphTargets] = useState<any>(null);
  
  // Load the GLTF model with error handling
  try {
    const gltf = useLoader(GLTFLoader, url, (loader) => {
      loader.manager.onError = (errorUrl) => {
        console.error('Failed to load Ready Player Me model:', errorUrl);
        onError();
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
          onError();
        }
      }
    }, [gltf, onError]);

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
  } catch (error) {
    console.error('Error loading Ready Player Me model:', error);
    onError();
    return null;
  }
};

// Fallback component when avatar fails to load
const FallbackAvatar: React.FC<{ isAnimating: boolean; emotion: string }> = ({ isAnimating, emotion }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Breathing animation
      const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 0.4) * 0.02;
      groupRef.current.scale.set(breathingScale, breathingScale, breathingScale);

      // Gentle rotation when animating
      if (isAnimating) {
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });

  const getEmotionColor = () => {
    switch (emotion) {
      case 'empathetic': return '#A7C7E7';
      case 'concerned': return '#FFB6C1';
      case 'supportive': return '#98FB98';
      default: return '#FDBCB4';
    }
  };

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshLambertMaterial color={getEmotionColor()} />
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
      <mesh position={[0, -0.15, 0.7]} scale={isAnimating ? [1.2, 1.2, 1.2] : [1, 1, 1]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#CD5C5C" />
      </mesh>
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
  // Using publicly available Ready Player Me demo avatars
  const avatarUrls = {
    vanessa: 'https://d1a370nemizbjq.cloudfront.net/e1bbcba2-db61-47bb-b416-80fc0ba8b8e3.glb', // Female avatar
    monica: 'https://d1a370nemizbjq.cloudfront.net/a1c00c0b-efb7-402a-9f7e-d78a7b7ba0d8.glb'   // Female avatar (Spanish)
  };

  const [hasError, setHasError] = useState(false);

  const handleModelError = () => {
    console.log('Switching to fallback avatar due to loading error');
    setHasError(true);
  };

  return (
    <div className={`w-48 h-48 ${className} relative`}>
      <Canvas 
        camera={{ position: [0, 0, 2], fov: 50 }}
        gl={{ preserveDrawingBuffer: false }}
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
          fallback={<FallbackAvatar isAnimating={isAnimating} emotion={emotion} />}
        >
          {hasError ? (
            <FallbackAvatar isAnimating={isAnimating} emotion={emotion} />
          ) : (
            <ReadyPlayerMeModel
              url={avatarUrls[companion]}
              isAnimating={isAnimating}
              emotion={emotion}
              onError={handleModelError}
            />
          )}
        </React.Suspense>
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
      
      {hasError && (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-75 text-white text-xs p-1 text-center rounded-b-lg">
          Using fallback avatar
        </div>
      )}
    </div>
  );
};

export default ReadyPlayerMeAvatar;
