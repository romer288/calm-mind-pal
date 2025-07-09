import { useMemo } from 'react';

interface WeeklyTrendData {
  day: string;
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
      
      console.log('🔄 Processing analysis:', {
        date: analysis.created_at,
        dayOfWeek: dayName,
        anxietyLevel: analysis.anxiety_level,
        triggers: analysis.anxiety_triggers
      });
      
      // Map triggers to categories and count anxiety levels
      const triggers = analysis.anxiety_triggers || [];
      if (triggers.length === 0) {
        // If no triggers, add to general category based on anxiety level
        weeklyData[dayName].social += analysis.anxiety_level;
      } else {
        triggers.forEach((trigger: string) => {
          const lowerTrigger = trigger.toLowerCase();
          if (lowerTrigger.includes('work') || lowerTrigger.includes('career') || lowerTrigger.includes('job')) {
            weeklyData[dayName].workCareer += analysis.anxiety_level;
          } else if (lowerTrigger.includes('social') || lowerTrigger.includes('people')) {
            weeklyData[dayName].social += analysis.anxiety_level;
          } else if (lowerTrigger.includes('health') || lowerTrigger.includes('medical')) {
            weeklyData[dayName].health += analysis.anxiety_level;
          } else if (lowerTrigger.includes('financial') || lowerTrigger.includes('money')) {
            weeklyData[dayName].financial += analysis.anxiety_level;
          } else if (lowerTrigger.includes('relationship') || lowerTrigger.includes('family')) {
            if (lowerTrigger.includes('family')) {
              weeklyData[dayName].family += analysis.anxiety_level;
            } else {
              weeklyData[dayName].relationships += analysis.anxiety_level;
            }
          } else if (lowerTrigger.includes('future') || lowerTrigger.includes('uncertainty')) {
            weeklyData[dayName].future += analysis.anxiety_level;
          } else {
            // Unmatched triggers go to social category as fallback
            weeklyData[dayName].social += analysis.anxiety_level;
          }
        });
      }
    });
    
    const result: WeeklyTrendData[] = daysOfWeek.map(day => ({
      day,
      workCareer: weeklyData[day].workCareer,
      social: weeklyData[day].social,
      health: weeklyData[day].health,
      financial: weeklyData[day].financial,
      relationships: weeklyData[day].relationships,
      future: weeklyData[day].future,
      family: weeklyData[day].family
    }));
    
    console.log('📊 Final weekly trends data:', result);
    return result;
  }, [analyses]);
};

export type { WeeklyTrendData };