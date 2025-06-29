
import { useEffect, useCallback } from 'react';
import { useVoiceSelection } from './speech/useVoiceSelection';
import { useSpeechState } from './speech/useSpeechState';
import { useSpeechExecution } from './speech/useSpeechExecution';

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
  
  const { executeSpeech, cancelSpeech } = useSpeechExecution(
    { currentUtteranceRef, speechTimeoutRef, isProcessingRef, lastRequestIdRef },
    setIsSpeaking
  );

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

  const speakText = useCallback(async (text: string, language: 'en' | 'es' = 'en'): Promise<void> => {
    console.log('🔊 speakText called:', { text: text.substring(0, 50), language });
    
    if (!speechSynthesisSupported) {
      console.log('🔊 Speech synthesis not supported');
      return Promise.resolve();
    }

    if (!text.trim()) {
      console.log('🔊 Empty text, not speaking');
      return Promise.resolve();
    }

    // Generate unique request ID
    const requestId = `speech-${Date.now()}-${Math.random()}`;
    lastRequestIdRef.current = requestId;

    // Prevent multiple simultaneous calls
    if (isProcessingRef.current) {
      console.log('🔊 Already processing speech, cancelling current');
      cancelSpeech();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Cancel any existing speech
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      console.log('🔊 Cancelling existing speech');
      window.speechSynthesis.cancel();
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    try {
      const voice = findBestVoiceForLanguage(language);
      await executeSpeech(text, language, voice, requestId);
      console.log('🔊 Speech completed successfully');
    } catch (error) {
      console.error('🔊 Error in speakText:', error);
      setIsSpeaking(false);
      isProcessingRef.current = false;
    }
  }, [speechSynthesisSupported, findBestVoiceForLanguage, executeSpeech, cancelSpeech, lastRequestIdRef, isProcessingRef, setIsSpeaking]);

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
