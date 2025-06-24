
import React from 'react';
import { useAvatarAnimation } from '@/hooks/useAvatarAnimation';
import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import { FallbackAnxietyAnalysis } from '@/utils/anxiety/types';
import { Message, AICompanion } from '@/types/chat';

export const useAvatarEmotions = (
  aiCompanion: AICompanion,
  messages: Message[],
  isTyping: boolean,
  anxietyAnalyses: (ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis)[],
  currentAnxietyAnalysis: ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis | null
) => {
  const {
    isAnimating,
    currentEmotion,
    startAnimation,
    stopAnimation,
    updateEmotionFromAnxietyAnalysis
  } = useAvatarAnimation(aiCompanion);

  // Get the most recent anxiety analysis
  const getLatestAnxietyAnalysis = React.useCallback(() => {
    const userMessagesWithAnalysis = messages
      .filter(msg => msg.sender === 'user' && msg.anxietyAnalysis)
      .reverse();
    
    return userMessagesWithAnalysis.length > 0 
      ? userMessagesWithAnalysis[0].anxietyAnalysis as (ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis)
      : currentAnxietyAnalysis;
  }, [messages, currentAnxietyAnalysis]);

  // Get all anxiety analyses from messages
  const getAllAnalyses = React.useCallback(() => {
    const messageAnalyses = messages
      .filter(msg => msg.sender === 'user' && msg.anxietyAnalysis)
      .map(msg => msg.anxietyAnalysis as (ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis));
    
    // Combine and deduplicate
    const allAnalyses = [...messageAnalyses, ...anxietyAnalyses]
      .filter((analysis, index, arr) => 
        arr.findIndex(a => JSON.stringify(a) === JSON.stringify(analysis)) === index
      ) as (ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis)[];

    return allAnalyses;
  }, [messages, anxietyAnalyses]);

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

  return {
    isAnimating,
    currentEmotion,
    latestAnalysis,
    allAnalyses
  };
};
