
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, Volume2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'vanessa';
  timestamp: Date;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Vanessa, your anxiety companion. How are you feeling today?",
      sender: 'vanessa',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-GB';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);

        // Reset silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Set new silence timer for 10 seconds
        silenceTimerRef.current = setTimeout(() => {
          if (transcript.trim()) {
            handleSendMessage(transcript);
          }
        }, 10000);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend) return;

    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    // Simulate AI response (replace with actual AI API call)
    setTimeout(() => {
      const responses = [
        "I understand how you're feeling, love. It's completely normal to experience anxiety. Let's work through this together, shall we?",
        "That sounds quite challenging, dear. Remember, you're stronger than you think. Would you like to try a breathing exercise with me?",
        "Thank you for sharing that with me. Your feelings are absolutely valid. How can I best support you right now?",
        "I'm here to listen, darling. Sometimes talking about our worries can help reduce their power over us.",
        "It's perfectly okay to feel overwhelmed sometimes. Let's take this one step at a time. What would help you feel more calm, do you think?",
        "I hear you, and I want you to know that what you're experiencing is very real. You're not alone in this journey.",
        "Give yourself credit for reaching out today. That takes real courage. What's been on your mind lately?"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const vanessaMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'vanessa',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, vanessaMessage]);
      setIsTyping(false);

      // Speak the response with enhanced British female voice
      speakText(randomResponse);
    }, 1500);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Wait for voices to load
      const setVoice = () => {
        const voices = speechSynthesis.getVoices();
        
        // Try to find the best British female voice
        const preferredVoices = [
          'Google UK English Female',
          'Microsoft Hazel - English (Great Britain)', 
          'Microsoft Susan - English (Great Britain)',
          'Serena',
          'Kate',
          'Moira'
        ];
        
        let selectedVoice = null;
        
        // First, try to find exact matches
        for (const voiceName of preferredVoices) {
          selectedVoice = voices.find(voice => voice.name === voiceName);
          if (selectedVoice) break;
        }
        
        // If no exact match, find any British female voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.includes('en-GB') || voice.lang.includes('en-UK')
          );
        }
        
        // Fallback to any English female voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.startsWith('en') && 
            (voice.name.toLowerCase().includes('female') || 
             voice.name.toLowerCase().includes('woman') ||
             voice.name.toLowerCase().includes('kate') ||
             voice.name.toLowerCase().includes('serena') ||
             voice.name.toLowerCase().includes('moira'))
          );
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        
        // Enhanced voice settings for more natural speech
        utterance.rate = 0.85; // Slightly slower for clarity
        utterance.pitch = 1.1; // Slightly higher pitch for feminine voice
        utterance.volume = 0.9;
        
        console.log('Selected voice:', selectedVoice?.name || 'Default');
        speechSynthesis.speak(utterance);
      };
      
      // If voices are already loaded
      if (speechSynthesis.getVoices().length > 0) {
        setVoice();
      } else {
        // Wait for voices to load
        speechSynthesis.onvoiceschanged = setVoice;
      }
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Volume2 className="w-6 h-6 text-blue-600" />
            Chat with Vanessa
          </h1>
          <p className="text-gray-600">Your AI anxiety companion is here to listen and support you</p>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col">
        <ScrollArea className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex space-x-2">
            <Button
              onClick={toggleListening}
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              className="shrink-0"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "Listening... (auto-send in 10s of silence)" : "Type your message or use voice..."}
              className="flex-1"
              disabled={isListening}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isListening}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          {isListening && (
            <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              Listening... Message will auto-send after 10 seconds of silence
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
