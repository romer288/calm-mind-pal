
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
  const hasSpokenWelcome = React.useRef(false);
  const speechInProgress = React.useRef(false);

  // Enhanced avatar stopped speaking handler with auto-microphone
  const handleAvatarStoppedSpeaking = React.useCallback(() => {
    console.log('🔊 Avatar stopped speaking callback triggered');
    speechInProgress.current = false;
    
    // Auto-start microphone after speech with proper delay
    if (!isListening && !isTyping) {
      console.log('🎤 Conditions met for auto-start listening');
      const delay = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 2000 : 1500;
      
      setTimeout(() => {
        if (!isListening && !isTyping && !speechInProgress.current) {
          console.log('🎤 Auto-starting listening after speech ended');
          handleAutoStartListening();
        }
      }, delay);
    }
  }, [handleAutoStartListening, isListening, isTyping]);

  // Handle welcome message speech - only once
  React.useEffect(() => {
    const welcomeMessage = messages.find(msg => msg.sender !== 'user');
    
    if (welcomeMessage && 
        !hasSpokenWelcome.current && 
        !isTyping && 
        !speechInProgress.current) {
      
      console.log('🔊 Speaking welcome message:', welcomeMessage.text.substring(0, 50));
      hasSpokenWelcome.current = true;
      speechInProgress.current = true;
      
      const speakWelcome = async () => {
        try {
          await handleSpeakText(welcomeMessage.text);
          console.log('🔊 Welcome message speech completed');
          handleAvatarStoppedSpeaking();
        } catch (error) {
          console.error('🔊 Error speaking welcome message:', error);
          handleAvatarStoppedSpeaking();
        }
      };
      
      // Delay welcome speech slightly
      setTimeout(speakWelcome, 1000);
    }
  }, [messages, isTyping, handleSpeakText, handleAvatarStoppedSpeaking]);

  // Handle AI response speech - but not welcome message
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage && 
        lastMessage.sender !== 'user' && 
        !isTyping && 
        !speechInProgress.current && 
        lastProcessedMessageId.current !== lastMessage.id &&
        hasSpokenWelcome.current) { // Only after welcome has been spoken
      
      console.log('🔊 New AI message detected for speech:', lastMessage.text.substring(0, 50));
      
      lastProcessedMessageId.current = lastMessage.id;
      speechInProgress.current = true;
      
      // Stop any current listening before speaking
      if (isListening) {
        console.log('🔊 Stopping listening before speaking AI response');
        stopSpeaking();
      }
      
      const delay = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 1000 : 800;
      
      setTimeout(async () => {
        try {
          console.log('🔊 Starting AI message speech');
          await handleSpeakText(lastMessage.text);
          console.log('🔊 AI message speech completed');
          handleAvatarStoppedSpeaking();
        } catch (error) {
          console.error('🔊 Error speaking AI message:', error);
          handleAvatarStoppedSpeaking();
        }
      }, delay);
    }
  }, [messages, isTyping, isListening, handleSpeakText, stopSpeaking, handleAvatarStoppedSpeaking]);

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
