import { useState } from 'react';
import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import { FallbackAnxietyAnalysis } from '@/utils/anxiety/types';

interface SuggestedGoal {
  title: string;
  description: string;
  category: 'treatment' | 'self-care' | 'therapy' | 'mindfulness' | 'exercise' | 'social' | 'work' | 'sleep' | 'nutrition';
  target_value: number;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  reason: string;
}

export const useGoalSuggestions = () => {
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestedGoals, setSuggestedGoals] = useState<SuggestedGoal[]>([]);

  const shouldSuggestGoals = (
    message: string, 
    analysis: ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis | null
  ): boolean => {
    const lowerMessage = message.toLowerCase();
    
    console.log('🎯 Checking goal suggestions for message:', message);
    console.log('🎯 Analysis:', analysis);
    
    // Check for explicit goal mentions
    const hasGoalKeywords = lowerMessage.includes('goal') || 
                           lowerMessage.includes('target') || 
                           lowerMessage.includes('achieve') ||
                           lowerMessage.includes('improve') ||
                           lowerMessage.includes('work on') ||
                           lowerMessage.includes('get better');

    // Check for high anxiety that could benefit from goal setting
    const hasHighAnxiety = analysis && analysis.anxietyLevel >= 6;
    
    // Check for specific triggers that goals could help with
    const hasWorkableTrigggers = analysis && analysis.triggers && 
                               analysis.triggers.some(trigger => 
                                 ['social', 'work', 'health', 'relationships', 'performance'].includes(trigger.toLowerCase())
                               );

    console.log('🎯 Goal keywords:', hasGoalKeywords, 'High anxiety:', hasHighAnxiety, 'Workable triggers:', hasWorkableTrigggers);
    
    return hasGoalKeywords || (hasHighAnxiety && hasWorkableTrigggers);
  };

  const generateGoalSuggestions = (
    message: string,
    analysis: ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis | null
  ): SuggestedGoal[] => {
    const suggestions: SuggestedGoal[] = [];
    const lowerMessage = message.toLowerCase();

    // Anxiety management goals
    if (analysis && analysis.anxietyLevel >= 5) {
      suggestions.push({
        title: 'Daily Anxiety Check-ins',
        description: 'Track your anxiety levels and identify patterns to better understand your triggers',
        category: 'self-care',
        target_value: 1,
        unit: 'check-in',
        frequency: 'daily',
        reason: 'Regular monitoring helps you recognize patterns and take proactive steps to manage anxiety'
      });

      if (analysis.anxietyLevel >= 7) {
        suggestions.push({
          title: 'Practice Deep Breathing',
          description: 'Use breathing exercises to calm your nervous system when anxiety peaks',
          category: 'mindfulness',
          target_value: 3,
          unit: 'sessions',
          frequency: 'daily',
          reason: 'Deep breathing activates your parasympathetic nervous system, providing immediate anxiety relief'
        });
      }
    }

    // Social anxiety goals
    if (analysis?.triggers?.some(t => t.toLowerCase().includes('social'))) {
      suggestions.push({
        title: 'Social Comfort Building',
        description: 'Gradually increase social interactions in comfortable, low-pressure settings',
        category: 'social',
        target_value: 2,
        unit: 'interactions',
        frequency: 'weekly',
        reason: 'Gradual exposure helps build confidence and reduces social anxiety over time'
      });
    }

    // Work stress goals
    if (analysis?.triggers?.some(t => t.toLowerCase().includes('work')) || lowerMessage.includes('work')) {
      suggestions.push({
        title: 'Work-Life Balance',
        description: 'Set boundaries and create dedicated time for relaxation and personal activities',
        category: 'work',
        target_value: 5,
        unit: 'hours',
        frequency: 'weekly',
        reason: 'Clear boundaries prevent work stress from overwhelming other areas of your life'
      });
    }

    // Exercise goals for anxiety
    if (analysis && analysis.anxietyLevel >= 4) {
      suggestions.push({
        title: 'Movement for Mental Health',
        description: 'Regular physical activity to reduce anxiety and improve mood naturally',
        category: 'exercise',
        target_value: 20,
        unit: 'minutes',
        frequency: 'daily',
        reason: 'Exercise releases endorphins and reduces cortisol, naturally lowering anxiety levels'
      });
    }

    // Sleep goals for anxiety
    if (analysis?.triggers?.some(t => t.toLowerCase().includes('sleep')) || lowerMessage.includes('sleep') || lowerMessage.includes('tired')) {
      suggestions.push({
        title: 'Consistent Sleep Schedule',
        description: 'Maintain regular bedtime and wake times to improve sleep quality and reduce anxiety',
        category: 'sleep',
        target_value: 8,
        unit: 'hours',
        frequency: 'daily',
        reason: 'Quality sleep is essential for emotional regulation and anxiety management'
      });
    }

    // Mindfulness goals
    if (analysis && (analysis.anxietyLevel >= 5 || analysis.triggers?.length > 2)) {
      suggestions.push({
        title: 'Mindfulness Practice',
        description: 'Daily meditation or mindfulness exercises to stay present and reduce overthinking',
        category: 'mindfulness',
        target_value: 10,
        unit: 'minutes',
        frequency: 'daily',
        reason: 'Mindfulness helps break the cycle of anxious thoughts and grounds you in the present moment'
      });
    }

    // Return top 3-4 most relevant suggestions
    return suggestions.slice(0, 4);
  };

  const triggerGoalSuggestion = (
    message: string,
    analysis: ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis | null
  ) => {
    if (shouldSuggestGoals(message, analysis)) {
      const goals = generateGoalSuggestions(message, analysis);
      if (goals.length > 0) {
        setSuggestedGoals(goals);
        setShowSuggestionModal(true);
        return true; // Indicates that goal suggestion was triggered
      }
    }
    return false;
  };

  const closeSuggestionModal = () => {
    setShowSuggestionModal(false);
    setSuggestedGoals([]);
  };

  return {
    showSuggestionModal,
    suggestedGoals,
    triggerGoalSuggestion,
    closeSuggestionModal
  };
};