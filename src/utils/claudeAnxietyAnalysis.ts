
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
    const response = await fetch('/functions/v1/analyze-anxiety-claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversationHistory,
        userId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Analysis failed');
    }

    return data.analysis;
  } catch (error) {
    console.error('Error analyzing anxiety with Claude:', error);
    
    // Fallback to basic analysis if Claude API fails
    return {
      anxietyLevel: 5,
      gad7Score: 10,
      beckAnxietyCategories: ['General Anxiety'],
      dsm5Indicators: ['Anxiety symptoms present'],
      triggers: ['Unknown'],
      cognitiveDistortions: [],
      recommendedInterventions: ['Deep breathing', 'Grounding techniques'],
      therapyApproach: 'Supportive',
      crisisRiskLevel: 'moderate',
      sentiment: 'neutral',
      escalationDetected: false,
      personalizedResponse: "I'm here to support you through this difficult time. Let's work together to help you feel better."
    };
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
