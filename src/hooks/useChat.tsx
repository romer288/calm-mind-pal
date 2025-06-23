
import { useEffect } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatAnalysis } from '@/hooks/useChatAnalysis';
import { chatService } from '@/services/chatService';
import { 
  createUserMessage, 
  createAIMessage, 
  getConversationHistory, 
  getFallbackResponse, 
  getContextualResponse,
  shouldSwitchToMonica 
} from '@/utils/chatUtils';

export const useChat = () => {
  const {
    currentSession,
    aiCompanion,
    currentLanguage,
    switchToMonica
  } = useChatSession();

  const {
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
  } = useChatMessages();

  const { isAnalyzing, processMessageAnalysis } = useChatAnalysis();

  // Initialize welcome message when session is created
  useEffect(() => {
    if (currentSession && messages.length === 0) {
      const welcomeMessage = addWelcomeMessage(aiCompanion);
      
      // Save welcome message to database
      chatService.saveMessage(currentSession.id, welcomeMessage.text, aiCompanion)
        .catch(error => console.error('Failed to save welcome message:', error));
    }
  }, [currentSession, aiCompanion]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || !currentSession) return;

    console.log('📤 Sending message:', textToSend);

    // Check if we should switch to Monica
    if (shouldSwitchToMonica(textToSend, aiCompanion)) {
      const monicaSession = await switchToMonica();
      if (monicaSession) {
        const monicaIntroMessage = createAIMessage(
          "¡Hola! Soy Mónica, tu compañera de apoyo para la ansiedad. Estoy aquí para brindarte apoyo clínico informado usando los enfoques terapéuticos más avanzados. ¿Cómo te sientes hoy?",
          'monica'
        );
        
        addMessage(monicaIntroMessage);
        await chatService.saveMessage(monicaSession.id, monicaIntroMessage.text, 'monica');
        speakText(monicaIntroMessage.text, 'es');
      }
      setInputText('');
      return;
    }

    try {
      const conversationHistory = getConversationHistory(messages);
      const userMessage = createUserMessage(textToSend);
      
      addMessage(userMessage);
      setInputText('');
      setIsTyping(true);

      // Process analysis and save message
      const { anxietyAnalysis } = await processMessageAnalysis(
        textToSend, 
        conversationHistory, 
        currentSession
      );

      const source = (anxietyAnalysis as any).source || 'unknown';
      console.log(`🧠 Analysis complete from ${source.toUpperCase()}:`, anxietyAnalysis);

      // Update user message with analysis
      updateMessage(userMessage.id, { anxietyAnalysis });

      // Generate AI response
      setTimeout(async () => {
        const contextualResponse = getContextualResponse(anxietyAnalysis, currentLanguage);
        console.log(`🗣️ Using response from ${source.toUpperCase()}:`, contextualResponse);
        
        const aiMessage = createAIMessage(contextualResponse, aiCompanion);
        addMessage(aiMessage);
        setIsTyping(false);

        // Save AI response to database
        await chatService.saveMessage(currentSession.id, contextualResponse, aiCompanion);

        console.log('🔊 Speaking AI response');
        speakText(contextualResponse, currentLanguage);
      }, 800);

    } catch (error) {
      console.error('💥 Error in message handling:', error);
      setIsTyping(false);
      
      const fallbackMessage = createAIMessage(
        getFallbackResponse(currentLanguage, aiCompanion),
        aiCompanion
      );
      
      addMessage(fallbackMessage);
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
