export interface ClaudeAnxietyAnalysis {
  anxietyLevel: number; // 1-10
  gad7Score: number; // 0-21 GAD-7 scale
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
  try {
    // Try to get the correct Supabase function URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const functionUrl = supabaseUrl 
      ? `${supabaseUrl}/functions/v1/analyze-anxiety-claude`
      : '/functions/v1/analyze-anxiety-claude';

    console.log('🌐 Attempting Claude API call to:', functionUrl);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
      },
      body: JSON.stringify({
        message,
        conversationHistory,
        userId
      })
    });

    console.log('📡 Claude API response status:', response.status);
    console.log('📡 Claude API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      console.log('❌ Non-JSON response received:', text.substring(0, 200));
      throw new Error('Invalid response format - expected JSON');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Analysis failed');
    }

    console.log('✅ Claude API success:', data.analysis);
    return data.analysis;
  } catch (error) {
    console.error('❌ Claude API completely failed:', error);
    
    // Return a clear fallback indicator
    throw new Error('Claude API unavailable');
  }
};

export const getGAD7Description = (score: number): string => {
  if (score <= 4) return 'Minimal Anxiety';
  if (score <= 9) return 'Mild Anxiety';
  if (score <= 14) return 'Moderate Anxiety';
  return 'Severe Anxiety';
};

export const getCrisisRiskColor = (level: string): string => {
  switch (level) {
    case 'low': return 'text-green-600';
    case 'moderate': return 'text-yellow-600';
    case 'high': return 'text-orange-600';
    case 'critical': return 'text-red-800';
    default: return 'text-gray-600';
  }
};

export const getTherapyApproachDescription = (approach: string): string => {
  switch (approach) {
    case 'CBT': return 'Cognitive Behavioral Therapy - Focus on thought patterns';
    case 'DBT': return 'Dialectical Behavior Therapy - Emotion regulation skills';
    case 'Mindfulness': return 'Mindfulness-based approach - Present moment awareness';
    case 'Trauma-Informed': return 'Trauma-informed care - Safety and healing focus';
    case 'Supportive': return 'Supportive therapy - Validation and encouragement';
    default: return 'General therapeutic support';
  }
};
