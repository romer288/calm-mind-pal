
import React from 'react';
import * as THREE from 'three';

interface AvatarHeadProps {
  meshRef: React.RefObject<THREE.Mesh>;
}

export const AvatarHead: React.FC<AvatarHeadProps> = ({ meshRef }) => {
  const getSkinColor = () => '#FDBCB4';

  return (
    <>
      {/* Head - realistic oval shape */}
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

      {/* Nose */}
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
    </>
  );
};
