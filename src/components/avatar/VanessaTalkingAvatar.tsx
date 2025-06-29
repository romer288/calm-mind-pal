
import React, { useState, useEffect, useRef } from 'react';
import { localSpeech, SpeechSynthesisResult } from '@/utils/speech';
import { visemeProcessor, VisemeTimeline } from '@/utils/viseme';
import { BlondeAvatar } from './BlondeAvatar';
import { PrivacyNotice } from './PrivacyNotice';
import { WASMLoader } from '@/utils/wasmLoader';
import { Loader2, Heart } from 'lucide-react';

interface VanessaTalkingAvatarProps {
  text: string;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  className?: string;
}

export const VanessaTalkingAvatar: React.FC<VanessaTalkingAvatarProps> = ({
  text,
  onSpeechStart,
  onSpeechEnd,
  className = ''
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeline, setTimeline] = useState<VisemeTimeline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);

  // Initialize with enhanced settings for Vanessa
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Initializing Vanessa...');
        setLoadingProgress(25);
        
        // Load WASM modules for high-quality speech
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
        console.log('Vanessa initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Vanessa:', error);
        setError('Failed to initialize Vanessa');
      }
    };

    initialize();
  }, []);

  // Process text for Vanessa's enhanced speech
  useEffect(() => {
    if (!text || !isInitialized || isPlaying) return;

    const processText = async () => {
      try {
        setError(null);
        console.log('Processing text for Vanessa:', text);

        // Use enhanced quality for Vanessa
        const speechResult: SpeechSynthesisResult = await localSpeech.synthesize(text, 'enhanced');
        
        // Generate more accurate viseme timeline
        const visemeTimeline = await visemeProcessor.processPhonemes(speechResult.phonemes);
        setTimeline(visemeTimeline);

        console.log('Vanessa speech processing complete:', {
          duration: speechResult.duration,
          phonemes: speechResult.phonemes.length,
          visemeFrames: visemeTimeline.frames.length
        });

      } catch (error) {
        console.error('Failed to process speech for Vanessa:', error);
        setError('Vanessa had trouble processing that');
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

      // Use premium quality for Vanessa
      const speechResult = await localSpeech.synthesize(text, 'enhanced');
      audioSourceRef.current = localSpeech.playAudio(speechResult.audioBuffer);

      audioSourceRef.current.onended = () => {
        setIsPlaying(false);
        onSpeechEnd?.();
        audioSourceRef.current = null;
      };

    } catch (error) {
      console.error('Vanessa failed to start speaking:', error);
      setIsPlaying(false);
      setError('Vanessa had trouble speaking');
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
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl relative`}>
        <div className="text-center p-4">
          <Heart className="w-6 h-6 text-pink-500 mx-auto mb-2" />
          <div className="text-pink-600 text-sm mb-2">Vanessa Error</div>
          <div className="text-xs text-gray-600">{error}</div>
        </div>
        <PrivacyNotice />
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl relative`}>
        <div className="text-center p-4">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-pink-500" />
          <div className="text-sm text-pink-700 font-medium">Loading Vanessa...</div>
          <div className="text-xs text-gray-600 mt-1">Your AI companion</div>
          <div className="w-32 h-2 bg-pink-200 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
        <PrivacyNotice />
      </div>
    );
  }

  return (
    <div className={`${className} relative bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl overflow-hidden`}>
      <BlondeAvatar
        timeline={timeline}
        isPlaying={isPlaying}
        startTime={startTimeRef.current}
        className="w-full h-full"
      />
      
      {/* Control buttons with enhanced styling */}
      <div className="absolute bottom-8 left-2 right-2 flex justify-center gap-2">
        <button
          onClick={isPlaying ? stopSpeaking : startSpeaking}
          disabled={!timeline}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm rounded-full hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 shadow-lg flex items-center gap-2"
        >
          <Heart className="w-4 h-4" />
          {isPlaying ? 'Stop Vanessa' : 'Talk to Vanessa'}
        </button>
      </div>
      
      <PrivacyNotice />
    </div>
  );
};
