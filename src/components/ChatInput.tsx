
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Send } from 'lucide-react';
import { Language } from '@/types/chat';

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  isListening: boolean;
  speechSupported: boolean;
  onToggleListening: () => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  currentLanguage: Language;
}

const ChatInput = ({
  inputText,
  setInputText,
  isListening,
  speechSupported,
  onToggleListening,
  onSendMessage,
  onKeyPress,
  currentLanguage
}: ChatInputProps) => {
  const getPlaceholder = () => {
    if (currentLanguage === 'es') {
      return isListening 
        ? "Escuchando..." 
        : speechSupported 
          ? "Escribe o habla tu mensaje..." 
          : "Escribe tu mensaje...";
    }
    return isListening 
      ? "Listening..." 
      : speechSupported 
        ? "Type or speak your message..." 
        : "Type your message...";
  };

  const getVoiceButtonTitle = () => {
    if (currentLanguage === 'es') {
      return speechSupported ? "Entrada de voz" : "Entrada de voz no compatible";
    }
    return speechSupported ? "Voice input" : "Voice input not supported";
  };

  const getListeningText = () => {
    if (currentLanguage === 'es') {
      return "Escuchando tu voz...";
    }
    return "Listening for your voice...";
  };

  const handleSendClick = () => {
    console.log('Send button clicked, inputText:', inputText);
    if (inputText.trim()) {
      onSendMessage();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex space-x-2">
        <Button
          onClick={onToggleListening}
          variant={isListening ? "destructive" : "outline"}
          size="icon"
          className="shrink-0"
          disabled={!speechSupported}
          title={getVoiceButtonTitle()}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          className="flex-1"
          disabled={isListening}
        />
        <Button
          onClick={handleSendClick}
          disabled={!inputText.trim()}
          size="icon"
          className="shrink-0"
          type="button"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      {isListening && (
        <p className={`text-sm mt-2 flex items-center gap-1 ${
          currentLanguage === 'es' ? 'text-pink-600' : 'text-blue-600'
        }`}>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          {getListeningText()}
        </p>
      )}
    </div>
  );
};

export default ChatInput;
