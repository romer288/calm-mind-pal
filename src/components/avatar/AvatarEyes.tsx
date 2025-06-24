
import React from 'react';
import * as THREE from 'three';

interface AvatarEyesProps {
  eyesRef: React.RefObject<THREE.Group>;
}

export const AvatarEyes: React.FC<AvatarEyesProps> = ({ eyesRef }) => {
  const getEyeColor = () => '#654321';
  const getSkinColor = () => '#FDBCB4';

  return (
    <>
      {/* Eyes */}
      <group ref={eyesRef} position={[0, 0.2, 0.7]}>
        {/* Left Eye */}
        <group position={[-0.25, 0, 0]}>
          <mesh position={[0, 0, -0.05]}>
            <sphereGeometry args={[0.18, 32, 32]} />
            <meshLambertMaterial color="#F0E68C" transparent opacity={0.2} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshPhongMaterial color="#FFFFFF" shininess={100} />
          </mesh>
          <mesh position={[0, 0, 0.12]}>
            <sphereGeometry args={[0.08, 24, 24]} />
            <meshPhongMaterial color={getEyeColor()} shininess={80} />
          </mesh>
          <mesh position={[0, 0, 0.14]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh position={[0, 0.08, 0.12]}>
            <sphereGeometry args={[0.16, 24, 12]} />
            <meshLambertMaterial color={getSkinColor()} />
          </mesh>
        </group>
        
        {/* Right Eye */}
        <group position={[0.25, 0, 0]}>
          <mesh position={[0, 0, -0.05]}>
            <sphereGeometry args={[0.18, 32, 32]} />
            <meshLambertMaterial color="#F0E68C" transparent opacity={0.2} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshPhongMaterial color="#FFFFFF" shininess={100} />
          </mesh>
          <mesh position={[0, 0, 0.12]}>
            <sphereGeometry args={[0.08, 24, 24]} />
            <meshPhongMaterial color={getEyeColor()} shininess={80} />
          </mesh>
          <mesh position={[0, 0, 0.14]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
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

      {/* Eyelashes */}
      <mesh position={[-0.25, 0.28, 0.82]}>
        <boxGeometry args={[0.15, 0.02, 0.01]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh position={[0.25, 0.28, 0.82]}>
        <boxGeometry args={[0.15, 0.02, 0.01]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </>
  );
};
