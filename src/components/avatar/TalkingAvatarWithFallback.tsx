
import React, { useState, useEffect } from 'react';
import { TalkingAvatar } from './TalkingAvatar';
import { useFPS } from '@/hooks/useFPS';

interface TalkingAvatarWithFallbackProps {
  text: string;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  className?: string;
}

export const TalkingAvatarWithFallback: React.FC<TalkingAvatarWithFallbackProps> = ({
  text,
  onSpeechStart,
  onSpeechEnd,
  className = ''
}) => {
  const [showFallback, setShowFallback] = useState(false);
  const { fps, isLowPerformance } = useFPS();

  useEffect(() => {
    if (isLowPerformance) {
      console.log('Low performance detected, switching to audio-only mode');
      setShowFallback(true);
    }
  }, [isLowPerformance]);

  if (showFallback) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-xl`}>
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded-full animate-pulse" />
          </div>
          <div className="text-xs text-gray-600">Audio Mode (FPS: {fps})</div>
          <div className="text-xs text-gray-500 mt-1">
            Avatar disabled for better performance
          </div>
        </div>
      </div>
    );
  }

  return (
    <TalkingAvatar
      text={text}
      onSpeechStart={onSpeechStart}
      onSpeechEnd={onSpeechEnd}
      className={className}
    />
  );
};
