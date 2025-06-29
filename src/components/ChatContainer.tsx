
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
  const speechProcessingRef = React.useRef(false);

  // Enhanced avatar stopped speaking handler with better state management
  const handleAvatarStoppedSpeaking = React.useCallback(() => {
    console.log('🔊 Avatar stopped speaking callback triggered');
    console.log('🔊 Current states - isListening:', isListening, 'isSpeaking:', isSpeaking, 'isTyping:', isTyping);
    
    // Only auto-start listening if we're not already listening and not typing
    if (!isListening && !isTyping && !isSpeaking) {
      console.log('🎤 Conditions met for auto-start listening');
      // Wait longer on iPhone for better stability
      const delay = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 1000 : 600;
      
      setTimeout(() => {
        // Double-check state before auto-starting
        if (!isListening && !isTyping && !isSpeaking) {
          console.log('🎤 Auto-starting listening after delay');
          handleAutoStartListening();
        } else {
          console.log('🎤 State changed during delay, skipping auto-start');
        }
      }, delay);
    } else {
      console.log('🎤 Conditions not met for auto-start listening');
    }
  }, [handleAutoStartListening, isListening, isSpeaking, isTyping]);

  // Handle speaking AI messages with better duplicate prevention and error handling
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    // Only speak if it's an AI message, we're not typing, we're not already speaking, 
    // we haven't processed this message yet, and we're not already processing speech
    if (lastMessage && 
        lastMessage.sender !== 'user' && 
        !isTyping && 
        !isSpeaking && 
        !speechProcessingRef.current &&
        lastProcessedMessageId.current !== lastMessage.id) {
      
      console.log('🔊 New AI message detected for speech:', lastMessage.text.substring(0, 50));
      console.log('🔊 Current speech state - isSpeaking:', isSpeaking, 'isListening:', isListening, 'isTyping:', isTyping);
      
      // Mark this message as being processed and set processing flag
      lastProcessedMessageId.current = lastMessage.id;
      speechProcessingRef.current = true;
      
      // Stop any current listening before speaking
      if (isListening) {
        console.log('🔊 Stopping listening before speaking AI response');
        stopSpeaking();
      }
      
      // Delay to ensure message is fully rendered and any state conflicts are resolved
      const delay = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 600 : 400;
      
      setTimeout(async () => {
        try {
          // Final check to make sure we should still speak
          if (!isSpeaking && speechProcessingRef.current) {
            console.log('🔊 Starting AI message speech');
            await handleSpeakText(lastMessage.text);
            console.log('🔊 AI message speech completed, triggering auto-listen callback');
            
            // Trigger auto-start listening after speech completes
            setTimeout(() => {
              handleAvatarStoppedSpeaking();
            }, 200);
          } else {
            console.log('🔊 Skipping speech - conditions changed');
          }
        } catch (error) {
          console.error('🔊 Error speaking AI message:', error);
        } finally {
          speechProcessingRef.current = false;
        }
      }, delay);
    }
    
    // Reset processing flag if message changes but conditions aren't met
    if (!lastMessage || lastMessage.sender === 'user' || isTyping) {
      speechProcessingRef.current = false;
    }
    
  }, [messages, isTyping, isSpeaking, isListening, handleSpeakText, stopSpeaking, handleAvatarStoppedSpeaking]);

  // Debug logging
  React.useEffect(() => {
    console.log('📊 Latest anxiety analysis:', latestAnalysis);
    console.log('📊 All analyses for analytics:', allAnalyses);
    console.log('🌐 Language context:', languageContext);
    console.log('🎤 Speech states - Speaking:', isSpeaking, 'Listening:', isListening, 'Typing:', isTyping, 'Processing:', speechProcessingRef.current);
  }, [latestAnalysis, allAnalyses, languageContext, isSpeaking, isListening, isTyping]);

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
