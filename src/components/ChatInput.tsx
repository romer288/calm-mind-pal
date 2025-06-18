
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Send } from 'lucide-react';

interface ChatInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  isListening: boolean;
  speechSupported: boolean;
  onToggleListening: () => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

const ChatInput = ({
  inputText,
  setInputText,
  isListening,
  speechSupported,
  onToggleListening,
  onSendMessage,
  onKeyPress
}: ChatInputProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex space-x-2">
        <Button
          onClick={onToggleListening}
          variant={isListening ? "destructive" : "outline"}
          size="icon"
          className="shrink-0"
          disabled={!speechSupported}
          title={speechSupported ? "Voice input" : "Voice input not supported"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={
            isListening 
              ? "Listening..." 
              : speechSupported 
                ? "Type or speak your message..." 
                : "Type your message..."
          }
          className="flex-1"
          disabled={isListening}
        />
        <Button
          onClick={onSendMessage}
          disabled={!inputText.trim() || isListening}
          size="icon"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      {isListening && (
        <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          Listening for your voice...
        </p>
      )}
    </div>
  );
};

export default ChatInput;
