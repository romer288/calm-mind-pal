
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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
  const mouthRef = useRef<THREE.Group>(null);
  const hairRef = useRef<THREE.Group>(null);
  const [blinkTimer, setBlinkTimer] = useState(0);
  const [lipSyncPhase, setLipSyncPhase] = useState(0);

  // Realistic skin and feature colors
  const getSkinColor = () => '#FDBCB4'; // Warm peachy skin tone
  const getHairColor = () => '#8B4513'; // Rich brown hair
  const getLipColor = () => '#CD5C5C'; // Natural pink lips
  const getEyeColor = () => '#654321'; // Warm brown eyes

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
        if (eyeGroup.children[2]) { // Upper eyelid
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
      
      // Multiple mouth shapes for realistic speech
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
      {/* Head - more realistic oval shape */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshLambertMaterial 
          color={getSkinColor()} 
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Neck */}
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.6, 32]} />
        <meshLambertMaterial color={getSkinColor()} />
      </mesh>

      {/* Face shape refinement */}
      <mesh position={[0, -0.1, 0.8]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshLambertMaterial 
          color={getSkinColor()} 
          transparent 
          opacity={0.6}
        />
      </mesh>

      {/* Cheekbones */}
      <mesh position={[-0.4, 0.1, 0.6]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshLambertMaterial 
          color="#F4A460" 
          transparent 
          opacity={0.3}
        />
      </mesh>
      <mesh position={[0.4, 0.1, 0.6]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshLambertMaterial 
          color="#F4A460" 
          transparent 
          opacity={0.3}
        />
      </mesh>

      {/* Eyes - more realistic and expressive */}
      <group ref={eyesRef} position={[0, 0.2, 0.7]}>
        {/* Left Eye */}
        <group position={[-0.25, 0, 0]}>
          {/* Eye socket */}
          <mesh position={[0, 0, -0.05]}>
            <sphereGeometry args={[0.18, 32, 32]} />
            <meshLambertMaterial color="#F0E68C" transparent opacity={0.2} />
          </mesh>
          {/* Eyeball */}
          <mesh>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshPhongMaterial color="#FFFFFF" shininess={100} />
          </mesh>
          {/* Iris */}
          <mesh position={[0, 0, 0.12]}>
            <sphereGeometry args={[0.08, 24, 24]} />
            <meshPhongMaterial color={getEyeColor()} shininess={80} />
          </mesh>
          {/* Pupil */}
          <mesh position={[0, 0, 0.14]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          {/* Upper eyelid */}
          <mesh position={[0, 0.08, 0.12]}>
            <sphereGeometry args={[0.16, 24, 12]} />
            <meshLambertMaterial color={getSkinColor()} />
          </mesh>
        </group>
        
        {/* Right Eye */}
        <group position={[0.25, 0, 0]}>
          {/* Eye socket */}
          <mesh position={[0, 0, -0.05]}>
            <sphereGeometry args={[0.18, 32, 32]} />
            <meshLambertMaterial color="#F0E68C" transparent opacity={0.2} />
          </mesh>
          {/* Eyeball */}
          <mesh>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshPhongMaterial color="#FFFFFF" shininess={100} />
          </mesh>
          {/* Iris */}
          <mesh position={[0, 0, 0.12]}>
            <sphereGeometry args={[0.08, 24, 24]} />
            <meshPhongMaterial color={getEyeColor()} shininess={80} />
          </mesh>
          {/* Pupil */}
          <mesh position={[0, 0, 0.14]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          {/* Upper eyelid */}
          <mesh position={[0, 0.08, 0.12]}>
            <sphereGeometry args={[0.16, 24, 12]} />
            <meshLambertMaterial color={getSkinColor()} />
          </mesh>
        </group>
      </group>

      {/* Eyebrows */}
      <mesh position={[-0.25, 0.35, 0.75]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.2, 0.03, 0.08]} />
        <meshLambertMaterial color="#5D4037" />
      </mesh>
      <mesh position={[0.25, 0.35, 0.75]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.2, 0.03, 0.08]} />
        <meshLambertMaterial color="#5D4037" />
      </mesh>

      {/* Nose - more refined */}
      <mesh position={[0, 0.05, 0.85]}>
        <coneGeometry args={[0.08, 0.15, 8]} />
        <meshLambertMaterial color={getSkinColor()} />
      </mesh>
      
      {/* Nostrils */}
      <mesh position={[-0.03, -0.02, 0.88]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshLambertMaterial color="#8B4513" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0.03, -0.02, 0.88]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshLambertMaterial color="#8B4513" transparent opacity={0.3} />
      </mesh>

      {/* Mouth - realistic with lip-sync */}
      <group ref={mouthRef} position={[0, -0.2, 0.8]}>
        {/* Upper lip */}
        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.12, 24, 12]} />
          <meshPhongMaterial color={getLipColor()} shininess={40} />
        </mesh>
        {/* Lower lip */}
        <mesh position={[0, -0.04, 0.01]}>
          <sphereGeometry args={[0.13, 24, 12]} />
          <meshPhongMaterial color={getLipColor()} shininess={40} />
        </mesh>
      </group>

      {/* Hair - voluminous and realistic */}
      <group ref={hairRef}>
        {/* Main hair volume */}
        <mesh position={[0, 0.7, -0.3]}>
          <sphereGeometry args={[0.9, 32, 32]} />
          <meshLambertMaterial color={getHairColor()} />
        </mesh>
        
        {/* Side hair */}
        <mesh position={[-0.6, 0.4, 0.2]}>
          <sphereGeometry args={[0.35, 20, 20]} />
          <meshLambertMaterial color={getHairColor()} />
        </mesh>
        <mesh position={[0.6, 0.4, 0.2]}>
          <sphereGeometry args={[0.35, 20, 20]} />
          <meshLambertMaterial color={getHairColor()} />
        </mesh>
        
        {/* Front hair strands */}
        <mesh position={[-0.3, 0.5, 0.6]} rotation={[0.3, 0, 0.2]}>
          <cylinderGeometry args={[0.08, 0.12, 0.8, 12]} />
          <meshLambertMaterial color={getHairColor()} />
        </mesh>
        <mesh position={[0.3, 0.5, 0.6]} rotation={[0.3, 0, -0.2]}>
          <cylinderGeometry args={[0.08, 0.12, 0.8, 12]} />
          <meshLambertMaterial color={getHairColor()} />
        </mesh>
        
        {/* Back hair volume */}
        <mesh position={[0, 0.3, -0.8]}>
          <sphereGeometry args={[0.6, 24, 24]} />
          <meshLambertMaterial color={getHairColor()} />
        </mesh>
      </group>

      {/* Eyelashes */}
      <mesh position={[-0.25, 0.28, 0.82]}>
        <boxGeometry args={[0.15, 0.02, 0.01]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0.25, 0.28, 0.82]}>
        <boxGeometry args={[0.15, 0.02, 0.01]} />
        <meshBasicMaterial color="#000000" />
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
      const mockAudioData = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        mockAudioData[i] = (Math.random() - 0.5) * 0.6 * Math.sin(i * 0.1);
      }
      setAudioData(mockAudioData);
      
      const interval = setInterval(() => {
        const newAudioData = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
          newAudioData[i] = (Math.random() - 0.5) * 0.4 * Math.sin(i * 0.08 + Date.now() * 0.008);
        }
        setAudioData(newAudioData);
      }, 80);
      
      return () => clearInterval(interval);
    }
  }, [isAnimating]);

  return (
    <div className={`w-48 h-48 ${className}`}>
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.8} color="#FFF8DC" />
        <directionalLight 
          position={[2, 3, 2]} 
          intensity={1.2} 
          color="#FFFFFF"
          castShadow
        />
        <pointLight 
          position={[-1, 1, 2]} 
          intensity={0.6} 
          color="#FFE4B5" 
        />
        <spotLight 
          position={[0, 4, 3]} 
          intensity={0.9} 
          angle={0.3} 
          penumbra={0.4}
          color="#FFFFFF"
        />
        
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
