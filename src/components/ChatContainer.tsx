
import React from 'react';
import ChatHeader from '@/components/ChatHeader';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import AdvancedAnxietyTracker from '@/components/AdvancedAnxietyTracker';
import AnxietyAnalyticsTracker from '@/components/AnxietyAnalyticsTracker';
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

  // Get all anxiety analyses from messages
  const getAllAnalyses = () => {
    const messageAnalyses = messages
      .filter(msg => msg.sender === 'user' && msg.anxietyAnalysis)
      .map(msg => msg.anxietyAnalysis as ClaudeAnxietyAnalysis);
    
    // Combine and deduplicate
    const allAnalyses = [...messageAnalyses, ...anxietyAnalyses]
      .filter((analysis, index, arr) => 
        arr.findIndex(a => JSON.stringify(a) === JSON.stringify(analysis)) === index
      ) as ClaudeAnxietyAnalysis[];

    return allAnalyses;
  };

  // Get the most recent anxiety analysis
  const getLatestAnxietyAnalysis = () => {
    const userMessagesWithAnalysis = messages
      .filter(msg => msg.sender === 'user' && msg.anxietyAnalysis)
      .reverse();
    
    return userMessagesWithAnalysis.length > 0 
      ? userMessagesWithAnalysis[0].anxietyAnalysis as ClaudeAnxietyAnalysis
      : currentAnxietyAnalysis;
  };

  const latestAnalysis = getLatestAnxietyAnalysis();
  const allAnalyses = getAllAnalyses();

  console.log('📊 Latest anxiety analysis:', latestAnalysis);
  console.log('📊 All analyses for analytics:', allAnalyses);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ChatHeader 
        speechSynthesisSupported={speechSynthesisSupported}
        speechSupported={speechSupported}
        aiCompanion={aiCompanion}
        currentLanguage={currentLanguage}
      />

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col">
        {/* Analytics Tracker - Shows intervention tracking and progress */}
        <AnxietyAnalyticsTracker analyses={allAnalyses} />

        {/* Current Analysis Display */}
        {latestAnalysis && (
          <AdvancedAnxietyTracker 
            currentAnalysis={latestAnalysis as ClaudeAnxietyAnalysis}
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
