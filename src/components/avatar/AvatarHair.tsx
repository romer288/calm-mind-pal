
import React from 'react';
import * as THREE from 'three';

interface AvatarHairProps {
  hairRef: React.RefObject<THREE.Group>;
}

export const AvatarHair: React.FC<AvatarHairProps> = ({ hairRef }) => {
  const getHairColor = () => '#8B4513';

  return (
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
  );
};
