
import { useCallback } from 'react';
import { useSpeechUtteranceFactory } from './useSpeechUtteranceFactory';

interface SpeechExecutionRefs {
  currentUtteranceRef: React.MutableRefObject<SpeechSynthesisUtterance | null>;
  speechTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  isProcessingRef: React.MutableRefObject<boolean>;
  lastRequestIdRef: React.MutableRefObject<string | null>;
}

export const useSpeechExecution = (
  refs: SpeechExecutionRefs,
  setIsSpeaking: (speaking: boolean) => void
) => {
  const { createUtterance } = useSpeechUtteranceFactory();

  const executeSpeech = useCallback(async (
    text: string,
    language: 'en' | 'es',
    voice: SpeechSynthesisVoice | null,
    requestId: string
  ): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      console.log('🔊 executeSpeech called with requestId:', requestId);
      
      // Check if this request is still valid
      if (refs.lastRequestIdRef.current !== requestId) {
        console.log('🔊 Request outdated, skipping execution');
        resolve();
        return;
      }

      let hasCompleted = false;
      
      const cleanup = () => {
        if (hasCompleted) return;
        hasCompleted = true;
        
        console.log('🔊 Cleaning up speech execution');
        
        if (refs.speechTimeoutRef.current) {
          clearTimeout(refs.speechTimeoutRef.current);
          refs.speechTimeoutRef.current = null;
        }
        
        refs.isProcessingRef.current = false;
        refs.currentUtteranceRef.current = null;
        setIsSpeaking(false);
      };

      const utterance = createUtterance(
        text,
        language,
        voice,
        () => {
          // onStart
          console.log('🔊 Speech started - setting states');
          refs.isProcessingRef.current = true;
          setIsSpeaking(true);
          
          // Safety timeout - be more generous with time
          const maxDuration = Math.max(15000, text.length * 150);
          refs.speechTimeoutRef.current = setTimeout(() => {
            console.log('🔊 Speech timeout, forcing stop');
            window.speechSynthesis.cancel();
            cleanup();
            resolve();
          }, maxDuration);
        },
        () => {
          // onEnd
          console.log('🔊 Speech ended normally');
          cleanup();
          resolve();
        },
        (error) => {
          // onError
          console.error('🔊 Speech error in execution:', error);
          cleanup();
          reject(error);
        }
      );

      refs.currentUtteranceRef.current = utterance;
      
      // Start speech immediately - no delay
      console.log('🔊 Starting speech synthesis immediately...');
      
      // Double-check request is still valid before starting
      if (refs.lastRequestIdRef.current === requestId) {
        try {
          window.speechSynthesis.speak(utterance);
          console.log('🔊 Speech synthesis started successfully');
        } catch (error) {
          console.error('🔊 Error starting speech synthesis:', error);
          cleanup();
          reject(error);
        }
      } else {
        console.log('🔊 Request cancelled before speech start');
        cleanup();
        resolve();
      }
    });
  }, [createUtterance, refs, setIsSpeaking]);

  const cancelSpeech = useCallback(() => {
    console.log('🔊 Cancelling speech execution');
    
    if (refs.speechTimeoutRef.current) {
      clearTimeout(refs.speechTimeoutRef.current);
      refs.speechTimeoutRef.current = null;
    }
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    refs.isProcessingRef.current = false;
    refs.currentUtteranceRef.current = null;
    refs.lastRequestIdRef.current = null;
    setIsSpeaking(false);
  }, [refs, setIsSpeaking]);

  return {
    executeSpeech,
    cancelSpeech
  };
};
