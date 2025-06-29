
import React from 'react';
import { Language } from '@/types/chat';

interface UseInteractionHandlersProps {
  isListening: boolean;
  isSpeaking: boolean;
  currentLanguage: Language;
  languageContext: any;
  startListening: (callback: (transcript: string) => void, language: Language) => void;
  autoStartListening: (callback: (transcript: string) => void, language: Language, delay?: number) => void;
  speakText: (text: string, language?: Language) => Promise<void>;
  stopSpeaking: () => void;
  updateLanguageContext: (text: string, isUserInput?: boolean) => Language;
  setSpeechInProgress: (inProgress: boolean) => void;
  setInputText: (text: string) => void;
  handleSendMessage: () => void;
}

export const useInteractionHandlers = ({
  isListening,
  isSpeaking,
  currentLanguage,
  languageContext,
  startListening,
  autoStartListening,
  speakText,
  stopSpeaking,
  updateLanguageContext,
  setSpeechInProgress,
  setInputText,
  handleSendMessage
}: UseInteractionHandlersProps) => {

  const handleToggleListening = React.useCallback(() => {
    console.log('🎤 Toggling listening, current state:', isListening);
    
    // Stop any current speech before starting to listen
    stopSpeaking();
    setSpeechInProgress(false);
    
    startListening((transcript: string) => {
      console.log('🎤 Speech transcript received:', transcript);
      
      // Detect language of the spoken input
      const detectedLanguage = updateLanguageContext(transcript, true);
      console.log('🌐 Detected language for speech input:', detectedLanguage);
      
      setInputText(transcript);
    }, currentLanguage);
  }, [startListening, setInputText, currentLanguage, updateLanguageContext, stopSpeaking, setSpeechInProgress, isListening]);

  const handleKeyPress = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Auto-start listening after AI response
  const handleAutoStartListening = React.useCallback(() => {
    console.log('🎤 AI finished speaking, checking if we should auto-start microphone...');
    
    // Don't auto-start if we're already listening or if speech is still in progress
    if (isListening || isSpeaking) {
      console.log('🎤 Skipping auto-start: already listening or speaking');
      return;
    }
    
    // Ensure speech has completely finished
    setSpeechInProgress(false);
    
    // Use the conversation language context for better continuity
    const targetLanguage = languageContext.conversationLanguage || currentLanguage;
    
    console.log('🎤 Auto-starting listening in language:', targetLanguage);
    
    // Delay for better stability
    const delay = 800;
    
    autoStartListening((transcript: string) => {
      console.log('🎤 Auto-captured speech transcript:', transcript);
      
      // Don't process very short inputs that might be noise
      if (transcript.length < 2) {
        console.log('🎤 Ignoring very short transcript');
        return;
      }
      
      // Update language context with the new input
      const detectedLanguage = updateLanguageContext(transcript, true);
      console.log('🌐 Auto-speech detected language:', detectedLanguage);
      
      setInputText(transcript);
    }, targetLanguage, delay);
  }, [autoStartListening, setInputText, currentLanguage, languageContext, updateLanguageContext, setSpeechInProgress, isListening, isSpeaking]);

  // Speak function with proper async handling
  const handleSpeakText = React.useCallback(async (text: string, language?: Language) => {
    console.log('🔊 Handling speak text request:', { text: text.substring(0, 50), language });
    
    // Determine the correct language to use
    const targetLanguage = language || updateLanguageContext(text, false);
    console.log('🔊 Speaking in language:', targetLanguage);
    
    // Set speech in progress
    setSpeechInProgress(true);
    
    try {
      // Speak the text with proper language and wait for completion
      await speakText(text, targetLanguage);
      console.log('🔊 Speech completed successfully');
    } catch (error) {
      console.error('🔊 Speech error:', error);
    } finally {
      // Reset speech progress
      setSpeechInProgress(false);
    }
    
  }, [speakText, updateLanguageContext, setSpeechInProgress]);

  const handleStopSpeaking = React.useCallback(() => {
    console.log('🔊 Force stopping all speech and listening');
    stopSpeaking();
    setSpeechInProgress(false);
  }, [stopSpeaking, setSpeechInProgress]);

  return {
    handleToggleListening,
    handleKeyPress,
    handleAutoStartListening,
    handleSpeakText,
    stopSpeaking: handleStopSpeaking
  };
};
