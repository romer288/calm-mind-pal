
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
    console.log('🔊 speakText called:', { text: text.substring(0, 50), language, isSpeaking: isSpeaking });
    
    if (!speechSynthesisSupported) {
      console.log('🔊 Speech synthesis not supported');
      return;
    }

    if (!text.trim()) {
      console.log('🔊 Empty text, not speaking');
      return;
    }

    // If already speaking, cancel current speech first
    if (isSpeaking || isProcessingRef.current) {
      console.log('🔊 Already speaking, cancelling current speech');
      cancelSpeech();
      // Wait a bit for cancellation to complete
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Cancel any existing speech in the browser
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      console.log('🔊 Cancelling existing browser speech');
      window.speechSynthesis.cancel();
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Generate unique request ID
    const requestId = `speech-${Date.now()}-${Math.random()}`;
    lastRequestIdRef.current = requestId;
    console.log('🔊 Starting new speech request:', requestId);

    try {
      const voice = findBestVoiceForLanguage(language);
      console.log('🔊 Selected voice:', voice?.name || 'default');
      
      await executeSpeech(text, language, voice, requestId);
      console.log('🔊 Speech execution completed successfully');
    } catch (error) {
      console.error('🔊 Error in speakText:', error);
      setIsSpeaking(false);
      isProcessingRef.current = false;
      throw error; // Re-throw so calling code can handle it
    }
  }, [speechSynthesisSupported, findBestVoiceForLanguage, executeSpeech, cancelSpeech, isSpeaking, isProcessingRef, lastRequestIdRef, setIsSpeaking]);

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
