
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/types/chat';

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

export const chatService = {
  // Create a new chat session
  async createSession(aiCompanion: 'vanessa' | 'monica' = 'vanessa', language: 'en' | 'es' = 'en'): Promise<ChatSession> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        ai_companion: aiCompanion,
        language: language,
        title: `Chat with ${aiCompanion === 'vanessa' ? 'Vanessa' : 'Mónica'}`
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user's chat sessions
  async getUserSessions(): Promise<ChatSession[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Save a message to the database
  async saveMessage(sessionId: string, content: string, sender: 'user' | 'vanessa' | 'monica'): Promise<StoredChatMessage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        content,
        sender
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get messages for a session
  async getSessionMessages(sessionId: string): Promise<StoredChatMessage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Save anxiety analysis
  async saveAnxietyAnalysis(messageId: string | null, analysis: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('anxiety_analyses')
      .insert({
        user_id: user.id,
        message_id: messageId,
        anxiety_level: analysis.anxietyLevel || 5,
        anxiety_triggers: analysis.triggers || [],
        coping_strategies: analysis.recommendedInterventions || [],
        personalized_response: analysis.personalizedResponse,
        confidence_score: 0.8,
        analysis_source: analysis.source || 'fallback'
      });

    if (error) throw error;
  }
};
