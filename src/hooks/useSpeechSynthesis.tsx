
import { useState, useEffect, useCallback, useRef } from 'react';
import { useVoiceSelection } from './speech/useVoiceSelection';
import { useSpeechQueue } from './speech/useSpeechQueue';
import { useSpeechUtterance } from './speech/useSpeechUtterance';
import { getMobileDelay } from './speech/speechConfig';

export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const lastTextRef = useRef<string>('');
  const onStoppedCallbackRef = useRef<(() => void) | null>(null);

  const { voicesLoaded, findBestVoiceForLanguage } = useVoiceSelection();
  const { addToQueue, clearQueue, getNextItem, hasItems, setProcessing, isProcessing } = useSpeechQueue();
  const { createUtterance, speakUtterance, cancelCurrent, isCurrentlySpeaking } = useSpeechUtterance();

  // Detect iPhone
  const isIPhone = /iPhone/.test(navigator.userAgent);

  // Check for speech synthesis support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesisSupported(true);
      console.log('Speech synthesis is supported');
    } else {
      console.log('Speech synthesis is not supported');
      setSpeechSynthesisSupported(false);
    }
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessing() || !hasItems()) {
      return;
    }

    // Extra protection against loops
    if (isCurrentlySpeaking()) {
      console.log('Speech utterance already in progress, skipping queue processing');
      return;
    }

    setProcessing(true);
    console.log('Starting to process speech queue...');

    try {
      while (hasItems()) {
        const queueItem = getNextItem();
        if (!queueItem) break;

        console.log('Processing queue item:', queueItem.text.substring(0, 50) + '...');

        try {
          const voice = findBestVoiceForLanguage(queueItem.language);
          
          const utterance = createUtterance(
            queueItem.text,
            queueItem.language,
            voice,
            () => {
              console.log('Started speaking:', queueItem.text.substring(0, 30) + '...');
              setIsSpeaking(true);
            },
            () => {
              console.log('Finished speaking:', queueItem.text.substring(0, 30) + '...');
              setIsSpeaking(false);
              
              // Call the stopped callback if it exists
              if (onStoppedCallbackRef.current) {
                console.log('Calling onStopped callback');
                const callback = onStoppedCallbackRef.current;
                onStoppedCallbackRef.current = null;
                
                // Small delay for callback
                setTimeout(() => callback(), isIPhone ? 300 : 100);
              }
            },
            (error) => {
              console.error('Speech error in queue processing:', error);
              setIsSpeaking(false);
              
              // Call the stopped callback even on error
              if (onStoppedCallbackRef.current) {
                console.log('Calling onStopped callback after error');
                const callback = onStoppedCallbackRef.current;
                onStoppedCallbackRef.current = null;
                setTimeout(() => callback(), 100);
              }
            }
          );

          await speakUtterance(utterance);
          
          // Add delay between queue items on mobile
          if (hasItems()) {
            await new Promise(resolve => setTimeout(resolve, getMobileDelay()));
          }
          
        } catch (error) {
          console.error('Error processing queue item:', error);
          setIsSpeaking(false);
          break;
        }
      }
    } finally {
      setProcessing(false);
      console.log('Finished processing speech queue');
    }
  }, [findBestVoiceForLanguage, createUtterance, speakUtterance, hasItems, getNextItem, isProcessing, setProcessing, isCurrentlySpeaking, isIPhone]);

  const speakText = useCallback((text: string, language: 'en' | 'es' = 'en', onStopped?: () => void) => {
    console.log('🔊 speakText called:', { text: text.substring(0, 50), language, voicesLoaded });
    
    if (!speechSynthesisSupported) {
      console.log('Speech synthesis not supported');
      if (onStopped) onStopped();
      return;
    }

    if (!text.trim()) {
      console.log('Empty text, not speaking');
      if (onStopped) onStopped();
      return;
    }

    // Only prevent if it's a very short repeated text (likely a loop)
    if (text === lastTextRef.current && text.length < 5 && (isSpeaking || isCurrentlySpeaking())) {
      console.log('Preventing very short repeated text:', text);
      if (onStopped) onStopped();
      return;
    }

    // Store the callback for when speech stops
    if (onStopped) {
      onStoppedCallbackRef.current = onStopped;
    }

    // Cancel any current speech and clear queue
    stopSpeaking();
    
    // Store the current text
    lastTextRef.current = text;
    
    // Add to queue and process
    addToQueue(text, language);
    
    // Process queue with small delay
    setTimeout(() => {
      processQueue();
    }, 100);
    
  }, [speechSynthesisSupported, isSpeaking, addToQueue, processQueue, isCurrentlySpeaking]);

  const stopSpeaking = useCallback(() => {
    console.log('🛑 stopSpeaking called');
    
    // Cancel current speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Cancel current utterance
    cancelCurrent();
    
    // Clear queue
    clearQueue();
    
    // Reset states
    setIsSpeaking(false);
    lastTextRef.current = '';
    
    // Clear any pending callback
    onStoppedCallbackRef.current = null;
    
  }, [cancelCurrent, clearQueue]);

  // Auto-process queue when voices are loaded
  useEffect(() => {
    if (voicesLoaded && hasItems() && !isProcessing()) {
      console.log('Voices loaded, processing queue...');
      processQueue();
    }
  }, [voicesLoaded, processQueue, hasItems, isProcessing]);

  return {
    speechSynthesisSupported,
    isSpeaking,
    speakText,
    stopSpeaking
  };
};
