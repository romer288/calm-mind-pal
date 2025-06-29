
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
  const preventLoopRef = useRef<boolean>(false);

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
    if (isProcessing() || !hasItems() || preventLoopRef.current) {
      return;
    }

    // Extra protection against loops
    if (isCurrentlySpeaking()) {
      console.log('Speech utterance already in progress, skipping queue processing');
      return;
    }

    setProcessing(true);
    preventLoopRef.current = true;
    console.log('Starting to process speech queue...');

    try {
      while (hasItems() && !preventLoopRef.current) {
        const queueItem = getNextItem();
        if (!queueItem) break;

        // Check for loop prevention
        if (queueItem.text === lastTextRef.current && queueItem.text.length < 10) {
          console.log('Preventing potential speech loop with short text:', queueItem.text);
          break;
        }

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
                
                // Delay callback for iPhone
                setTimeout(() => callback(), isIPhone ? 500 : 100);
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
          break; // Stop processing on error
        }
      }
    } finally {
      setProcessing(false);
      preventLoopRef.current = false;
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

    // iPhone loop prevention - be more aggressive
    if (isIPhone && text === lastTextRef.current && text.length < 20) {
      console.log('iPhone loop prevention: ignoring repeated short text:', text);
      if (onStopped) onStopped();
      return;
    }

    // Prevent duplicate speech
    if (text === lastTextRef.current && (isSpeaking || isCurrentlySpeaking())) {
      console.log('Same text is already being spoken, ignoring');
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
    
    // Process queue with iPhone-appropriate delay
    setTimeout(() => {
      if (!preventLoopRef.current) {
        processQueue();
      }
    }, isIPhone ? 300 : 100);
    
  }, [speechSynthesisSupported, isSpeaking, addToQueue, processQueue, isCurrentlySpeaking, isIPhone]);

  const stopSpeaking = useCallback(() => {
    console.log('🛑 stopSpeaking called');
    
    // Set loop prevention
    preventLoopRef.current = true;
    
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
    
    // Reset loop prevention after delay
    setTimeout(() => {
      preventLoopRef.current = false;
    }, isIPhone ? 1000 : 500);
    
  }, [cancelCurrent, clearQueue, isIPhone]);

  // Auto-process queue when voices are loaded
  useEffect(() => {
    if (voicesLoaded && hasItems() && !isProcessing() && !preventLoopRef.current) {
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
