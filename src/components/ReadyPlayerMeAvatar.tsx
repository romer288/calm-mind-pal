
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AICompanion } from '@/types/chat';
import { ReadyPlayerMeModel } from './avatar/ReadyPlayerMeModel';
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
  // Using Ready Player Me demo avatars - these are realistic human avatars
  const avatarUrls = {
    vanessa: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934c6.glb', // Female realistic avatar
    monica: 'https://models.readyplayer.me/64bfa0230e72c63d7c3934a8.glb'   // Female realistic avatar (for Spanish)
  };

  const [hasError, setHasError] = useState(false);

  const handleModelError = () => {
    console.log('Ready Player Me model failed to load, switching to fallback avatar');
    setHasError(true);
  };

  return (
    <div className={`w-48 h-48 ${className} relative`}>
      <Canvas 
        camera={{ position: [0, 0.5, 1.5], fov: 50 }}
        gl={{ preserveDrawingBuffer: false }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight 
          position={[2, 2, 2]} 
          intensity={1.2} 
          castShadow
        />
        <pointLight 
          position={[-1, 1, 1]} 
          intensity={0.6} 
        />
        
        <React.Suspense 
          fallback={<FallbackAvatar isAnimating={isAnimating} emotion={emotion} />}
        >
          {hasError ? (
            <FallbackAvatar isAnimating={isAnimating} emotion={emotion} />
          ) : (
            <ReadyPlayerMeModel
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
      
      {/* Ready Player Me attribution */}
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center rounded-t-lg">
        Ready Player Me
      </div>
    </div>
  );
};

export default ReadyPlayerMeAvatar;
