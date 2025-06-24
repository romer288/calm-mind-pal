
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
  
  // Load the GLTF model with error handling
  try {
    const gltf = useLoader(GLTFLoader, url, (loader) => {
      loader.manager.onError = (errorUrl) => {
        console.error('Failed to load VRoid model:', errorUrl);
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

          // Position and scale the model for VRoid avatars
          gltf.scene.position.set(0, -1.5, 0);
          gltf.scene.scale.set(0.8, 0.8, 0.8);
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
    console.error('Error loading VRoid model:', error);
    onError();
    return null;
  }
};
