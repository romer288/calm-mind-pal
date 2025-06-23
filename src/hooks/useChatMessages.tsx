
import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';

export const useChatMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { speakText } = useSpeechSynthesis();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Speak the welcome message
  useEffect(() => {
    if (!hasSpokenWelcome && messages.length > 0) {
      const welcomeMessage = messages[0];
      if (welcomeMessage && welcomeMessage.sender === 'vanessa') {
        console.log('🔊 Speaking welcome message');
        speakText(welcomeMessage.text, 'en');
        setHasSpokenWelcome(true);
      }
    }
  }, [speakText, hasSpokenWelcome, messages]);

  const addWelcomeMessage = (companionName: 'vanessa' | 'monica') => {
    const welcomeMessage: Message = {
      id: '1',
      text: companionName === 'vanessa' 
        ? "Hello! I'm Vanessa, your advanced AI anxiety companion. I'm here to provide you with clinically-informed support using the latest therapeutic approaches. How are you feeling today?"
        : "¡Hola! Soy Mónica, tu compañera de apoyo para la ansiedad. Estoy aquí para brindarte apoyo clínico informado usando los enfoques terapéuticos más avanzados. ¿Cómo te sientes hoy?",
      sender: companionName,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    return welcomeMessage;
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, ...updates }
          : msg
      )
    );
  };

  return {
    messages,
    inputText,
    setInputText,
    isTyping,
    setIsTyping,
    scrollRef,
    addWelcomeMessage,
    addMessage,
    updateMessage,
    speakText
  };
};
