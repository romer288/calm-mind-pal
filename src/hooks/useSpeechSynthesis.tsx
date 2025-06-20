
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useSpeechSynthesis = () => {
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
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

  const speakText = (text: string, language: 'en' | 'es' = 'en') => {
    console.log('Attempting to speak:', text, 'in language:', language);
    
    if (!speechSynthesisSupported) {
      console.log('Speech synthesis not supported');
      return;
    }
    
    try {
      // Cancel any current speech before starting new one
      if (currentUtteranceRef.current) {
        window.speechSynthesis.cancel();
        currentUtteranceRef.current = null;
      }
      
      // Wait a bit to ensure cancellation is complete
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        currentUtteranceRef.current = utterance;
        
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);
        
        let selectedVoice = null;
        
        if (language === 'es') {
          // Spanish feminine voices (Monica)
          const spanishFeminineVoices = [
            'Google español',
            'Microsoft Sabina Desktop - Spanish (Mexico)',
            'Microsoft Helena Desktop - Spanish (Spain)',
            'Paulina',
            'Monica',
            'Esperanza',
            'Soledad'
          ];
          
          for (const voiceName of spanishFeminineVoices) {
            selectedVoice = voices.find(voice => voice.name.includes(voiceName));
            if (selectedVoice) break;
          }
          
          if (!selectedVoice) {
            selectedVoice = voices.find(voice => 
              (voice.lang.startsWith('es') || voice.lang.includes('es')) && 
              (voice.name.toLowerCase().includes('female') ||
               voice.name.toLowerCase().includes('woman') ||
               voice.name.toLowerCase().includes('monica') ||
               voice.name.toLowerCase().includes('helena') ||
               voice.name.toLowerCase().includes('sabina') ||
               voice.name.toLowerCase().includes('paulina'))
            );
          }
          
          if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.lang.startsWith('es'));
          }
          
          utterance.lang = 'es-ES';
          utterance.rate = 0.85;
          utterance.pitch = 1.2;
        } else {
          // English feminine voices (Vanessa)
          const englishFeminineVoices = [
            'Google UK English Female',
            'Microsoft Zira Desktop - English (United States)',
            'Samantha',
            'Karen',
            'Moira',
            'Tessa',
            'Vanessa'
          ];
          
          for (const voiceName of englishFeminineVoices) {
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
          
          utterance.lang = 'en-US';
          utterance.rate = 0.9;
          utterance.pitch = 1.1;
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log(`Using ${language === 'es' ? 'Monica' : 'Vanessa'} voice:`, selectedVoice.name);
        }
        
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
          console.log('Speech started');
        };
        
        utterance.onend = () => {
          console.log('Speech ended');
          currentUtteranceRef.current = null;
        };
        
        utterance.onerror = (event) => {
          console.error('Speech error:', event.error);
          currentUtteranceRef.current = null;
          
          // Only show toast for non-interruption errors
          if (event.error !== 'interrupted') {
            toast({
              title: "Audio Issue",
              description: "Text-to-speech had an issue, but you can still read the message.",
              variant: "destructive",
            });
          }
        };
        
        window.speechSynthesis.speak(utterance);
      }, 200);
      
    } catch (error) {
      console.error('Speech synthesis error:', error);
      currentUtteranceRef.current = null;
    }
  };

  return {
    speechSynthesisSupported,
    voicesLoaded,
    speakText
  };
};
