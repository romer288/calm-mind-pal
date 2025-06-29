
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
    const utterance = new SpeechSynthesisUtterance(text);
    const config = getSpeechConfig(language);
    
    // Set voice
    if (voice) {
      utterance.voice = voice;
      console.log(`Using voice: ${voice.name} for ${language === 'es' ? 'Spanish' : 'English'}`);
    } else {
      console.log('No suitable voice found, using system default');
    }
    
    // Configure speech parameters - slightly slower for iPhone
    utterance.lang = config.lang;
    utterance.rate = isIPhone ? Math.max(0.8, config.rate - 0.1) : config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;
    
    utterance.onstart = function(event) {
      console.log(`Speech started in ${language} with voice:`, voice?.name || 'default');
      isProcessingRef.current = true;
      lastTextRef.current = text;
      
      // Safety timeout - more generous timing
      const maxDuration = Math.max(8000, text.length * 100);
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
      
      onEnd();
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
      // Only prevent if we're already processing the same text
      if (isProcessingRef.current && lastTextRef.current === utterance.text) {
        console.log('Same text already being spoken, rejecting');
        reject(new Error('Same speech already in progress'));
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
      
      // Start speech with minimal delay
      setTimeout(() => {
        try {
          console.log('Starting speech synthesis...');
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('Error starting speech:', error);
          isProcessingRef.current = false;
          reject(error);
        }
      }, getCancellationDelay());
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
