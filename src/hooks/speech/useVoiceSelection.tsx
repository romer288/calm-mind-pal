
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
        
        if (voices.length > 0) {
          setAvailableVoices(voices);
          setVoicesLoaded(true);
          
          // Log high-quality voices for debugging
          const qualityVoices = voices.filter(v => 
            v.localService && 
            (v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Natural'))
          );
          console.log('High-quality voices found:', qualityVoices.map(v => v.name));
        }
      };

      loadVoices();
      
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Multiple attempts for mobile compatibility
      setTimeout(loadVoices, 100);
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
    
    if (language === 'es') {
      // Enhanced Spanish voice priorities - focus on natural, non-robotic voices
      const spanishVoicePreferences = [
        // High-quality premium voices
        { name: 'Premium', partial: true, priority: 10 },
        { name: 'Enhanced', partial: true, priority: 10 },
        { name: 'Natural', partial: true, priority: 10 },
        
        // iOS/Safari specific high-quality Spanish voices
        { name: 'Mónica', exact: true, priority: 9 },
        { name: 'Paulina', exact: true, priority: 9 },
        { name: 'Marisol', exact: true, priority: 8 },
        { name: 'Soledad', exact: true, priority: 8 },
        
        // Google high-quality voices
        { name: 'Google español', partial: true, priority: 8 },
        { name: 'Google Español', partial: true, priority: 8 },
        
        // Microsoft premium voices
        { name: 'Microsoft Sabina', partial: true, priority: 7 },
        { name: 'Microsoft Helena', partial: true, priority: 6 },
        
        // Female voice preference (generally less robotic)
        { name: 'female', partial: true, priority: 5 },
        { name: 'mujer', partial: true, priority: 5 }
      ];

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

        // Strong preference for local/premium voices
        if (voice.localService && bestPriority < 6) {
          bestVoice = voice;
          bestPriority = 6;
        }

        // Avoid obviously robotic voices
        const roboticKeywords = ['robot', 'synthetic', 'computer', 'machine'];
        const isRobotic = roboticKeywords.some(keyword => 
          voice.name.toLowerCase().includes(keyword)
        );
        
        if (isRobotic && bestVoice === voice) {
          bestVoice = null;
          bestPriority = 0;
        }
      }

      if (bestVoice) {
        console.log('Selected Spanish voice:', bestVoice.name, 'Priority:', bestPriority, 'Local:', bestVoice.localService);
        return bestVoice;
      }

    } else {
      // Enhanced English voice priorities - focus on natural, friendly voices
      const englishVoicePreferences = [
        // Premium/Enhanced voices
        { name: 'Premium', partial: true, priority: 10 },
        { name: 'Enhanced', partial: true, priority: 10 },
        { name: 'Natural', partial: true, priority: 10 },
        
        // iOS/Safari high-quality English voices (female preferred for warmth)
        { name: 'Samantha', exact: true, priority: 9 },
        { name: 'Karen', exact: true, priority: 8 },
        { name: 'Tessa', exact: true, priority: 8 },
        { name: 'Veena', exact: true, priority: 7 },
        { name: 'Fiona', exact: true, priority: 7 },
        
        // Google premium voices
        { name: 'Google UK English Female', exact: true, priority: 9 },
        { name: 'Google US English Female', exact: true, priority: 9 },
        
        // Microsoft premium voices
        { name: 'Microsoft Zira', partial: true, priority: 7 },
        { name: 'Microsoft Hazel', partial: true, priority: 6 },
        
        // General female voice preference
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

        // Strong preference for local/premium voices
        if (voice.localService && bestPriority < 6) {
          bestVoice = voice;
          bestPriority = 6;
        }

        // Avoid robotic/male voices that sound mechanical
        const avoidKeywords = ['robot', 'synthetic', 'computer', 'machine', 'alex', 'fred', 'tom'];
        const shouldAvoid = avoidKeywords.some(keyword => 
          voice.name.toLowerCase().includes(keyword)
        );
        
        if (shouldAvoid && bestVoice === voice) {
          bestVoice = null;
          bestPriority = 0;
        }
      }

      if (bestVoice) {
        console.log('Selected English voice:', bestVoice.name, 'Priority:', bestPriority, 'Local:', bestVoice.localService);
        return bestVoice;
      }
    }
    
    console.log('No suitable high-quality voice found for language:', language);
    return null;
  };

  return {
    voicesLoaded,
    availableVoices,
    findBestVoiceForLanguage
  };
};
