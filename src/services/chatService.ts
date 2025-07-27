
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';
import { validateAndSanitizeMessage, sanitizeInput, sessionTitleSchema } from '@/utils/validation';
import { interventionSummaryService } from './interventionSummaryService';

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  ai_companion: 'vanessa' | 'monica';
  language: 'en' | 'es';
  created_at: string;
  updated_at: string;
}

export interface StoredChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  sender: 'user' | 'vanessa' | 'monica';
  created_at: string;
}

export class ChatService {
  // Create a new chat session
  static async createSession(
    aiCompanion: 'vanessa' | 'monica' = 'vanessa', 
    language: 'en' | 'es' = 'en'
  ): Promise<ChatSession> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const companionName = aiCompanion === 'vanessa' ? 'Vanessa' : 'Mónica';
    const title = `Chat with ${companionName}`;

    // Validate title
    const sanitizedTitle = sanitizeInput(title);
    try {
      sessionTitleSchema.parse(sanitizedTitle);
    } catch {
      throw new Error('Invalid session title');
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        ai_companion: aiCompanion,
        language: language,
        title: sanitizedTitle
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      ai_companion: data.ai_companion as 'vanessa' | 'monica',
      language: data.language as 'en' | 'es'
    };
  }

  // Get user's chat sessions
  static async getUserSessions(): Promise<ChatSession[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50); // Limit to prevent excessive data loading

    if (error) throw error;
    return (data || []).map(session => ({
      ...session,
      ai_companion: session.ai_companion as 'vanessa' | 'monica',
      language: session.language as 'en' | 'es'
    }));
  }

  // Save a message to the database
  static async saveMessage(
    sessionId: string, 
    content: string, 
    sender: 'user' | 'vanessa' | 'monica'
  ): Promise<StoredChatMessage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Validate and sanitize message content
    const validation = validateAndSanitizeMessage(content);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid message content');
    }

    // Validate sender
    const validSenders = ['user', 'vanessa', 'monica'];
    if (!validSenders.includes(sender)) {
      throw new Error('Invalid sender');
    }

    // Validate session ID format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      throw new Error('Invalid session ID');
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        content: validation.sanitized,
        sender
      })
      .select()
      .single();

    if (error) throw error;
    
    // Generate intervention summaries periodically (every 10 messages)
    try {
      const messageCount = await this.getMessageCount(user.id);
      if (messageCount % 10 === 0) {
        // Generate summaries in the background
        interventionSummaryService.generateAndSaveSummaries().catch(console.error);
      }
    } catch (error) {
      console.error('Error triggering summary generation:', error);
    }
    
    return {
      ...data,
      sender: data.sender as 'user' | 'vanessa' | 'monica'
    };
  }

  // Get total message count for user
  static async getMessageCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  }

  // Get messages for a session
  static async getSessionMessages(sessionId: string): Promise<StoredChatMessage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Validate session ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      throw new Error('Invalid session ID');
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1000); // Prevent excessive memory usage

    if (error) throw error;
    return (data || []).map(message => ({
      ...message,
      sender: message.sender as 'user' | 'vanessa' | 'monica'
    }));
  }

  // Save anxiety analysis with validation
  static async saveAnxietyAnalysis(messageId: string | null, analysis: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Validate analysis data
    if (!analysis || typeof analysis !== 'object') {
      throw new Error('Invalid analysis data');
    }

    // Validate anxiety level
    const anxietyLevel = analysis.anxietyLevel || 5;
    if (typeof anxietyLevel !== 'number' || anxietyLevel < 1 || anxietyLevel > 10) {
      throw new Error('Invalid anxiety level');
    }

    // Validate and sanitize personalized response
    let personalizedResponse = analysis.personalizedResponse || '';
    if (personalizedResponse) {
      const validation = validateAndSanitizeMessage(personalizedResponse);
      if (!validation.isValid) {
        throw new Error('Invalid personalized response');
      }
      personalizedResponse = validation.sanitized;
    }

    // Validate triggers and interventions arrays
    const triggers = Array.isArray(analysis.triggers) ? analysis.triggers : [];
    const interventions = Array.isArray(analysis.recommendedInterventions) ? analysis.recommendedInterventions : [];

    // Sanitize array elements
    const sanitizedTriggers = triggers.map((trigger: any) => 
      typeof trigger === 'string' ? sanitizeInput(trigger) : ''
    ).filter(Boolean);

    const sanitizedInterventions = interventions.map((intervention: any) => 
      typeof intervention === 'string' ? sanitizeInput(intervention) : ''
    ).filter(Boolean);

    const { error } = await supabase
      .from('anxiety_analyses')
      .insert({
        user_id: user.id,
        message_id: messageId,
        anxiety_level: anxietyLevel,
        anxiety_triggers: sanitizedTriggers,
        coping_strategies: sanitizedInterventions,
        personalized_response: personalizedResponse,
        confidence_score: Math.min(Math.max(0, analysis.confidence_score || 0.8), 1),
        analysis_source: analysis.source || 'fallback'
      });

    if (error) throw error;
  }
}

// Export the service instance for backward compatibility
export const chatService = ChatService;
