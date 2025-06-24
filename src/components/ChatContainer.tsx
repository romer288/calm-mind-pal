
import React from 'react';
import ChatHeader from '@/components/ChatHeader';
import AvatarSection from '@/components/chat/AvatarSection';
import ChatSection from '@/components/chat/ChatSection';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useAnxietyAnalysis } from '@/hooks/useAnxietyAnalysis';
import { useChat } from '@/hooks/useChat';
import { useAvatarAnimation } from '@/hooks/useAvatarAnimation';
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
  
  // Avatar animation hook
  const {
    isAnimating,
    currentEmotion,
    startAnimation,
    stopAnimation,
    updateEmotionFromAnxietyAnalysis
  } = useAvatarAnimation(aiCompanion);

  const [useReadyPlayerMe, setUseReadyPlayerMe] = React.useState(true);

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

  // Get the most recent anxiety analysis
  const getLatestAnxietyAnalysis = () => {
    const userMessagesWithAnalysis = messages
      .filter(msg => msg.sender === 'user' && msg.anxietyAnalysis)
      .reverse();
    
    return userMessagesWithAnalysis.length > 0 
      ? userMessagesWithAnalysis[0].anxietyAnalysis as ClaudeAnxietyAnalysis
      : currentAnxietyAnalysis;
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

  const latestAnalysis = getLatestAnxietyAnalysis();
  const allAnalyses = getAllAnalyses();

  // Update avatar emotion based on latest analysis
  React.useEffect(() => {
    if (latestAnalysis) {
      updateEmotionFromAnxietyAnalysis(latestAnalysis);
    }
  }, [latestAnalysis, updateEmotionFromAnxietyAnalysis]);

  // Handle avatar animation when AI is speaking
  React.useEffect(() => {
    if (isTyping) {
      // Get the last AI message to animate with
      const lastAiMessage = messages
        .filter(msg => msg.sender === aiCompanion)
        .slice(-1)[0];
      
      if (lastAiMessage) {
        startAnimation(lastAiMessage.text);
      }
    } else {
      stopAnimation();
    }
  }, [isTyping, messages, aiCompanion, startAnimation, stopAnimation]);

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

      <div className="flex-1 max-w-6xl mx-auto w-full p-4 flex flex-col lg:flex-row gap-4">
        <AvatarSection
          aiCompanion={aiCompanion}
          isAnimating={isAnimating}
          isTyping={isTyping}
          currentEmotion={currentEmotion}
          useReadyPlayerMe={useReadyPlayerMe}
          setUseReadyPlayerMe={setUseReadyPlayerMe}
        />

        <ChatSection
          messages={messages}
          inputText={inputText}
          setInputText={setInputText}
          isTyping={isTyping}
          isAnalyzing={isAnalyzing}
          isListening={isListening}
          speechSupported={speechSupported}
          aiCompanion={aiCompanion}
          currentLanguage={currentLanguage}
          scrollRef={scrollRef}
          latestAnalysis={latestAnalysis}
          allAnalyses={allAnalyses}
          onToggleListening={handleToggleListening}
          onSendMessage={handleSendMessage}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
};

export default ChatContainer;
