
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
  onStoppedSpeaking?: () => void;
}

const ReadyPlayerMeAvatar: React.FC<ReadyPlayerMeAvatarProps> = ({ 
  companion, 
  isAnimating, 
  emotion = 'neutral',
  className = '',
  onStoppedSpeaking
}) => {
  // Updated with working Ready Player Me avatars - these are verified working URLs
  const avatarUrls = {
    vanessa: 'https://models.readyplayer.me/673f7b4f56915f14b2aca7e1.glb', // Working female avatar
    monica: 'https://models.readyplayer.me/673f7b6d56915f14b2aca820.glb'   // Working female avatar
  };

  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleModelError = () => {
    console.log('Ready Player Me model failed to load, switching to fallback avatar');
    setHasError(true);
    setIsLoading(false);
  };

  const handleModelLoaded = () => {
    console.log('Ready Player Me model loaded successfully');
    setIsLoading(false);
  };

  return (
    <div className={`w-48 h-48 ${className} relative`}>
      <Canvas 
        camera={{ position: [0, 0, 2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[2, 2, 2]} 
          intensity={1.0} 
          castShadow
        />
        <pointLight 
          position={[-1, 1, 1]} 
          intensity={0.4} 
        />
        <spotLight
          position={[0, 2, 2]}
          intensity={0.8}
          angle={0.3}
          penumbra={0.1}
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
              onLoaded={handleModelLoaded}
              onStoppedSpeaking={onStoppedSpeaking}
            />
          )}
        </React.Suspense>
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
          autoRotate={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
      
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="text-sm text-gray-600">Loading avatar...</div>
        </div>
      )}
      
      {hasError && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-800 bg-opacity-75 text-white text-xs p-1 text-center rounded-b-lg">
          Using simple avatar (Ready Player Me unavailable)
        </div>
      )}
      
      {!hasError && !isLoading && (
        <div className="absolute top-0 left-0 right-0 bg-green-800 bg-opacity-75 text-white text-xs p-1 text-center rounded-t-lg">
          Ready Player Me Avatar
        </div>
      )}
    </div>
  );
};

export default ReadyPlayerMeAvatar;
