
import { useState, useEffect, useRef } from 'react';
import { Message, AICompanion, Language } from '@/types/chat';
import { useAnxietyAnalysis } from '@/hooks/useAnxietyAnalysis';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { detectLanguage } from '@/utils/languageDetection';
import { chatService, ChatSession } from '@/services/chatService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [aiCompanion, setAiCompanion] = useState<AICompanion>('vanessa');
  const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { speakText } = useSpeechSynthesis();
  const { isAnalyzing, analyzeMessage } = useAnxietyAnalysis();

  // Initialize chat session when user is authenticated
  useEffect(() => {
    if (user && !currentSession) {
      initializeChat();
    }
  }, [user]);

  const initializeChat = async () => {
    try {
      const session = await chatService.createSession('vanessa', 'en');
      setCurrentSession(session);
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: '1',
        text: "Hello! I'm Vanessa, your advanced AI anxiety companion. I'm here to provide you with clinically-informed support using the latest therapeutic approaches. How are you feeling today?",
        sender: 'vanessa',
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      
      // Save welcome message to database
      await chatService.saveMessage(session.id, welcomeMessage.text, 'vanessa');
      
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      toast({
        title: "Error",
        description: "Failed to initialize chat session. Please try again.",
        variant: "destructive"
      });
    }
  };

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const switchToMonica = async () => {
    if (aiCompanion === 'vanessa' && currentSession) {
      try {
        // Create new session for Monica
        const monicaSession = await chatService.createSession('monica', 'es');
        setCurrentSession(monicaSession);
        setAiCompanion('monica');
        setCurrentLanguage('es');
        
        const monicaIntroMessage: Message = {
          id: 'monica-intro',
          text: "¡Hola! Soy Mónica, tu compañera de apoyo para la ansiedad. Estoy aquí para brindarte apoyo clínico informado usando los enfoques terapéuticos más avanzados. ¿Cómo te sientes hoy?",
          sender: 'monica',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, monicaIntroMessage]);
        
        // Save Monica's intro to database
        await chatService.saveMessage(monicaSession.id, monicaIntroMessage.text, 'monica');
        
        speakText(monicaIntroMessage.text, 'es');
      } catch (error) {
        console.error('Failed to switch to Monica:', error);
        toast({
          title: "Error",
          description: "Failed to switch to Monica. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || !currentSession) return;

    console.log('📤 Sending message:', textToSend);

    // Detect language
    const detectedLanguage = detectLanguage(textToSend);
    console.log('🌐 Detected language:', detectedLanguage);

    // Switch to Monica if Spanish is detected
    if (detectedLanguage === 'es' && aiCompanion === 'vanessa') {
      await switchToMonica();
      setInputText('');
      return;
    }

    try {
      const conversationHistory = messages
        .filter(msg => msg.sender === 'user')
        .map(msg => msg.text)
        .slice(-10);

      console.log('📚 Using conversation history:', conversationHistory);

      // Start analysis in parallel with user message creation
      const analysisPromise = analyzeMessage(textToSend, conversationHistory);

      const userMessage: Message = {
        id: Date.now().toString(),
        text: textToSend,
        sender: 'user',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      setIsTyping(true);

      // Save user message to database
      const savedMessage = await chatService.saveMessage(currentSession.id, textToSend, 'user');

      // Wait for analysis to complete
      const anxietyAnalysis = await analysisPromise;

      // Save anxiety analysis to database
      await chatService.saveAnxietyAnalysis(savedMessage.id, anxietyAnalysis);

      const source = (anxietyAnalysis as any).source || 'unknown';
      console.log(`🧠 Analysis complete from ${source.toUpperCase()}:`, anxietyAnalysis);

      // Update user message with analysis
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, anxietyAnalysis }
            : msg
        )
      );

      // Generate AI response
      setTimeout(async () => {
        const contextualResponse = anxietyAnalysis.personalizedResponse || 
          (detectedLanguage === 'es' 
            ? "Estoy aquí para apoyarte. ¿Cómo puedo ayudarte mejor en este momento?"
            : "I'm here to support you. How can I best help you right now?");
        
        console.log(`🗣️ Using response from ${source.toUpperCase()}:`, contextualResponse);
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: contextualResponse,
          sender: aiCompanion,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);

        // Save AI response to database
        await chatService.saveMessage(currentSession.id, contextualResponse, aiCompanion);

        console.log('🔊 Speaking AI response');
        speakText(contextualResponse, detectedLanguage);
      }, 800);

    } catch (error) {
      console.error('💥 Error in message handling:', error);
      setIsTyping(false);
      
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: currentLanguage === 'es' 
          ? "Estoy aquí para escucharte y apoyarte. ¿Cómo puedo ayudarte mejor en este momento?"
          : "I'm here to listen and support you. How can I best help you right now?",
        sender: aiCompanion,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      speakText(fallbackMessage.text, currentLanguage);

      // Save fallback message to database
      if (currentSession) {
        try {
          await chatService.saveMessage(currentSession.id, fallbackMessage.text, aiCompanion);
        } catch (saveError) {
          console.error('Failed to save fallback message:', saveError);
        }
      }
    }
  };

  return {
    messages,
    inputText,
    setInputText,
    isTyping,
    isAnalyzing,
    currentLanguage,
    aiCompanion,
    scrollRef,
    handleSendMessage
  };
};
