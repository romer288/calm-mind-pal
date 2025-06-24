
import React from 'react';
import ChatHeader from '@/components/ChatHeader';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import AdvancedAnxietyTracker from '@/components/AdvancedAnxietyTracker';
import ReadyPlayerMeAvatar from '@/components/ReadyPlayerMeAvatar';
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
        {/* Left side - Avatar */}
        <div className="lg:w-64 flex flex-col items-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <h3 className="text-lg font-semibold mb-2 text-center">
              {aiCompanion === 'vanessa' ? 'Vanessa' : 'Mónica'}
            </h3>
            <ReadyPlayerMeAvatar
              companion={aiCompanion}
              isAnimating={isAnimating || isTyping}
              emotion={currentEmotion.emotion}
              className="mx-auto"
            />
            <div className="mt-2 text-sm text-gray-600 text-center">
              {isAnimating ? 'Speaking...' : 'Listening'}
            </div>
          </div>

          {/* Avatar emotion indicator */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 w-full">
            <div className="text-xs text-gray-500 mb-1">Current Mood</div>
            <div className="capitalize text-sm font-medium">
              {currentEmotion.emotion.replace('_', ' ')}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentEmotion.emotion === 'concerned' ? 'bg-red-400' :
                  currentEmotion.emotion === 'empathetic' ? 'bg-blue-400' :
                  currentEmotion.emotion === 'supportive' ? 'bg-green-400' :
                  'bg-gray-400'
                }`}
                style={{ width: `${currentEmotion.intensity * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right side - Chat and Analysis */}
        <div className="flex-1 flex flex-col">
          {/* Only show Advanced Anxiety Analysis */}
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
    </div>
  );
};

export default ChatContainer;
