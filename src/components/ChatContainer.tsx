
import React from 'react';
import ChatHeader from '@/components/ChatHeader';
import AvatarSection from '@/components/chat/AvatarSection';
import ChatSection from '@/components/chat/ChatSection';
import { useAnxietyAnalysis } from '@/hooks/useAnxietyAnalysis';
import { useChat } from '@/hooks/useChat';
import { useAvatarEmotions } from '@/hooks/useAvatarEmotions';
import { useChatInteractions } from '@/hooks/useChatInteractions';

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

  const { anxietyAnalyses, currentAnxietyAnalysis } = useAnxietyAnalysis();
  
  const {
    isAnimating,
    currentEmotion,
    latestAnalysis,
    allAnalyses
  } = useAvatarEmotions(
    aiCompanion,
    messages,
    isTyping,
    anxietyAnalyses,
    currentAnxietyAnalysis
  );

  const {
    isListening,
    speechSupported,
    speechSynthesisSupported,
    languageContext,
    handleToggleListening,
    handleKeyPress,
    handleAutoStartListening,
    handleSpeakText,
    stopSpeaking
  } = useChatInteractions(currentLanguage, setInputText, handleSendMessage);

  const [useReadyPlayerMe, setUseReadyPlayerMe] = React.useState(true);

  // Enhanced avatar stopped speaking handler
  const handleAvatarStoppedSpeaking = React.useCallback(() => {
    console.log('Avatar stopped speaking, language context:', languageContext);
    
    // Stop any residual speech and clear speech state
    stopSpeaking();
    
    // Wait a moment for the speech to fully stop, then auto-start listening
    setTimeout(() => {
      handleAutoStartListening();
    }, 500);
  }, [handleAutoStartListening, stopSpeaking, languageContext]);

  // Handle speaking AI messages with proper language detection
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.type === 'ai' && !isTyping) {
      console.log('New AI message received, preparing to speak:', lastMessage.content.substring(0, 50));
      
      // Small delay to ensure message is fully rendered
      setTimeout(() => {
        handleSpeakText(lastMessage.content);
      }, 300);
    }
  }, [messages, isTyping, handleSpeakText]);

  console.log('📊 Latest anxiety analysis:', latestAnalysis);
  console.log('📊 All analyses for analytics:', allAnalyses);
  console.log('🌐 Language context:', languageContext);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ChatHeader 
        speechSynthesisSupported={speechSynthesisSupported}
        speechSupported={speechSupported}
        aiCompanion={aiCompanion}
        currentLanguage={languageContext.currentLanguage}
      />

      <div className="flex-1 max-w-6xl mx-auto w-full p-4 flex flex-col lg:flex-row gap-4">
        <AvatarSection
          aiCompanion={aiCompanion}
          isAnimating={isAnimating}
          isTyping={isTyping}
          currentEmotion={currentEmotion}
          useReadyPlayerMe={useReadyPlayerMe}
          setUseReadyPlayerMe={setUseReadyPlayerMe}
          onStoppedSpeaking={handleAvatarStoppedSpeaking}
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
          currentLanguage={languageContext.currentLanguage}
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
