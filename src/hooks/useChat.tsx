import { useState, useEffect, useRef } from 'react';
import { Message, AICompanion, Language } from '@/types/chat';
import { useAnxietyAnalysis } from '@/hooks/useAnxietyAnalysis';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { detectLanguage } from '@/utils/languageDetection';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Vanessa, your advanced AI anxiety companion. I'm here to provide you with clinically-informed support using the latest therapeutic approaches. How are you feeling today?",
      sender: 'vanessa',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [aiCompanion, setAiCompanion] = useState<AICompanion>('vanessa');
  const [hasSpokenWelcome, setHasSpokenWelcome] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { speakText } = useSpeechSynthesis();
  const { isAnalyzing, analyzeMessage } = useAnxietyAnalysis();

  // Speak the welcome message when the component first loads
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

  const switchToMonica = () => {
    if (aiCompanion === 'vanessa') {
      setAiCompanion('monica');
      setCurrentLanguage('es');
      
      const monicaIntroMessage: Message = {
        id: 'monica-intro',
        text: "¡Hola! Soy Mónica, tu compañera de apoyo para la ansiedad. Estoy aquí para brindarte apoyo clínico informado usando los enfoques terapéuticos más avanzados. ¿Cómo te sientes hoy?",
        sender: 'monica',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, monicaIntroMessage]);
      speakText(monicaIntroMessage.text, 'es');
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend) return;

    console.log('📤 Sending message:', textToSend);

    // Detect language
    const detectedLanguage = detectLanguage(textToSend);
    console.log('🌐 Detected language:', detectedLanguage);

    // Switch to Monica if Spanish is detected
    if (detectedLanguage === 'es' && aiCompanion === 'vanessa') {
      switchToMonica();
      setInputText('');
      return;
    }

    try {
      const conversationHistory = messages
        .filter(msg => msg.sender === 'user')
        .map(msg => msg.text)
        .slice(-10);

      console.log('📚 Using conversation history:', conversationHistory);

      const anxietyAnalysis = await analyzeMessage(textToSend, conversationHistory);

      // Log the source of the analysis
      const source = (anxietyAnalysis as any).source || 'unknown';
      console.log(`🧠 Analysis complete from ${source.toUpperCase()}:`, anxietyAnalysis);
      console.log('💭 Personalized response from analysis:', anxietyAnalysis.personalizedResponse);

      const userMessage: Message = {
        id: Date.now().toString(),
        text: textToSend,
        sender: 'user',
        timestamp: new Date(),
        anxietyAnalysis
      };

      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      setIsTyping(true);

      setTimeout(() => {
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

        console.log('🔊 Attempting to speak response');
        speakText(contextualResponse, detectedLanguage);
      }, 1500);

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
