
import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { AICompanion } from '@/types/chat';
import { AvatarFace } from './AvatarFace';

interface RealisticAvatarProps {
  companion: AICompanion;
  isAnimating: boolean;
  emotion?: 'neutral' | 'empathetic' | 'concerned' | 'supportive';
  className?: string;
  onStoppedSpeaking?: () => void;
}

export const RealisticAvatar: React.FC<RealisticAvatarProps> = ({ 
  companion, 
  isAnimating, 
  emotion = 'neutral',
  className = '',
  onStoppedSpeaking
}) => {
  const [audioData, setAudioData] = useState<Float32Array>();

  useEffect(() => {
    if (isAnimating) {
      const mockAudioData = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        mockAudioData[i] = (Math.random() - 0.5) * 0.6 * Math.sin(i * 0.1);
      }
      setAudioData(mockAudioData);
      
      const interval = setInterval(() => {
        const newAudioData = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
          newAudioData[i] = (Math.random() - 0.5) * 0.4 * Math.sin(i * 0.08 + Date.now() * 0.008);
        }
        setAudioData(newAudioData);
      }, 80);
      
      return () => clearInterval(interval);
    }
  }, [isAnimating]);

  return (
    <div className={`w-48 h-48 ${className}`}>
      <Canvas camera={{ position: [0, 0, 3], fov: 50 }}>
        <ambientLight intensity={0.8} color="#FFF8DC" />
        <directionalLight 
          position={[2, 3, 2]} 
          intensity={1.2} 
          color="#FFFFFF"
          castShadow
        />
        <pointLight 
          position={[-1, 1, 2]} 
          intensity={0.6} 
          color="#FFE4B5" 
        />
        <spotLight 
          position={[0, 4, 3]} 
          intensity={0.9} 
          angle={0.3} 
          penumbra={0.4}
          color="#FFFFFF"
        />
        
        <AvatarFace 
          companion={companion}
          isAnimating={isAnimating}
          audioData={audioData}
          emotion={emotion}
          onStoppedSpeaking={onStoppedSpeaking}
        />
      </Canvas>
    </div>
  );
};
