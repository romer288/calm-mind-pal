
import { useState, useEffect, useCallback, useRef } from 'react';
import { useVoiceSelection } from './speech/useVoiceSelection';
import { getSpeechConfig } from './speech/speechConfig';
import { useToast } from '@/hooks/use-toast';

export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const onStoppedCallbackRef = useRef<(() => void) | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const { voicesLoaded, findBestVoiceForLanguage } = useVoiceSelection();
  const { toast } = useToast();

  // Check for speech synthesis support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesisSupported(true);
      console.log('🔊 Speech synthesis is supported');
    } else {
      console.log('🔊 Speech synthesis is not supported');
      setSpeechSynthesisSupported(false);
    }
  }, []);

  const speakText = useCallback((text: string, language: 'en' | 'es' = 'en', onStopped?: () => void) => {
    console.log('🔊 speakText called:', { text: text.substring(0, 50), language });
    
    if (!speechSynthesisSupported) {
      console.log('🔊 Speech synthesis not supported');
      if (onStopped) onStopped();
      return;
    }

    if (!text.trim()) {
      console.log('🔊 Empty text, not speaking');
      if (onStopped) onStopped();
      return;
    }

    // Store the callback
    if (onStopped) {
      onStoppedCallbackRef.current = onStopped;
    }

    // Cancel any current speech
    if (window.speechSynthesis.speaking) {
      console.log('🔊 Cancelling current speech');
      window.speechSynthesis.cancel();
    }

    // Wait a moment for cancellation to complete
    setTimeout(() => {
      try {
        const voice = findBestVoiceForLanguage(language);
        const config = getSpeechConfig(language);
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Set voice if available
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
          console.log('🔊 Speech started successfully');
          setIsSpeaking(true);
        };
        
        utterance.onend = function(event) {
          console.log('🔊 Speech ended normally');
          setIsSpeaking(false);
          currentUtteranceRef.current = null;
          
          // Call the callback if it exists
          if (onStoppedCallbackRef.current) {
            console.log('🔊 Calling onStopped callback');
            const callback = onStoppedCallbackRef.current;
            onStoppedCallbackRef.current = null;
            setTimeout(() => callback(), 100);
          }
        };
        
        utterance.onerror = function(event) {
          console.error('🔊 Speech error:', event.error);
          setIsSpeaking(false);
          currentUtteranceRef.current = null;
          
          if (event.error !== 'interrupted' && event.error !== 'canceled') {
            toast({
              title: "Voice Issue",
              description: "There was an issue with text-to-speech.",
              variant: "destructive",
            });
          }
          
          // Call callback even on error
          if (onStoppedCallbackRef.current) {
            const callback = onStoppedCallbackRef.current;
            onStoppedCallbackRef.current = null;
            setTimeout(() => callback(), 100);
          }
        };
        
        currentUtteranceRef.current = utterance;
        
        console.log('🔊 Starting speech synthesis...');
        window.speechSynthesis.speak(utterance);
        
      } catch (error) {
        console.error('🔊 Error creating utterance:', error);
        setIsSpeaking(false);
        if (onStopped) onStopped();
      }
    }, 100);
    
  }, [speechSynthesisSupported, findBestVoiceForLanguage, toast]);

  const stopSpeaking = useCallback(() => {
    console.log('🔊 stopSpeaking called');
    
    // Cancel current speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Reset states
    setIsSpeaking(false);
    currentUtteranceRef.current = null;
    
    // Clear any pending callback
    onStoppedCallbackRef.current = null;
    
  }, []);

  return {
    speechSynthesisSupported,
    isSpeaking,
    speakText,
    stopSpeaking
  };
};
