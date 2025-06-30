
import { AnxietyAnalysisRequest } from './types.ts';
import { corsHeaders } from './constants.ts';
import { createErrorResponse, validateRequest } from './utils.ts';
import { callClaudeApi } from './claude-api.ts';

export async function handleRequest(req: Request): Promise<Response> {
  console.log('🚀 Claude analysis function called');
  console.log('📝 Request method:', req.method);

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
  
  // Get Claude API key - prioritize the specific key name first
  console.log('🔑 Checking for Claude API key...');
  
  let claudeApiKey = Deno.env.get('Anxiety-Companion-key');
  console.log('🔑 Anxiety-Companion-key found:', !!claudeApiKey);
  
  if (!claudeApiKey) {
    claudeApiKey = Deno.env.get('Claude_API_key');
    console.log('🔑 Claude_API_key found:', !!claudeApiKey);
  }
  
  if (!claudeApiKey) {
    claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    console.log('🔑 CLAUDE_API_KEY found:', !!claudeApiKey);
  }
  
  if (!claudeApiKey) {
    claudeApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    console.log('🔑 ANTHROPIC_API_KEY found:', !!claudeApiKey);
  }
  
  if (!claudeApiKey) {
    console.log('❌ No Claude API key found in environment variables');
    return createErrorResponse(500, 'Claude API key not configured', 'Please set one of: Anxiety-Companion-key, Claude_API_key, CLAUDE_API_KEY, or ANTHROPIC_API_KEY');
  }

  console.log('✅ Claude API key found, proceeding with API call');
  
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
