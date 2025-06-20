
import React, { useState, useEffect, useRef } from 'react';
import ChatHeader from '@/components/ChatHeader';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import AdvancedAnxietyTracker from '@/components/AdvancedAnxietyTracker';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useAnxietyAnalysis } from '@/hooks/useAnxietyAnalysis';
import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import { FallbackAnxietyAnalysis } from '@/utils/anxiety/types';
import { detectLanguage } from '@/utils/languageDetection';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'vanessa' | 'monica';
  timestamp: Date;
  anxietyAnalysis?: ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis;
}

const Chat = () => {
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
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'es'>('en');
  const [aiCompanion, setAiCompanion] = useState<'vanessa' | 'monica'>('vanessa');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { isListening, speechSupported, startListening } = useSpeechRecognition();
  const { speechSynthesisSupported, speakText } = useSpeechSynthesis();
  const { isAnalyzing, anxietyAnalyses, currentAnxietyAnalysis, analyzeMessage } = useAnxietyAnalysis();

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

      const anxietyAnalysis = await analyzeMessage(textToSend, conversationHistory, detectedLanguage);

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

  const handleToggleListening = () => {
    startListening((transcript: string) => {
      setInputText(transcript);
    }, currentLanguage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ChatHeader 
        speechSynthesisSupported={speechSynthesisSupported}
        speechSupported={speechSupported}
        aiCompanion={aiCompanion}
        currentLanguage={currentLanguage}
      />

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col">
        {/* Show Advanced Anxiety Analysis if available */}
        {currentAnxietyAnalysis && (
          <AdvancedAnxietyTracker 
            currentAnalysis={currentAnxietyAnalysis as ClaudeAnxietyAnalysis}
            recentAnalyses={anxietyAnalyses.slice(-5) as ClaudeAnxietyAnalysis[]}
          />
        )}

        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          isAnalyzing={isAnalyzing}
          scrollRef={scrollRef}
          aiCompanion={aiCompanion}
        />

        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          isListening={isListening}
          speechSupported={speechSupported}
          onToggleListening={handleToggleListening}
          onSendMessage={handleSendMessage}
          onKeyPress={handleKeyPress}
          currentLanguage={currentLanguage}
        />
      </div>
    </div>
  );
};

export default Chat;
