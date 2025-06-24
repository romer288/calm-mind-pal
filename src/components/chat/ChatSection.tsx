
import React from 'react';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import AdvancedAnxietyTracker from '@/components/AdvancedAnxietyTracker';
import { Message, AICompanion, Language } from '@/types/chat';
import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';

interface ChatSectionProps {
  messages: Message[];
  inputText: string;
  setInputText: (text: string) => void;
  isTyping: boolean;
  isAnalyzing: boolean;
  isListening: boolean;
  speechSupported: boolean;
  aiCompanion: AICompanion;
  currentLanguage: Language;
  scrollRef: React.RefObject<HTMLDivElement>;
  latestAnalysis: ClaudeAnxietyAnalysis | null;
  allAnalyses: ClaudeAnxietyAnalysis[];
  onToggleListening: () => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

const ChatSection: React.FC<ChatSectionProps> = ({
  messages,
  inputText,
  setInputText,
  isTyping,
  isAnalyzing,
  isListening,
  speechSupported,
  aiCompanion,
  currentLanguage,
  scrollRef,
  latestAnalysis,
  allAnalyses,
  onToggleListening,
  onSendMessage,
  onKeyPress
}) => {
  return (
    <div className="flex-1 flex flex-col">
      {/* Only show Advanced Anxiety Analysis */}
      {latestAnalysis && (
        <AdvancedAnxietyTracker 
          currentAnalysis={latestAnalysis}
          recentAnalyses={allAnalyses.slice(-5)}
        />
      )}

      <ChatMessages
        messages={messages}
        isTyping={isTyping}
        isAnalyzing={isAnalyzing}
        scrollRef={scrollRef}
        aiCompanion={aiCompanion}
      />

      <ChatInput
        inputText={inputText}
        setInputText={setInputText}
        isListening={isListening}
        speechSupported={speechSupported}
        onToggleListening={onToggleListening}
        onSendMessage={onSendMessage}
        onKeyPress={onKeyPress}
        currentLanguage={currentLanguage}
      />
    </div>
  );
};

export default ChatSection;
