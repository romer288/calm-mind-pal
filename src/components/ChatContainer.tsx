
import React from 'react';
import ChatHeader from '@/components/ChatHeader';
import AvatarSection from '@/components/chat/AvatarSection';
import ChatSection from '@/components/chat/ChatSection';
import { GoalSuggestionModal } from '@/components/goals/GoalSuggestionModal';
import { useAnxietyAnalysis } from '@/hooks/useAnxietyAnalysis';
import { useChat } from '@/hooks/useChat';
import { useAvatarEmotions } from '@/hooks/useAvatarEmotions';
import { useChatInteractions } from '@/hooks/useChatInteractions';
import { useGoalSuggestions } from '@/hooks/useGoalSuggestions';

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
    handleSendMessage,
    editMessage
  } = useChat();

  const { anxietyAnalyses, currentAnxietyAnalysis } = useAnxietyAnalysis();
  
  const {
    showSuggestionModal,
    suggestedGoals,
    triggerGoalSuggestion,
    closeSuggestionModal
  } = useGoalSuggestions();
  
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
  const [lastSpokenMessageId, setLastSpokenMessageId] = React.useState<string | null>(null);

  // Reset avatar speaking state on mount to prevent stuck states
  React.useEffect(() => {
    console.log('🔊 Resetting avatar speaking state on mount');
    setAvatarIsSpeaking(false);
    setLastSpokenMessageId(null); // Reset to null to allow initial message
    stopSpeaking(); // Clear any stuck speech
  }, [stopSpeaking]);

  // Enhanced speech handling with proper avatar integration and duplicate prevention
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    
    console.log('🔊 Speech effect check:', {
      hasMessage: !!lastMessage,
      messageId: lastMessage?.id,
      isFromAI: lastMessage?.sender !== 'user',
      isTyping,
      avatarIsSpeaking,
      lastSpokenId: lastSpokenMessageId,
      isDifferentMessage: lastMessage?.id !== lastSpokenMessageId,
      messageText: lastMessage?.text?.substring(0, 30)
    });
    
    // Only proceed if we have a new AI message and conditions are right
    if (lastMessage && 
        lastMessage.sender !== 'user' && 
        !isTyping && 
        !avatarIsSpeaking && 
        lastMessage.id !== lastSpokenMessageId &&
        lastMessage.text && 
        lastMessage.text.trim()) {
      
      console.log('🔊 Avatar will speak new message:', lastMessage.text.substring(0, 50));
      console.log('🔊 Full message length:', lastMessage.text.length);
      
      // Immediately mark as spoken to prevent loops
      setLastSpokenMessageId(lastMessage.id);
      setAvatarIsSpeaking(true);
      
      const speakMessage = async () => {
        try {
          console.log('🔊 Starting speech for message ID:', lastMessage.id);
          await handleSpeakText(lastMessage.text);
          console.log('🔊 Avatar speech completed successfully');
          
          // Auto-start microphone after speech with delay
          setTimeout(() => {
            if (!isListening && !isTyping) {
              console.log('🔊 Auto-starting microphone after speech');
              handleAutoStartListening();
            }
          }, 1500);
        } catch (error) {
          console.error('🔊 Avatar speech error:', error);
        } finally {
          setAvatarIsSpeaking(false);
        }
      };
      
      // Start speaking after a brief delay
      setTimeout(speakMessage, 800);
    }
  }, [messages, isTyping, handleSpeakText, handleAutoStartListening, isListening, avatarIsSpeaking, lastSpokenMessageId]);

  const handleAvatarStoppedSpeaking = React.useCallback(() => {
    console.log('🔊 Avatar stopped speaking callback - force reset');
    setAvatarIsSpeaking(false);
    stopSpeaking(); // Ensure speech is fully stopped
  }, [stopSpeaking]);

  // Force reset if avatar is speaking for too long
  React.useEffect(() => {
    if (avatarIsSpeaking) {
      const timeout = setTimeout(() => {
        console.log('🔊 Force resetting stuck avatar speaking state');
        setAvatarIsSpeaking(false);
      }, 30000); // 30 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [avatarIsSpeaking]);

  // Stop speech when user starts typing or speaking
  React.useEffect(() => {
    if (isListening && avatarIsSpeaking) {
      console.log('🔊 User started speaking, stopping avatar speech');
      stopSpeaking();
      setAvatarIsSpeaking(false);
    }
  }, [isListening, avatarIsSpeaking, stopSpeaking]);

  // Check for goal suggestions after anxiety analysis - more aggressive triggering
  React.useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const lastUserMessage = messages.slice().reverse().find(msg => msg.sender === 'user');
    
    if (lastUserMessage && 
        currentAnxietyAnalysis && 
        !showSuggestionModal &&
        !isTyping) {
      
      console.log('🎯 Checking goal suggestion trigger for:', lastUserMessage.text);
      
      // Trigger immediately after AI response
      setTimeout(() => {
        const shouldTrigger = triggerGoalSuggestion(lastUserMessage.text, currentAnxietyAnalysis);
        if (shouldTrigger) {
          console.log('🎯 Goal suggestions triggered for message:', lastUserMessage.text.substring(0, 50));
        } else {
          console.log('🎯 Goal suggestions not triggered - criteria not met');
        }
      }, 2000); // Reduced delay to 2 seconds
    }
  }, [messages, currentAnxietyAnalysis, triggerGoalSuggestion, showSuggestionModal, isTyping]);

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
          onEditMessage={editMessage}
          onStopSpeaking={stopSpeaking}
          isSpeaking={isSpeaking}
        />
      </div>

      <GoalSuggestionModal
        isOpen={showSuggestionModal}
        onClose={closeSuggestionModal}
        suggestedGoals={suggestedGoals}
        aiCompanion={aiCompanion}
      />
    </div>
  );
};

export default ChatContainer;
