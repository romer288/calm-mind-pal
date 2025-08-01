
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
    console.log('🔊 speakText called:', { text: text.substring(0, 50), language, isSpeaking, isProcessing: isProcessingRef.current });
    
    if (!speechSynthesisSupported) {
      console.log('🔊 Speech synthesis not supported');
      return;
    }

    if (!text.trim()) {
      console.log('🔊 Empty text, not speaking');
      return;
    }

    // Prevent multiple simultaneous speech requests
    if (isProcessingRef.current) {
      console.log('🔊 Speech already in progress, cancelling previous and starting new');
      cancelSpeech();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Cancel any existing speech
    if (isSpeaking) {
      console.log('🔊 Cancelling existing speech');
      cancelSpeech();
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Create unique request ID to prevent race conditions
    const requestId = Date.now().toString();
    lastRequestIdRef.current = requestId;
    isProcessingRef.current = true;

    return new Promise<void>((resolve, reject) => {
      try {
        // Check if request is still valid
        if (lastRequestIdRef.current !== requestId) {
          console.log('🔊 Request superseded, canceling');
          isProcessingRef.current = false;
          resolve();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = findBestVoiceForLanguage(language);
        
        if (voice) {
          utterance.voice = voice;
          console.log('🔊 Using selected voice:', voice.name, 'Local:', voice.localService, 'Lang:', voice.lang);
        } else {
          console.log('🔊 No suitable voice found, using system default');
        }
        
        // Configure speech parameters for British accent and faster, natural speech
        utterance.lang = language === 'es' ? 'es-ES' : 'en-GB'; // Force British English
        utterance.rate = 1.2; // Faster speech rate
        utterance.pitch = 1.0; // Natural pitch
        utterance.volume = 0.95; // Slightly lower volume for comfort
        
        let hasCompleted = false;
        
        const complete = (reason = 'completed') => {
          if (hasCompleted) return;
          hasCompleted = true;
          
          console.log('🔊 Speech', reason);
          
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
          console.log('🔊 Speech started with voice:', utterance.voice?.name || 'system default');
          setIsSpeaking(true);
          
          // Safety timeout
          const maxDuration = Math.max(15000, text.length * 120);
          speechTimeoutRef.current = setTimeout(() => {
            console.log('🔊 Speech timeout after', maxDuration, 'ms');
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
            complete('timed out');
          }, maxDuration);
        };
        
        utterance.onend = () => {
          console.log('🔊 Speech ended normally');
          complete('ended normally');
        };
        
        utterance.onerror = (event) => {
          console.log('🔊 Speech error:', event.error);
          complete('ended with error: ' + event.error);
          if (event.error !== 'interrupted' && event.error !== 'canceled') {
            reject(new Error(`Speech error: ${event.error}`));
            return;
          }
        };
        
        currentUtteranceRef.current = utterance;
        
        console.log('🔊 Starting speech with British settings...');
        window.speechSynthesis.speak(utterance);
        
      } catch (error) {
        console.error('🔊 Error creating speech:', error);
        isProcessingRef.current = false;
        setIsSpeaking(false);
        reject(error);
      }
    });
  }, [speechSynthesisSupported, findBestVoiceForLanguage, isSpeaking, isProcessingRef, currentUtteranceRef, speechTimeoutRef, setIsSpeaking, lastRequestIdRef, cancelSpeech]);

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
