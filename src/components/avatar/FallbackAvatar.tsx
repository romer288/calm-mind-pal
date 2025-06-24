
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FallbackAvatarProps {
  isAnimating: boolean;
  emotion: string;
}

export const FallbackAvatar: React.FC<FallbackAvatarProps> = ({ isAnimating, emotion }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Breathing animation
      const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 0.4) * 0.02;
      groupRef.current.scale.set(breathingScale, breathingScale, breathingScale);

      // Gentle rotation when animating
      if (isAnimating) {
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });

  const getEmotionColor = () => {
    switch (emotion) {
      case 'empathetic': return '#A7C7E7';
      case 'concerned': return '#FFB6C1';
      case 'supportive': return '#98FB98';
      default: return '#FDBCB4';
    }
  };

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshLambertMaterial color={getEmotionColor()} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.2, 0.1, 0.7]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0.2, 0.1, 0.7]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      {/* Mouth */}
      <mesh position={[0, -0.15, 0.7]} scale={isAnimating ? [1.2, 1.2, 1.2] : [1, 1, 1]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#CD5C5C" />
      </mesh>
    </group>
  );
};
