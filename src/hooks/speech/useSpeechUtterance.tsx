
import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSpeechConfig, getCancellationDelay } from './speechConfig';

export const useSpeechUtterance = () => {
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Detect iPhone specifically
  const isIPhone = /iPhone/.test(navigator.userAgent);

  const createUtterance = (
    text: string, 
    language: 'en' | 'es', 
    voice: SpeechSynthesisVoice | null,
    onStart: () => void,
    onEnd: () => void,
    onError: (error: Error) => void
  ): SpeechSynthesisUtterance => {
    const utterance = new SpeechSynthesisUtterance(text);
    const config = getSpeechConfig(language);
    
    // Set voice
    if (voice) {
      utterance.voice = voice;
      console.log(`🔊 Using voice: ${voice.name} for ${language}`);
    }
    
    // Configure speech parameters
    utterance.lang = config.lang;
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;
    
    utterance.onstart = function(event) {
      console.log('🔊 Speech started');
      isProcessingRef.current = true;
      
      // Safety timeout
      const maxDuration = Math.max(10000, text.length * 120);
      speechTimeoutRef.current = setTimeout(() => {
        console.log('🔊 Speech timeout, forcing stop');
        window.speechSynthesis.cancel();
        isProcessingRef.current = false;
        currentUtteranceRef.current = null;
        onEnd();
      }, maxDuration);
      
      onStart();
    };
    
    utterance.onend = function(event) {
      console.log('🔊 Speech ended normally');
      
      // Clear timeout
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
      
      isProcessingRef.current = false;
      currentUtteranceRef.current = null;
      
      onEnd();
    };
    
    utterance.onerror = function(event) {
      console.error('🔊 Speech error:', event.error);
      
      // Clear timeout
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
      
      isProcessingRef.current = false;
      currentUtteranceRef.current = null;
      
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        toast({
          title: "Voice Issue",
          description: "There was an issue with text-to-speech.",
          variant: "destructive",
        });
      }
      
      onError(new Error(`Speech error: ${event.error}`));
    };
    
    return utterance;
  };

  const speakUtterance = async (utterance: SpeechSynthesisUtterance): Promise<void> => {
    return new Promise((resolve, reject) => {
      currentUtteranceRef.current = utterance;
      
      // Enhanced event handlers for promise resolution
      const originalOnEnd = utterance.onend;
      const originalOnError = utterance.onerror;
      
      utterance.onend = function(event) {
        if (originalOnEnd) originalOnEnd.call(this, event);
        resolve();
      };
      
      utterance.onerror = function(event) {
        if (originalOnError) originalOnError.call(this, event);
        reject(new Error(`Speech error: ${event.error}`));
      };
      
      // Start speech
      setTimeout(() => {
        try {
          console.log('🔊 Starting speech synthesis...');
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('🔊 Error starting speech:', error);
          isProcessingRef.current = false;
          reject(error);
        }
      }, 100);
    });
  };

  const cancelCurrent = () => {
    console.log('🔊 Cancelling current utterance');
    
    // Clear timeout
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    
    // Force cancel speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Reset states
    isProcessingRef.current = false;
    currentUtteranceRef.current = null;
  };

  const isCurrentlySpeaking = () => isProcessingRef.current;

  return {
    createUtterance,
    speakUtterance,
    cancelCurrent,
    isCurrentlySpeaking
  };
};
