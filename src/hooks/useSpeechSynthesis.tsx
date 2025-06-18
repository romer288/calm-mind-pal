
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useSpeechSynthesis = () => {
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Initializing speech synthesis...');
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      console.log('Speech synthesis is available');
      setSpeechSynthesisSupported(true);
      
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);
        if (voices.length > 0) {
          setVoicesLoaded(true);
        }
      };

      loadVoices();
      
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      setTimeout(() => {
        loadVoices();
        const testUtterance = new SpeechSynthesisUtterance('');
        testUtterance.volume = 0;
        window.speechSynthesis.speak(testUtterance);
      }, 100);
    } else {
      console.log('Speech synthesis not available in this browser');
      setSpeechSynthesisSupported(false);
    }
  }, []);

  const speakText = (text: string) => {
    console.log('Attempting to speak:', text);
    
    if (!speechSynthesisSupported) {
      console.log('Speech synthesis not supported');
      return;
    }
    
    try {
      window.speechSynthesis.cancel();
      
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);
        
        const preferredVoices = [
          'Google UK English Female',
          'Microsoft Zira Desktop - English (United States)',
          'Samantha',
          'Karen',
          'Moira',
          'Tessa'
        ];
        
        let selectedVoice = null;
        
        for (const voiceName of preferredVoices) {
          selectedVoice = voices.find(voice => voice.name.includes(voiceName));
          if (selectedVoice) break;
        }
        
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.startsWith('en') && 
            (voice.name.toLowerCase().includes('female') ||
             voice.name.toLowerCase().includes('woman') ||
             voice.name.toLowerCase().includes('samantha') ||
             voice.name.toLowerCase().includes('karen'))
          );
        }
        
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log('Using voice:', selectedVoice.name);
        }
        
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        
        utterance.onstart = () => console.log('Speech started');
        utterance.onend = () => console.log('Speech ended');
        utterance.onerror = (event) => {
          console.error('Speech error:', event.error);
          toast({
            title: "Audio Issue",
            description: "Text-to-speech had an issue, but you can still read the message.",
            variant: "destructive",
          });
        };
        
        window.speechSynthesis.speak(utterance);
      }, 100);
      
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  };

  return {
    speechSynthesisSupported,
    voicesLoaded,
    speakText
  };
};
