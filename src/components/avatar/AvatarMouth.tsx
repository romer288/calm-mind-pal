
import React from 'react';
import * as THREE from 'three';

interface AvatarMouthProps {
  mouthRef: React.RefObject<THREE.Group>;
}

export const AvatarMouth: React.FC<AvatarMouthProps> = ({ mouthRef }) => {
  const getLipColor = () => '#CD5C5C';

  return (
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
  );
};
