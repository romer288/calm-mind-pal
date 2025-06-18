
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    console.log('Initializing speech recognition...');
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      console.log('Speech recognition is available');
      setSpeechSupported(true);
      
      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast({
            title: "Speech Recognition Error",
            description: `Error: ${event.error}. Please try again or type your message.`,
            variant: "destructive",
          });
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
        };
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        setSpeechSupported(false);
      }
    } else {
      console.log('Speech recognition not available in this browser');
      setSpeechSupported(false);
    }
  }, [toast]);

  const startListening = (onResult: (transcript: string) => void) => {
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
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      console.log('Starting speech recognition');
      try {
        recognitionRef.current.onresult = (event: any) => {
          console.log('Speech recognition result received');
          const transcript = event.results[0][0].transcript;
          console.log('Transcript:', transcript);
          onResult(transcript);
          setIsListening(false);
        };

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

  return {
    isListening,
    speechSupported,
    startListening
  };
};
