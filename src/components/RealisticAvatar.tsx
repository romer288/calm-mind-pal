
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
  const glassesRef = useRef<THREE.Group>(null);
  const [blinkTimer, setBlinkTimer] = useState(0);
  const [lipSyncPhase, setLipSyncPhase] = useState(0);

  // Enhanced features for a more attractive, realistic look
  const getSkinColor = () => '#F5DEB3'; // Warm wheat tone
  const getHairColor = () => '#2F1B14'; // Rich dark brown
  const getLipColor = () => '#C85A5A'; // Natural rose
  const getEyeColor = () => '#4A4A4A'; // Deep brown eyes

  useFrame((state, delta) => {
    if (!meshRef.current || !eyesRef.current || !mouthRef.current) return;

    // Very subtle breathing animation
    const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 0.3) * 0.008;
    meshRef.current.scale.set(breathingScale, breathingScale, breathingScale);

    // Natural blinking with random intervals
    setBlinkTimer(prev => prev + delta);
    if (blinkTimer > 2 + Math.random() * 4) {
      const blinkCycle = (state.clock.elapsedTime * 12) % (2 * Math.PI);
      const blinkIntensity = Math.max(0, Math.sin(blinkCycle));
      
      eyesRef.current.children.forEach((eyeGroup) => {
        const eyelid = eyeGroup.children[3]; // Eyelid mesh
        if (eyelid) {
          eyelid.scale.y = 1 - (blinkIntensity * 0.9);
        }
      });
      
      if (blinkCycle > Math.PI * 1.8) {
        setBlinkTimer(0);
      }
    }

    // Micro head movements for liveliness
    const headSway = Math.sin(state.clock.elapsedTime * 0.2) * 0.015;
    const headNod = Math.sin(state.clock.elapsedTime * 0.15) * 0.008;
    meshRef.current.rotation.y = headSway;
    meshRef.current.rotation.x = headNod;

    // Hair physics simulation
    if (hairRef.current) {
      hairRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.005;
      hairRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.003;
    }

    // Realistic lip-sync animation
    if (isAnimating && mouthRef.current) {
      setLipSyncPhase(prev => prev + delta * 8);
      
      // Create varied mouth shapes for natural speech
      const speechIntensity = audioData ? 
        audioData.reduce((sum, val) => sum + Math.abs(val), 0) / audioData.length : 
        (Math.sin(lipSyncPhase) + 1) * 0.3;
      
      // Multiple mouth shapes for realistic speech
      const mouthShapes = [
        { scaleY: 1 + speechIntensity * 0.3, scaleX: 1 - speechIntensity * 0.1 },
        { scaleY: 1 + speechIntensity * 0.5, scaleX: 1 + speechIntensity * 0.2 },
        { scaleY: 1 + speechIntensity * 0.2, scaleX: 1 + speechIntensity * 0.3 },
      ];
      
      const currentShape = mouthShapes[Math.floor(lipSyncPhase * 0.5) % mouthShapes.length];
      const smoothTransition = Math.sin(lipSyncPhase * 2) * 0.5 + 0.5;
      
      mouthRef.current.scale.y = THREE.MathUtils.lerp(1, currentShape.scaleY, smoothTransition);
      mouthRef.current.scale.x = THREE.MathUtils.lerp(1, currentShape.scaleX, smoothTransition);
    } else if (mouthRef.current) {
      // Return to neutral position smoothly
      mouthRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }

    // Emotion-based expressions
    const emotionOffset = getEmotionOffset(emotion);
    meshRef.current.rotation.x += emotionOffset.tilt;
    if (eyesRef.current) {
      eyesRef.current.position.y = 0.15 + emotionOffset.eyeHeight;
    }
  });

  const getEmotionOffset = (emotion: string) => {
    switch (emotion) {
      case 'empathetic':
        return { tilt: -0.02, eyeHeight: 0.01 };
      case 'concerned':
        return { tilt: 0.015, eyeHeight: -0.005 };
      case 'supportive':
        return { tilt: -0.008, eyeHeight: 0.008 };
      default:
        return { tilt: 0, eyeHeight: 0 };
    }
  };

  return (
    <group>
      {/* Head - more oval and feminine */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.85, 48, 48]} />
        <meshPhongMaterial 
          color={getSkinColor()} 
          shininess={15}
          specular="#FFFFFF"
        />
      </mesh>

      {/* Cheekbone definition */}
      <mesh position={[-0.35, 0.08, 0.65]}>
        <sphereGeometry args={[0.12, 20, 20]} />
        <meshPhongMaterial color="#F0C6A3" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0.35, 0.08, 0.65]}>
        <sphereGeometry args={[0.12, 20, 20]} />
        <meshPhongMaterial color="#F0C6A3" transparent opacity={0.4} />
      </mesh>

      {/* Eyes - larger and more expressive */}
      <group ref={eyesRef} position={[0, 0.15, 0.75]}>
        {/* Left Eye */}
        <group position={[-0.18, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshPhongMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0, 0.1]}>
            <sphereGeometry args={[0.09, 20, 20]} />
            <meshPhongMaterial color={getEyeColor()} />
          </mesh>
          <mesh position={[0, 0, 0.13]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshPhongMaterial color="#000000" />
          </mesh>
          {/* Eyelid for blinking */}
          <mesh position={[0, 0.05, 0.14]}>
            <sphereGeometry args={[0.17, 24, 12]} />
            <meshPhongMaterial color={getSkinColor()} />
          </mesh>
        </group>
        
        {/* Right Eye */}
        <group position={[0.18, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshPhongMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0, 0.1]}>
            <sphereGeometry args={[0.09, 20, 20]} />
            <meshPhongMaterial color={getEyeColor()} />
          </mesh>
          <mesh position={[0, 0, 0.13]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshPhongMaterial color="#000000" />
          </mesh>
          {/* Eyelid for blinking */}
          <mesh position={[0, 0.05, 0.14]}>
            <sphereGeometry args={[0.17, 24, 12]} />
            <meshPhongMaterial color={getSkinColor()} />
          </mesh>
        </group>
      </group>

      {/* Glasses - professional look */}
      <group ref={glassesRef} position={[0, 0.15, 0.8]}>
        {/* Left lens frame */}
        <mesh position={[-0.18, 0, 0]}>
          <torusGeometry args={[0.14, 0.015, 8, 32]} />
          <meshPhongMaterial color="#333333" />
        </mesh>
        {/* Right lens frame */}
        <mesh position={[0.18, 0, 0]}>
          <torusGeometry args={[0.14, 0.015, 8, 32]} />
          <meshPhongMaterial color="#333333" />
        </mesh>
        {/* Bridge */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.01, 0.01, 0.08]} />
          <meshPhongMaterial color="#333333" />
        </mesh>
        {/* Glass lenses */}
        <mesh position={[-0.18, 0, 0.01]}>
          <circleGeometry args={[0.13, 32]} />
          <meshPhongMaterial color="#FFFFFF" transparent opacity={0.1} />
        </mesh>
        <mesh position={[0.18, 0, 0.01]}>
          <circleGeometry args={[0.13, 32]} />
          <meshPhongMaterial color="#FFFFFF" transparent opacity={0.1} />
        </mesh>
      </group>

      {/* Nose - refined */}
      <mesh position={[0, 0.03, 0.82]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshPhongMaterial color={getSkinColor()} />
      </mesh>

      {/* Mouth - more realistic with lip-sync capability */}
      <group ref={mouthRef} position={[0, -0.12, 0.78]}>
        {/* Upper lip */}
        <mesh position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.08, 16, 8]} />
          <meshPhongMaterial color={getLipColor()} shininess={30} />
        </mesh>
        {/* Lower lip */}
        <mesh position={[0, -0.02, 0]}>
          <sphereGeometry args={[0.09, 16, 8]} />
          <meshPhongMaterial color={getLipColor()} shininess={30} />
        </mesh>
      </group>

      {/* Hair - voluminous and styled */}
      <group ref={hairRef}>
        {/* Main hair volume */}
        <mesh position={[0, 0.55, -0.25]}>
          <sphereGeometry args={[0.8, 24, 24]} />
          <meshPhongMaterial color={getHairColor()} shininess={20} />
        </mesh>
        
        {/* Side hair layers */}
        <mesh position={[-0.4, 0.3, 0.1]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshPhongMaterial color={getHairColor()} />
        </mesh>
        <mesh position={[0.4, 0.3, 0.1]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshPhongMaterial color={getHairColor()} />
        </mesh>
        
        {/* Hair texture strands */}
        <mesh position={[-0.2, 0.4, 0.4]} rotation={[0.2, 0, 0.1]}>
          <cylinderGeometry args={[0.08, 0.15, 0.6]} />
          <meshPhongMaterial color={getHairColor()} />
        </mesh>
        <mesh position={[0.2, 0.4, 0.4]} rotation={[0.2, 0, -0.1]}>
          <cylinderGeometry args={[0.08, 0.15, 0.6]} />
          <meshPhongMaterial color={getHairColor()} />
        </mesh>
      </group>

      {/* Eyebrows - well-defined */}
      <mesh position={[-0.18, 0.25, 0.78]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.015, 0.02, 0.15]} />
        <meshPhongMaterial color="#1A1A1A" />
      </mesh>
      <mesh position={[0.18, 0.25, 0.78]} rotation={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.015, 0.02, 0.15]} />
        <meshPhongMaterial color="#1A1A1A" />
      </mesh>

      {/* Eyelashes */}
      <mesh position={[-0.18, 0.22, 0.82]}>
        <cylinderGeometry args={[0.003, 0.003, 0.06]} />
        <meshPhongMaterial color="#000000" />
      </mesh>
      <mesh position={[0.18, 0.22, 0.82]}>
        <cylinderGeometry args={[0.003, 0.003, 0.06]} />
        <meshPhongMaterial color="#000000" />
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
      // Enhanced mock audio data for more realistic lip-sync
      const mockAudioData = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        mockAudioData[i] = (Math.random() - 0.5) * 0.8 * Math.sin(i * 0.1);
      }
      setAudioData(mockAudioData);
      
      const interval = setInterval(() => {
        const newAudioData = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
          newAudioData[i] = (Math.random() - 0.5) * 0.6 * Math.sin(i * 0.08 + Date.now() * 0.01);
        }
        setAudioData(newAudioData);
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [isAnimating]);

  return (
    <div className={`w-48 h-48 ${className}`}>
      <Canvas camera={{ position: [0, 0, 2.2], fov: 65 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[2, 2, 2]} intensity={1} color="#FFF8DC" />
        <pointLight position={[-1, 1, 1]} intensity={0.7} color="#FFE4B5" />
        <spotLight 
          position={[0, 3, 2]} 
          intensity={0.8} 
          angle={0.4} 
          penumbra={0.3}
          color="#FFFFFF"
        />
        <directionalLight
          position={[1, 1, 1]}
          intensity={0.5}
          color="#FFF8DC"
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
