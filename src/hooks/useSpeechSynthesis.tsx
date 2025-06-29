
import { useState, useEffect, useCallback, useRef } from 'react';
import { useVoiceSelection } from './speech/useVoiceSelection';
import { getSpeechConfig } from './speech/speechConfig';
import { useToast } from '@/hooks/use-toast';

export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const speakText = useCallback((text: string, language: 'en' | 'es' = 'en') => {
    console.log('🔊 speakText called:', { text: text.substring(0, 50), language });
    
    if (!speechSynthesisSupported) {
      console.log('🔊 Speech synthesis not supported');
      return Promise.resolve();
    }

    if (!text.trim()) {
      console.log('🔊 Empty text, not speaking');
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      // Cancel any current speech and clear timeout
      if (window.speechSynthesis.speaking) {
        console.log('🔊 Cancelling current speech');
        window.speechSynthesis.cancel();
      }
      
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
        speechTimeoutRef.current = null;
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
          
          let hasEnded = false;
          
          const completeHandler = () => {
            if (hasEnded) return;
            hasEnded = true;
            
            console.log('🔊 Speech completed');
            setIsSpeaking(false);
            currentUtteranceRef.current = null;
            
            if (speechTimeoutRef.current) {
              clearTimeout(speechTimeoutRef.current);
              speechTimeoutRef.current = null;
            }
            
            resolve();
          };
          
          utterance.onstart = function(event) {
            console.log('🔊 Speech started successfully');
            setIsSpeaking(true);
            
            // Set a safety timeout
            const maxDuration = Math.max(5000, text.length * 100);
            speechTimeoutRef.current = setTimeout(() => {
              console.log('🔊 Speech timeout, forcing completion');
              completeHandler();
            }, maxDuration);
          };
          
          utterance.onend = function(event) {
            console.log('🔊 Speech ended normally');
            completeHandler();
          };
          
          utterance.onerror = function(event) {
            console.error('🔊 Speech error:', event.error);
            
            if (event.error !== 'interrupted' && event.error !== 'canceled') {
              toast({
                title: "Voice Issue",
                description: "There was an issue with text-to-speech.",
                variant: "destructive",
              });
            }
            
            completeHandler();
          };
          
          currentUtteranceRef.current = utterance;
          
          console.log('🔊 Starting speech synthesis...');
          window.speechSynthesis.speak(utterance);
          
        } catch (error) {
          console.error('🔊 Error creating utterance:', error);
          setIsSpeaking(false);
          resolve();
        }
      }, 100);
    });
  }, [speechSynthesisSupported, findBestVoiceForLanguage, toast]);

  const stopSpeaking = useCallback(() => {
    console.log('🔊 stopSpeaking called');
    
    // Cancel current speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Clear timeout
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    
    // Reset states
    setIsSpeaking(false);
    currentUtteranceRef.current = null;
    
  }, []);

  return {
    speechSynthesisSupported,
    isSpeaking,
    speakText,
    stopSpeaking
  };
};
