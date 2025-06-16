
export interface FallbackAnxietyAnalysis {
  anxietyLevel: number;
  gad7Score: number;
  beckAnxietyCategories: string[];
  dsm5Indicators: string[];
  triggers: string[];
  emotions: string[];
  cognitiveDistortions: string[];
  recommendedInterventions: string[];
  therapyApproach: 'CBT' | 'DBT' | 'Mindfulness' | 'Trauma-Informed' | 'Supportive';
  crisisRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  sentiment: 'positive' | 'neutral' | 'negative' | 'crisis';
  escalationDetected: boolean;
  personalizedResponse?: string;
}

export const analyzeFallbackAnxiety = (
  message: string,
  conversationHistory: string[]
): FallbackAnxietyAnalysis => {
  const lowerMessage = message.toLowerCase();
  
  // Detect anxiety-related keywords
  const anxietyKeywords = ['anxious', 'worried', 'scared', 'panic', 'stress', 'nervous', 'fear'];
  const depressionKeywords = ['sad', 'depressed', 'hopeless', 'tired', 'empty', 'worthless'];
  const crisisKeywords = ['hurt myself', 'end it', 'suicide', 'kill myself', 'die', 'not worth living', 'want to commit suicide'];
  
  let anxietyLevel = 1;
  let gad7Score = 0;
  let triggers: string[] = [];
  let emotions: string[] = [];
  let cognitiveDistortions: string[] = [];
  let crisisRiskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  let sentiment: 'positive' | 'neutral' | 'negative' | 'crisis' = 'neutral';
  
  // Check for crisis indicators first
  if (crisisKeywords.some(keyword => lowerMessage.includes(keyword))) {
    crisisRiskLevel = 'critical';
    anxietyLevel = 9;
    gad7Score = 18;
    sentiment = 'crisis';
    emotions.push('despair', 'hopelessness');
  }
  
  // Check for anxiety indicators
  if (anxietyKeywords.some(keyword => lowerMessage.includes(keyword))) {
    anxietyLevel = Math.min(anxietyLevel + 3, 8);
    gad7Score = Math.min(gad7Score + 6, 15);
    emotions.push('anxiety');
    sentiment = sentiment === 'crisis' ? 'crisis' : 'negative';
  }
  
  // Check for depression indicators
  if (depressionKeywords.some(keyword => lowerMessage.includes(keyword))) {
    anxietyLevel = Math.min(anxietyLevel + 2, 7);
    gad7Score = Math.min(gad7Score + 4, 12);
    emotions.push('sadness');
    sentiment = sentiment === 'crisis' ? 'crisis' : 'negative';
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
  if (lowerMessage.includes('money') || lowerMessage.includes('financial')) {
    triggers.push('financial');
  }
  
  // Detect cognitive distortions
  if (lowerMessage.includes('always') || lowerMessage.includes('never') || lowerMessage.includes('everything')) {
    cognitiveDistortions.push('All-or-nothing thinking');
  }
  if (lowerMessage.includes('should') || lowerMessage.includes('must') || lowerMessage.includes('have to')) {
    cognitiveDistortions.push('Should statements');
  }
  if (lowerMessage.includes('worst') || lowerMessage.includes('terrible') || lowerMessage.includes('awful')) {
    cognitiveDistortions.push('Catastrophizing');
  }
  
  // Set crisis risk based on content
  if (crisisRiskLevel !== 'critical') {
    if (anxietyLevel >= 8) {
      crisisRiskLevel = 'high';
    } else if (anxietyLevel >= 6) {
      crisisRiskLevel = 'moderate';
    }
  }
  
  // Determine therapy approach
  let therapyApproach: 'CBT' | 'DBT' | 'Mindfulness' | 'Trauma-Informed' | 'Supportive' = 'Supportive';
  
  if (cognitiveDistortions.length > 0) {
    therapyApproach = 'CBT';
  } else if (crisisRiskLevel === 'high' || crisisRiskLevel === 'critical') {
    therapyApproach = 'Trauma-Informed';
  } else if (emotions.includes('anxiety') && triggers.length > 0) {
    therapyApproach = 'Mindfulness';
  }
  
  // Generate personalized response based on analysis
  let personalizedResponse = "";
  
  if (crisisRiskLevel === 'critical') {
    personalizedResponse = "I'm very concerned about what you're sharing with me. Please reach out to a crisis helpline (988 in the US) or emergency services immediately. Your life has value and there are people who want to help you.";
  } else if (crisisRiskLevel === 'high') {
    personalizedResponse = "I can hear how difficult things are for you right now. Have you considered speaking with a mental health professional? They can provide specialized support that might really help.";
  } else {
    if (lowerMessage.includes('not anxious')) {
      personalizedResponse = "I'm glad to hear you're feeling less anxious. That's a positive step! What's been helping you feel this way?";
    } else if (triggers.includes('work')) {
      personalizedResponse = "Work-related stress can be overwhelming. It sounds like your job is creating a lot of pressure for you right now.";
    } else if (triggers.includes('social')) {
      personalizedResponse = "Social situations can feel challenging, and what you're experiencing is completely understandable.";
    } else if (cognitiveDistortions.includes('All-or-nothing thinking')) {
      personalizedResponse = "I notice some thought patterns that might be making things feel more intense. Sometimes our minds can see things in very black-and-white terms.";
    } else {
      personalizedResponse = "Thank you for sharing what you're going through. Your feelings are completely valid, and I'm here to support you.";
    }
  }
  
  const recommendedInterventions = [
    'Practice deep breathing exercises',
    'Try progressive muscle relaxation',
    'Use grounding techniques (5-4-3-2-1 method)',
    'Consider journaling your thoughts'
  ];
  
  if (crisisRiskLevel === 'critical') {
    recommendedInterventions.unshift('Contact crisis hotline immediately', 'Reach out to emergency services if needed');
  }
  
  const beckAnxietyCategories = [];
  if (emotions.includes('anxiety')) {
    beckAnxietyCategories.push('Subjective anxiety');
  }
  if (lowerMessage.includes('heart') || lowerMessage.includes('breathing')) {
    beckAnxietyCategories.push('Physical symptoms');
  }
  
  const dsm5Indicators = [];
  if (anxietyLevel >= 6) {
    dsm5Indicators.push('Excessive anxiety present');
  }
  if (triggers.length > 1) {
    dsm5Indicators.push('Multiple anxiety triggers identified');
  }
  
  return {
    anxietyLevel,
    gad7Score,
    beckAnxietyCategories,
    dsm5Indicators,
    triggers,
    emotions,
    cognitiveDistortions,
    recommendedInterventions,
    therapyApproach,
    crisisRiskLevel,
    sentiment,
    escalationDetected: anxietyLevel > 7,
    personalizedResponse
  };
};
