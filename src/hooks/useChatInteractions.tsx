
import React from 'react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { Language } from '@/types/chat';

export const useChatInteractions = (
  currentLanguage: Language,
  setInputText: (text: string) => void,
  handleSendMessage: () => void
) => {
  const { isListening, speechSupported, startListening } = useSpeechRecognition();
  const { speechSynthesisSupported } = useSpeechSynthesis();

  const handleToggleListening = React.useCallback(() => {
    startListening((transcript: string) => {
      setInputText(transcript);
    }, currentLanguage);
  }, [startListening, setInputText, currentLanguage]);

  const handleKeyPress = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return {
    isListening,
    speechSupported,
    speechSynthesisSupported,
    handleToggleListening,
    handleKeyPress
  };
};
