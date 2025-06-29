
import React from 'react';
import ReadyPlayerMeAvatar from '@/components/ReadyPlayerMeAvatar';
import { RealisticAvatar } from '@/components/avatar/RealisticAvatar';
import { AICompanion } from '@/types/chat';

interface AvatarSectionProps {
  aiCompanion: AICompanion;
  isAnimating: boolean;
  isTyping: boolean;
  currentEmotion: {
    emotion: 'neutral' | 'empathetic' | 'concerned' | 'supportive';
    intensity: number;
  };
  useReadyPlayerMe: boolean;
  setUseReadyPlayerMe: (value: boolean) => void;
}

const AvatarSection: React.FC<AvatarSectionProps> = ({
  aiCompanion,
  isAnimating,
  isTyping,
  currentEmotion,
  useReadyPlayerMe,
  setUseReadyPlayerMe
}) => {
  return (
    <div className="lg:w-64 flex flex-col items-center">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <h3 className="text-lg font-semibold mb-2 text-center">
          {aiCompanion === 'vanessa' ? 'Vanessa' : 'Mónica'}
        </h3>
        
        {/* Avatar toggle button */}
        <div className="mb-2 text-center">
          <button
            onClick={() => setUseReadyPlayerMe(!useReadyPlayerMe)}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
          >
            {useReadyPlayerMe ? 'Use Simple Avatar' : 'Use Realistic Avatar'}
          </button>
        </div>

        {useReadyPlayerMe ? (
          <ReadyPlayerMeAvatar
            companion={aiCompanion}
            isAnimating={isAnimating || isTyping}
            emotion={currentEmotion.emotion}
            className="mx-auto"
          />
        ) : (
          <RealisticAvatar
            companion={aiCompanion}
            isAnimating={isAnimating || isTyping}
            emotion={currentEmotion.emotion}
            className="mx-auto"
          />
        )}
        
        <div className="mt-2 text-sm text-gray-600 text-center">
          {isAnimating ? 'Speaking...' : 'Listening'}
        </div>
      </div>

      {/* Avatar emotion indicator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 w-full">
        <div className="text-xs text-gray-500 mb-1">Current Mood</div>
        <div className="capitalize text-sm font-medium">
          {currentEmotion.emotion.replace('_', ' ')}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              currentEmotion.emotion === 'concerned' ? 'bg-red-400' :
              currentEmotion.emotion === 'empathetic' ? 'bg-blue-400' :
              currentEmotion.emotion === 'supportive' ? 'bg-green-400' :
              'bg-gray-400'
            }`}
            style={{ width: `${currentEmotion.intensity * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default AvatarSection;
