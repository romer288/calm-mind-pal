
import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface ChatHeaderProps {
  speechSynthesisSupported: boolean;
  speechSupported: boolean;
}

const ChatHeader = ({ speechSynthesisSupported, speechSupported }: ChatHeaderProps) => {
  return (
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
  );
};

export default ChatHeader;
