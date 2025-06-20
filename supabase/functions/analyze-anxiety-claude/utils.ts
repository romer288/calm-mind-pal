
import { AnxietyAnalysisRequest, ClaudeAnxietyAnalysis } from './types.ts';
import { corsHeaders } from './constants.ts';

export function createErrorResponse(
  status: number,
  error: string,
  details?: string,
  debug?: any
): Response {
  return new Response(JSON.stringify({ 
    success: false, 
    error,
    details,
    debug
  }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function validateRequest(parsedBody: any): string | null {
  const { message } = parsedBody;
  
  if (!message || typeof message !== 'string') {
    return 'Message field is required and must be a string';
  }
  
  return null;
}

export function createFallbackAnalysis(message: string): ClaudeAnxietyAnalysis {
  return {
    anxietyLevel: 3,
    gad7Score: 5,
    beckAnxietyCategories: ["Cognitive Symptoms"],
    dsm5Indicators: ["Excessive worry present"],
    triggers: [],
    cognitiveDistortions: [],
    recommendedInterventions: ["Deep breathing exercises", "Mindfulness practice"],
    therapyApproach: 'Supportive',
    crisisRiskLevel: 'low',
    sentiment: 'neutral',
    escalationDetected: false,
    personalizedResponse: `Thank you for sharing "${message}" with me. I'm here to listen and support you through whatever you're experiencing. How are you feeling right now?`
  };
}

export function validateApiKey(apiKey: string): string | null {
  if (!apiKey.startsWith('sk-ant-')) {
    return `Claude API keys should start with 'sk-ant-', but this starts with '${apiKey.substring(0, 10)}'`;
  }
  return null;
}
