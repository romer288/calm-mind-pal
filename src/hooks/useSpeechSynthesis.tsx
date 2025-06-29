
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useSpeechSynthesis = () => {
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechQueueRef = useRef<Array<{ text: string; language: 'en' | 'es' }>>([]);
  const isProcessingRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Initializing speech synthesis...');
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      console.log('Speech synthesis is available');
      setSpeechSynthesisSupported(true);
      
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
    } else {
      console.log('Speech synthesis not available in this browser');
      setSpeechSynthesisSupported(false);
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

  const processNextInQueue = async () => {
    if (isProcessingRef.current || speechQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const { text, language } = speechQueueRef.current.shift()!;

    try {
      await speakTextDirectly(text, language);
    } catch (error) {
      console.error('Error processing speech queue:', error);
    } finally {
      isProcessingRef.current = false;
      // Process next item if queue is not empty
      if (speechQueueRef.current.length > 0) {
        setTimeout(processNextInQueue, 200);
      }
    }
  };

  const speakTextDirectly = async (text: string, language: 'en' | 'es' = 'en'): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log('Speaking text directly:', text.substring(0, 50), 'in language:', language);
      
      if (!speechSynthesisSupported) {
        console.log('Speech synthesis not supported');
        resolve();
        return;
      }

      if (!voicesLoaded) {
        console.log('Voices not loaded yet, rejecting...');
        reject(new Error('Voices not loaded'));
        return;
      }

      try {
        // Always cancel any current speech to prevent mixing
        if (currentUtteranceRef.current) {
          console.log('Cancelling previous speech');
          window.speechSynthesis.cancel();
          currentUtteranceRef.current = null;
        }

        // Wait for cancellation to complete on mobile
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(text);
          currentUtteranceRef.current = utterance;
          
          // Find and set the best voice for the language
          const selectedVoice = findBestVoiceForLanguage(language);
          
          if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log(`Using voice: ${selectedVoice.name} for ${language === 'es' ? 'Spanish' : 'English'}`);
          } else {
            console.log('No suitable voice found, using system default');
          }
          
          // Configure speech parameters based on language and platform
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          if (language === 'es') {
            utterance.lang = 'es-ES';
            utterance.rate = isMobile ? 0.9 : 1.0;
            utterance.pitch = isIOS ? 1.1 : 1.3;
          } else {
            utterance.lang = 'en-US';
            utterance.rate = isMobile ? 0.85 : 0.95;
            utterance.pitch = isIOS ? 1.0 : 1.2;
          }
          
          utterance.volume = 1.0;
          
          // Enhanced event handlers
          utterance.onstart = () => {
            console.log(`Speech started in ${language} with voice:`, selectedVoice?.name || 'default');
            setIsSpeaking(true);
          };
          
          utterance.onend = () => {
            console.log('Speech ended normally');
            currentUtteranceRef.current = null;
            setIsSpeaking(false);
            resolve();
          };
          
          utterance.onerror = (event) => {
            console.error('Speech error:', event.error, event);
            currentUtteranceRef.current = null;
            setIsSpeaking(false);
            
            if (event.error !== 'interrupted' && event.error !== 'canceled') {
              toast({
                title: "Voice Issue",
                description: "There was an issue with text-to-speech. You can still read the message.",
                variant: "destructive",
              });
            }
            
            reject(new Error(`Speech error: ${event.error}`));
          };
          
          // Speak the utterance
          console.log('Starting speech synthesis...');
          window.speechSynthesis.speak(utterance);
        }, 300);
        
      } catch (error) {
        console.error('Speech synthesis error:', error);
        currentUtteranceRef.current = null;
        setIsSpeaking(false);
        reject(error);
      }
    });
  };

  const speakText = (text: string, language: 'en' | 'es' = 'en') => {
    console.log('Queueing text for speech:', text.substring(0, 50), 'Language:', language);
    
    // Clear existing queue and add new item
    speechQueueRef.current = [{ text, language }];
    
    // Stop current speech
    stopSpeaking();
    
    // Process the queue
    setTimeout(processNextInQueue, 100);
  };

  const stopSpeaking = () => {
    console.log('Stopping speech synthesis');
    
    // Clear the queue
    speechQueueRef.current = [];
    isProcessingRef.current = false;
    
    // Cancel current speech
    if (currentUtteranceRef.current) {
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
    }
    
    setIsSpeaking(false);
  };

  return {
    speechSynthesisSupported,
    voicesLoaded,
    availableVoices,
    isSpeaking,
    speakText,
    stopSpeaking
  };
};
