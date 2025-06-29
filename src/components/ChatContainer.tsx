
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
  const lastProcessedMessageId = React.useRef<string | null>(null);

  // Enhanced avatar stopped speaking handler
  const handleAvatarStoppedSpeaking = React.useCallback(() => {
    console.log('🔊 Avatar stopped speaking callback triggered');
    
    if (!isListening && !isTyping && !isSpeaking) {
      console.log('🎤 Conditions met for auto-start listening');
      const delay = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 1000 : 600;
      
      setTimeout(() => {
        if (!isListening && !isTyping && !isSpeaking) {
          console.log('🎤 Auto-starting listening after delay');
          handleAutoStartListening();
        }
      }, delay);
    }
  }, [handleAutoStartListening, isListening, isSpeaking, isTyping]);

  // Handle speaking AI messages with better control
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage && 
        lastMessage.sender !== 'user' && 
        !isTyping && 
        !isSpeaking && 
        lastProcessedMessageId.current !== lastMessage.id) {
      
      console.log('🔊 New AI message detected for speech:', lastMessage.text.substring(0, 50));
      
      lastProcessedMessageId.current = lastMessage.id;
      
      // Stop any current listening before speaking
      if (isListening) {
        console.log('🔊 Stopping listening before speaking AI response');
        stopSpeaking();
      }
      
      const delay = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 600 : 300;
      
      setTimeout(async () => {
        if (!isSpeaking) {
          console.log('🔊 Starting AI message speech');
          try {
            await handleSpeakText(lastMessage.text);
            console.log('🔊 AI message speech completed');
            
            // Auto-start listening after speech completes
            setTimeout(() => {
              handleAvatarStoppedSpeaking();
            }, 500);
          } catch (error) {
            console.error('🔊 Error speaking AI message:', error);
          }
        }
      }, delay);
    }
  }, [messages, isTyping, isSpeaking, isListening, handleSpeakText, stopSpeaking, handleAvatarStoppedSpeaking]);

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
