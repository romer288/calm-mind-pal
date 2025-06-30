
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
  // Use public Ready Player Me avatars that are known to work
  const avatarUrls = {
    vanessa: 'https://models.readyplayer.me/6652b5d5a2e8b8b78bbf8f3c.glb',
    monica: 'https://models.readyplayer.me/6652b5d5a2e8b8b78bbf8f3c.glb'
  };

  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleModelError = () => {
    console.log('❌ Ready Player Me model failed, using fallback');
    setHasError(true);
    setIsLoading(false);
  };

  const handleModelLoaded = () => {
    console.log('✅ Ready Player Me model loaded successfully');
    setIsLoading(false);
  };

  // Show fallback avatar immediately if we're having issues
  if (hasError) {
    return (
      <div className={`w-48 h-48 ${className} relative`}>
        <FallbackAvatar 
          isAnimating={isAnimating} 
          emotion={emotion}
          onStoppedSpeaking={onStoppedSpeaking}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-blue-800 bg-opacity-75 text-white text-xs p-1 text-center rounded-b-lg">
          Using Simple Avatar (3D Model Unavailable)
        </div>
      </div>
    );
  }

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
          <ReadyPlayerMeModel
            url={avatarUrls[companion]}
            isAnimating={isAnimating}
            emotion={emotion}
            onError={handleModelError}
            onLoaded={handleModelLoaded}
            onStoppedSpeaking={onStoppedSpeaking}
          />
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
          <div className="text-sm text-gray-600">Loading Vanessa...</div>
        </div>
      )}
      
      {isAnimating && (
        <div className="absolute top-0 left-0 right-0 bg-green-600 bg-opacity-75 text-white text-xs p-1 text-center rounded-t-lg animate-pulse">
          Vanessa is Speaking
        </div>
      )}
    </div>
  );
};

export default ReadyPlayerMeAvatar;
