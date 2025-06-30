
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
      console.log('🔊 Speech already in progress, ignoring new request');
      return;
    }

    // Cancel any existing speech
    if (isSpeaking) {
      console.log('🔊 Cancelling existing speech');
      cancelSpeech();
      // Wait longer for cancellation to complete
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
          console.log('🔊 Using voice:', voice.name);
        }
        
        // Configure speech parameters
        utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
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
          console.log('🔊 Speech started');
          setIsSpeaking(true);
          
          // Safety timeout - be more generous with timing
          const maxDuration = Math.max(20000, text.length * 120);
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
        
        // Additional event listener for boundary events (word boundaries)
        utterance.onboundary = () => {
          // Reset timeout on word boundaries to ensure we don't timeout mid-speech
          if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            const remainingTime = Math.max(10000, (text.length - text.indexOf(' ')) * 120);
            speechTimeoutRef.current = setTimeout(() => {
              console.log('🔊 Speech boundary timeout');
              if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
              complete('boundary timeout');
            }, remainingTime);
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
