
import { systemPrompt } from './constants.ts';
import { ClaudeAnxietyAnalysis } from './types.ts';
import { createErrorResponse, createFallbackAnalysis, validateApiKey } from './utils.ts';

export async function callClaudeApi(
  message: string,
  conversationHistory: string[],
  apiKey: string
): Promise<{ success: true; analysis: ClaudeAnxietyAnalysis } | { success: false; response: Response }> {
  
  console.log('🔧 Received API key length:', apiKey?.length || 0);
  console.log('🔧 API key type:', typeof apiKey);
  console.log('🔧 API key truthy:', !!apiKey);
  
  if (!apiKey) {
    console.log('❌ API key is null, undefined, or empty');
    return {
      success: false,
      response: createErrorResponse(500, 'Claude API key is missing', 'API key is null, undefined, or empty')
    };
  }
  
  const cleanApiKey = apiKey.trim();
  console.log('🔧 Cleaned API key length:', cleanApiKey.length);
  console.log('🔧 API key starts with:', cleanApiKey.substring(0, 10));
  console.log('🔧 API key ends with:', cleanApiKey.substring(cleanApiKey.length - 10));
  
  const apiKeyError = validateApiKey(cleanApiKey);
  if (apiKeyError) {
    console.log('❌ Invalid Claude API key format:', apiKeyError);
    return {
      success: false,
      response: createErrorResponse(500, 'Invalid Claude API key format', apiKeyError)
    };
  }

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
        'x-api-key': cleanApiKey,
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
    return {
      success: false,
      response: createErrorResponse(500, 'Network error calling Claude API', fetchError.message)
    };
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
    
    return {
      success: false,
      response: createErrorResponse(500, `Claude API error: ${claudeResponse.status}`, errorText, {
        apiKeyFormat: cleanApiKey.startsWith('sk-ant-') ? 'Valid format' : 'Invalid format',
        apiKeyLength: cleanApiKey.length,
        apiKeyStart: cleanApiKey.substring(0, 10),
        timestamp: new Date().toISOString()
      })
    };
  }

  let claudeData: any;
  try {
    claudeData = await claudeResponse.json();
    console.log('📝 Claude response received successfully');
  } catch (jsonError) {
    console.log('❌ Error parsing Claude response JSON:', jsonError);
    return {
      success: false,
      response: createErrorResponse(500, 'Invalid JSON response from Claude API', jsonError.message)
    };
  }

  if (!claudeData.content || !claudeData.content[0] || !claudeData.content[0].text) {
    console.log('❌ Invalid Claude response structure:', claudeData);
    return {
      success: false,
      response: createErrorResponse(500, 'Invalid response structure from Claude API', 'Missing content.text in response')
    };
  }

  const analysisText = claudeData.content[0].text;
  console.log('📝 Claude analysis text received, length:', analysisText.length);

  let analysis: ClaudeAnxietyAnalysis;
  try {
    analysis = JSON.parse(analysisText);
    console.log('✅ Successfully parsed Claude response as JSON');
    
    if (!analysis.personalizedResponse || typeof analysis.personalizedResponse !== 'string') {
      throw new Error('Missing or invalid personalizedResponse field');
    }
    
  } catch (parseError) {
    console.log('❌ Failed to parse Claude response as JSON:', parseError);
    console.log('❌ Raw response:', analysisText);
    
    analysis = createFallbackAnalysis(message);
  }

  return { success: true, analysis };
}
