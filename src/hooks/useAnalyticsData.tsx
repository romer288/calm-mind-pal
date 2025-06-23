
import { useState, useEffect } from 'react';
import { analyticsService, AnalyticsData } from '@/services/analyticsService';
import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';

export const useAnalyticsData = () => {
  const [data, setData] = useState<AnalyticsData>({
    messages: [],
    anxietyAnalyses: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const analyticsData = await analyticsService.getAnalyticsData();
      setData(analyticsData);
      console.log('📊 useAnalyticsData - Data loaded:', {
        messagesCount: analyticsData.messages.length,
        analysesCount: analyticsData.anxietyAnalyses.length
      });
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get all anxiety analyses from both messages and direct analyses
  const getAllAnalyses = (): ClaudeAnxietyAnalysis[] => {
    const messageAnalyses = data.messages
      .filter(msg => msg.sender === 'user' && msg.anxietyAnalysis)
      .map(msg => msg.anxietyAnalysis as ClaudeAnxietyAnalysis);
    
    // Combine and deduplicate
    const allAnalyses = [...messageAnalyses, ...data.anxietyAnalyses]
      .filter((analysis, index, arr) => 
        arr.findIndex(a => JSON.stringify(a) === JSON.stringify(analysis)) === index
      ) as ClaudeAnxietyAnalysis[];

    console.log('📊 getAllAnalyses - Combined analyses:', allAnalyses.length);
    return allAnalyses;
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    getAllAnalyses
  };
};
