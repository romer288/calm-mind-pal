
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
  const [avatarIsSpeaking, setAvatarIsSpeaking] = React.useState(false);

  // Enhanced speech handling with proper avatar integration
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage && 
        lastMessage.sender !== 'user' && 
        !isTyping && 
        !avatarIsSpeaking) {
      
      console.log('🔊 Avatar will speak message:', lastMessage.text.substring(0, 50));
      setAvatarIsSpeaking(true);
      
      const speakMessage = async () => {
        try {
          await handleSpeakText(lastMessage.text);
          console.log('🔊 Avatar speech completed');
          
          // Auto-start microphone after speech
          setTimeout(() => {
            if (!isListening && !isTyping) {
              handleAutoStartListening();
            }
          }, 1000);
        } catch (error) {
          console.error('🔊 Avatar speech error:', error);
        } finally {
          setAvatarIsSpeaking(false);
        }
      };
      
      // Start speaking after a brief delay
      setTimeout(speakMessage, 500);
    }
  }, [messages, isTyping, handleSpeakText, handleAutoStartListening, isListening, avatarIsSpeaking]);

  const handleAvatarStoppedSpeaking = React.useCallback(() => {
    console.log('🔊 Avatar stopped speaking callback');
    setAvatarIsSpeaking(false);
  }, []);

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
          isAnimating={avatarIsSpeaking || isAnimating}
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
