
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

  const findBestFeminineVoice = (language: 'en' | 'es') => {
    const voices = window.speechSynthesis.getVoices();
    console.log('All available voices:', voices.map(v => ({ name: v.name, lang: v.lang, gender: v.name })));
    
    if (language === 'es') {
      // Spanish feminine voice priorities - most natural sounding first
      const spanishFeminineNames = [
        'Google español de Estados Unidos', // Google Spanish (US) - very natural
        'Microsoft Sabina - Spanish (Mexico)', // Microsoft Sabina
        'Microsoft Helena - Spanish (Spain)', // Microsoft Helena
        'Google español', // Generic Google Spanish
        'Paulina', // macOS Spanish voice
        'Monica', // Common Spanish voice name
        'Esperanza', // macOS Spanish voice
        'Soledad', // macOS Spanish voice
        'Marisol', // Another Spanish voice
        'Carmen' // Spanish voice
      ];
      
      // First try exact name matches
      for (const voiceName of spanishFeminineNames) {
        const voice = voices.find(v => v.name === voiceName);
        if (voice) {
          console.log('Found exact Spanish voice match:', voice.name);
          return voice;
        }
      }
      
      // Then try partial matches with feminine indicators
      const feminineKeywords = ['female', 'woman', 'sabina', 'helena', 'monica', 'carmen', 'esperanza', 'soledad', 'paulina', 'marisol'];
      const spanishVoice = voices.find(voice => 
        (voice.lang.startsWith('es') || voice.lang.includes('es')) && 
        feminineKeywords.some(keyword => voice.name.toLowerCase().includes(keyword))
      );
      
      if (spanishVoice) {
        console.log('Found Spanish feminine voice:', spanishVoice.name);
        return spanishVoice;
      }
      
      // Finally, any Spanish voice (better than English)
      const anySpanishVoice = voices.find(voice => voice.lang.startsWith('es'));
      if (anySpanishVoice) {
        console.log('Using any Spanish voice:', anySpanishVoice.name);
        return anySpanishVoice;
      }
      
    } else {
      // English feminine voice priorities
      const englishFeminineNames = [
        'Google UK English Female', // Very natural sounding
        'Google US English Female', // Also very natural
        'Microsoft Zira - English (United States)', // Microsoft Zira
        'Microsoft Hazel - English (Great Britain)', // Microsoft Hazel
        'Samantha', // macOS default female voice
        'Karen', // macOS voice
        'Moira', // macOS voice
        'Tessa', // macOS voice
        'Veena', // macOS voice
        'Fiona', // macOS voice
        'Alex' // Sometimes can sound feminine
      ];
      
      // First try exact name matches
      for (const voiceName of englishFeminineNames) {
        const voice = voices.find(v => v.name === voiceName);
        if (voice) {
          console.log('Found exact English voice match:', voice.name);
          return voice;
        }
      }
      
      // Then try partial matches with feminine indicators
      const feminineKeywords = ['female', 'woman', 'zira', 'hazel', 'samantha', 'karen', 'moira', 'tessa', 'veena', 'fiona'];
      const englishVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        feminineKeywords.some(keyword => voice.name.toLowerCase().includes(keyword))
      );
      
      if (englishVoice) {
        console.log('Found English feminine voice:', englishVoice.name);
        return englishVoice;
      }
      
      // Try to avoid obviously male voices
      const maleKeywords = ['male', 'man', 'david', 'daniel', 'fred', 'alex'];
      const neutralEnglishVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        !maleKeywords.some(keyword => voice.name.toLowerCase().includes(keyword))
      );
      
      if (neutralEnglishVoice) {
        console.log('Using neutral English voice:', neutralEnglishVoice.name);
        return neutralEnglishVoice;
      }
    }
    
    console.log('No suitable voice found, using default');
    return null;
  };

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
        
        // Find the best feminine voice
        const selectedVoice = findBestFeminineVoice(language);
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log(`Using ${language === 'es' ? 'Monica' : 'Vanessa'} voice:`, selectedVoice.name);
        } else {
          console.log('No suitable voice found, using system default');
        }
        
        // Set language and voice parameters
        if (language === 'es') {
          utterance.lang = 'es-ES';
          utterance.rate = 1.0; // Keep Monica's rate unchanged
          utterance.pitch = 1.3; // Higher pitch for more feminine sound
        } else {
          utterance.lang = 'en-US';
          utterance.rate = 0.95; // Slightly slower for Vanessa (reduced from 1.1)
          utterance.pitch = 1.2; // Higher pitch for more feminine sound
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
