import { useMemo } from 'react';

interface WeeklyTrendData {
  day: string;
  displayLabel: string; // Just the day name for display
  date: string;         // The actual date
  workCareer: number;
  social: number;
  health: number;
  financial: number;
  relationships: number;
  future: number;
  family: number;
}

export const useWeeklyTrendsData = (analyses: any[]): WeeklyTrendData[] => {
  return useMemo(() => {
    console.log('🔍 useWeeklyTrendsData - Processing weekly trends with analyses:', analyses.length);
    console.log('🔍 First analysis data structure:', analyses[0]);
    if (analyses.length === 0) return [] as WeeklyTrendData[];
    
    // Group analyses by date and calculate totals for each anxiety category
    const dateMap: Record<string, Record<string, number>> = {};
    
    analyses.forEach(analysis => {
      const date = new Date(analysis.created_at || new Date());
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const anxietyLevel = analysis.anxietyLevel || 0;
      
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          workCareer: 0,
          social: 0,
          health: 0,
          financial: 0,
          relationships: 0,
          future: 0,
          family: 0
        };
      }
      
      console.log('🔄 Processing analysis:', {
        date: analysis.created_at,
        dateKey,
        anxietyLevel,
        triggers: analysis.triggers
      });
      
      const triggers = analysis.triggers || [];
      if (triggers.length === 0) {
        // If no triggers, add to general category based on anxiety level
        dateMap[dateKey].social += anxietyLevel;
      } else {
        triggers.forEach((trigger: string) => {
          const lowerTrigger = trigger.toLowerCase();
          if (lowerTrigger.includes('work') || lowerTrigger.includes('career') || lowerTrigger.includes('job')) {
            dateMap[dateKey].workCareer += anxietyLevel;
          } else if (lowerTrigger.includes('social') || lowerTrigger.includes('people')) {
            dateMap[dateKey].social += anxietyLevel;
          } else if (lowerTrigger.includes('health') || lowerTrigger.includes('medical')) {
            dateMap[dateKey].health += anxietyLevel;
          } else if (lowerTrigger.includes('financial') || lowerTrigger.includes('money')) {
            dateMap[dateKey].financial += anxietyLevel;
          } else if (lowerTrigger.includes('relationship') || lowerTrigger.includes('family')) {
            if (lowerTrigger.includes('family')) {
              dateMap[dateKey].family += anxietyLevel;
            } else {
              dateMap[dateKey].relationships += anxietyLevel;
            }
          } else if (lowerTrigger.includes('future') || lowerTrigger.includes('uncertainty')) {
            dateMap[dateKey].future += anxietyLevel;
          } else {
            // Unmatched triggers go to social category as fallback
            dateMap[dateKey].social += anxietyLevel;
          }
        });
      }
    });
    
    // Convert to array and sort by date (earliest to latest)
    const allResults: WeeklyTrendData[] = Object.keys(dateMap)
      .sort((a, b) => a.localeCompare(b)) // Sort dates chronologically
      .map(dateKey => {
        const date = new Date(dateKey);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        return {
          day: dayName,
          displayLabel: dayName,
          date: dateString,
          workCareer: dateMap[dateKey].workCareer,
          social: dateMap[dateKey].social,
          health: dateMap[dateKey].health,
          financial: dateMap[dateKey].financial,
          relationships: dateMap[dateKey].relationships,
          future: dateMap[dateKey].future,
          family: dateMap[dateKey].family
        };
      });

    // Limit to last 10 data points to avoid overcrowding
    const result = allResults.slice(-10);
    
    console.log('📊 Final weekly trends data with displayLabel:', result);
    console.log('📊 Result order check - first date:', result[0]?.date, 'last date:', result[result.length - 1]?.date);
    return result;
  }, [analyses]);
};

export type { WeeklyTrendData };