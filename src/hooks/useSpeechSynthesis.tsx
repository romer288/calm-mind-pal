
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
  const isInitializedRef = useRef(false);

  const { voicesLoaded, findBestVoiceForLanguage } = useVoiceSelection();
  const { toast } = useToast();

  // Check for speech synthesis support and initialize
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesisSupported(true);
      console.log('🔊 Speech synthesis is supported');
      
      // Initialize speech synthesis
      if (!isInitializedRef.current) {
        // Trigger voices loading by creating a test utterance
        const testUtterance = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(testUtterance);
        window.speechSynthesis.cancel();
        isInitializedRef.current = true;
        console.log('🔊 Speech synthesis initialized');
      }
    } else {
      console.log('🔊 Speech synthesis is not supported');
      setSpeechSynthesisSupported(false);
    }
  }, []);

  const speakText = useCallback(async (text: string, language: 'en' | 'es' = 'en'): Promise<void> => {
    console.log('🔊 speakText called:', { text: text.substring(0, 50), language, isProcessing: isProcessingRef.current });
    
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

    // Cancel any current speech
    if (window.speechSynthesis.speaking) {
      console.log('🔊 Stopping current speech');
      window.speechSynthesis.cancel();
    }

    // Clear any existing timeout
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }

    return new Promise<void>((resolve, reject) => {
      isProcessingRef.current = true;
      setIsSpeaking(true);

      try {
        // Wait for voices to be available
        const waitForVoices = () => {
          return new Promise<void>((voiceResolve) => {
            if (window.speechSynthesis.getVoices().length > 0 || voicesLoaded) {
              voiceResolve();
            } else {
              // Wait for voices to load
              const checkVoices = () => {
                if (window.speechSynthesis.getVoices().length > 0) {
                  voiceResolve();
                } else {
                  setTimeout(checkVoices, 100);
                }
              };
              setTimeout(checkVoices, 100);
            }
          });
        };

        waitForVoices().then(() => {
          try {
            const voice = findBestVoiceForLanguage(language);
            const config = getSpeechConfig(language);
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Set voice if available
            if (voice) {
              utterance.voice = voice;
              console.log(`🔊 Using voice: ${voice.name} for ${language}`);
            } else {
              console.log(`🔊 No specific voice found for ${language}, using default`);
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
              
              console.log('🔊 Speech completed successfully');
              setIsSpeaking(false);
              isProcessingRef.current = false;
              currentUtteranceRef.current = null;
              
              if (speechTimeoutRef.current) {
                clearTimeout(speechTimeoutRef.current);
                speechTimeoutRef.current = null;
              }
              
              resolve();
            };
            
            utterance.onstart = function(event) {
              console.log('🔊 Speech started successfully');
              
              // Set a safety timeout based on text length
              const estimatedDuration = Math.max(3000, text.length * 80);
              speechTimeoutRef.current = setTimeout(() => {
                console.log('🔊 Speech timeout, forcing completion');
                window.speechSynthesis.cancel();
                completeHandler();
              }, estimatedDuration);
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
                  description: "There was an issue with text-to-speech. Trying again...",
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
            isProcessingRef.current = false;
            reject(error);
          }
        });

      } catch (error) {
        console.error('🔊 Error in speakText:', error);
        setIsSpeaking(false);
        isProcessingRef.current = false;
        reject(error);
      }
    });
  }, [speechSynthesisSupported, findBestVoiceForLanguage, voicesLoaded, toast]);

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
