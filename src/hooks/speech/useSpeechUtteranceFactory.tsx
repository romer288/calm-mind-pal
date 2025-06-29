
import { useCallback } from 'react';
import { getSpeechConfig } from './speechConfig';
import { useToast } from '@/hooks/use-toast';

export const useSpeechUtteranceFactory = () => {
  const { toast } = useToast();

  const createUtterance = useCallback((
    text: string,
    language: 'en' | 'es',
    voice: SpeechSynthesisVoice | null,
    onStart: () => void,
    onEnd: () => void,
    onError: (error: Error) => void
  ): SpeechSynthesisUtterance => {
    const utterance = new SpeechSynthesisUtterance(text);
    const config = getSpeechConfig(language);
    
    if (voice) {
      utterance.voice = voice;
      console.log(`🔊 Using voice: ${voice.name} for ${language}`);
    }
    
    utterance.lang = config.lang;
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;
    
    let hasCompleted = false;
    
    const completeHandler = () => {
      if (hasCompleted) return;
      hasCompleted = true;
      console.log('🔊 Speech completed');
      onEnd();
    };
    
    utterance.onstart = () => {
      console.log('🔊 Speech started successfully');
      onStart();
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
      onError(new Error(`Speech error: ${event.error}`));
    };
    
    return utterance;
  }, [toast]);

  return { createUtterance };
};
