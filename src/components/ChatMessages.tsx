
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'vanessa';
  timestamp: Date;
  anxietyAnalysis?: any;
}

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  isAnalyzing: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
}

const ChatMessages = ({ messages, isTyping, isAnalyzing, scrollRef }: ChatMessagesProps) => {
  return (
    <ScrollArea className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4" ref={scrollRef}>
      <div className="space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
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
  );
};

export default ChatMessages;
