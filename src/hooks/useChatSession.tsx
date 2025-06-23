
import { useState, useEffect } from 'react';
import { chatService, ChatSession } from '@/services/chatService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AICompanion, Language } from '@/types/chat';

export const useChatSession = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [aiCompanion, setAiCompanion] = useState<AICompanion>('vanessa');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  useEffect(() => {
    if (user && !currentSession) {
      initializeChat();
    }
  }, [user]);

  const initializeChat = async () => {
    try {
      const session = await chatService.createSession('vanessa', 'en');
      setCurrentSession(session);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      toast({
        title: "Error",
        description: "Failed to initialize chat session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const switchToMonica = async () => {
    if (aiCompanion === 'vanessa' && currentSession) {
      try {
        const monicaSession = await chatService.createSession('monica', 'es');
        setCurrentSession(monicaSession);
        setAiCompanion('monica');
        setCurrentLanguage('es');
        return monicaSession;
      } catch (error) {
        console.error('Failed to switch to Monica:', error);
        toast({
          title: "Error",
          description: "Failed to switch to Monica. Please try again.",
          variant: "destructive"
        });
        return null;
      }
    }
    return null;
  };

  return {
    currentSession,
    aiCompanion,
    currentLanguage,
    setAiCompanion,
    setCurrentLanguage,
    switchToMonica
  };
};
