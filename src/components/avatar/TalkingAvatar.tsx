import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { localSpeech, SpeechSynthesisResult } from '@/utils/speech';
import { visemeProcessor, VisemeTimeline } from '@/utils/viseme';
import { TalkingAvatarModel } from './TalkingAvatarModel';
import { VanessaTalkingAvatar } from './VanessaTalkingAvatar';
import { PrivacyNotice } from './PrivacyNotice';
import { WASMLoader } from '@/utils/wasmLoader';
import { Loader2, Settings } from 'lucide-react';

interface TalkingAvatarProps {
  text: string;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  className?: string;
  avatarType?: 'default' | 'vanessa';
}

export const TalkingAvatar: React.FC<TalkingAvatarProps> = ({
  text,
  onSpeechStart,
  onSpeechEnd,
  className = '',
  avatarType = 'default'
}) => {
  const [showVanessa, setShowVanessa] = useState(avatarType === 'vanessa');

  // If user specifically wants Vanessa, render her component
  if (showVanessa || avatarType === 'vanessa') {
    return (
      <div className={className}>
        <VanessaTalkingAvatar
          text={text}
          onSpeechStart={onSpeechStart}
          onSpeechEnd={onSpeechEnd}
          className="w-full h-full"
        />
        
        {/* Avatar switcher */}
        <div className="absolute top-2 left-2">
          <button
            onClick={() => setShowVanessa(false)}
            className="p-2 bg-white bg-opacity-75 rounded-full hover:bg-opacity-100 transition-all"
            title="Switch to simple avatar"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeline, setTimeline] = useState<VisemeTimeline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize the speech synthesis system with WASM loading
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Initializing talking avatar with WASM support...');
        setLoadingProgress(25);
        
        // Load WASM modules
        await Promise.all([
          WASMLoader.loadPiperWASM(),
          WASMLoader.loadRhubarbLipSync()
        ]);
        setLoadingProgress(50);
        
        await localSpeech.initialize();
        setLoadingProgress(75);
        
        await visemeProcessor.initialize();
        setLoadingProgress(100);
        
        setIsInitialized(true);
        console.log('Talking avatar initialized successfully with WASM support');
      } catch (error) {
        console.error('Failed to initialize talking avatar:', error);
        setError('Failed to initialize 3D avatar system');
      }
    };

    initialize();
  }, []);

  // Process new text for speech synthesis
  useEffect(() => {
    if (!text || !isInitialized || isPlaying) return;

    const processText = async () => {
      try {
        setError(null);
        console.log('Processing text for speech:', text);

        // Synthesize speech with enhanced quality
        const speechResult: SpeechSynthesisResult = await localSpeech.synthesize(text);
        
        // Generate viseme timeline with better accuracy
        const visemeTimeline = await visemeProcessor.processPhonemes(speechResult.phonemes);
        setTimeline(visemeTimeline);

        console.log('Speech processing complete:', {
          duration: speechResult.duration,
          phonemes: speechResult.phonemes.length,
          visemeFrames: visemeTimeline.frames.length
        });

      } catch (error) {
        console.error('Failed to process text:', error);
        setError('Failed to process speech');
      }
    };

    processText();
  }, [text, isInitialized, isPlaying]);

  const startSpeaking = async () => {
    if (!timeline || isPlaying) return;

    try {
      setIsPlaying(true);
      startTimeRef.current = Date.now();
      onSpeechStart?.();

      // Synthesize and play audio with higher quality
      const speechResult = await localSpeech.synthesize(text, 'enhanced');
      audioSourceRef.current = localSpeech.playAudio(speechResult.audioBuffer);

      // Stop when audio ends
      audioSourceRef.current.onended = () => {
        setIsPlaying(false);
        onSpeechEnd?.();
        audioSourceRef.current = null;
      };

    } catch (error) {
      console.error('Failed to start speaking:', error);
      setIsPlaying(false);
      setError('Failed to start speech playback');
    }
  };

  const stopSpeaking = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setIsPlaying(false);
    onSpeechEnd?.();
  };

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-xl relative`}>
        <div className="text-center p-4">
          <div className="text-red-500 text-sm mb-2">Avatar Error</div>
          <div className="text-xs text-gray-600">{error}</div>
        </div>
        <PrivacyNotice />
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-xl relative`}>
        <div className="text-center p-4">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <div className="text-xs text-gray-600">Loading 3D Avatar...</div>
          <div className="w-32 h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
        <PrivacyNotice />
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      <Canvas
        camera={{ position: [0, 0, 2], fov: 50 }}
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
        
        <Suspense fallback={null}>
          <TalkingAvatarModel
            timeline={timeline}
            isPlaying={isPlaying}
            startTime={startTimeRef.current}
          />
        </Suspense>
        
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
          autoRotate={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
      
      {/* Avatar switcher */}
      <div className="absolute top-2 left-2">
        <button
          onClick={() => setShowVanessa(true)}
          className="p-2 bg-white bg-opacity-75 rounded-full hover:bg-opacity-100 transition-all"
          title="Switch to Vanessa"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
      
      {/* Control buttons */}
      <div className="absolute bottom-8 left-2 right-2 flex justify-center gap-2">
        <button
          onClick={isPlaying ? stopSpeaking : startSpeaking}
          disabled={!timeline}
          className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isPlaying ? 'Stop' : 'Speak'}
        </button>
      </div>
      
      {/* Status indicator */}
      <div className="absolute top-2 right-2">
        <div className={`w-2 h-2 rounded-full ${
          isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
        }`} />
      </div>
      
      <PrivacyNotice />
    </div>
  );
};
