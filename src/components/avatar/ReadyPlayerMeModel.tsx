
import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface ReadyPlayerMeModelProps {
  url: string;
  isAnimating: boolean;
  emotion: 'neutral' | 'empathetic' | 'concerned' | 'supportive';
  onError: () => void;
  onLoaded?: () => void;
}

export const ReadyPlayerMeModel: React.FC<ReadyPlayerMeModelProps> = ({ 
  url, 
  isAnimating, 
  emotion, 
  onError,
  onLoaded 
}) => {
  const modelRef = useRef<THREE.Group>(null);
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
  const [morphTargets, setMorphTargets] = useState<any>(null);
  const [headBone, setHeadBone] = useState<THREE.Bone | null>(null);
  
  // Load the Ready Player Me GLTF model with better error handling
  let gltf;
  try {
    console.log('Loading Ready Player Me model from:', url);
    gltf = useLoader(GLTFLoader, url, (loader) => {
      loader.manager.onLoad = () => {
        console.log('✅ Ready Player Me model loaded successfully');
        onLoaded?.();
      };
      loader.manager.onError = (errorUrl) => {
        console.error('❌ Failed to load Ready Player Me model:', errorUrl);
        onError();
      };
    });
  } catch (error) {
    console.error('❌ Error loading Ready Player Me model:', error);
    onError();
    return null;
  }

  useEffect(() => {
    if (gltf && modelRef.current) {
      try {
        console.log('🎭 Setting up Ready Player Me model animations');
        
        // Set up animation mixer
        const animationMixer = new THREE.AnimationMixer(gltf.scene);
        setMixer(animationMixer);

        // Find morph targets for facial expressions
        gltf.scene.traverse((child: any) => {
          if (child.isMesh && child.morphTargetDictionary) {
            console.log('🎯 Found morph targets:', Object.keys(child.morphTargetDictionary));
            setMorphTargets(child);
          }
          
          // Find head bone for natural movement
          if (child.isBone && (
            child.name.toLowerCase().includes('head') || 
            child.name.toLowerCase().includes('neck')
          )) {
            console.log('🗣️ Found head bone:', child.name);
            setHeadBone(child);
          }
        });

        // Position and scale the model properly
        gltf.scene.position.set(0, -1.2, 0);
        gltf.scene.scale.set(1.5, 1.5, 1.5);
        gltf.scene.rotation.y = 0;
        
        // Enhance materials for better appearance
        gltf.scene.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            if (child.material) {
              // Enhance skin materials
              if (child.material.name && child.material.name.toLowerCase().includes('skin')) {
                child.material.roughness = 0.7;
                child.material.metalness = 0.1;
              }
              
              // Enhance hair materials
              if (child.material.name && child.material.name.toLowerCase().includes('hair')) {
                child.material.roughness = 0.8;
                child.material.metalness = 0.2;
              }
            }
          }
        });
        
      } catch (error) {
        console.error('❌ Error setting up Ready Player Me model:', error);
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
      const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.01;
      modelRef.current.scale.set(breathingScale, breathingScale, breathingScale);
    }

    // Natural head movement
    if (headBone) {
      const time = state.clock.elapsedTime;
      
      // Gentle head sway
      headBone.rotation.y = Math.sin(time * 0.2) * 0.05;
      
      // Subtle head nod when speaking
      if (isAnimating) {
        headBone.rotation.x = Math.sin(time * 1.5) * 0.03;
        headBone.rotation.z = Math.sin(time * 0.8) * 0.01;
      }
    }

    // Realistic lip-sync animation
    if (isAnimating && morphTargets && morphTargets.morphTargetDictionary) {
      const time = state.clock.elapsedTime;
      
      // Create realistic speech pattern
      const speechWave1 = Math.sin(time * 6) * 0.5;
      const speechWave2 = Math.sin(time * 9) * 0.3;
      const speechWave3 = Math.sin(time * 12) * 0.2;
      const speechIntensity = (speechWave1 + speechWave2 + speechWave3) * 0.4;
      
      // Animate common viseme targets
      const visemeTargets = [
        'viseme_aa', 'viseme_E', 'viseme_I', 'viseme_O', 'viseme_U',
        'mouthOpen', 'jawOpen', 'mouthSmile', 'mouthClose'
      ];
      
      visemeTargets.forEach(target => {
        const index = morphTargets.morphTargetDictionary[target];
        if (index !== undefined && morphTargets.morphTargetInfluences) {
          morphTargets.morphTargetInfluences[index] = Math.max(0, speechIntensity);
        }
      });

      // Random eye blinks
      const blinkTargets = ['eyeBlinkLeft', 'eyeBlinkRight', 'eyesClosed'];
      const shouldBlink = Math.random() < 0.02; // 2% chance per frame
      blinkTargets.forEach(target => {
        const index = morphTargets.morphTargetDictionary[target];
        if (index !== undefined && morphTargets.morphTargetInfluences) {
          morphTargets.morphTargetInfluences[index] = shouldBlink ? 1 : 0;
        }
      });
    }

    // Apply emotion-based expressions
    if (morphTargets && morphTargets.morphTargetDictionary) {
      const emotionIntensity = 0.4;
      
      // Reset all emotion targets first
      const allEmotionTargets = [
        'mouthSmile', 'mouthFrown', 'browDownLeft', 'browDownRight',
        'browInnerUp', 'eyeSquintLeft', 'eyeSquintRight', 'cheekPuff',
        'mouthPucker', 'mouthPress'
      ];
      
      allEmotionTargets.forEach(target => {
        const index = morphTargets.morphTargetDictionary[target];
        if (index !== undefined && morphTargets.morphTargetInfluences) {
          morphTargets.morphTargetInfluences[index] = 0;
        }
      });

      // Apply current emotion
      switch (emotion) {
        case 'empathetic':
          ['browInnerUp', 'mouthSmile'].forEach(target => {
            const index = morphTargets.morphTargetDictionary[target];
            if (index !== undefined && morphTargets.morphTargetInfluences) {
              morphTargets.morphTargetInfluences[index] = emotionIntensity * 0.3;
            }
          });
          break;
          
        case 'concerned':
          ['browDownLeft', 'browDownRight', 'browInnerUp'].forEach(target => {
            const index = morphTargets.morphTargetDictionary[target];
            if (index !== undefined && morphTargets.morphTargetInfluences) {
              morphTargets.morphTargetInfluences[index] = emotionIntensity * 0.5;
            }
          });
          break;
          
        case 'supportive':
          ['mouthSmile', 'eyeSquintLeft', 'eyeSquintRight'].forEach(target => {
            const index = morphTargets.morphTargetDictionary[target];
            if (index !== undefined && morphTargets.morphTargetInfluences) {
              morphTargets.morphTargetInfluences[index] = emotionIntensity * 0.6;
            }
          });
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
