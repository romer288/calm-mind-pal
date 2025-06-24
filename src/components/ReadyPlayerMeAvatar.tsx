
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AICompanion } from '@/types/chat';
import { VRoidModel } from './avatar/VRoidModel';
import { FallbackAvatar } from './avatar/FallbackAvatar';

interface ReadyPlayerMeAvatarProps {
  companion: AICompanion;
  isAnimating: boolean;
  emotion?: 'neutral' | 'empathetic' | 'concerned' | 'supportive';
  className?: string;
}

const ReadyPlayerMeAvatar: React.FC<ReadyPlayerMeAvatarProps> = ({ 
  companion, 
  isAnimating, 
  emotion = 'neutral',
  className = ''
}) => {
  // Using actual VRoid Hub free GLB models - these are reliable and hosted on VRoid's CDN
  const avatarUrls = {
    vanessa: 'https://cdn.vroid.com/models/sample_female_01.glb', // Female anime avatar
    monica: 'https://cdn.vroid.com/models/sample_female_02.glb'   // Female anime avatar (for Spanish)
  };

  const [hasError, setHasError] = useState(false);

  const handleModelError = () => {
    console.log('VRoid model failed to load, switching to fallback avatar');
    setHasError(true);
  };

  return (
    <div className={`w-48 h-48 ${className} relative`}>
      <Canvas 
        camera={{ position: [0, 0, 2], fov: 50 }}
        gl={{ preserveDrawingBuffer: false }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[2, 2, 2]} 
          intensity={1} 
          castShadow
        />
        <pointLight 
          position={[-1, 1, 1]} 
          intensity={0.4} 
        />
        
        <React.Suspense 
          fallback={<FallbackAvatar isAnimating={isAnimating} emotion={emotion} />}
        >
          {hasError ? (
            <FallbackAvatar isAnimating={isAnimating} emotion={emotion} />
          ) : (
            <VRoidModel
              url={avatarUrls[companion]}
              isAnimating={isAnimating}
              emotion={emotion}
              onError={handleModelError}
            />
          )}
        </React.Suspense>
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
      
      {hasError && (
        <div className="absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-75 text-white text-xs p-1 text-center rounded-b-lg">
          Using fallback avatar
        </div>
      )}
      
      {/* VRoid Hub attribution */}
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center rounded-t-lg">
        VRoid Hub Model
      </div>
    </div>
  );
};

export default ReadyPlayerMeAvatar;
