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
    
    // Group analyses by week (Monday to Sunday)
    const weeklyData: Record<string, Record<string, number>> = {};
    
    // Helper function to get the Monday of the week for a given date
    const getWeekStart = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      return new Date(d.setDate(diff));
    };

    // Helper function to format week range
    const formatWeekRange = (weekStart: Date): string => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
      const startDay = weekStart.getDate();
      const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
      const endDay = weekEnd.getDate();
      
      if (startMonth === endMonth) {
        return `${startMonth} ${startDay}-${endDay}`;
      } else {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
      }
    };
    
    analyses.forEach(analysis => {
      const date = new Date(analysis.created_at || new Date());
      const weekStart = getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0]; // Use ISO date as key
      const anxietyLevel = analysis.anxietyLevel || 0;
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
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
        weekKey,
        anxietyLevel,
        triggers: analysis.triggers
      });
      
      const triggers = analysis.triggers || [];
      if (triggers.length === 0) {
        // If no triggers, add to general category based on anxiety level
        weeklyData[weekKey].social += anxietyLevel;
      } else {
        triggers.forEach((trigger: string) => {
          const lowerTrigger = trigger.toLowerCase();
          if (lowerTrigger.includes('work') || lowerTrigger.includes('career') || lowerTrigger.includes('job')) {
            weeklyData[weekKey].workCareer += anxietyLevel;
          } else if (lowerTrigger.includes('social') || lowerTrigger.includes('people')) {
            weeklyData[weekKey].social += anxietyLevel;
          } else if (lowerTrigger.includes('health') || lowerTrigger.includes('medical')) {
            weeklyData[weekKey].health += anxietyLevel;
          } else if (lowerTrigger.includes('financial') || lowerTrigger.includes('money')) {
            weeklyData[weekKey].financial += anxietyLevel;
          } else if (lowerTrigger.includes('relationship') || lowerTrigger.includes('family')) {
            if (lowerTrigger.includes('family')) {
              weeklyData[weekKey].family += anxietyLevel;
            } else {
              weeklyData[weekKey].relationships += anxietyLevel;
            }
          } else if (lowerTrigger.includes('future') || lowerTrigger.includes('uncertainty')) {
            weeklyData[weekKey].future += anxietyLevel;
          } else {
            // Unmatched triggers go to social category as fallback
            weeklyData[weekKey].social += anxietyLevel;
          }
        });
      }
    });
    
    // Convert to array and sort by week (earliest to latest)
    const allResults: WeeklyTrendData[] = Object.keys(weeklyData)
      .sort((a, b) => a.localeCompare(b)) // Sort weeks chronologically
      .map(weekKey => {
        const weekStart = new Date(weekKey);
        const weekRange = formatWeekRange(weekStart);
        
        return {
          day: weekRange, // Using week range instead of day
          displayLabel: weekRange,
          date: weekRange,
          workCareer: weeklyData[weekKey].workCareer,
          social: weeklyData[weekKey].social,
          health: weeklyData[weekKey].health,
          financial: weeklyData[weekKey].financial,
          relationships: weeklyData[weekKey].relationships,
          future: weeklyData[weekKey].future,
          family: weeklyData[weekKey].family
        };
      });

    // Limit to last 8 weeks to avoid overcrowding
    const result = allResults.slice(-8);
    
    console.log('📊 Final weekly trends data with displayLabel:', result);
    console.log('📊 Result order check - first date:', result[0]?.date, 'last date:', result[result.length - 1]?.date);
    return result;
  }, [analyses]);
};

export type { WeeklyTrendData };