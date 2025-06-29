
import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSpeechConfig, getCancellationDelay } from './speechConfig';

export const useSpeechUtterance = () => {
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { toast } = useToast();

  const createUtterance = (
    text: string, 
    language: 'en' | 'es', 
    voice: SpeechSynthesisVoice | null,
    onStart: () => void,
    onEnd: () => void,
    onError: (error: Error) => void
  ): SpeechSynthesisUtterance => {
    const utterance = new SpeechSynthesisUtterance(text);
    const config = getSpeechConfig(language);
    
    // Set voice
    if (voice) {
      utterance.voice = voice;
      console.log(`Using voice: ${voice.name} for ${language === 'es' ? 'Spanish' : 'English'}`);
    } else {
      console.log('No suitable voice found, using system default');
    }
    
    // Configure speech parameters
    utterance.lang = config.lang;
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;
    
    // Set event handlers - fix the 'this' context errors
    utterance.onstart = (event) => {
      console.log(`Speech started in ${language} with voice:`, voice?.name || 'default');
      onStart();
    };
    
    utterance.onend = (event) => {
      console.log('Speech ended normally');
      currentUtteranceRef.current = null;
      onEnd();
    };
    
    utterance.onerror = (event) => {
      console.error('Speech error:', event.error, event);
      currentUtteranceRef.current = null;
      
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        toast({
          title: "Voice Issue",
          description: "There was an issue with text-to-speech. You can still read the message.",
          variant: "destructive",
        });
      }
      
      onError(new Error(`Speech error: ${event.error}`));
    };
    
    return utterance;
  };

  const speakUtterance = async (utterance: SpeechSynthesisUtterance): Promise<void> => {
    return new Promise((resolve, reject) => {
      currentUtteranceRef.current = utterance;
      
      // Enhanced event handlers for promise resolution
      const originalOnEnd = utterance.onend;
      const originalOnError = utterance.onerror;
      
      utterance.onend = (event) => {
        if (originalOnEnd) originalOnEnd.call(utterance, event);
        resolve();
      };
      
      utterance.onerror = (event) => {
        if (originalOnError) originalOnError.call(utterance, event);
        reject(new Error(`Speech error: ${event.error}`));
      };
      
      // Speak with delay for mobile stability
      setTimeout(() => {
        console.log('Starting speech synthesis...');
        window.speechSynthesis.speak(utterance);
      }, getCancellationDelay());
    });
  };

  const cancelCurrent = () => {
    console.log('Cancelling current utterance');
    if (currentUtteranceRef.current) {
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
    }
  };

  return {
    createUtterance,
    speakUtterance,
    cancelCurrent
  };
};
