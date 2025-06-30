
import { useState, useEffect } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface UseReadyPlayerMeLoaderProps {
  url: string;
  onError: () => void;
  onLoaded?: () => void;
}

export const useReadyPlayerMeLoader = ({ url, onError, onLoaded }: UseReadyPlayerMeLoaderProps) => {
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
  const [morphTargets, setMorphTargets] = useState<any>(null);
  const [headBone, setHeadBone] = useState<THREE.Bone | null>(null);

  let gltf;
  try {
    console.log('Loading Ready Player Me model from:', url);
    gltf = useLoader(GLTFLoader, url, (loader) => {
      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.error('❌ Ready Player Me model loading timeout');
        onError();
      }, 10000); // 10 second timeout

      loader.manager.onLoad = () => {
        clearTimeout(timeoutId);
        console.log('✅ Ready Player Me model loaded successfully');
        onLoaded?.();
      };
      loader.manager.onError = (errorUrl) => {
        clearTimeout(timeoutId);
        console.error('❌ Failed to load Ready Player Me model:', errorUrl);
        onError();
      };
    });
  } catch (error) {
    console.error('❌ Error loading Ready Player Me model:', error);
    onError();
    return { gltf: null, mixer, morphTargets, headBone };
  }

  useEffect(() => {
    if (gltf && gltf.scene) {
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
        gltf.scene.scale.set(1.6, 1.6, 1.6);
        gltf.scene.rotation.y = 0;
        
        // Enhance materials for better appearance
        gltf.scene.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            if (child.material) {
              // Make materials more realistic
              if (child.material.name && child.material.name.toLowerCase().includes('skin')) {
                child.material.roughness = 0.65;
                child.material.metalness = 0.02;
              }
              
              if (child.material.name && child.material.name.toLowerCase().includes('hair')) {
                child.material.roughness = 0.9;
                child.material.metalness = 0.05;
              }
              
              if (child.material.name && child.material.name.toLowerCase().includes('eye')) {
                child.material.roughness = 0.1;
                child.material.metalness = 0.95;
              }
              
              // Ensure materials are properly configured
              child.material.needsUpdate = true;
            }
          }
        });
        
      } catch (error) {
        console.error('❌ Error setting up Ready Player Me model:', error);
        onError();
      }
    }
  }, [gltf, onError]);

  return { gltf, mixer, morphTargets, headBone };
};
