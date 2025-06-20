
import { AnxietyAnalysisRequest } from './types.ts';
import { corsHeaders } from './constants.ts';
import { createErrorResponse, validateRequest } from './utils.ts';
import { callClaudeApi } from './claude-api.ts';

export async function handleRequest(req: Request): Promise<Response> {
  console.log('🚀 Claude analysis function called');
  console.log('📝 Request method:', req.method);
  console.log('📝 Request URL:', req.url);

  // Handle CORS preflight requests FIRST
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('🔍 Processing POST request...');
  
  let requestBody: string;
  try {
    requestBody = await req.text();
    console.log('📝 Raw request body received, length:', requestBody.length);
    console.log('📝 Raw request body:', requestBody);
  } catch (bodyError) {
    console.log('❌ Error reading request body:', bodyError);
    return createErrorResponse(400, 'Failed to read request body', bodyError.message);
  }

  let parsedBody: AnxietyAnalysisRequest;
  try {
    parsedBody = JSON.parse(requestBody);
    console.log('📝 Successfully parsed request body');
  } catch (parseError) {
    console.log('❌ Error parsing JSON:', parseError);
    return createErrorResponse(400, 'Invalid JSON in request body', parseError.message);
  }

  const validationError = validateRequest(parsedBody);
  if (validationError) {
    console.log('❌ Request validation failed:', validationError);
    return createErrorResponse(400, validationError);
  }

  const { message, conversationHistory = [], userId } = parsedBody;
  console.log('📝 Parsed message:', message);
  console.log('📝 Conversation history length:', conversationHistory.length);
  
  // Get Claude API key from environment - trying multiple possible names
  console.log('🔑 Checking for Claude API key...');
  console.log('🔑 Environment keys available:', Object.keys(Deno.env.toObject()));
  
  let claudeApiKey = Deno.env.get('Anxiety-Companion-key');
  console.log('🔑 Anxiety-Companion-key exists:', !!claudeApiKey);
  console.log('🔑 Anxiety-Companion-key length:', claudeApiKey?.length || 0);
  
  // Try alternative key names if the main one doesn't exist
  if (!claudeApiKey) {
    console.log('🔑 Trying alternative key names...');
    claudeApiKey = Deno.env.get('Claude_API_key');
    console.log('🔑 Claude_API_key exists:', !!claudeApiKey);
    
    if (!claudeApiKey) {
      claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
      console.log('🔑 CLAUDE_API_KEY exists:', !!claudeApiKey);
    }
    
    if (!claudeApiKey) {
      claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY');
      console.log('🔑 ANTHROPIC_API_KEY exists:', !!claudeApiKey);
    }
  }
  
  if (!claudeApiKey) {
    console.log('❌ Claude API key not found in any environment variable');
    console.log('🔑 Available environment variables:', Object.keys(Deno.env.toObject()));
    return createErrorResponse(500, 'Claude API key not configured', 'No API key found in any of the checked environment variables: Anxiety-Companion-key, Claude_API_key, CLAUDE_API_KEY, ANTHROPIC_API_KEY');
  }

  console.log('✅ Claude API key found, length:', claudeApiKey.length);
  
  const result = await callClaudeApi(message, conversationHistory, claudeApiKey);
  
  if (!result.success) {
    return result.response;
  }

  console.log('✅ Final analysis prepared');

  const response = { success: true, analysis: result.analysis };
  
  return new Response(JSON.stringify(response), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
