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
          
          // Log British voices for debugging
          const britishVoices = voices.filter(v => 
            v.lang.includes('GB') || v.lang.includes('UK') || 
            v.name.toLowerCase().includes('british') ||
            v.name.toLowerCase().includes('uk')
          );
          console.log('British voices found:', britishVoices.map(v => `${v.name} (${v.lang})`));
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
    
    if (language === 'en') {
      // Priority for British female voices
      const englishVoicePreferences = [
        // Highest priority: British female voices
        { pattern: /british.*female/i, priority: 15, lang: 'en-GB' },
        { pattern: /uk.*female/i, priority: 15, lang: 'en-GB' },
        { name: 'Google UK English Female', exact: true, priority: 14, lang: 'en-GB' },
        { name: 'Microsoft Hazel Desktop', exact: true, priority: 13, lang: 'en-GB' },
        { name: 'Microsoft Susan', exact: true, priority: 13, lang: 'en-GB' },
        { name: 'Kate', exact: true, priority: 12, lang: 'en-GB' },
        { name: 'Serena', exact: true, priority: 12, lang: 'en-GB' },
        { name: 'Daniel (Enhanced)', exact: true, priority: 11, lang: 'en-GB' },
        
        // High priority: Any British/UK voice
        { pattern: /british/i, priority: 10, lang: 'en-GB' },
        { pattern: /^.*GB.*$/i, priority: 10, lang: 'en-GB' },
        { pattern: /uk/i, priority: 9, lang: 'en-GB' },
        
        // Medium-high priority: Premium English female voices
        { name: 'Premium', partial: true, priority: 8 },
        { name: 'Enhanced', partial: true, priority: 8 },
        { name: 'Natural', partial: true, priority: 8 },
        
        // Medium priority: Other high-quality female voices
        { name: 'Samantha', exact: true, priority: 7 },
        { name: 'Karen', exact: true, priority: 7 },
        { name: 'Tessa', exact: true, priority: 6 },
        { name: 'Fiona', exact: true, priority: 6 },
        
        // Lower priority: Any female voice
        { pattern: /female/i, priority: 5 },
        { pattern: /woman/i, priority: 4 }
      ];

      let bestVoice = null;
      let bestPriority = 0;

      for (const voice of availableVoices) {
        // Only consider English voices
        if (!voice.lang.toLowerCase().startsWith('en')) continue;

        for (const pref of englishVoicePreferences) {
          let matches = false;
          
          if (pref.exact) {
            matches = voice.name === pref.name;
          } else if (pref.partial) {
            matches = voice.name.toLowerCase().includes(pref.name.toLowerCase());
          } else if (pref.pattern) {
            matches = pref.pattern.test(voice.name) || pref.pattern.test(voice.lang);
          }

          // Extra points for British locale
          const isBritish = voice.lang.includes('GB') || voice.lang.includes('UK') || 
                           voice.lang === 'en-GB' || voice.name.toLowerCase().includes('british');
          const adjustedPriority = isBritish ? pref.priority + 2 : pref.priority;

          if (matches && adjustedPriority > bestPriority) {
            bestVoice = voice;
            bestPriority = adjustedPriority;
          }
        }

        // Avoid robotic/male voices
        const avoidKeywords = ['robot', 'synthetic', 'computer', 'machine', 'male', 'man', 'alex', 'fred', 'tom', 'david', 'mark'];
        const shouldAvoid = avoidKeywords.some(keyword => 
          voice.name.toLowerCase().includes(keyword)
        );
        
        if (shouldAvoid && bestVoice === voice) {
          console.log('Avoiding robotic/male voice:', voice.name);
          bestVoice = null;
          bestPriority = 0;
        }
      }

      if (bestVoice) {
        console.log('🇬🇧 Selected British voice:', bestVoice.name, 'Lang:', bestVoice.lang, 'Priority:', bestPriority, 'Local:', bestVoice.localService);
        return bestVoice;
      }

    } else {
      // Spanish voice logic (unchanged)
      const spanishVoicePreferences = [
        { name: 'Premium', partial: true, priority: 10 },
        { name: 'Enhanced', partial: true, priority: 10 },
        { name: 'Natural', partial: true, priority: 10 },
        { name: 'Mónica', exact: true, priority: 9 },
        { name: 'Paulina', exact: true, priority: 9 },
        { name: 'Marisol', exact: true, priority: 8 },
        { name: 'Soledad', exact: true, priority: 8 },
        { name: 'Google español', partial: true, priority: 8 },
        { name: 'Google Español', partial: true, priority: 8 },
        { name: 'Microsoft Sabina', partial: true, priority: 7 },
        { name: 'Microsoft Helena', partial: true, priority: 6 },
        { name: 'female', partial: true, priority: 5 },
        { name: 'mujer', partial: true, priority: 5 }
      ];

      let bestVoice = null;
      let bestPriority = 0;

      for (const voice of availableVoices) {
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

        if (voice.localService && bestPriority < 6) {
          bestVoice = voice;
          bestPriority = 6;
        }

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
