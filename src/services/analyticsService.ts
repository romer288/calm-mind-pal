
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
        gad7Score: Math.round(analysis.anxiety_level * 2.1), // Approximate GAD-7 from anxiety level
        beckAnxietyCategories: ['General Anxiety'], // Default since not stored
        dsm5Indicators: analysis.anxiety_triggers || [],
        triggers: analysis.anxiety_triggers || [],
        cognitiveDistortions: [], // Default since not stored
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
  }
};
