
import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSpeechConfig, getCancellationDelay } from './speechConfig';

export const useSpeechUtterance = () => {
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const lastTextRef = useRef<string>('');
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
    // Prevent duplicate speech
    if (isProcessingRef.current && text === lastTextRef.current) {
      console.log('Preventing duplicate speech:', text.substring(0, 20));
      throw new Error('Speech already in progress with same text');
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const config = getSpeechConfig(language);
    
    // Set voice
    if (voice) {
      utterance.voice = voice;
      console.log(`Using voice: ${voice.name} for ${language === 'es' ? 'Spanish' : 'English'}`);
    } else {
      console.log('No suitable voice found, using system default');
    }
    
    // Configure speech parameters - slower for iPhone
    utterance.lang = config.lang;
    utterance.rate = isIPhone ? Math.max(0.7, config.rate - 0.2) : config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;
    
    // Enhanced event handlers for iPhone
    utterance.onstart = function(event) {
      console.log(`Speech started in ${language} with voice:`, voice?.name || 'default');
      isProcessingRef.current = true;
      lastTextRef.current = text;
      
      // Safety timeout for iPhone - force stop after reasonable time
      const maxDuration = Math.max(5000, text.length * 150); // 150ms per character minimum
      speechTimeoutRef.current = setTimeout(() => {
        console.log('Speech timeout reached, forcing stop');
        window.speechSynthesis.cancel();
        isProcessingRef.current = false;
        currentUtteranceRef.current = null;
        onEnd();
      }, maxDuration);
      
      onStart();
    };
    
    utterance.onend = function(event) {
      console.log('Speech ended normally');
      
      // Clear timeout
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
      
      isProcessingRef.current = false;
      currentUtteranceRef.current = null;
      lastTextRef.current = '';
      
      // Delay onEnd callback for iPhone stability
      if (isIPhone) {
        setTimeout(() => onEnd(), 300);
      } else {
        onEnd();
      }
    };
    
    utterance.onerror = function(event) {
      console.error('Speech error:', event.error, event);
      
      // Clear timeout
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
      }
      
      isProcessingRef.current = false;
      currentUtteranceRef.current = null;
      lastTextRef.current = '';
      
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        toast({
          title: "Voice Issue",
          description: "There was an issue with text-to-speech. You can still read the message.",
          variant: "destructive",
        });
      }
      
      onError(new Error(`Speech error: ${event.error}`));
    };
    
    return utterance;
  };

  const speakUtterance = async (utterance: SpeechSynthesisUtterance): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Prevent multiple simultaneous speech
      if (isProcessingRef.current) {
        console.log('Speech already in progress, rejecting new request');
        reject(new Error('Speech already in progress'));
        return;
      }

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
      
      // iPhone-specific speech initiation
      const startSpeech = () => {
        try {
          console.log('Starting speech synthesis...');
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('Error starting speech:', error);
          isProcessingRef.current = false;
          reject(error);
        }
      };

      // Longer delay for iPhone
      setTimeout(startSpeech, isIPhone ? 500 : getCancellationDelay());
    });
  };

  const cancelCurrent = () => {
    console.log('Cancelling current utterance');
    
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
    lastTextRef.current = '';
  };

  const isCurrentlySpeaking = () => isProcessingRef.current;

  return {
    createUtterance,
    speakUtterance,
    cancelCurrent,
    isCurrentlySpeaking
  };
};
