
import { supabase } from '@/integrations/supabase/client';
import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';

export interface AnalyticsData {
  messages: Array<{
    id: string;
    content: string;
    sender: string;
    created_at: string;
    anxietyAnalysis?: ClaudeAnxietyAnalysis;
  }>;
  anxietyAnalyses: ClaudeAnxietyAnalysis[];
}

export interface AnxietyTrend {
  date: string;
  anxietyLevel: number;
  triggers: string[];
  treatmentResponse?: number;
}

export interface TreatmentOutcome {
  period: string;
  averageAnxiety: number;
  improvement: number;
  treatmentEffectiveness: 'improving' | 'stable' | 'declining';
}

export const analyticsService = {
  async getAnalyticsData(): Promise<AnalyticsData> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch chat messages for the current user
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        throw messagesError;
      }

      // Fetch anxiety analyses for the current user
      const { data: analyses, error: analysesError } = await supabase
        .from('anxiety_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (analysesError) {
        console.error('Error fetching anxiety analyses:', analysesError);
        throw analysesError;
      }

      // Transform the database analyses to match ClaudeAnxietyAnalysis format
      const anxietyAnalyses: ClaudeAnxietyAnalysis[] = analyses?.map(analysis => ({
        anxietyLevel: analysis.anxiety_level,
        gad7Score: Math.round(analysis.anxiety_level * 2.1),
        beckAnxietyCategories: ['General Anxiety'],
        dsm5Indicators: analysis.anxiety_triggers || [],
        triggers: analysis.anxiety_triggers || [],
        cognitiveDistortions: [],
        recommendedInterventions: analysis.coping_strategies || [],
        therapyApproach: 'CBT' as const,
        crisisRiskLevel: analysis.anxiety_level >= 8 ? 'high' : analysis.anxiety_level >= 6 ? 'moderate' : 'low' as const,
        sentiment: analysis.anxiety_level >= 7 ? 'negative' : analysis.anxiety_level <= 3 ? 'positive' : 'neutral' as const,
        escalationDetected: analysis.anxiety_level >= 8,
        personalizedResponse: analysis.personalized_response || ''
      })) || [];

      console.log('📊 Analytics Service - Fetched data:', {
        messagesCount: messages?.length || 0,
        analysesCount: anxietyAnalyses.length
      });

      return {
        messages: messages || [],
        anxietyAnalyses
      };
    } catch (error) {
      console.error('Error in getAnalyticsData:', error);
      return {
        messages: [],
        anxietyAnalyses: []
      };
    }
  },

  generateAnxietyTrends(analyses: ClaudeAnxietyAnalysis[]): AnxietyTrend[] {
    return analyses.map((analysis, index) => ({
      date: new Date(Date.now() - (analyses.length - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      anxietyLevel: analysis.anxietyLevel,
      triggers: analysis.triggers,
      treatmentResponse: index > 0 ? analyses[index - 1].anxietyLevel - analysis.anxietyLevel : 0
    }));
  },

  calculateTreatmentOutcomes(trends: AnxietyTrend[]): TreatmentOutcome[] {
    if (trends.length < 7) return [];

    const weeks = Math.floor(trends.length / 7);
    const outcomes: TreatmentOutcome[] = [];

    for (let week = 0; week < weeks; week++) {
      const weekData = trends.slice(week * 7, (week + 1) * 7);
      const averageAnxiety = weekData.reduce((sum, day) => sum + day.anxietyLevel, 0) / weekData.length;
      
      let improvement = 0;
      if (week > 0) {
        const previousWeek = outcomes[week - 1];
        improvement = previousWeek.averageAnxiety - averageAnxiety;
      }

      let treatmentEffectiveness: 'improving' | 'stable' | 'declining' = 'stable';
      if (improvement > 0.5) treatmentEffectiveness = 'improving';
      else if (improvement < -0.5) treatmentEffectiveness = 'declining';

      outcomes.push({
        period: `Week ${week + 1}`,
        averageAnxiety: Math.round(averageAnxiety * 10) / 10,
        improvement: Math.round(improvement * 10) / 10,
        treatmentEffectiveness
      });
    }

    return outcomes;
  }
};
