
import React from 'react';
import { Message } from '@/types/chat';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageStyling = () => {
    if (message.sender === 'user') {
      return 'bg-blue-600 text-white';
    } else if (message.sender === 'monica') {
      return 'bg-pink-100 text-pink-900 border border-pink-200';
    } else {
      return 'bg-gray-100 text-gray-900';
    }
  };

  const getTimeStyling = () => {
    if (message.sender === 'user') {
      return 'text-blue-100';
    } else if (message.sender === 'monica') {
      return 'text-pink-600';
    } else {
      return 'text-gray-500';
    }
  };

  return (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${getMessageStyling()}`}>
        <p className="text-sm">{message.text}</p>
        <p className={`text-xs mt-1 ${getTimeStyling()}`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
