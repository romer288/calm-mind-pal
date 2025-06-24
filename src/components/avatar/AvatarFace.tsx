
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AICompanion } from '@/types/chat';
import { AvatarHead } from './AvatarHead';
import { AvatarEyes } from './AvatarEyes';
import { AvatarMouth } from './AvatarMouth';
import { AvatarHair } from './AvatarHair';

interface AvatarFaceProps {
  companion: AICompanion;
  isAnimating: boolean;
  audioData?: Float32Array;
  emotion: 'neutral' | 'empathetic' | 'concerned' | 'supportive';
}

export const AvatarFace: React.FC<AvatarFaceProps> = ({ companion, isAnimating, audioData, emotion }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const eyesRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Group>(null);
  const hairRef = useRef<THREE.Group>(null);
  const [blinkTimer, setBlinkTimer] = useState(0);
  const [lipSyncPhase, setLipSyncPhase] = useState(0);

  useFrame((state, delta) => {
    if (!meshRef.current || !eyesRef.current || !mouthRef.current) return;

    // Subtle breathing animation
    const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 0.4) * 0.005;
    meshRef.current.scale.set(breathingScale, breathingScale, breathingScale);

    // Natural blinking
    setBlinkTimer(prev => prev + delta);
    if (blinkTimer > 3 + Math.random() * 2) {
      const blinkCycle = (state.clock.elapsedTime * 15) % (2 * Math.PI);
      const blinkIntensity = Math.max(0, Math.sin(blinkCycle));
      
      eyesRef.current.children.forEach((eyeGroup: any) => {
        if (eyeGroup.children[2]) {
          eyeGroup.children[2].scale.y = 1 - (blinkIntensity * 0.8);
        }
      });
      
      if (blinkCycle > Math.PI * 1.5) {
        setBlinkTimer(0);
      }
    }

    // Micro head movements
    const headMovement = Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
    meshRef.current.rotation.y = headMovement;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.01;

    // Hair movement
    if (hairRef.current) {
      hairRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.008;
    }

    // Advanced lip-sync animation
    if (isAnimating && mouthRef.current) {
      setLipSyncPhase(prev => prev + delta * 12);
      
      const speechIntensity = audioData ? 
        audioData.reduce((sum, val) => sum + Math.abs(val), 0) / audioData.length : 
        (Math.sin(lipSyncPhase) + Math.sin(lipSyncPhase * 1.5) + 1) * 0.25;
      
      const timeOffset = state.clock.elapsedTime;
      const mouthOpenY = 1 + Math.sin(timeOffset * 8) * speechIntensity * 0.4;
      const mouthOpenX = 1 + Math.cos(timeOffset * 6) * speechIntensity * 0.2;
      
      mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, mouthOpenY, 0.3);
      mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, mouthOpenX, 0.2);
    } else if (mouthRef.current) {
      mouthRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
    }

    // Emotion-based expressions
    const emotionOffset = getEmotionOffset(emotion);
    if (eyesRef.current) {
      eyesRef.current.position.y = 0.2 + emotionOffset.eyeHeight;
      eyesRef.current.rotation.z = emotionOffset.eyeRotation;
    }
  });

  const getEmotionOffset = (emotion: string) => {
    switch (emotion) {
      case 'empathetic':
        return { eyeHeight: 0.01, eyeRotation: 0.02 };
      case 'concerned':
        return { eyeHeight: -0.005, eyeRotation: -0.015 };
      case 'supportive':
        return { eyeHeight: 0.008, eyeRotation: 0.005 };
      default:
        return { eyeHeight: 0, eyeRotation: 0 };
    }
  };

  return (
    <group>
      <AvatarHead meshRef={meshRef} />
      <AvatarEyes eyesRef={eyesRef} />
      <AvatarMouth mouthRef={mouthRef} />
      <AvatarHair hairRef={hairRef} />
    </group>
  );
};
