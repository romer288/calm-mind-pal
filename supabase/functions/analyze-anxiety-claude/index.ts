
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
  console.log('📝 Request URL:', req.url);

  // Handle CORS preflight requests FIRST
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Processing POST request...');
    
    let requestBody: string;
    try {
      requestBody = await req.text();
      console.log('📝 Raw request body received, length:', requestBody.length);
      console.log('📝 Raw request body:', requestBody);
    } catch (bodyError) {
      console.log('❌ Error reading request body:', bodyError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to read request body',
        details: bodyError.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let parsedBody: AnxietyAnalysisRequest;
    try {
      parsedBody = JSON.parse(requestBody);
      console.log('📝 Successfully parsed request body');
    } catch (parseError) {
      console.log('❌ Error parsing JSON:', parseError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid JSON in request body',
        details: parseError.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, conversationHistory = [], userId } = parsedBody;
    
    console.log('📝 Parsed message:', message);
    console.log('📝 Conversation history length:', conversationHistory.length);
    
    // Validate required fields
    if (!message || typeof message !== 'string') {
      console.log('❌ Missing or invalid message field');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Message field is required and must be a string'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
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
    
    // Validate API key format
    if (!claudeApiKey.startsWith('sk-ant-')) {
      console.log('❌ Invalid Claude API key format');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid Claude API key format',
        debug: 'Claude API keys should start with sk-ant-'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
}`;

    const conversationContext = conversationHistory.length > 0 ? 
      `\n\nPrevious conversation context (last 5 messages): ${conversationHistory.slice(-5).join(' | ')}` : '';

    const userPrompt = `Patient's current message: "${message}"${conversationContext}

Please provide a comprehensive clinical analysis and personalized therapeutic response as Vanessa.`;

    console.log('🤖 Sending request to Claude API...');

    let claudeResponse: Response;
    try {
      claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
    } catch (fetchError) {
      console.log('❌ Network error calling Claude API:', fetchError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Network error calling Claude API',
        details: fetchError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('📡 Claude API response status:', claudeResponse.status);

    if (!claudeResponse.ok) {
      let errorText: string;
      try {
        errorText = await claudeResponse.text();
        console.log('❌ Claude API error response:', errorText);
      } catch (textError) {
        console.log('❌ Could not read Claude API error response:', textError);
        errorText = 'Unknown error';
      }
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Claude API error: ${claudeResponse.status}`,
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let claudeData: any;
    try {
      claudeData = await claudeResponse.json();
      console.log('📝 Claude response received successfully');
    } catch (jsonError) {
      console.log('❌ Error parsing Claude response JSON:', jsonError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid JSON response from Claude API',
        details: jsonError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!claudeData.content || !claudeData.content[0] || !claudeData.content[0].text) {
      console.log('❌ Invalid Claude response structure:', claudeData);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid response structure from Claude API',
        details: 'Missing content.text in response'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const analysisText = claudeData.content[0].text;
    console.log('📝 Claude analysis text received, length:', analysisText.length);

    let analysis: ClaudeAnxietyAnalysis;
    try {
      analysis = JSON.parse(analysisText);
      console.log('✅ Successfully parsed Claude response as JSON');
      
      // Validate required fields
      if (!analysis.personalizedResponse || typeof analysis.personalizedResponse !== 'string') {
        throw new Error('Missing or invalid personalizedResponse field');
      }
      
    } catch (parseError) {
      console.log('❌ Failed to parse Claude response as JSON:', parseError);
      console.log('❌ Raw response:', analysisText);
      
      // Generate fallback analysis
      analysis = {
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

    console.log('✅ Final analysis prepared');

    const response = { success: true, analysis };
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('💥 Critical error in anxiety analysis function:', error);
    console.error('💥 Error stack:', error.stack);
    console.error('💥 Error name:', error.name);
    console.error('💥 Error message:', error.message);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error',
      details: error.message,
      debug: {
        errorType: error.name,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
