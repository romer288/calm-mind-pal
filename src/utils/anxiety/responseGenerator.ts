
export const generatePersonalizedResponse = (message: string, analysis: any): string => {
  const lowerMessage = message.toLowerCase().trim();
  
  console.log('🎯 Generating personalized response for:', message);
  console.log('📊 Analysis sentiment:', analysis.sentiment);
  console.log('📈 Anxiety level:', analysis.anxietyLevel);
  
  // Handle very short or incomplete messages
  if (lowerMessage.length <= 3) {
    const responses = [
      "I'm here and listening. Would you like to share more about how you're feeling right now?",
      "I notice you might be hesitant to share. That's completely okay. Take your time - I'm here when you're ready.",
      "Sometimes it's hard to find the words. Would it help if I asked you some questions to get started?",
      "I'm with you. You don't have to say much right now - just know that I'm here to support you."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Crisis response
  if (analysis.crisisRiskLevel === 'critical') {
    return "I'm deeply concerned about what you're sharing with me right now. Your life has immense value, and I want you to know that you don't have to face this alone. Please reach out to a crisis helpline (988 in the US) or emergency services immediately. There are people trained to help you through this exact situation.";
  }
  
  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage === 'here') {
    return `Hello! I'm so glad you're here. It takes courage to reach out, and I want you to know that this is a safe space where you can share whatever is on your mind. How are you feeling today?`;
  }
  
  // POSITIVE responses - when someone says they're NOT anxious or feeling OKAY
  if (analysis.sentiment === 'positive' || 
      lowerMessage.includes('not anxious') || 
      lowerMessage.includes('i am okay') || 
      lowerMessage.includes("i'm okay") ||
      lowerMessage.includes('feeling better') ||
      lowerMessage.includes('feeling good') ||
      lowerMessage.includes('not worried')) {
    
    const positiveResponses = [
      "That's wonderful to hear! I'm so glad you're feeling okay right now. It's great that you're checking in and being mindful of your emotional state. What's been helping you feel this way?",
      "I'm really happy to hear that you're not feeling anxious at the moment. That's a positive sign! It's good that you're aware of how you're feeling. Is there anything specific that's been contributing to this sense of being okay?",
      "It's fantastic that you're feeling alright! Sometimes it's just as important to acknowledge when we're doing well as when we're struggling. What does 'okay' feel like for you right now?",
      "That's great news! I appreciate you sharing that you're feeling okay. It shows good self-awareness to check in with yourself like this. How has your day been treating you?"
    ];
    
    return positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
  }
  
  // Neutral responses - when someone is just checking in or being casual
  if (analysis.sentiment === 'neutral' && analysis.anxietyLevel <= 3) {
    const neutralResponses = [
      "Thank you for sharing that with me. I'm here to listen and support you however you need. Is there anything particular on your mind today?",
      "I appreciate you checking in. It's good to touch base with how you're feeling. What brought you here today?",
      "Thanks for letting me know how you're doing. I'm here if you want to talk about anything - big or small. What's on your heart today?",
      "I'm glad you reached out. Sometimes it's nice just to have someone to talk to. How can I best support you right now?"
    ];
    
    return neutralResponses[Math.floor(Math.random() * neutralResponses.length)];
  }
  
  // Feeling-based responses for actual anxiety
  if (lowerMessage.includes('anxious') || lowerMessage.includes('worried')) {
    return `I hear that you're feeling anxious right now, and I want you to know that those feelings are completely valid. Anxiety can feel overwhelming, but you've taken an important step by reaching out. What's been weighing on your mind most today?`;
  }
  
  if (lowerMessage.includes('sad') || lowerMessage.includes('depressed')) {
    return `Thank you for trusting me with how you're feeling. Sadness can feel so heavy, and it's brave of you to acknowledge it. You don't have to carry this alone - I'm here to support you through this. What's been contributing to these feelings?`;
  }
  
  // Work-related stress
  if (analysis.triggers?.includes('work')) {
    return `Work stress can feel so consuming, especially when it starts affecting other areas of your life. It sounds like your job is creating a lot of pressure for you right now. Have you been able to take any breaks for yourself lately?`;
  }
  
  // Social anxiety
  if (analysis.triggers?.includes('social')) {
    return `Social situations can feel incredibly challenging, and what you're experiencing is more common than you might think. Many people struggle with similar feelings around others. You're being brave by reaching out and talking about this.`;
  }
  
  // Health anxiety
  if (analysis.triggers?.includes('health')) {
    return `Health concerns can create such intense worry, especially when our minds start imagining worst-case scenarios. It's completely understandable that you're feeling anxious about this. Have you been able to speak with a healthcare provider about your concerns?`;
  }
  
  // High anxiety
  if (analysis.anxietyLevel >= 7) {
    return `I can feel the intensity of what you're going through right now, and I want you to know that your feelings are completely valid. When anxiety feels this overwhelming, it can seem like it will never end, but you've gotten through difficult moments before, and you can get through this one too.`;
  }
  
  // Default personalized responses based on message content
  const personalizedDefaults = [
    `Thank you for sharing "${message}" with me. I can sense that there's more behind those words, and I'm here to listen and support you through whatever you're experiencing.`,
    `I hear you saying "${message}" and I want you to know that whatever brought you here today, you don't have to face it alone. I'm here to help you work through this step by step.`,
    `"${message}" - I appreciate you sharing that with me. I'm here to listen and understand what you're going through. How are you feeling right now?`
  ];
  
  return personalizedDefaults[Math.floor(Math.random() * personalizedDefaults.length)];
};
