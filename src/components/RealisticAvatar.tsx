
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Box, Plane } from '@react-three/drei';
import * as THREE from 'three';
import { AICompanion } from '@/types/chat';

interface AvatarFaceProps {
  companion: AICompanion;
  isAnimating: boolean;
  audioData?: Float32Array;
  emotion: 'neutral' | 'empathetic' | 'concerned' | 'supportive';
}

const AvatarFace: React.FC<AvatarFaceProps> = ({ companion, isAnimating, audioData, emotion }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const eyesRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const [blinkTimer, setBlinkTimer] = useState(0);

  // Realistic face geometry with proper proportions
  const faceGeometry = new THREE.SphereGeometry(1, 32, 32);
  const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
  const mouthGeometry = new THREE.RingGeometry(0.05, 0.15, 16);

  // Skin tones and features based on companion
  const getSkinColor = () => {
    return companion === 'vanessa' ? '#FDBCB4' : '#D4A574'; // Different skin tones
  };

  const getHairColor = () => {
    return companion === 'vanessa' ? '#8B4513' : '#2F1B14'; // Different hair colors
  };

  useFrame((state, delta) => {
    if (!meshRef.current || !eyesRef.current || !mouthRef.current) return;

    // Breathing animation
    const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    meshRef.current.scale.setScalar(breathingScale);

    // Blinking animation
    setBlinkTimer(prev => prev + delta);
    if (blinkTimer > 3 + Math.random() * 2) { // Random blink every 3-5 seconds
      const blinkAnimation = Math.sin(state.clock.elapsedTime * 20);
      eyesRef.current.children.forEach((eye) => {
        (eye as THREE.Mesh).scale.y = Math.max(0.1, 1 - Math.abs(blinkAnimation) * 0.5);
      });
      if (blinkAnimation < -0.8) {
        setBlinkTimer(0);
      }
    }

    // Mouth animation for speech
    if (isAnimating && audioData) {
      const audioLevel = audioData.reduce((sum, val) => sum + Math.abs(val), 0) / audioData.length;
      const mouthOpenness = Math.min(audioLevel * 5, 0.3);
      mouthRef.current.scale.setScalar(1 + mouthOpenness);
    }

    // Emotion-based facial adjustments
    const emotionOffset = getEmotionOffset(emotion);
    meshRef.current.rotation.x = emotionOffset.tilt;
    eyesRef.current.position.y = 0.2 + emotionOffset.eyeHeight;
  });

  const getEmotionOffset = (emotion: string) => {
    switch (emotion) {
      case 'empathetic':
        return { tilt: -0.05, eyeHeight: 0.02 }; // Slight head tilt, raised eyebrows
      case 'concerned':
        return { tilt: 0.03, eyeHeight: -0.01 }; // Forward lean, lowered brow
      case 'supportive':
        return { tilt: -0.02, eyeHeight: 0.01 }; // Gentle tilt, slight smile
      default:
        return { tilt: 0, eyeHeight: 0 };
    }
  };

  return (
    <group>
      {/* Face */}
      <mesh ref={meshRef} geometry={faceGeometry}>
        <meshPhongMaterial color={getSkinColor()} />
      </mesh>

      {/* Eyes */}
      <group ref={eyesRef} position={[0, 0.2, 0.8]}>
        <mesh position={[-0.25, 0, 0]} geometry={eyeGeometry}>
          <meshPhongMaterial color="#4A4A4A" />
        </mesh>
        <mesh position={[0.25, 0, 0]} geometry={eyeGeometry}>
          <meshPhongMaterial color="#4A4A4A" />
        </mesh>
      </group>

      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, -0.2, 0.8]} geometry={mouthGeometry}>
        <meshPhongMaterial color="#8B4513" />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 0.7, -0.3]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshPhongMaterial color={getHairColor()} />
      </mesh>
    </group>
  );
};

interface RealisticAvatarProps {
  companion: AICompanion;
  isAnimating: boolean;
  emotion?: 'neutral' | 'empathetic' | 'concerned' | 'supportive';
  className?: string;
}

const RealisticAvatar: React.FC<RealisticAvatarProps> = ({ 
  companion, 
  isAnimating, 
  emotion = 'neutral',
  className = ''
}) => {
  const [audioData, setAudioData] = useState<Float32Array>();

  useEffect(() => {
    if (isAnimating) {
      // Mock audio data for now - in production this would come from speech synthesis
      const mockAudioData = new Float32Array(128);
      for (let i = 0; i < 128; i++) {
        mockAudioData[i] = (Math.random() - 0.5) * 0.5;
      }
      setAudioData(mockAudioData);
    }
  }, [isAnimating]);

  return (
    <div className={`w-48 h-48 ${className}`}>
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[2, 2, 2]} intensity={0.8} />
        <pointLight position={[-2, -2, 2]} intensity={0.4} color="#FFE4B5" />
        
        <AvatarFace 
          companion={companion}
          isAnimating={isAnimating}
          audioData={audioData}
          emotion={emotion}
        />
      </Canvas>
    </div>
  );
};

export default RealisticAvatar;
