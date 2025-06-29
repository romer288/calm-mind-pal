
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const onResultCallbackRef = useRef<((transcript: string) => void) | null>(null);
  const autoStartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('Initializing speech recognition...');
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      console.log('Speech recognition is available');
      setSpeechSupported(true);
      
      try {
        recognitionRef.current = new SpeechRecognition();
        // Enable continuous listening and interim results for better pause handling
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          console.log('Speech recognition result received');
          
          // Clear the silence timer since we're getting speech
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }

          let interimTranscript = '';
          let finalTranscript = '';

          // Process all results
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Update the final transcript accumulator
          if (finalTranscript) {
            finalTranscriptRef.current += finalTranscript + ' ';
            console.log('Final transcript so far:', finalTranscriptRef.current);
          }

          // Start silence detection timer for exactly 7 seconds after speech stops
          if (finalTranscript || interimTranscript) {
            silenceTimerRef.current = setTimeout(() => {
              console.log('7-second silence detected, ending speech recognition');
              if (recognitionRef.current && isListening) {
                const fullTranscript = finalTranscriptRef.current.trim();
                if (fullTranscript && onResultCallbackRef.current) {
                  console.log('Final complete transcript:', fullTranscript);
                  onResultCallbackRef.current(fullTranscript);
                }
                recognitionRef.current.stop();
              }
            }, 7000); // Exactly 7 seconds of silence
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          
          // Clean up timers and state
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          
          setIsListening(false);
          
          // Don't show error for "no-speech" - this is normal during pauses
          if (event.error !== 'no-speech') {
            toast({
              title: "Speech Recognition Error",
              description: `Error: ${event.error}. Please try again or type your message.`,
              variant: "destructive",
            });
          }
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          
          // Clean up timers
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          
          setIsListening(false);
          
          // Send final transcript if we have one
          const fullTranscript = finalTranscriptRef.current.trim();
          if (fullTranscript && onResultCallbackRef.current) {
            console.log('Sending final transcript on end:', fullTranscript);
            onResultCallbackRef.current(fullTranscript);
          }
          
          // Reset for next session
          finalTranscriptRef.current = '';
          onResultCallbackRef.current = null;
        };

      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        setSpeechSupported(false);
      }
    } else {
      console.log('Speech recognition not available in this browser');
      setSpeechSupported(false);
    }

    // Cleanup on unmount
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (autoStartTimeoutRef.current) {
        clearTimeout(autoStartTimeoutRef.current);
      }
    };
  }, [toast]);

  const startListening = (onResult: (transcript: string) => void, language: 'en' | 'es' = 'en') => {
    if (!speechSupported) {
      toast({
        title: "Microphone Not Available",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      console.log('Stopping speech recognition');
      
      // Clean up timers
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      console.log('Starting continuous speech recognition for language:', language);
      try {
        // Reset state for new session
        finalTranscriptRef.current = '';
        onResultCallbackRef.current = onResult;
        
        // Set language based on current language
        recognitionRef.current.lang = language === 'es' ? 'es-ES' : 'en-US';
        
        setIsListening(true);
        recognitionRef.current?.start();
        
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        toast({
          title: "Microphone Error",
          description: "Unable to start speech recognition. Please check permissions.",
          variant: "destructive",
        });
      }
    }
  };

  // New function to automatically start listening after AI stops speaking
  const autoStartListening = (onResult: (transcript: string) => void, language: 'en' | 'es' = 'en', delay: number = 500) => {
    if (!speechSupported || isListening) {
      return;
    }

    console.log(`Auto-starting microphone in ${delay}ms...`);
    
    // Clear any existing auto-start timeout
    if (autoStartTimeoutRef.current) {
      clearTimeout(autoStartTimeoutRef.current);
    }

    autoStartTimeoutRef.current = setTimeout(() => {
      console.log('Auto-starting speech recognition');
      startListening(onResult, language);
    }, delay);
  };

  return {
    isListening,
    speechSupported,
    startListening,
    autoStartListening
  };
};
