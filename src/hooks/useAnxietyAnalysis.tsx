
import { useState } from 'react';
import { analyzeAnxietyWithClaude, ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import { analyzeFallbackAnxiety, FallbackAnxietyAnalysis } from '@/utils/fallbackAnxietyAnalysis';

export const useAnxietyAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [anxietyAnalyses, setAnxietyAnalyses] = useState<(ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis)[]>([]);
  const [currentAnxietyAnalysis, setCurrentAnxietyAnalysis] = useState<ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis | null>(null);

  const analyzeMessage = async (
    message: string,
    conversationHistory: string[]
  ): Promise<ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis> => {
    setIsAnalyzing(true);

    try {
      let anxietyAnalysis: ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis;

      try {
        console.log('🔍 Attempting Claude analysis for message:', message);
        console.log('📝 Conversation history:', conversationHistory);
        
        anxietyAnalysis = await analyzeAnxietyWithClaude(
          message,
          conversationHistory,
          'user-123'
        );
        
        console.log('✅ Claude analysis successful:', anxietyAnalysis);
        console.log('💬 Claude personalized response:', anxietyAnalysis.personalizedResponse);
        
      } catch (error) {
        console.log('❌ Claude API failed, using fallback analysis:', error);
        anxietyAnalysis = analyzeFallbackAnxiety(message, conversationHistory);
        console.log('🔄 Fallback analysis completed:', anxietyAnalysis);
        console.log('💬 Fallback personalized response:', anxietyAnalysis.personalizedResponse);
      }

      setCurrentAnxietyAnalysis(anxietyAnalysis);
      setAnxietyAnalyses(prev => [...prev, anxietyAnalysis]);

      return anxietyAnalysis;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    anxietyAnalyses,
    currentAnxietyAnalysis,
    analyzeMessage
  };
};
