
import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface VRoidModelProps {
  url: string;
  isAnimating: boolean;
  emotion: 'neutral' | 'empathetic' | 'concerned' | 'supportive';
  onError: () => void;
}

export const VRoidModel: React.FC<VRoidModelProps> = ({ url, isAnimating, emotion, onError }) => {
  const modelRef = useRef<THREE.Group>(null);
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
  const [morphTargets, setMorphTargets] = useState<any>(null);
  
  // Load the GLTF model with proper error handling for VRoid Hub models
  let gltf;
  try {
    gltf = useLoader(GLTFLoader, url, (loader) => {
      // Configure loader for VRoid models
      loader.manager.onLoad = () => {
        console.log('VRoid model loaded successfully from VRoid Hub CDN');
      };
      loader.manager.onError = (errorUrl) => {
        console.error('Failed to load VRoid model from VRoid Hub:', errorUrl);
        onError();
      };
    });
  } catch (error) {
    console.error('Error loading VRoid model:', error);
    onError();
    return null;
  }

  useEffect(() => {
    if (gltf && modelRef.current) {
      try {
        console.log('Setting up VRoid model from VRoid Hub');
        
        // Set up animation mixer for VRoid animations
        const animationMixer = new THREE.AnimationMixer(gltf.scene);
        setMixer(animationMixer);

        // Find morph targets for facial expressions (common in VRoid models)
        gltf.scene.traverse((child: any) => {
          if (child.isMesh && child.morphTargetDictionary) {
            console.log('Found VRoid morph targets:', Object.keys(child.morphTargetDictionary));
            setMorphTargets(child);
          }
        });

        // Position and scale the VRoid model appropriately
        gltf.scene.position.set(0, -1.2, 0);
        gltf.scene.scale.set(1.0, 1.0, 1.0);
        
        // Ensure proper materials for VRoid models
        gltf.scene.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
      } catch (error) {
        console.error('Error setting up VRoid model:', error);
        onError();
      }
    }
  }, [gltf, onError]);

  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }

    if (modelRef.current) {
      // Subtle breathing animation for VRoid models
      const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
      modelRef.current.scale.set(breathingScale, breathingScale, breathingScale);

      // Natural head movement
      const headMovement = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
      modelRef.current.rotation.y = headMovement;
    }

    // Enhanced lip-sync animation for VRoid models
    if (isAnimating && morphTargets) {
      const time = state.clock.elapsedTime;
      const speechIntensity = (Math.sin(time * 6) + Math.sin(time * 10)) * 0.3;
      
      // Animate mouth morph targets for speech (VRoid standard naming)
      const mouthTargets = ['A', 'I', 'U', 'E', 'O', 'mouth_open', 'jaw_open'];
      mouthTargets.forEach(target => {
        if (morphTargets.morphTargetDictionary[target] !== undefined) {
          const index = morphTargets.morphTargetDictionary[target];
          morphTargets.morphTargetInfluences[index] = Math.max(0, speechIntensity * 0.5);
        }
      });
    }

    // Emotion-based expressions using VRoid morph targets
    if (morphTargets && morphTargets.morphTargetDictionary) {
      const emotionIntensity = 0.4;
      
      // Reset emotion morph targets
      const emotionTargets = ['happy', 'sad', 'angry', 'surprised', 'blink', 'smile'];
      emotionTargets.forEach(target => {
        if (morphTargets.morphTargetDictionary[target] !== undefined) {
          const index = morphTargets.morphTargetDictionary[target];
          morphTargets.morphTargetInfluences[index] = 0;
        }
      });

      // Apply emotion-specific morph targets for VRoid models
      switch (emotion) {
        case 'empathetic':
          if (morphTargets.morphTargetDictionary.sad !== undefined) {
            morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.sad] = emotionIntensity * 0.3;
          }
          break;
        case 'concerned':
          if (morphTargets.morphTargetDictionary.surprised !== undefined) {
            morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.surprised] = emotionIntensity * 0.5;
          }
          break;
        case 'supportive':
          if (morphTargets.morphTargetDictionary.happy !== undefined) {
            morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.happy] = emotionIntensity * 0.6;
          }
          if (morphTargets.morphTargetDictionary.smile !== undefined) {
            morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.smile] = emotionIntensity * 0.4;
          }
          break;
      }
    }
  });

  if (!gltf) return null;

  return (
    <group ref={modelRef}>
      <primitive object={gltf.scene} />
    </group>
  );
};
