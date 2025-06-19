import React, { useState, useEffect, useRef } from 'react';
import AdvancedAnxietyTracker from '@/components/AdvancedAnxietyTracker';
import ChatHeader from '@/components/ChatHeader';
import ChatMessages from '@/components/ChatMessages';
import ChatInput from '@/components/ChatInput';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useAnxietyAnalysis } from '@/hooks/useAnxietyAnalysis';
import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import { FallbackAnxietyAnalysis } from '@/utils/anxiety/types';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'vanessa';
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
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { isListening, speechSupported, startListening } = useSpeechRecognition();
  const { speechSynthesisSupported, speakText } = useSpeechSynthesis();
  const { isAnalyzing, anxietyAnalyses, currentAnxietyAnalysis, analyzeMessage } = useAnxietyAnalysis();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend) return;

    console.log('📤 Sending message:', textToSend);

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
          "I'm here to support you. How can I best help you right now?";
        
        console.log(`🗣️ Using response from ${source.toUpperCase()}:`, contextualResponse);
        
        const vanessaMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: contextualResponse,
          sender: 'vanessa',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, vanessaMessage]);
        setIsTyping(false);

        console.log('🔊 Attempting to speak response');
        speakText(contextualResponse);
      }, 1500);

    } catch (error) {
      console.error('💥 Error in message handling:', error);
      setIsTyping(false);
      
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm here to listen and support you. How can I best help you right now?",
        sender: 'vanessa',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      speakText(fallbackMessage.text);
    }
  };

  const handleToggleListening = () => {
    startListening((transcript: string) => {
      setInputText(transcript);
    });
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
      />

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col">
        {currentAnxietyAnalysis && (
          <AdvancedAnxietyTracker 
            currentAnalysis={currentAnxietyAnalysis as ClaudeAnxietyAnalysis}
            recentAnalyses={anxietyAnalyses as ClaudeAnxietyAnalysis[]}
          />
        )}
        
        <ChatMessages
          messages={messages}
          isTyping={isTyping}
          isAnalyzing={isAnalyzing}
          scrollRef={scrollRef}
        />

        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          isListening={isListening}
          speechSupported={speechSupported}
          onToggleListening={handleToggleListening}
          onSendMessage={handleSendMessage}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
};

export default Chat;
