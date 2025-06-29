
import { useState, useEffect } from 'react';

export const useVoiceSelection = () => {
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    console.log('Initializing voice selection...');
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);
        console.log('Voice details:', voices.map(v => ({ name: v.name, lang: v.lang, localService: v.localService, default: v.default })));
        
        if (voices.length > 0) {
          setAvailableVoices(voices);
          setVoicesLoaded(true);
        }
      };

      loadVoices();
      
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // For iOS, we need multiple attempts to load voices
      setTimeout(() => {
        loadVoices();
        // Trigger voice loading on iOS
        const testUtterance = new SpeechSynthesisUtterance('');
        testUtterance.volume = 0;
        window.speechSynthesis.speak(testUtterance);
        window.speechSynthesis.cancel();
      }, 100);

      // Additional attempt for mobile devices
      setTimeout(loadVoices, 500);
      setTimeout(loadVoices, 1000);
    }
  }, []);

  const findBestVoiceForLanguage = (language: 'en' | 'es') => {
    if (availableVoices.length === 0) {
      console.log('No voices available yet');
      return null;
    }

    console.log(`Finding best voice for language: ${language}`);
    
    // Detect if we're on iOS/mobile
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log('Platform detection:', { isIOS, isMobile });

    if (language === 'es') {
      // Spanish voice priorities - focus on high-quality, non-robotic voices
      const spanishVoicePreferences = [
        // iOS/Safari specific high-quality Spanish voices
        { name: 'Mónica', exact: true, priority: 10 },
        { name: 'Paulina', exact: true, priority: 9 },
        { name: 'Marisol', exact: true, priority: 8 },
        { name: 'Soledad', exact: true, priority: 7 },
        
        // Google voices (usually high quality)
        { name: 'Google español', partial: true, priority: 8 },
        { name: 'Google Español', partial: true, priority: 8 },
        
        // Microsoft voices
        { name: 'Microsoft Sabina', partial: true, priority: 7 },
        { name: 'Microsoft Helena', partial: true, priority: 6 },
        
        // Generic patterns for Spanish
        { name: 'es-', partial: true, priority: 4 },
        { name: 'spanish', partial: true, priority: 3 },
        { name: 'español', partial: true, priority: 3 }
      ];

      // Find the best matching voice
      let bestVoice = null;
      let bestPriority = 0;

      for (const voice of availableVoices) {
        // Only consider Spanish voices
        if (!voice.lang.toLowerCase().startsWith('es')) continue;

        for (const pref of spanishVoicePreferences) {
          const matchesName = pref.exact 
            ? voice.name === pref.name
            : voice.name.toLowerCase().includes(pref.name.toLowerCase());

          if (matchesName && pref.priority > bestPriority) {
            bestVoice = voice;
            bestPriority = pref.priority;
          }
        }

        // Prefer local/device voices for better quality
        if (voice.localService && bestPriority < 5) {
          bestVoice = voice;
          bestPriority = 5;
        }
      }

      if (bestVoice) {
        console.log('Selected Spanish voice:', bestVoice.name, 'Priority:', bestPriority);
        return bestVoice;
      }

      // Fallback: any Spanish voice
      const anySpanishVoice = availableVoices.find(v => v.lang.toLowerCase().startsWith('es'));
      if (anySpanishVoice) {
        console.log('Using fallback Spanish voice:', anySpanishVoice.name);
        return anySpanishVoice;
      }

    } else {
      // English voice priorities - focus on natural-sounding voices
      const englishVoicePreferences = [
        // iOS/Safari high-quality English voices
        { name: 'Samantha', exact: true, priority: 10 },
        { name: 'Karen', exact: true, priority: 9 },
        { name: 'Moira', exact: true, priority: 8 },
        { name: 'Tessa', exact: true, priority: 7 },
        { name: 'Veena', exact: true, priority: 6 },
        
        // Google voices
        { name: 'Google UK English Female', exact: true, priority: 9 },
        { name: 'Google US English Female', exact: true, priority: 9 },
        
        // Microsoft voices
        { name: 'Microsoft Zira', partial: true, priority: 7 },
        { name: 'Microsoft Hazel', partial: true, priority: 6 },
        
        // Generic female indicators
        { name: 'female', partial: true, priority: 5 },
        { name: 'woman', partial: true, priority: 5 }
      ];

      let bestVoice = null;
      let bestPriority = 0;

      for (const voice of availableVoices) {
        // Only consider English voices
        if (!voice.lang.toLowerCase().startsWith('en')) continue;

        for (const pref of englishVoicePreferences) {
          const matchesName = pref.exact 
            ? voice.name === pref.name
            : voice.name.toLowerCase().includes(pref.name.toLowerCase());

          if (matchesName && pref.priority > bestPriority) {
            bestVoice = voice;
            bestPriority = pref.priority;
          }
        }

        // Prefer local/device voices for better quality
        if (voice.localService && bestPriority < 5) {
          bestVoice = voice;
          bestPriority = 5;
        }
      }

      if (bestVoice) {
        console.log('Selected English voice:', bestVoice.name, 'Priority:', bestPriority);
        return bestVoice;
      }

      // Fallback: any English voice that's not obviously male
      const maleKeywords = ['male', 'man', 'david', 'daniel', 'fred', 'alex', 'tom', 'john'];
      const englishVoice = availableVoices.find(voice => 
        voice.lang.toLowerCase().startsWith('en') && 
        !maleKeywords.some(keyword => voice.name.toLowerCase().includes(keyword))
      );

      if (englishVoice) {
        console.log('Using fallback English voice:', englishVoice.name);
        return englishVoice;
      }
    }
    
    console.log('No suitable voice found for language:', language);
    return null;
  };

  return {
    voicesLoaded,
    availableVoices,
    findBestVoiceForLanguage
  };
};
