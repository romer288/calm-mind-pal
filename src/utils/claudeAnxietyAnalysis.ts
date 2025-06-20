
import { supabase } from '@/integrations/supabase/client';

export interface ClaudeAnxietyAnalysis {
  anxietyLevel: number;
  gad7Score: number;
  beckAnxietyCategories: string[];
  dsm5Indicators: string[];
  triggers: string[];
  cognitiveDistortions: string[];
  recommendedInterventions: string[];
  therapyApproach: 'CBT' | 'DBT' | 'Mindfulness' | 'Trauma-Informed' | 'Supportive';
  crisisRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  sentiment: 'positive' | 'neutral' | 'negative' | 'crisis';
  escalationDetected: boolean;
  personalizedResponse: string;
}

export const analyzeAnxietyWithClaude = async (
  message: string,
  conversationHistory: string[] = [],
  userId?: string
): Promise<ClaudeAnxietyAnalysis> => {
  console.log('🔍 Starting Claude analysis for message:', message);
  console.log('📝 Conversation history:', conversationHistory);

  try {
    // First, check if we have a valid Supabase client
    if (!supabase) {
      console.log('❌ Supabase client not available');
      throw new Error('Supabase client not available');
    }

    // Try to get the current session to verify we're authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('⚠️ Session error (will proceed anyway):', sessionError);
    }

    console.log('🌐 Attempting Claude API call to: /functions/v1/analyze-anxiety-claude');
    
    const { data, error } = await supabase.functions.invoke('analyze-anxiety-claude', {
      body: {
        message,
        conversationHistory,
        userId
      }
    });

    console.log('📡 Claude API response data:', data);
    console.log('📡 Claude API response error:', error);

    if (error) {
      console.log('❌ Supabase function error:', error);
      throw new Error(`Supabase function error: ${error.message}`);
    }

    if (!data) {
      console.log('❌ No data received from Claude API');
      throw new Error('No data received from Claude API');
    }

    if (!data.success) {
      console.log('❌ Claude API returned error:', data.error);
      throw new Error(`Claude API error: ${data.error}`);
    }

    if (!data.analysis) {
      console.log('❌ No analysis in Claude API response');
      throw new Error('No analysis in Claude API response');
    }

    const analysis = data.analysis as ClaudeAnxietyAnalysis;
    
    // Validate that we got a proper response
    if (!analysis.personalizedResponse || analysis.personalizedResponse.length < 10) {
      console.log('❌ Invalid or empty personalized response from Claude');
      throw new Error('Invalid response from Claude');
    }

    console.log('✅ REAL Claude analysis successful:', analysis);
    console.log('💬 CLAUDE personalized response:', analysis.personalizedResponse);
    
    return analysis;

  } catch (error) {
    console.log('❌ Claude API completely failed:', error);
    
    // Re-throw the error so the calling code knows to use fallback
    throw new Error('Claude API unavailable');
  }
};
