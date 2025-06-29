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
    isSpeaking,
    handleToggleListening,
    handleKeyPress,
    handleAutoStartListening,
    handleSpeakText,
    stopSpeaking
  } = useChatInteractions(currentLanguage, setInputText, handleSendMessage);

  const [useReadyPlayerMe, setUseReadyPlayerMe] = React.useState(true);

  // Enhanced avatar stopped speaking handler with better state management
  const handleAvatarStoppedSpeaking = React.useCallback(() => {
    console.log('Avatar stopped speaking, language context:', languageContext);
    console.log('Current states - isListening:', isListening, 'isSpeaking:', isSpeaking, 'isTyping:', isTyping);
    
    // Only auto-start listening if we're not already listening and not typing
    if (!isListening && !isTyping && !isSpeaking) {
      // Wait longer on iPhone for better stability
      const delay = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 800 : 500;
      
      setTimeout(() => {
        // Double-check state before auto-starting
        if (!isListening && !isTyping && !isSpeaking) {
          handleAutoStartListening();
        }
      }, delay);
    }
  }, [handleAutoStartListening, isListening, isSpeaking, isTyping, languageContext]);

  // Handle speaking AI messages with proper async handling
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    // Only speak if it's an AI message, we're not typing, and we're not already speaking
    if (lastMessage && lastMessage.sender !== 'user' && !isTyping && !isSpeaking) {
      console.log('New AI message received, preparing to speak:', lastMessage.text.substring(0, 50));
      console.log('Current speech state - isSpeaking:', isSpeaking, 'isListening:', isListening);
      
      // Stop any current listening before speaking
      if (isListening) {
        console.log('Stopping listening before speaking AI response');
        stopSpeaking(); // This will also stop listening
      }
      
      // Delay to ensure message is fully rendered and any conflicts are resolved
      const delay = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 500 : 300;
      
      setTimeout(async () => {
        // Final check to make sure we should still speak
        if (!isSpeaking) {
          try {
            await handleSpeakText(lastMessage.text);
            console.log('🔊 AI message speech completed, triggering auto-listen');
            // Trigger auto-start listening after speech completes
            handleAvatarStoppedSpeaking();
          } catch (error) {
            console.error('🔊 Error speaking AI message:', error);
          }
        }
      }, delay);
    }
  }, [messages, isTyping, isSpeaking, isListening, handleSpeakText, stopSpeaking, handleAvatarStoppedSpeaking]);

  console.log('📊 Latest anxiety analysis:', latestAnalysis);
  console.log('📊 All analyses for analytics:', allAnalyses);
  console.log('🌐 Language context:', languageContext);
  console.log('🎤 Speech states - Speaking:', isSpeaking, 'Listening:', isListening, 'Typing:', isTyping);

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
