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

    const systemPrompt = `You are Vanessa, a compassionate AI anxiety companion with clinical psychology training. You specialize in providing personalized therapeutic responses based on individual patient needs.

CLINICAL FRAMEWORKS TO APPLY:
1. GAD-7 Scale (0-21): Assess generalized anxiety severity
2. Beck Anxiety Inventory: Identify somatic vs cognitive symptoms  
3. DSM-5 Anxiety Criteria: Map symptoms to potential disorder patterns
4. Cognitive Behavioral Therapy: Identify thinking patterns and triggers

YOUR RESPONSE MUST INCLUDE:
1. Clinical Analysis (JSON format)
2. Personalized Therapeutic Response as Vanessa

ANALYSIS REQUIREMENTS:
- Anxiety Level: Rate 1-10 based on clinical severity
- GAD-7 Score: Estimate 0-21 score based on symptoms described
- Beck Categories: Identify physical symptoms, cognitive symptoms, panic symptoms
- DSM-5 Indicators: Note any criteria met for anxiety disorders
- Cognitive Distortions: Identify catastrophizing, all-or-nothing thinking, etc.
- Crisis Assessment: Evaluate immediate risk level
- Therapeutic Approach: Recommend most appropriate intervention
- Personalized Response: Craft a compassionate, therapeutic response as Vanessa that directly addresses the patient's specific concerns, emotions, and needs

RESPONSE GUIDELINES FOR VANESSA:
- Validate the patient's feelings and experiences
- Address their specific concerns mentioned in the message
- Use person-first language and avoid clinical jargon
- Offer relevant coping strategies based on their situation
- Show empathy and understanding
- If crisis risk is detected, prioritize safety while remaining supportive
- Tailor your response to their therapy approach and triggers identified

RESPONSE FORMAT: Return ONLY a JSON object with this exact structure:
{
  "anxietyLevel": number,
  "gad7Score": number,
  "beckAnxietyCategories": string[],
  "dsm5Indicators": string[],
  "triggers": string[],
  "cognitiveDistortions": string[],
  "recommendedInterventions": string[],
  "therapyApproach": "CBT" | "DBT" | "Mindfulness" | "Trauma-Informed" | "Supportive",
  "crisisRiskLevel": "low" | "moderate" | "high" | "critical",
  "sentiment": "positive" | "neutral" | "negative" | "crisis",
  "escalationDetected": boolean,
  "personalizedResponse": "Your personalized therapeutic response as Vanessa here"
}

IMPORTANT: The personalizedResponse must be crafted specifically for this patient's message and emotional state. Make it personal, therapeutic, and relevant to their specific situation.`;

    const conversationContext = conversationHistory.length > 0 ? 
      `\n\nPrevious conversation context (last 5 messages): ${conversationHistory.slice(-5).join(' | ')}` : '';

    const userPrompt = `Patient's current message: "${message}"${conversationContext}

Please provide a comprehensive clinical analysis and personalized therapeutic response as Vanessa. Focus on what this specific patient needs to hear right now based on their message and emotional state.`;

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
        temperature: 0.7,
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

    console.log('Claude raw response:', analysisText);

    let analysis: ClaudeAnxietyAnalysis;
    
    try {
      // Try to parse as JSON first
      analysis = JSON.parse(analysisText);
      
      // Ensure personalizedResponse exists and is meaningful
      if (!analysis.personalizedResponse || analysis.personalizedResponse.length < 20) {
        analysis.personalizedResponse = generatePersonalizedFallback(message, analysis);
      }
    } catch (parseError) {
      console.log('Failed to parse Claude response as JSON, creating structured analysis');
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
        personalizedResponse: extractPersonalizedResponse(analysisText, message)
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

function generatePersonalizedFallback(message: string, analysis: ClaudeAnxietyAnalysis): string {
  const lowerMessage = message.toLowerCase();
  
  // Crisis response
  if (analysis.crisisRiskLevel === 'critical') {
    return "I'm deeply concerned about what you're sharing with me right now. Your life has immense value, and I want you to know that you don't have to face this alone. Please reach out to a crisis helpline (988 in the US) or emergency services immediately. There are people trained to help you through this exact situation.";
  }
  
  // High anxiety response
  if (analysis.anxietyLevel >= 8) {
    return "I can feel the intensity of what you're going through right now, and I want you to know that your feelings are completely valid. When anxiety feels this overwhelming, it can seem like it will never end, but you've gotten through difficult moments before, and you can get through this one too. Let's focus on some immediate grounding techniques that might help you feel more stable.";
  }
  
  // Work-related stress
  if (analysis.triggers.includes('work')) {
    return "Work stress can feel so consuming, especially when it starts affecting other areas of your life. It sounds like your job is creating a lot of pressure for you right now. Have you been able to take any breaks for yourself lately? Sometimes even small moments of stepping away can help us regain perspective.";
  }
  
  // Social anxiety
  if (analysis.triggers.includes('social')) {
    return "Social situations can feel incredibly challenging, and what you're experiencing is more common than you might think. Many people struggle with similar feelings around others. You're being brave by reaching out and talking about this. What feels most difficult about social interactions for you right now?";
  }
  
  // Health anxiety
  if (analysis.triggers.includes('health')) {
    return "Health concerns can create such intense worry, especially when our minds start imagining worst-case scenarios. It's completely understandable that you're feeling anxious about this. Have you been able to speak with a healthcare provider about your concerns? Sometimes having professional reassurance can help quiet some of those worried thoughts.";
  }
  
  // Positive sentiment
  if (analysis.sentiment === 'positive') {
    return "I'm so glad to hear that you're feeling better! That's wonderful progress, and it shows your strength and resilience. What do you think has been most helpful in getting you to this better place? It's important to recognize and celebrate these positive moments.";
  }
  
  // Cognitive distortions
  if (analysis.cognitiveDistortions.includes('All-or-nothing thinking')) {
    return "I notice you're using some very absolute language - words like 'always' or 'never.' Our minds sometimes paint situations in very black and white terms when we're stressed, but reality is usually more nuanced. What if we looked at this situation and tried to find some middle ground or gray areas?";
  }
  
  // Default supportive response
  return "Thank you for trusting me with what you're going through. I can hear that this is really difficult for you right now, and I want you to know that your feelings are completely valid. You don't have to carry this alone - I'm here to support you, and together we can work through this step by step.";
}

function extractPersonalizedResponse(text: string, message: string): string {
  // Try to extract a personalized response from Claude's text
  const lines = text.split('\n');
  const responseLines = lines.filter(line => 
    line.includes('response') || 
    line.includes('Vanessa') ||
    line.length > 50
  );
  
  if (responseLines.length > 0) {
    return responseLines[0].replace(/^[^a-zA-Z]*/, '').trim();
  }
  
  return generatePersonalizedFallback(message, {
    anxietyLevel: 5,
    gad7Score: 10,
    beckAnxietyCategories: [],
    dsm5Indicators: [],
    triggers: [],
    cognitiveDistortions: [],
    recommendedInterventions: [],
    therapyApproach: 'Supportive',
    crisisRiskLevel: 'moderate',
    sentiment: 'neutral',
    escalationDetected: false,
    personalizedResponse: ''
  });
}
