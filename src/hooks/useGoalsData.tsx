import { useState, useEffect } from 'react';
import { goalsService } from '@/services/goalsService';
import { interventionSummaryService } from '@/services/interventionSummaryService';
import { GoalWithProgress, InterventionSummary } from '@/types/goals';

export const useGoalsData = () => {
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [summaries, setSummaries] = useState<InterventionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [goalsData, summariesData] = await Promise.all([
        goalsService.getUserGoals(),
        interventionSummaryService.getUserSummaries()
      ]);
      
      setGoals(goalsData);
      setSummaries(summariesData);
    } catch (err) {
      console.error('Error loading goals and summaries:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    goals,
    summaries,
    isLoading,
    error,
    refetch: loadData
  };
};