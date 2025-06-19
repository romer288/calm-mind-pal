
import { FallbackAnxietyAnalysis } from './types';
import { KEYWORDS, detectTriggers, detectCognitiveDistortions } from './keywordDetection';
import { generatePersonalizedResponse } from './responseGenerator';
import { 
  generateRecommendedInterventions, 
  generateBeckAnxietyCategories, 
  generateDsm5Indicators, 
  determineTherapyApproach,
  determineCrisisRiskLevel 
} from './analysisUtils';

export const analyzeFallbackAnxiety = (
  message: string,
  conversationHistory: string[]
): FallbackAnxietyAnalysis => {
  const lowerMessage = message.toLowerCase();
  
  console.log('🔍 FALLBACK: Analyzing message:', message);
  console.log('📝 FALLBACK: Message lowercase:', lowerMessage);
  
  let anxietyLevel = 1;
  let gad7Score = 0;
  let emotions: string[] = [];
  let crisisRiskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  let sentiment: 'positive' | 'neutral' | 'negative' | 'crisis' = 'neutral';
  
  // Check for explicit negations first (NOT anxious, feeling OKAY)
  if (KEYWORDS.negativeKeywords.some(keyword => lowerMessage.includes(keyword)) ||
      lowerMessage.includes('not anxious') ||
      lowerMessage.includes('not worried') ||
      lowerMessage.includes('i am okay') ||
      lowerMessage.includes("i'm okay")) {
    
    console.log('✅ FALLBACK: Detected POSITIVE/OKAY message');
    anxietyLevel = 1;
    gad7Score = 0;
    sentiment = 'positive';
    emotions.push('calm', 'okay');
    
  } else if (KEYWORDS.crisisKeywords.some(keyword => lowerMessage.includes(keyword))) {
    // Check for crisis indicators
    console.log('🚨 FALLBACK: Detected CRISIS message');
    crisisRiskLevel = 'critical';
    anxietyLevel = 9;
    gad7Score = 18;
    sentiment = 'crisis';
    emotions.push('despair', 'hopelessness');
    
  } else if (KEYWORDS.anxietyKeywords.some(keyword => lowerMessage.includes(keyword))) {
    // Check for anxiety indicators
    console.log('😰 FALLBACK: Detected ANXIETY message');
    anxietyLevel = Math.min(anxietyLevel + 3, 8);
    gad7Score = Math.min(gad7Score + 6, 15);
    emotions.push('anxiety');
    sentiment = 'negative';
    
  } else if (KEYWORDS.depressionKeywords.some(keyword => lowerMessage.includes(keyword))) {
    // Check for depression indicators
    console.log('😢 FALLBACK: Detected DEPRESSION message');
    anxietyLevel = Math.min(anxietyLevel + 2, 7);
    gad7Score = Math.min(gad7Score + 4, 12);
    emotions.push('sadness');
    sentiment = 'negative';
    
  } else if (KEYWORDS.positiveKeywords.some(keyword => lowerMessage.includes(keyword))) {
    // Check for positive indicators
    console.log('😊 FALLBACK: Detected POSITIVE message');
    anxietyLevel = 1;
    gad7Score = 0;
    sentiment = 'positive';
    emotions.push('positive');
    
  } else {
    // Default neutral
    console.log('😐 FALLBACK: Detected NEUTRAL message');
    anxietyLevel = 2;
    gad7Score = 2;
    sentiment = 'neutral';
    emotions.push('neutral');
  }
  
  const triggers = detectTriggers(lowerMessage);
  const cognitiveDistortions = detectCognitiveDistortions(lowerMessage);
  const hasCrisisKeywords = KEYWORDS.crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  
  crisisRiskLevel = determineCrisisRiskLevel(anxietyLevel, hasCrisisKeywords);
  const therapyApproach = determineTherapyApproach(cognitiveDistortions, crisisRiskLevel, emotions, triggers);
  
  const analysis = {
    anxietyLevel,
    gad7Score,
    triggers,
    emotions,
    cognitiveDistortions,
    crisisRiskLevel,
    sentiment,
    therapyApproach
  };
  
  console.log('📊 FALLBACK: Final analysis:', analysis);
  
  const recommendedInterventions = generateRecommendedInterventions(crisisRiskLevel);
  const beckAnxietyCategories = generateBeckAnxietyCategories(emotions, lowerMessage);
  const dsm5Indicators = generateDsm5Indicators(anxietyLevel, triggers);
  const personalizedResponse = generatePersonalizedResponse(message, analysis);
  
  console.log('📝 FALLBACK: Generated response:', personalizedResponse);
  
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
