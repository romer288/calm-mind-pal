
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
        console.log('Attempting Claude analysis...');
        anxietyAnalysis = await analyzeAnxietyWithClaude(
          message,
          conversationHistory,
          'user-123'
        );
        console.log('Claude analysis successful:', anxietyAnalysis);
      } catch (error) {
        console.log('Claude API not available, using fallback analysis');
        anxietyAnalysis = analyzeFallbackAnxiety(message, conversationHistory);
        console.log('Fallback analysis completed:', anxietyAnalysis);
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
