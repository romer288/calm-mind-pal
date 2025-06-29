
import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface ReadyPlayerMeModelProps {
  url: string;
  isAnimating: boolean;
  emotion: 'neutral' | 'empathetic' | 'concerned' | 'supportive';
  onError: () => void;
}

export const ReadyPlayerMeModel: React.FC<ReadyPlayerMeModelProps> = ({ 
  url, 
  isAnimating, 
  emotion, 
  onError 
}) => {
  const modelRef = useRef<THREE.Group>(null);
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
  const [morphTargets, setMorphTargets] = useState<any>(null);
  const [headBone, setHeadBone] = useState<THREE.Bone | null>(null);
  
  // Load the Ready Player Me GLTF model
  let gltf;
  try {
    gltf = useLoader(GLTFLoader, url, (loader) => {
      loader.manager.onLoad = () => {
        console.log('Ready Player Me model loaded successfully');
      };
      loader.manager.onError = (errorUrl) => {
        console.error('Failed to load Ready Player Me model:', errorUrl);
        onError();
      };
    });
  } catch (error) {
    console.error('Error loading Ready Player Me model:', error);
    onError();
    return null;
  }

  useEffect(() => {
    if (gltf && modelRef.current) {
      try {
        console.log('Setting up Ready Player Me model');
        
        // Set up animation mixer
        const animationMixer = new THREE.AnimationMixer(gltf.scene);
        setMixer(animationMixer);

        // Find morph targets for facial expressions and lip-sync
        gltf.scene.traverse((child: any) => {
          if (child.isMesh && child.morphTargetDictionary) {
            console.log('Found Ready Player Me morph targets:', Object.keys(child.morphTargetDictionary));
            setMorphTargets(child);
          }
          
          // Find head bone for natural head movement
          if (child.isBone && child.name.toLowerCase().includes('head')) {
            setHeadBone(child);
          }
        });

        // Position and scale the Ready Player Me model
        gltf.scene.position.set(0, -0.8, 0);
        gltf.scene.scale.set(1.2, 1.2, 1.2);
        
        // Ensure proper materials for Ready Player Me models
        gltf.scene.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            // Enhance skin material for more realistic look
            if (child.material && child.material.name.includes('skin')) {
              child.material.roughness = 0.8;
              child.material.metalness = 0.1;
            }
          }
        });
        
      } catch (error) {
        console.error('Error setting up Ready Player Me model:', error);
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
      const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.008;
      modelRef.current.scale.set(breathingScale, breathingScale, breathingScale);
    }

    // Natural head movement
    if (headBone) {
      const headMovement = Math.sin(state.clock.elapsedTime * 0.3) * 0.03;
      headBone.rotation.y = headMovement;
      
      // Subtle head nod when speaking
      if (isAnimating) {
        headBone.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.02;
      }
    }

    // Advanced lip-sync animation for Ready Player Me models
    if (isAnimating && morphTargets) {
      const time = state.clock.elapsedTime;
      
      // More realistic speech pattern
      const speechIntensity = (
        Math.sin(time * 8) * 0.4 + 
        Math.sin(time * 12) * 0.2 + 
        Math.sin(time * 16) * 0.1
      ) * 0.6;
      
      // Animate common Ready Player Me viseme targets
      const visemeTargets = [
        'viseme_aa', 'viseme_E', 'viseme_I', 'viseme_O', 'viseme_U',
        'mouthOpen', 'jawOpen', 'mouthSmile'
      ];
      
      visemeTargets.forEach(target => {
        if (morphTargets.morphTargetDictionary[target] !== undefined) {
          const index = morphTargets.morphTargetDictionary[target];
          morphTargets.morphTargetInfluences[index] = Math.max(0, speechIntensity * 0.7);
        }
      });

      // Eye blink animation during speech
      const blinkTargets = ['eyeBlinkLeft', 'eyeBlinkRight', 'eyesClosed'];
      const blinkIntensity = Math.random() < 0.1 ? 1 : 0; // Random blinks
      blinkTargets.forEach(target => {
        if (morphTargets.morphTargetDictionary[target] !== undefined) {
          const index = morphTargets.morphTargetDictionary[target];
          morphTargets.morphTargetInfluences[index] = blinkIntensity;
        }
      });
    }

    // Emotion-based expressions using Ready Player Me morph targets
    if (morphTargets && morphTargets.morphTargetDictionary) {
      const emotionIntensity = 0.5;
      
      // Reset emotion morph targets
      const emotionTargets = [
        'mouthSmile', 'mouthFrown', 'browDownLeft', 'browDownRight',
        'browInnerUp', 'eyeSquintLeft', 'eyeSquintRight', 'cheekPuff'
      ];
      
      emotionTargets.forEach(target => {
        if (morphTargets.morphTargetDictionary[target] !== undefined) {
          const index = morphTargets.morphTargetDictionary[target];
          morphTargets.morphTargetInfluences[index] = 0;
        }
      });

      // Apply emotion-specific expressions
      switch (emotion) {
        case 'empathetic':
          if (morphTargets.morphTargetDictionary.browInnerUp !== undefined) {
            morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.browInnerUp] = emotionIntensity * 0.4;
          }
          if (morphTargets.morphTargetDictionary.mouthSmile !== undefined) {
            morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.mouthSmile] = emotionIntensity * 0.2;
          }
          break;
        case 'concerned':
          if (morphTargets.morphTargetDictionary.browDownLeft !== undefined) {
            morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.browDownLeft] = emotionIntensity * 0.6;
          }
          if (morphTargets.morphTargetDictionary.browDownRight !== undefined) {
            morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.browDownRight] = emotionIntensity * 0.6;
          }
          break;
        case 'supportive':
          if (morphTargets.morphTargetDictionary.mouthSmile !== undefined) {
            morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.mouthSmile] = emotionIntensity * 0.7;
          }
          if (morphTargets.morphTargetDictionary.eyeSquintLeft !== undefined) {
            morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.eyeSquintLeft] = emotionIntensity * 0.3;
          }
          if (morphTargets.morphTargetDictionary.eyeSquintRight !== undefined) {
            morphTargets.morphTargetInfluences[morphTargets.morphTargetDictionary.eyeSquintRight] = emotionIntensity * 0.3;
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
