
import { useEffect, useCallback } from 'react';
import { useVoiceSelection } from './speech/useVoiceSelection';
import { useSpeechState } from './speech/useSpeechState';

export const useSpeechSynthesis = () => {
  const {
    isSpeaking,
    setIsSpeaking,
    speechSynthesisSupported,
    setSpeechSynthesisSupported,
    currentUtteranceRef,
    speechTimeoutRef,
    isProcessingRef,
    lastRequestIdRef
  } = useSpeechState();

  const { findBestVoiceForLanguage } = useVoiceSelection();

  // Check for speech synthesis support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesisSupported(true);
      console.log('🔊 Speech synthesis is supported');
    } else {
      console.log('🔊 Speech synthesis is not supported');
      setSpeechSynthesisSupported(false);
    }
  }, [setSpeechSynthesisSupported]);

  const cancelSpeech = useCallback(() => {
    console.log('🔊 Cancelling speech');
    
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    isProcessingRef.current = false;
    currentUtteranceRef.current = null;
    lastRequestIdRef.current = null;
    setIsSpeaking(false);
  }, [speechTimeoutRef, isProcessingRef, currentUtteranceRef, lastRequestIdRef, setIsSpeaking]);

  const speakText = useCallback(async (text: string, language: 'en' | 'es' = 'en'): Promise<void> => {
    console.log('🔊 speakText called:', { text: text.substring(0, 50), language, isSpeaking });
    
    if (!speechSynthesisSupported) {
      console.log('🔊 Speech synthesis not supported');
      return;
    }

    if (!text.trim()) {
      console.log('🔊 Empty text, not speaking');
      return;
    }

    // Cancel any existing speech
    if (isSpeaking || isProcessingRef.current || window.speechSynthesis.speaking) {
      console.log('🔊 Cancelling existing speech');
      cancelSpeech();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Promise<void>((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = findBestVoiceForLanguage(language);
        
        if (voice) {
          utterance.voice = voice;
          console.log('🔊 Using voice:', voice.name);
        }
        
        // Configure speech parameters
        utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        let hasCompleted = false;
        
        const complete = () => {
          if (hasCompleted) return;
          hasCompleted = true;
          
          console.log('🔊 Speech completed');
          
          if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
          }
          
          isProcessingRef.current = false;
          currentUtteranceRef.current = null;
          setIsSpeaking(false);
          resolve();
        };
        
        utterance.onstart = () => {
          console.log('🔊 Speech started');
          isProcessingRef.current = true;
          setIsSpeaking(true);
          
          // Safety timeout
          const maxDuration = Math.max(15000, text.length * 100);
          speechTimeoutRef.current = setTimeout(() => {
            console.log('🔊 Speech timeout');
            window.speechSynthesis.cancel();
            complete();
          }, maxDuration);
        };
        
        utterance.onend = () => {
          console.log('🔊 Speech ended normally');
          complete();
        };
        
        utterance.onerror = (event) => {
          console.error('🔊 Speech error:', event.error);
          complete();
          if (event.error !== 'interrupted' && event.error !== 'canceled') {
            reject(new Error(`Speech error: ${event.error}`));
          }
        };
        
        currentUtteranceRef.current = utterance;
        
        console.log('🔊 Starting speech...');
        window.speechSynthesis.speak(utterance);
        
      } catch (error) {
        console.error('🔊 Error creating speech:', error);
        isProcessingRef.current = false;
        setIsSpeaking(false);
        reject(error);
      }
    });
  }, [speechSynthesisSupported, findBestVoiceForLanguage, cancelSpeech, isSpeaking, isProcessingRef, currentUtteranceRef, speechTimeoutRef, setIsSpeaking]);

  const stopSpeaking = useCallback(() => {
    console.log('🔊 stopSpeaking called');
    cancelSpeech();
  }, [cancelSpeech]);

  return {
    speechSynthesisSupported,
    isSpeaking,
    speakText,
    stopSpeaking
  };
};
