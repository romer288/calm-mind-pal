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
    
    const weeklyData: Record<string, Record<string, number>> = {};
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Initialize all days
    daysOfWeek.forEach(day => {
      weeklyData[day] = {
        workCareer: 0,
        social: 0,
        health: 0,
        financial: 0,
        relationships: 0,
        future: 0,
        family: 0
      };
    });
    
    analyses.forEach(analysis => {
      const date = new Date(analysis.created_at || new Date());
      const dayName = daysOfWeek[date.getDay()];
      const anxietyLevel = analysis.anxietyLevel || 0;
      
      console.log('🔄 Processing analysis:', {
        date: analysis.created_at,
        dayOfWeek: dayName,
        anxietyLevel,
        triggers: analysis.triggers
      });
      const triggers = analysis.triggers || [];
      if (triggers.length === 0) {
        // If no triggers, add to general category based on anxiety level
        weeklyData[dayName].social += anxietyLevel;
      } else {
        triggers.forEach((trigger: string) => {
          const lowerTrigger = trigger.toLowerCase();
          if (lowerTrigger.includes('work') || lowerTrigger.includes('career') || lowerTrigger.includes('job')) {
            weeklyData[dayName].workCareer += anxietyLevel;
          } else if (lowerTrigger.includes('social') || lowerTrigger.includes('people')) {
            weeklyData[dayName].social += anxietyLevel;
          } else if (lowerTrigger.includes('health') || lowerTrigger.includes('medical')) {
            weeklyData[dayName].health += anxietyLevel;
          } else if (lowerTrigger.includes('financial') || lowerTrigger.includes('money')) {
            weeklyData[dayName].financial += anxietyLevel;
          } else if (lowerTrigger.includes('relationship') || lowerTrigger.includes('family')) {
            if (lowerTrigger.includes('family')) {
              weeklyData[dayName].family += anxietyLevel;
            } else {
              weeklyData[dayName].relationships += anxietyLevel;
            }
          } else if (lowerTrigger.includes('future') || lowerTrigger.includes('uncertainty')) {
            weeklyData[dayName].future += anxietyLevel;
          } else {
            // Unmatched triggers go to social category as fallback
            weeklyData[dayName].social += anxietyLevel;
          }
        });
      }
    });
    
    // Get the last 7 days with dates
    const today = new Date();
    const result: WeeklyTrendData[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayName = daysOfWeek[date.getDay()];
      const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      result.push({
        day: dayName,
        displayLabel: dayName,
        date: dateString,
        workCareer: weeklyData[dayName].workCareer,
        social: weeklyData[dayName].social,
        health: weeklyData[dayName].health,
        financial: weeklyData[dayName].financial,
        relationships: weeklyData[dayName].relationships,
        future: weeklyData[dayName].future,
        family: weeklyData[dayName].family
      });
    }
    
    console.log('📊 Final weekly trends data with displayLabel:', result);
    return result;
  }, [analyses]);
};

export type { WeeklyTrendData };