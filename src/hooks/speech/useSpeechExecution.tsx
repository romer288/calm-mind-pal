
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
      // Check if this request is still valid
      if (refs.lastRequestIdRef.current !== requestId) {
        console.log('🔊 Request outdated, skipping execution');
        resolve();
        return;
      }

      const utterance = createUtterance(
        text,
        language,
        voice,
        () => {
          // onStart
          refs.isProcessingRef.current = true;
          setIsSpeaking(true);
          
          // Safety timeout
          const maxDuration = Math.max(10000, text.length * 120);
          refs.speechTimeoutRef.current = setTimeout(() => {
            console.log('🔊 Speech timeout, forcing stop');
            window.speechSynthesis.cancel();
            cleanup();
            resolve();
          }, maxDuration);
        },
        () => {
          // onEnd
          cleanup();
          resolve();
        },
        (error) => {
          // onError
          cleanup();
          reject(error);
        }
      );

      const cleanup = () => {
        if (refs.speechTimeoutRef.current) {
          clearTimeout(refs.speechTimeoutRef.current);
          refs.speechTimeoutRef.current = null;
        }
        
        refs.isProcessingRef.current = false;
        refs.currentUtteranceRef.current = null;
        setIsSpeaking(false);
      };

      refs.currentUtteranceRef.current = utterance;
      
      // Start speech with a delay to ensure browser readiness
      setTimeout(() => {
        // Double-check request is still valid before starting
        if (refs.lastRequestIdRef.current === requestId) {
          console.log('🔊 Starting speech synthesis...');
          window.speechSynthesis.speak(utterance);
        } else {
          console.log('🔊 Request cancelled before speech start');
          cleanup();
          resolve();
        }
      }, 100);
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
