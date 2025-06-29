
import { useState, useEffect, useCallback, useRef } from 'react';
import { useVoiceSelection } from './speech/useVoiceSelection';
import { getSpeechConfig } from './speech/speechConfig';
import { useToast } from '@/hooks/use-toast';

export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

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

    // Prevent multiple simultaneous calls
    if (isProcessingRef.current) {
      console.log('🔊 Already processing speech, skipping');
      return Promise.resolve();
    }

    // Cancel any current speech first
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      console.log('🔊 Cancelling existing speech');
      window.speechSynthesis.cancel();
      
      // Wait a bit for cancellation to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return new Promise<void>((resolve) => {
      isProcessingRef.current = true;
      setIsSpeaking(true);

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
        
        let hasCompleted = false;
        
        const completeHandler = () => {
          if (hasCompleted) return;
          hasCompleted = true;
          
          console.log('🔊 Speech completed');
          setIsSpeaking(false);
          isProcessingRef.current = false;
          currentUtteranceRef.current = null;
          
          if (speechTimeoutRef.current) {
            clearTimeout(speechTimeoutRef.current);
            speechTimeoutRef.current = null;
          }
          
          resolve();
        };
        
        utterance.onstart = () => {
          console.log('🔊 Speech started successfully');
          
          // Set a safety timeout
          const estimatedDuration = Math.max(5000, text.length * 100);
          speechTimeoutRef.current = setTimeout(() => {
            console.log('🔊 Speech timeout, forcing completion');
            window.speechSynthesis.cancel();
            completeHandler();
          }, estimatedDuration);
        };
        
        utterance.onend = () => {
          console.log('🔊 Speech ended normally');
          completeHandler();
        };
        
        utterance.onerror = (event) => {
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
        
        // Start speech with a small delay to ensure browser is ready
        setTimeout(() => {
          console.log('🔊 Starting speech synthesis...');
          window.speechSynthesis.speak(utterance);
        }, 50);
        
      } catch (error) {
        console.error('🔊 Error in speakText:', error);
        setIsSpeaking(false);
        isProcessingRef.current = false;
        resolve();
      }
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
    isProcessingRef.current = false;
    currentUtteranceRef.current = null;
  }, []);

  return {
    speechSynthesisSupported,
    isSpeaking,
    speakText,
    stopSpeaking
  };
};
