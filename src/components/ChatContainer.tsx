
import React from 'react';
import ChatHeader from '@/components/ChatHeader';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import AdvancedAnxietyTracker from '@/components/AdvancedAnxietyTracker';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useAnxietyAnalysis } from '@/hooks/useAnxietyAnalysis';
import { useChat } from '@/hooks/useChat';
import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';

const ChatContainer = () => {
  const {
    messages,
    inputText,
    setInputText,
    isTyping,
    isAnalyzing,
    currentLanguage,
    aiCompanion,
    scrollRef,
    handleSendMessage
  } = useChat();

  const { isListening, speechSupported, startListening } = useSpeechRecognition();
  const { speechSynthesisSupported } = useSpeechSynthesis();
  const { anxietyAnalyses, currentAnxietyAnalysis } = useAnxietyAnalysis();

  const handleToggleListening = () => {
    startListening((transcript: string) => {
      setInputText(transcript);
    }, currentLanguage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ChatHeader 
        speechSynthesisSupported={speechSynthesisSupported}
        speechSupported={speechSupported}
        aiCompanion={aiCompanion}
        currentLanguage={currentLanguage}
      />

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col">
        {/* Show Advanced Anxiety Analysis if available */}
        {currentAnxietyAnalysis && (
          <AdvancedAnxietyTracker 
            currentAnalysis={currentAnxietyAnalysis as ClaudeAnxietyAnalysis}
            recentAnalyses={anxietyAnalyses.slice(-5) as ClaudeAnxietyAnalysis[]}
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
          onToggleListening={handleToggleListening}
          onSendMessage={handleSendMessage}
          onKeyPress={handleKeyPress}
          currentLanguage={currentLanguage}
        />
      </div>
    </div>
  );
};

export default ChatContainer;
