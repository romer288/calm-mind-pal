
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
  const mouthRef = useRef<THREE.Mesh>(null);
  const hairRef = useRef<THREE.Group>(null);
  const [blinkTimer, setBlinkTimer] = useState(0);

  // Enhanced attractive features for Vanessa
  const getSkinColor = () => {
    return companion === 'vanessa' ? '#FFE4C4' : '#D4A574'; // Peach/cream skin tone
  };

  const getHairColor = () => {
    return companion === 'vanessa' ? '#8B4513' : '#2F1B14'; // Rich brown hair
  };

  const getLipColor = () => {
    return companion === 'vanessa' ? '#FF6B9D' : '#D2691E'; // Pink lips
  };

  const getEyeColor = () => {
    return companion === 'vanessa' ? '#4169E1' : '#8B4513'; // Blue eyes
  };

  useFrame((state, delta) => {
    if (!meshRef.current || !eyesRef.current || !mouthRef.current) return;

    // Gentle breathing animation
    const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 0.4) * 0.015;
    meshRef.current.scale.setScalar(breathingScale);

    // Natural blinking animation
    setBlinkTimer(prev => prev + delta);
    if (blinkTimer > 2.5 + Math.random() * 3) {
      const blinkSpeed = 15;
      const blinkAnimation = Math.sin(state.clock.elapsedTime * blinkSpeed);
      eyesRef.current.children.forEach((eye) => {
        if (eye.children[0]) { // Eye iris
          (eye.children[0] as THREE.Mesh).scale.y = Math.max(0.05, 1 - Math.abs(blinkAnimation) * 0.9);
        }
      });
      if (blinkAnimation < -0.9) {
        setBlinkTimer(0);
      }
    }

    // Subtle head movements for liveliness
    const headSway = Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
    meshRef.current.rotation.y = headSway;

    // Hair animation
    if (hairRef.current) {
      hairRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
    }

    // Enhanced mouth animation for speech
    if (isAnimating && audioData) {
      const audioLevel = audioData.reduce((sum, val) => sum + Math.abs(val), 0) / audioData.length;
      const mouthOpenness = Math.min(audioLevel * 3, 0.2);
      mouthRef.current.scale.setScalar(1 + mouthOpenness);
    }

    // Emotion-based facial adjustments
    const emotionOffset = getEmotionOffset(emotion);
    meshRef.current.rotation.x = emotionOffset.tilt;
    eyesRef.current.position.y = 0.15 + emotionOffset.eyeHeight;
  });

  const getEmotionOffset = (emotion: string) => {
    switch (emotion) {
      case 'empathetic':
        return { tilt: -0.03, eyeHeight: 0.02 };
      case 'concerned':
        return { tilt: 0.02, eyeHeight: -0.01 };
      case 'supportive':
        return { tilt: -0.01, eyeHeight: 0.015 };
      default:
        return { tilt: 0, eyeHeight: 0 };
    }
  };

  return (
    <group>
      {/* Face - more oval and feminine shape */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshPhongMaterial 
          color={getSkinColor()} 
          shininess={30}
          specular="#FFFFFF"
        />
      </mesh>

      {/* Cheekbones for definition */}
      <mesh position={[-0.4, 0.1, 0.7]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshPhongMaterial color="#FFB6C1" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0.4, 0.1, 0.7]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshPhongMaterial color="#FFB6C1" transparent opacity={0.3} />
      </mesh>

      {/* Eyes - larger and more expressive */}
      <group ref={eyesRef} position={[0, 0.15, 0.8]}>
        {/* Left Eye */}
        <group position={[-0.2, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.15, 20, 20]} />
            <meshPhongMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0, 0.1]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshPhongMaterial color={getEyeColor()} />
          </mesh>
          <mesh position={[0, 0, 0.12]}>
            <sphereGeometry args={[0.03, 12, 12]} />
            <meshPhongMaterial color="#000000" />
          </mesh>
        </group>
        
        {/* Right Eye */}
        <group position={[0.2, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.15, 20, 20]} />
            <meshPhongMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0, 0.1]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshPhongMaterial color={getEyeColor()} />
          </mesh>
          <mesh position={[0, 0, 0.12]}>
            <sphereGeometry args={[0.03, 12, 12]} />
            <meshPhongMaterial color="#000000" />
          </mesh>
        </group>
      </group>

      {/* Eyelashes */}
      <mesh position={[-0.2, 0.22, 0.85]}>
        <cylinderGeometry args={[0.005, 0.005, 0.08]} />
        <meshPhongMaterial color="#000000" />
      </mesh>
      <mesh position={[0.2, 0.22, 0.85]}>
        <cylinderGeometry args={[0.005, 0.005, 0.08]} />
        <meshPhongMaterial color="#000000" />
      </mesh>

      {/* Nose - more refined */}
      <mesh position={[0, 0.05, 0.85]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshPhongMaterial color={getSkinColor()} />
      </mesh>

      {/* Lips - fuller and more attractive */}
      <mesh ref={mouthRef} position={[0, -0.15, 0.8]}>
        <sphereGeometry args={[0.12, 16, 8]} />
        <meshPhongMaterial color={getLipColor()} shininess={50} />
      </mesh>

      {/* Hair - more voluminous and styled */}
      <group ref={hairRef}>
        {/* Main hair volume */}
        <mesh position={[0, 0.6, -0.2]}>
          <sphereGeometry args={[0.85, 16, 16]} />
          <meshPhongMaterial color={getHairColor()} />
        </mesh>
        
        {/* Hair strands for texture */}
        <mesh position={[-0.3, 0.4, 0.3]}>
          <cylinderGeometry args={[0.15, 0.25, 0.8]} />
          <meshPhongMaterial color={getHairColor()} />
        </mesh>
        <mesh position={[0.3, 0.4, 0.3]}>
          <cylinderGeometry args={[0.15, 0.25, 0.8]} />
          <meshPhongMaterial color={getHairColor()} />
        </mesh>
        
        {/* Bangs */}
        <mesh position={[0, 0.3, 0.7]}>
          <cylinderGeometry args={[0.2, 0.3, 0.2]} />
          <meshPhongMaterial color={getHairColor()} />
        </mesh>
      </group>

      {/* Eyebrows */}
      <mesh position={[-0.2, 0.28, 0.82]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2]} />
        <meshPhongMaterial color="#654321" />
      </mesh>
      <mesh position={[0.2, 0.28, 0.82]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2]} />
        <meshPhongMaterial color="#654321" />
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
      // Mock audio data for animation
      const mockAudioData = new Float32Array(128);
      for (let i = 0; i < 128; i++) {
        mockAudioData[i] = (Math.random() - 0.5) * 0.5;
      }
      setAudioData(mockAudioData);
    }
  }, [isAnimating]);

  return (
    <div className={`w-48 h-48 ${className}`}>
      <Canvas camera={{ position: [0, 0, 2.5], fov: 60 }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[2, 2, 2]} intensity={1.2} color="#FFE4B5" />
        <pointLight position={[-1, 1, 1]} intensity={0.8} color="#FFF8DC" />
        <spotLight 
          position={[0, 3, 3]} 
          intensity={0.5} 
          angle={0.3} 
          penumbra={0.5}
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
