import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import AdvancedAnxietyTracker from '@/components/AdvancedAnxietyTracker';
import { analyzeAnxietyWithClaude, ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import { analyzeFallbackAnxiety, FallbackAnxietyAnalysis } from '@/utils/fallbackAnxietyAnalysis';
import { useToast } from '@/hooks/use-toast';

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
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [anxietyAnalyses, setAnxietyAnalyses] = useState<(ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis)[]>([]);
  const [currentAnxietyAnalysis, setCurrentAnxietyAnalysis] = useState<ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Initializing speech capabilities...');
    
    // Check for speech recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      console.log('Speech recognition is available');
      setSpeechSupported(true);
      
      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          console.log('Speech recognition result received');
          const transcript = event.results[0][0].transcript;
          console.log('Transcript:', transcript);
          setInputText(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast({
            title: "Speech Recognition Error",
            description: `Error: ${event.error}. Please try again or type your message.`,
            variant: "destructive",
          });
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
        };
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        setSpeechSupported(false);
      }
    } else {
      console.log('Speech recognition not available in this browser');
      setSpeechSupported(false);
    }

    // Check for speech synthesis support with better detection
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      console.log('Speech synthesis is available');
      setSpeechSynthesisSupported(true);
      
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);
        if (voices.length > 0) {
          setVoicesLoaded(true);
        }
      };

      // Try multiple methods to load voices
      loadVoices();
      
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      // Force voice loading after a delay
      setTimeout(() => {
        loadVoices();
        // Trigger a dummy utterance to wake up the speech synthesis on mobile
        const testUtterance = new SpeechSynthesisUtterance('');
        testUtterance.volume = 0;
        window.speechSynthesis.speak(testUtterance);
      }, 100);
    } else {
      console.log('Speech synthesis not available in this browser');
      setSpeechSynthesisSupported(false);
    }
  }, [toast]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend) return;

    console.log('Sending message:', textToSend);
    setIsAnalyzing(true);

    try {
      const conversationHistory = messages
        .filter(msg => msg.sender === 'user')
        .map(msg => msg.text)
        .slice(-10);

      let anxietyAnalysis: ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis;

      try {
        // Try Claude first
        anxietyAnalysis = await analyzeAnxietyWithClaude(
          textToSend,
          conversationHistory,
          'user-123'
        );
        console.log('Using Claude analysis');
      } catch (error) {
        console.log('Claude API not available, using fallback analysis');
        // Use fallback analysis
        anxietyAnalysis = analyzeFallbackAnxiety(textToSend, conversationHistory);
      }

      setCurrentAnxietyAnalysis(anxietyAnalysis);
      setAnxietyAnalyses(prev => [...prev, anxietyAnalysis]);

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
        const getContextualResponse = (analysis: ClaudeAnxietyAnalysis | FallbackAnxietyAnalysis) => {
          if ('personalizedResponse' in analysis && analysis.personalizedResponse) {
            return analysis.personalizedResponse;
          }

          let response = "";

          if (analysis.crisisRiskLevel === 'critical') {
            response = "I'm very concerned about what you're sharing with me. Please consider reaching out to a crisis helpline (988 in the US) or emergency services immediately. Your life has value and there are people who want to help you.";
          } else if (analysis.crisisRiskLevel === 'high') {
            response = "I can hear how difficult things are for you right now. Have you considered speaking with a mental health professional? They can provide specialized support that might really help.";
          } else {
            switch (analysis.therapyApproach) {
              case 'CBT':
                response = `I notice some thought patterns that might be contributing to how you're feeling. ${analysis.cognitiveDistortions.length > 0 ? `Specifically, I'm seeing some ${analysis.cognitiveDistortions[0].toLowerCase()}.` : ''} Would you like to explore some ways to challenge these thoughts?`;
                break;
              case 'DBT':
                response = "It sounds like you're experiencing some intense emotions. That's completely understandable. Let's focus on some skills that might help you navigate these feelings.";
                break;
              case 'Mindfulness':
                response = "I can sense there's a lot on your mind right now. Sometimes grounding ourselves in the present moment can provide some relief. Would you like to try a brief mindfulness exercise?";
                break;
              case 'Trauma-Informed':
                response = "Thank you for trusting me with your feelings. What you're experiencing is completely valid, and healing takes time. We can go at whatever pace feels comfortable for you.";
                break;
              default:
                response = "I hear you, and I want you to know that what you're experiencing matters. You're taking a brave step by reaching out and talking about these feelings.";
            }

            if (analysis.triggers.includes('work')) {
              response += " Work-related stress can be particularly overwhelming.";
            }
            if (analysis.triggers.includes('social')) {
              response += " Social situations can feel challenging, but please remember that you belong.";
            }
            if (analysis.triggers.includes('health')) {
              response += " Health concerns can create a lot of anxiety - that's very understandable.";
            }
          }

          return response;
        };
        
        const contextualResponse = getContextualResponse(anxietyAnalysis);
        
        const vanessaMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: contextualResponse,
          sender: 'vanessa',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, vanessaMessage]);
        setIsTyping(false);

        console.log('Attempting to speak response');
        speakText(contextualResponse);
      }, 1500);

    } catch (error) {
      console.error('Error in message handling:', error);
      setIsTyping(false);
      
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm here to listen and support you. How can I best help you right now?",
        sender: 'vanessa',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      speakText(fallbackMessage.text);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const speakText = (text: string) => {
    console.log('Attempting to speak:', text);
    
    if (!speechSynthesisSupported) {
      console.log('Speech synthesis not supported');
      return;
    }
    
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.length);
        
        // Find a good female voice
        const preferredVoices = [
          'Google UK English Female',
          'Microsoft Zira Desktop - English (United States)',
          'Samantha',
          'Karen',
          'Moira',
          'Tessa'
        ];
        
        let selectedVoice = null;
        
        for (const voiceName of preferredVoices) {
          selectedVoice = voices.find(voice => voice.name.includes(voiceName));
          if (selectedVoice) break;
        }
        
        // Fallback to any English female voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.startsWith('en') && 
            (voice.name.toLowerCase().includes('female') ||
             voice.name.toLowerCase().includes('woman') ||
             voice.name.toLowerCase().includes('samantha') ||
             voice.name.toLowerCase().includes('karen'))
          );
        }
        
        // Final fallback to any English voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log('Using voice:', selectedVoice.name);
        }
        
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        
        utterance.onstart = () => console.log('Speech started');
        utterance.onend = () => console.log('Speech ended');
        utterance.onerror = (event) => {
          console.error('Speech error:', event.error);
          toast({
            title: "Audio Issue",
            description: "Text-to-speech had an issue, but you can still read the message.",
            variant: "destructive",
          });
        };
        
        window.speechSynthesis.speak(utterance);
      }, 100);
      
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  };

  const toggleListening = () => {
    if (!speechSupported) {
      toast({
        title: "Microphone Not Available",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      console.log('Stopping speech recognition');
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      console.log('Starting speech recognition');
      try {
        setIsListening(true);
        recognitionRef.current?.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
        toast({
          title: "Microphone Error",
          description: "Unable to start speech recognition. Please check permissions.",
          variant: "destructive",
        });
      }
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
            {speechSynthesisSupported ? (
              <Volume2 className="w-6 h-6 text-green-600" />
            ) : (
              <VolumeX className="w-6 h-6 text-gray-400" />
            )}
            Advanced Anxiety Support with Vanessa
          </h1>
          <p className="text-gray-600">
            AI companion with clinical analysis and voice support
          </p>
          {!speechSupported && !speechSynthesisSupported && (
            <p className="text-amber-600 text-sm mt-2">
              Voice features not available in this browser. You can still chat by typing.
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col">
        {currentAnxietyAnalysis && (
          <AdvancedAnxietyTracker 
            currentAnalysis={currentAnxietyAnalysis}
            recentAnalyses={anxietyAnalyses}
          />
        )}
        
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
            {(isTyping || isAnalyzing) && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isAnalyzing ? 'Analyzing your message...' : 'Vanessa is typing...'}
                  </p>
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
              disabled={!speechSupported}
              title={speechSupported ? "Voice input" : "Voice input not supported"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isListening 
                  ? "Listening..." 
                  : speechSupported 
                    ? "Type or speak your message..." 
                    : "Type your message..."
              }
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
              Listening for your voice...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
