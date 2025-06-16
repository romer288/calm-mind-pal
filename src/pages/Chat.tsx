import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import AdvancedAnxietyTracker from '@/components/AdvancedAnxietyTracker';
import { analyzeAnxietyWithClaude, ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'vanessa';
  timestamp: Date;
  anxietyAnalysis?: ClaudeAnxietyAnalysis;
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
  const [anxietyAnalyses, setAnxietyAnalyses] = useState<ClaudeAnxietyAnalysis[]>([]);
  const [currentAnxietyAnalysis, setCurrentAnxietyAnalysis] = useState<ClaudeAnxietyAnalysis | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      console.log('Mobile device detected:', isMobileDevice);
    };
    
    checkMobile();

    // Check for speech recognition support
    console.log('Checking browser capabilities...');
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      console.log('Speech recognition is available');
      setSpeechSupported(true);
      
      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          console.log('Speech recognition result received');
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          console.log('Transcript:', transcript);
          setInputText(transcript);

          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          silenceTimerRef.current = setTimeout(() => {
            if (transcript.trim()) {
              console.log('Auto-sending message after silence:', transcript);
              handleSendMessage(transcript);
            }
          }, 10000);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast({
            title: "Speech Recognition Error",
            description: `Error: ${event.error}. Please try typing your message instead.`,
            variant: "destructive",
          });
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
        };

        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
          setIsListening(true);
        };
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        setSpeechSupported(false);
      }
    } else {
      console.log('Speech recognition not available in this browser');
      setSpeechSupported(false);
    }

    // Check for speech synthesis support
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
      console.log('Speech synthesis is available');
      setSpeechSynthesisSupported(true);
      
      // Handle voice loading for different browsers
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Voices loaded:', voices.length);
        if (voices.length > 0) {
          setVoicesLoaded(true);
        }
      };

      // Load voices immediately if available
      loadVoices();
      
      // Also listen for the voices changed event (needed for some browsers)
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      // For mobile devices, sometimes voices need extra time to load
      if (isMobile) {
        setTimeout(loadVoices, 1000);
        setTimeout(loadVoices, 3000);
      }
    } else {
      console.log('Speech synthesis not available in this browser');
      setSpeechSynthesisSupported(false);
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [toast]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend) return;

    console.log('Sending message:', textToSend);

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    setIsAnalyzing(true);

    try {
      const conversationHistory = messages
        .filter(msg => msg.sender === 'user')
        .map(msg => msg.text)
        .slice(-10);

      const anxietyAnalysis = await analyzeAnxietyWithClaude(
        textToSend,
        conversationHistory,
        'user-123'
      );

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

      if (isListening && recognitionRef.current) {
        console.log('Stopping speech recognition after sending message');
        recognitionRef.current.stop();
        setIsListening(false);
      }

      setTimeout(() => {
        const getAdvancedContextualResponse = (analysis: ClaudeAnxietyAnalysis) => {
          if (analysis.personalizedResponse) {
            return analysis.personalizedResponse;
          }

          let response = "";

          if (analysis.crisisRiskLevel === 'critical') {
            response = "I'm very concerned about what you're sharing with me, and I want you to know that you don't have to face this alone. Please consider reaching out to a crisis helpline (988 in the US) or emergency services immediately. Your life has value and there are people who want to help you through this difficult time.";
          } else if (analysis.crisisRiskLevel === 'high') {
            response = "I can hear how much pain you're in right now, and I'm really glad you're reaching out. What you're experiencing sounds incredibly difficult. Have you considered speaking with a mental health professional about these feelings? They can provide specialized support that might really help.";
          } else {
            switch (analysis.therapyApproach) {
              case 'CBT':
                response = `I notice some thought patterns in what you're sharing that might be contributing to your anxiety. ${analysis.cognitiveDistortions.length > 0 ? `Specifically, I'm picking up on ${analysis.cognitiveDistortions[0].toLowerCase()}.` : ''} Would you like to explore some ways to challenge these thoughts together?`;
                break;
              case 'DBT':
                response = "It sounds like you're experiencing some intense emotions right now. That's completely understandable given what you're going through. Let's focus on some skills that might help you navigate these feelings in a healthy way.";
                break;
              case 'Mindfulness':
                response = "I can sense that your mind might be racing with worries about the future or regrets about the past. Sometimes grounding ourselves in the present moment can provide some relief. Would you like to try a brief mindfulness exercise together?";
                break;
              case 'Trauma-Informed':
                response = "Thank you for trusting me with something so personal. I want you to know that your feelings are completely valid, and healing takes time. We can go at whatever pace feels comfortable for you.";
                break;
              default:
                response = "I hear you, and I want you to know that what you're experiencing is valid. You're taking a brave step by reaching out and talking about these feelings.";
            }

            if (analysis.triggers.includes('work')) {
              response += " Work-related stress can be particularly overwhelming, especially when it feels like it's taking over other areas of your life.";
            }
            if (analysis.triggers.includes('social')) {
              response += " Social anxiety can make us feel so isolated, but please remember that you belong and your feelings matter.";
            }
            if (analysis.triggers.includes('health')) {
              response += " Health anxiety is incredibly frightening - our minds can create worst-case scenarios that feel very real.";
            }
          }

          return response;
        };
        
        const contextualResponse = getAdvancedContextualResponse(anxietyAnalysis);
        
        const vanessaMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: contextualResponse,
          sender: 'vanessa',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, vanessaMessage]);
        setIsTyping(false);

        console.log('Attempting to speak response:', contextualResponse);
        speakText(contextualResponse);
      }, 2000);

    } catch (error) {
      console.error('Error analyzing anxiety:', error);
      setIsTyping(false);
      
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm here to listen and support you. Sometimes my analysis tools have hiccups, but that doesn't change the fact that your feelings are valid and important. How can I best support you right now?",
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
    console.log('Attempting to speak text:', text);
    
    if (!speechSynthesisSupported) {
      console.log('Speech synthesis not supported in this browser');
      return;
    }

    // On mobile, especially iOS, we need user interaction first
    if (isMobile && !voicesLoaded) {
      console.log('Voices not loaded yet on mobile, waiting...');
      setTimeout(() => speakText(text), 1000);
      return;
    }
    
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      // Wait a bit for cancel to complete
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices for speech:', voices.length);
        
        // Find the best female voice for mobile and desktop
        let selectedVoice = null;
        
        // For mobile devices, prioritize system voices
        if (isMobile) {
          // iOS voices
          selectedVoice = voices.find(voice => 
            voice.name.includes('Samantha') || 
            voice.name.includes('Karen') ||
            voice.name.includes('Susan') ||
            voice.name.includes('Moira')
          );
          
          // Android voices
          if (!selectedVoice) {
            selectedVoice = voices.find(voice => 
              voice.lang.startsWith('en') && 
              (voice.name.toLowerCase().includes('female') || 
               voice.name.toLowerCase().includes('woman'))
            );
          }
        } else {
          // Desktop voices
          const preferredVoices = [
            'Microsoft Zira - English (United States)',
            'Microsoft Hazel - English (Great Britain)', 
            'Google UK English Female',
            'Samantha',
            'Karen'
          ];
          
          for (const voiceName of preferredVoices) {
            selectedVoice = voices.find(voice => voice.name === voiceName);
            if (selectedVoice) break;
          }
        }
        
        // Fallback to any English female-sounding voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.lang.startsWith('en') && 
            (voice.name.toLowerCase().includes('female') || 
             voice.name.toLowerCase().includes('zara') ||
             voice.name.toLowerCase().includes('karen') ||
             voice.name.toLowerCase().includes('samantha') ||
             voice.name.toLowerCase().includes('susan'))
          );
        }
        
        // Final fallback to any English voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log('Selected voice:', selectedVoice.name, selectedVoice.lang);
        } else {
          console.log('Using default voice');
        }
        
        // Mobile-optimized voice settings
        utterance.rate = isMobile ? 0.9 : 0.85;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
          console.log('Speech started successfully');
        };
        
        utterance.onend = () => {
          console.log('Speech ended successfully');
        };
        
        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event.error);
          toast({
            title: "Audio Issue",
            description: "There was an issue with text-to-speech. Vanessa's message is still shown above.",
            variant: "destructive",
          });
        };
        
        console.log('Starting speech synthesis...');
        window.speechSynthesis.speak(utterance);
      }, 100);
      
    } catch (error) {
      console.error('Error in speech synthesis:', error);
      toast({
        title: "Audio Not Available",
        description: "Text-to-speech is not working, but you can still read Vanessa's responses.",
        variant: "destructive",
      });
    }
  };

  const toggleListening = () => {
    if (!speechSupported) {
      toast({
        title: "Microphone Not Available",
        description: "Your browser doesn't support speech recognition. Please type your message instead.",
        variant: "destructive",
      });
      return;
    }

    if (!recognitionRef.current) {
      console.log('Speech recognition not initialized');
      return;
    }

    if (isListening) {
      console.log('Stopping speech recognition');
      recognitionRef.current.stop();
      setIsListening(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    } else {
      console.log('Starting speech recognition');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast({
          title: "Microphone Error",
          description: "Unable to start speech recognition. Please check your microphone permissions.",
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
            {speechSynthesisSupported && voicesLoaded ? (
              <Volume2 className="w-6 h-6 text-green-600" />
            ) : (
              <VolumeX className="w-6 h-6 text-gray-400" />
            )}
            Advanced Anxiety Support with Vanessa
          </h1>
          <p className="text-gray-600">
            Clinically-informed AI companion with GAD-7, Beck Anxiety Inventory, and DSM-5 analysis
            {isMobile && " • Mobile Optimized"}
          </p>
          {(!speechSupported || !speechSynthesisSupported) && (
            <p className="text-amber-600 text-sm mt-2">
              {!speechSupported && "Microphone not available. "}
              {!speechSynthesisSupported && "Audio responses not available. "}
              You can still chat by typing.
            </p>
          )}
          {speechSynthesisSupported && !voicesLoaded && (
            <p className="text-blue-600 text-sm mt-2">
              Loading voice capabilities...
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
                    {isAnalyzing ? 'Analyzing with clinical frameworks...' : 'Vanessa is typing...'}
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
              title={speechSupported ? "Toggle voice input" : "Voice input not supported"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isListening 
                  ? "Listening... (auto-send in 10s of silence)" 
                  : speechSupported 
                    ? "Type your message or use voice..." 
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
              Listening... Message will auto-send after 10 seconds of silence
            </p>
          )}
          {speechSynthesisSupported && !voicesLoaded && (
            <p className="text-sm text-blue-600 mt-2">
              Loading audio capabilities for mobile...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
