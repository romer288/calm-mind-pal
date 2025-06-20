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

serve(async (req) => {
  console.log('🚀 Claude analysis function called');
  console.log('📝 Request method:', req.method);

  // Handle CORS preflight requests FIRST
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Processing POST request...');
    
    const requestBody = await req.text();
    console.log('📝 Raw request body received, length:', requestBody.length);

    const { message, conversationHistory = [], userId } = JSON.parse(requestBody) as AnxietyAnalysisRequest;
    
    console.log('📝 Parsed message:', message);
    console.log('📝 Conversation history length:', conversationHistory.length);
    
    // Get Claude API key with multiple possible names
    const claudeApiKey = Deno.env.get('Claude_API_key') || 
                        Deno.env.get('CLAUDE_API_KEY') || 
                        Deno.env.get('ANTHROPIC_API_KEY');
    
    console.log('🔑 Checking Claude API key...');
    console.log('🔑 Claude_API_key exists:', !!Deno.env.get('Claude_API_key'));
    console.log('🔑 CLAUDE_API_KEY exists:', !!Deno.env.get('CLAUDE_API_KEY'));
    console.log('🔑 ANTHROPIC_API_KEY exists:', !!Deno.env.get('ANTHROPIC_API_KEY'));
    
    if (!claudeApiKey) {
      console.log('❌ Claude API key not found in environment');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Claude API key not configured',
        debug: 'No API key found in any expected environment variable'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Claude API key found, length:', claudeApiKey.length);
    console.log('🔑 API key starts with:', claudeApiKey.substring(0, 10) + '...');

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

    console.log('🤖 Sending request to Claude API...');

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

    console.log('📡 Claude API response status:', claudeResponse.status);
    console.log('📡 Claude API response headers:', Object.fromEntries(claudeResponse.headers.entries()));

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.log('❌ Claude API error response:', errorText);
      
      // Try to parse error response
      let errorDetails = errorText;
      try {
        const errorObj = JSON.parse(errorText);
        errorDetails = errorObj.error?.message || errorText;
      } catch (e) {
        // Keep original error text if JSON parsing fails
      }
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Claude API error: ${claudeResponse.status}`,
        details: errorDetails,
        debug: {
          status: claudeResponse.status,
          statusText: claudeResponse.statusText,
          hasApiKey: !!claudeApiKey,
          apiKeyLength: claudeApiKey?.length || 0
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const claudeData = await claudeResponse.json();
    console.log('📝 Claude response received successfully');
    console.log('📝 Claude response structure:', Object.keys(claudeData));

    const analysisText = claudeData.content[0].text;
    console.log('📝 Claude analysis text length:', analysisText.length);
    console.log('📝 Claude analysis preview:', analysisText.substring(0, 200) + '...');

    let analysis: ClaudeAnxietyAnalysis;
    
    try {
      analysis = JSON.parse(analysisText);
      console.log('✅ Successfully parsed Claude response as JSON');
      console.log('✅ Analysis keys:', Object.keys(analysis));
      
      if (!analysis.personalizedResponse || analysis.personalizedResponse.length < 20) {
        console.log('⚠️ Personalized response too short, generating fallback');
        analysis.personalizedResponse = generatePersonalizedFallback(message);
      }
    } catch (parseError) {
      console.log('❌ Failed to parse Claude response as JSON:', parseError);
      console.log('❌ Raw response that failed to parse:', analysisText);
      
      analysis = {
        anxietyLevel: determineAnxietyLevel(message),
        gad7Score: determineGAD7Score(message),
        beckAnxietyCategories: ["Cognitive Symptoms"],
        dsm5Indicators: ["Excessive anxiety and worry"],
        triggers: extractTriggers(message),
        cognitiveDistortions: ["All-or-nothing thinking"],
        recommendedInterventions: ["Deep breathing exercises", "Cognitive restructuring"],
        therapyApproach: 'Supportive',
        crisisRiskLevel: 'low',
        sentiment: 'neutral',
        escalationDetected: false,
        personalizedResponse: generatePersonalizedFallback(message)
      };
    }

    console.log('✅ Final analysis prepared');
    console.log('✅ Personalized response:', analysis.personalizedResponse);

    const response = { success: true, analysis };
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Error in anxiety analysis function:', error);
    console.error('💥 Error stack:', error.stack);
    console.error('💥 Error name:', error.name);
    console.error('💥 Error message:', error.message);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error',
      details: error.message,
      debug: {
        errorType: error.name,
        errorStack: error.stack
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function determineAnxietyLevel(message: string): number {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('panic') || lowerMessage.includes('overwhelmed')) return 8;
  if (lowerMessage.includes('anxious') || lowerMessage.includes('worried')) return 6;
  if (lowerMessage.includes('stressed') || lowerMessage.includes('nervous')) return 4;
  return 2;
}

function determineGAD7Score(message: string): number {
  return Math.min(determineAnxietyLevel(message) * 2, 21);
}

function extractTriggers(message: string): string[] {
  const triggers = [];
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('work') || lowerMessage.includes('job')) triggers.push('work');
  if (lowerMessage.includes('social') || lowerMessage.includes('people')) triggers.push('social');
  if (lowerMessage.includes('health') || lowerMessage.includes('sick')) triggers.push('health');
  if (lowerMessage.includes('money') || lowerMessage.includes('financial')) triggers.push('financial');
  
  return triggers;
}

function generatePersonalizedFallback(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
    return "Hello! I'm so glad you're here. It takes courage to reach out, and I want you to know that this is a safe space where you can share whatever is on your mind. How are you feeling today?";
  }
  
  if (lowerMessage.includes('trump') || lowerMessage.includes('politics')) {
    return "I understand that political topics can bring up strong feelings and sometimes stress or anxiety. It's completely normal to feel affected by current events and public figures. Would you like to talk about how these feelings are impacting you today?";
  }
  
  return "Thank you for sharing that with me. I'm here to listen and support you through whatever you're experiencing. How are you feeling right now, and what would be most helpful for you today?";
}
