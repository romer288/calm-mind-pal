
import { AnalysisKeywords } from './types';

export const KEYWORDS: AnalysisKeywords = {
  anxietyKeywords: ['anxious', 'worried', 'scared', 'panic', 'stress', 'nervous', 'fear'],
  depressionKeywords: ['sad', 'depressed', 'hopeless', 'tired', 'empty', 'worthless'],
  crisisKeywords: ['hurt myself', 'end it', 'suicide', 'kill myself', 'die', 'not worth living', 'want to commit suicide'],
  positiveKeywords: ['okay', 'good', 'better', 'fine', 'great', 'happy', 'calm', 'peaceful', 'not anxious', 'not worried'],
  negativeKeywords: ['not anxious', 'not worried', 'not scared', "i'm okay", "i am okay", 'feeling better', 'feeling good']
};

export const detectTriggers = (lowerMessage: string): string[] => {
  const triggers: string[] = [];
  
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
  
  return triggers;
};

export const detectCognitiveDistortions = (lowerMessage: string): string[] => {
  const distortions: string[] = [];
  
  if (lowerMessage.includes('always') || lowerMessage.includes('never') || lowerMessage.includes('everything')) {
    distortions.push('All-or-nothing thinking');
  }
  if (lowerMessage.includes('should') || lowerMessage.includes('must') || lowerMessage.includes('have to')) {
    distortions.push('Should statements');
  }
  if (lowerMessage.includes('worst') || lowerMessage.includes('terrible') || lowerMessage.includes('awful')) {
    distortions.push('Catastrophizing');
  }
  
  return distortions;
};
