
import React from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useChatLanguageContext } from '@/hooks/useChatLanguageContext';
import { Language } from '@/types/chat';

export const useChatInteractions = (
  currentLanguage: Language,
  setInputText: (text: string) => void,
  handleSendMessage: () => void
) => {
  const { isListening, speechSupported, startListening, autoStartListening } = useSpeechRecognition();
  const { speechSynthesisSupported, speakText, stopSpeaking } = useSpeechSynthesis();
  const { languageContext, updateLanguageContext, setSpeechInProgress } = useChatLanguageContext();

  const handleToggleListening = React.useCallback(() => {
    // Stop any current speech before starting to listen
    stopSpeaking();
    setSpeechInProgress(false);
    
    startListening((transcript: string) => {
      console.log('Speech transcript received:', transcript);
      
      // Detect language of the spoken input
      const detectedLanguage = updateLanguageContext(transcript, true);
      console.log('Detected language for speech input:', detectedLanguage);
      
      setInputText(transcript);
    }, currentLanguage);
  }, [startListening, setInputText, currentLanguage, updateLanguageContext, stopSpeaking, setSpeechInProgress]);

  const handleKeyPress = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Enhanced function to automatically start listening after AI response
  const handleAutoStartListening = React.useCallback(() => {
    console.log('AI finished speaking, auto-starting microphone...');
    
    // Ensure speech has completely finished
    setSpeechInProgress(false);
    stopSpeaking();
    
    // Use the conversation language context for better continuity
    const targetLanguage = languageContext.conversationLanguage || currentLanguage;
    
    autoStartListening((transcript: string) => {
      console.log('Auto-captured speech transcript:', transcript);
      
      // Update language context with the new input
      const detectedLanguage = updateLanguageContext(transcript, true);
      console.log('Auto-speech detected language:', detectedLanguage);
      
      setInputText(transcript);
    }, targetLanguage, 800); // Longer delay to ensure clean transition
  }, [autoStartListening, setInputText, currentLanguage, languageContext, updateLanguageContext, setSpeechInProgress, stopSpeaking]);

  // Enhanced speak function that respects language context
  const handleSpeakText = React.useCallback((text: string, language?: Language) => {
    console.log('Handling speak text request:', { text: text.substring(0, 50), language });
    
    // Stop any current speech to prevent mixing
    stopSpeaking();
    
    // Determine the correct language to use
    const targetLanguage = language || updateLanguageContext(text, false);
    console.log('Speaking in language:', targetLanguage);
    
    // Set speech in progress
    setSpeechInProgress(true);
    
    // Speak the text with proper language
    speakText(text, targetLanguage);
    
    // Set a timeout to reset speech status (fallback in case events don't fire)
    setTimeout(() => {
      setSpeechInProgress(false);
    }, Math.max(3000, text.length * 100)); // Estimate based on text length
    
  }, [speakText, stopSpeaking, updateLanguageContext, setSpeechInProgress]);

  return {
    isListening,
    speechSupported,
    speechSynthesisSupported,
    languageContext,
    handleToggleListening,
    handleKeyPress,
    handleAutoStartListening,
    handleSpeakText,
    stopSpeaking: () => {
      stopSpeaking();
      setSpeechInProgress(false);
    }
  };
};
