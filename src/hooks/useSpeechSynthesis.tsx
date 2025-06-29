
import { useState, useEffect, useCallback, useRef } from 'react';
import { useVoiceSelection } from './speech/useVoiceSelection';
import { useSpeechQueue } from './speech/useSpeechQueue';
import { useSpeechUtterance } from './speech/useSpeechUtterance';
import { getMobileDelay } from './speech/speechConfig';

export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
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

    setProcessing(true);
    console.log('🔊 Processing speech queue...');

    try {
      while (hasItems()) {
        const queueItem = getNextItem();
        if (!queueItem) break;

        console.log('🔊 Speaking:', queueItem.text.substring(0, 50) + '...');

        try {
          const voice = findBestVoiceForLanguage(queueItem.language);
          
          const utterance = createUtterance(
            queueItem.text,
            queueItem.language,
            voice,
            () => {
              console.log('🔊 Speech started');
              setIsSpeaking(true);
            },
            () => {
              console.log('🔊 Speech ended');
              setIsSpeaking(false);
              
              // Call the callback if it exists
              if (onStoppedCallbackRef.current) {
                console.log('🔊 Calling onStopped callback');
                const callback = onStoppedCallbackRef.current;
                onStoppedCallbackRef.current = null;
                setTimeout(() => callback(), 200);
              }
            },
            (error) => {
              console.error('🔊 Speech error:', error);
              setIsSpeaking(false);
              
              // Call callback even on error
              if (onStoppedCallbackRef.current) {
                const callback = onStoppedCallbackRef.current;
                onStoppedCallbackRef.current = null;
                setTimeout(() => callback(), 100);
              }
            }
          );

          await speakUtterance(utterance);
          
          // Small delay between queue items
          if (hasItems()) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
        } catch (error) {
          console.error('🔊 Error processing queue item:', error);
          setIsSpeaking(false);
          break;
        }
      }
    } finally {
      setProcessing(false);
      console.log('🔊 Finished processing speech queue');
    }
  }, [findBestVoiceForLanguage, createUtterance, speakUtterance, hasItems, getNextItem, isProcessing, setProcessing]);

  const speakText = useCallback((text: string, language: 'en' | 'es' = 'en', onStopped?: () => void) => {
    console.log('🔊 speakText called:', { text: text.substring(0, 50), language });
    
    if (!speechSynthesisSupported) {
      console.log('🔊 Speech synthesis not supported');
      if (onStopped) onStopped();
      return;
    }

    if (!text.trim()) {
      console.log('🔊 Empty text, not speaking');
      if (onStopped) onStopped();
      return;
    }

    // Store the callback
    if (onStopped) {
      onStoppedCallbackRef.current = onStopped;
    }

    // Cancel any current speech and clear queue
    stopSpeaking();
    
    // Add to queue and process immediately
    addToQueue(text, language);
    processQueue();
    
  }, [speechSynthesisSupported, addToQueue, processQueue]);

  const stopSpeaking = useCallback(() => {
    console.log('🔊 stopSpeaking called');
    
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
    
    // Clear any pending callback
    onStoppedCallbackRef.current = null;
    
  }, [cancelCurrent, clearQueue]);

  // Auto-process queue when voices are loaded
  useEffect(() => {
    if (voicesLoaded && hasItems() && !isProcessing()) {
      console.log('🔊 Voices loaded, processing queue...');
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
