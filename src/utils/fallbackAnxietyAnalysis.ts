
export interface FallbackAnxietyAnalysis {
  anxietyLevel: number;
  triggers: string[];
  emotions: string[];
  cognitiveDistortions: string[];
  therapyApproach: 'CBT' | 'DBT' | 'Mindfulness' | 'Trauma-Informed' | 'Supportive';
  crisisRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  personalizedResponse?: string;
  recommendations: string[];
}

export const analyzeFallbackAnxiety = (
  message: string,
  conversationHistory: string[]
): FallbackAnxietyAnalysis => {
  const lowerMessage = message.toLowerCase();
  
  // Detect anxiety-related keywords
  const anxietyKeywords = ['anxious', 'worried', 'scared', 'panic', 'stress', 'nervous', 'fear'];
  const depressionKeywords = ['sad', 'depressed', 'hopeless', 'tired', 'empty', 'worthless'];
  const crisisKeywords = ['hurt myself', 'end it', 'suicide', 'kill myself', 'die', 'not worth living'];
  
  let anxietyLevel = 1;
  let triggers: string[] = [];
  let emotions: string[] = [];
  let cognitiveDistortions: string[] = [];
  let crisisRiskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  
  // Check for crisis indicators
  if (crisisKeywords.some(keyword => lowerMessage.includes(keyword))) {
    crisisRiskLevel = 'critical';
    anxietyLevel = 9;
  }
  
  // Check for anxiety indicators
  if (anxietyKeywords.some(keyword => lowerMessage.includes(keyword))) {
    anxietyLevel = Math.min(anxietyLevel + 3, 8);
    emotions.push('anxiety');
  }
  
  // Check for depression indicators
  if (depressionKeywords.some(keyword => lowerMessage.includes(keyword))) {
    anxietyLevel = Math.min(anxietyLevel + 2, 7);
    emotions.push('sadness');
  }
  
  // Detect triggers
  if (lowerMessage.includes('work') || lowerMessage.includes('job')) {
    triggers.push('work');
  }
  if (lowerMessage.includes('social') || lowerMessage.includes('people') || lowerMessage.includes('friends')) {
    triggers.push('social');
  }
  if (lowerMessage.includes('health') || lowerMessage.includes('sick') || lowerMessage.includes('pain')) {
    triggers.push('health');
  }
  
  // Detect cognitive distortions
  if (lowerMessage.includes('always') || lowerMessage.includes('never') || lowerMessage.includes('everything')) {
    cognitiveDistortions.push('All-or-nothing thinking');
  }
  if (lowerMessage.includes('should') || lowerMessage.includes('must') || lowerMessage.includes('have to')) {
    cognitiveDistortions.push('Should statements');
  }
  
  // Determine therapy approach
  let therapyApproach: 'CBT' | 'DBT' | 'Mindfulness' | 'Trauma-Informed' | 'Supportive' = 'Supportive';
  
  if (cognitiveDistortions.length > 0) {
    therapyApproach = 'CBT';
  } else if (emotions.includes('anxiety') && triggers.length > 0) {
    therapyApproach = 'Mindfulness';
  } else if (crisisRiskLevel === 'high' || crisisRiskLevel === 'critical') {
    therapyApproach = 'Trauma-Informed';
  }
  
  const recommendations = [
    'Practice deep breathing exercises',
    'Consider journaling your thoughts',
    'Try progressive muscle relaxation',
    'Reach out to trusted friends or family'
  ];
  
  return {
    anxietyLevel,
    triggers,
    emotions,
    cognitiveDistortions,
    therapyApproach,
    crisisRiskLevel,
    recommendations
  };
};
