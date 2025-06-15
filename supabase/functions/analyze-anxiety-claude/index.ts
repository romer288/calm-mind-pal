
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnxietyAnalysisRequest {
  message: string;
  conversationHistory?: string[];
  userId?: string;
}

interface ClaudeAnxietyAnalysis {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { message, conversationHistory = [], userId } = await req.json() as AnxietyAnalysisRequest;
    
    const claudeApiKey = Deno.env.get('Claude_API_key');
    if (!claudeApiKey) {
      throw new Error('Claude API key not found in secrets');
    }

    const systemPrompt = `You are an expert clinical psychologist specializing in anxiety disorders. Analyze the user's message using professional clinical frameworks and provide a comprehensive psychological assessment.

CLINICAL FRAMEWORKS TO APPLY:
1. GAD-7 Scale (0-21): Assess generalized anxiety severity
2. Beck Anxiety Inventory: Identify somatic vs cognitive symptoms
3. DSM-5 Anxiety Criteria: Map symptoms to potential disorder patterns
4. Cognitive Behavioral Therapy: Identify thinking patterns and triggers

ANALYSIS REQUIREMENTS:
- Anxiety Level: Rate 1-10 based on clinical severity
- GAD-7 Score: Estimate 0-21 score based on symptoms described
- Beck Categories: Identify physical symptoms, cognitive symptoms, panic symptoms
- DSM-5 Indicators: Note any criteria met for anxiety disorders
- Cognitive Distortions: Identify catastrophizing, all-or-nothing thinking, etc.
- Crisis Assessment: Evaluate immediate risk level
- Therapeutic Approach: Recommend most appropriate intervention

RESPONSE FORMAT: Return a JSON object with the exact structure requested.

IMPORTANT: Be clinically accurate but compassionate. If severe symptoms are detected, prioritize safety and professional referral recommendations.`;

    const userPrompt = `Analyze this message for anxiety patterns and provide clinical assessment:

Current Message: "${message}"

${conversationHistory.length > 0 ? `Previous Messages: ${conversationHistory.slice(-5).join(', ')}` : ''}

Please provide a comprehensive clinical analysis following the specified format.`;

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    if (!claudeResponse.ok) {
      throw new Error(`Claude API error: ${claudeResponse.statusText}`);
    }

    const claudeData = await claudeResponse.json();
    const analysisText = claudeData.content[0].text;

    // Parse Claude's response and structure it
    let analysis: ClaudeAnxietyAnalysis;
    
    try {
      // Try to parse as JSON first
      analysis = JSON.parse(analysisText);
    } catch {
      // If not JSON, create structured analysis from text
      analysis = {
        anxietyLevel: extractAnxietyLevel(analysisText, message),
        gad7Score: extractGAD7Score(analysisText),
        beckAnxietyCategories: extractBeckCategories(analysisText),
        dsm5Indicators: extractDSM5Indicators(analysisText),
        triggers: extractTriggers(analysisText, message),
        cognitiveDistortions: extractCognitiveDistortions(analysisText),
        recommendedInterventions: extractInterventions(analysisText),
        therapyApproach: determineTherapyApproach(analysisText),
        crisisRiskLevel: assessCrisisRisk(analysisText, message),
        sentiment: determineSentiment(analysisText, message),
        escalationDetected: detectEscalation(conversationHistory, message),
        personalizedResponse: generatePersonalizedResponse(analysisText, message)
      };
    }

    // Store analysis in database for pattern tracking
    if (userId) {
      await supabase.from('anxiety_analyses').insert({
        user_id: userId,
        message,
        anxiety_level: analysis.anxietyLevel,
        gad7_score: analysis.gad7Score,
        triggers: analysis.triggers,
        therapy_approach: analysis.therapyApproach,
        crisis_risk: analysis.crisisRiskLevel,
        analysis_data: analysis,
        created_at: new Date().toISOString()
      });
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in anxiety analysis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions for parsing Claude's analysis
function extractAnxietyLevel(text: string, message: string): number {
  const anxietyKeywords = {
    high: ['panic', 'terrified', 'overwhelmed', 'can\'t breathe', 'dying'],
    medium: ['worried', 'anxious', 'stressed', 'nervous', 'scared'],
    low: ['uncertain', 'concerned', 'bothered']
  };
  
  const lowerMessage = message.toLowerCase();
  let score = 1;
  
  anxietyKeywords.high.forEach(keyword => {
    if (lowerMessage.includes(keyword)) score += 3;
  });
  anxietyKeywords.medium.forEach(keyword => {
    if (lowerMessage.includes(keyword)) score += 2;
  });
  anxietyKeywords.low.forEach(keyword => {
    if (lowerMessage.includes(keyword)) score += 1;
  });
  
  return Math.min(10, score);
}

function extractGAD7Score(text: string): number {
  // GAD-7 mapping based on symptoms mentioned
  const gad7Symptoms = [
    'nervous', 'anxious', 'worrying', 'trouble relaxing',
    'restless', 'irritable', 'afraid', 'control'
  ];
  
  let score = 0;
  const lowerText = text.toLowerCase();
  
  gad7Symptoms.forEach(symptom => {
    if (lowerText.includes(symptom)) score += 2;
  });
  
  return Math.min(21, score);
}

function extractBeckCategories(text: string): string[] {
  const categories = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('heart') || lowerText.includes('breath') || lowerText.includes('sweat')) {
    categories.push('Physical Symptoms');
  }
  if (lowerText.includes('worry') || lowerText.includes('think') || lowerText.includes('mind')) {
    categories.push('Cognitive Symptoms');
  }
  if (lowerText.includes('panic') || lowerText.includes('fear') || lowerText.includes('terror')) {
    categories.push('Panic Symptoms');
  }
  
  return categories;
}

function extractDSM5Indicators(text: string): string[] {
  const indicators = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('worry') || lowerText.includes('anxious')) {
    indicators.push('Excessive anxiety and worry');
  }
  if (lowerText.includes('control') || lowerText.includes('difficult')) {
    indicators.push('Difficulty controlling worry');
  }
  if (lowerText.includes('restless') || lowerText.includes('tense')) {
    indicators.push('Physical tension/restlessness');
  }
  
  return indicators;
}

function extractTriggers(text: string, message: string): string[] {
  const triggers = [];
  const lowerMessage = message.toLowerCase();
  
  const triggerMap = {
    'work': ['work', 'job', 'boss', 'deadline'],
    'social': ['people', 'friends', 'social', 'crowd'],
    'health': ['health', 'sick', 'pain', 'doctor'],
    'financial': ['money', 'bills', 'debt', 'cost'],
    'relationships': ['relationship', 'partner', 'family']
  };
  
  Object.entries(triggerMap).forEach(([trigger, keywords]) => {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      triggers.push(trigger);
    }
  });
  
  return triggers;
}

function extractCognitiveDistortions(text: string): string[] {
  const distortions = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('always') || lowerText.includes('never')) {
    distortions.push('All-or-nothing thinking');
  }
  if (lowerText.includes('disaster') || lowerText.includes('worst')) {
    distortions.push('Catastrophizing');
  }
  if (lowerText.includes('should') || lowerText.includes('must')) {
    distortions.push('Should statements');
  }
  
  return distortions;
}

function extractInterventions(text: string): string[] {
  return [
    'Deep breathing exercises',
    'Cognitive restructuring',
    'Grounding techniques',
    'Progressive muscle relaxation'
  ];
}

function determineTherapyApproach(text: string): 'CBT' | 'DBT' | 'Mindfulness' | 'Trauma-Informed' | 'Supportive' {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('trauma') || lowerText.includes('abuse')) {
    return 'Trauma-Informed';
  }
  if (lowerText.includes('emotion') || lowerText.includes('intense')) {
    return 'DBT';
  }
  if (lowerText.includes('worry') || lowerText.includes('think')) {
    return 'CBT';
  }
  if (lowerText.includes('present') || lowerText.includes('mindful')) {
    return 'Mindfulness';
  }
  
  return 'Supportive';
}

function assessCrisisRisk(text: string, message: string): 'low' | 'moderate' | 'high' | 'critical' {
  const lowerMessage = message.toLowerCase();
  
  const criticalKeywords = ['kill', 'die', 'suicide', 'end it all', 'can\'t go on'];
  const highKeywords = ['panic', 'can\'t breathe', 'losing control', 'going crazy'];
  const moderateKeywords = ['overwhelmed', 'can\'t cope', 'too much'];
  
  if (criticalKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'critical';
  }
  if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'high';
  }
  if (moderateKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'moderate';
  }
  
  return 'low';
}

function determineSentiment(text: string, message: string): 'positive' | 'neutral' | 'negative' | 'crisis' {
  const lowerMessage = message.toLowerCase();
  
  const crisisKeywords = ['kill', 'die', 'suicide', 'end it all'];
  const negativeKeywords = ['awful', 'terrible', 'worst', 'hate', 'can\'t'];
  const positiveKeywords = ['good', 'better', 'happy', 'calm', 'grateful'];
  
  if (crisisKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'crisis';
  }
  if (negativeKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'negative';
  }
  if (positiveKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return 'positive';
  }
  
  return 'neutral';
}

function detectEscalation(history: string[], currentMessage: string): boolean {
  if (history.length < 2) return false;
  
  const recentMessages = history.slice(-3);
  const anxietyKeywords = ['panic', 'overwhelmed', 'can\'t', 'worse', 'terrible'];
  
  let escalationCount = 0;
  recentMessages.forEach(msg => {
    if (anxietyKeywords.some(keyword => msg.toLowerCase().includes(keyword))) {
      escalationCount++;
    }
  });
  
  return escalationCount >= 2;
}

function generatePersonalizedResponse(analysisText: string, message: string): string {
  // This would be enhanced by Claude's actual analysis
  return "I can hear that you're going through a challenging time right now. Your feelings are completely valid, and I want you to know that you're not alone in this. Based on what you've shared, it sounds like we could work together on some specific strategies that might help you feel more grounded and in control.";
}
