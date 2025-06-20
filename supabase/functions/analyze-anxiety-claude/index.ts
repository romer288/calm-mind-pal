
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleRequest } from './request-handler.ts';
import { createErrorResponse } from './utils.ts';

serve(async (req) => {
  try {
    return await handleRequest(req);
  } catch (error) {
    console.error('💥 Critical error in anxiety analysis function:', error);
    console.error('💥 Error stack:', error.stack);
    console.error('💥 Error name:', error.name);
    console.error('💥 Error message:', error.message);
    
    return createErrorResponse(500, 'Internal server error', error.message, {
      errorType: error.name,
      timestamp: new Date().toISOString()
    });
  }
});
