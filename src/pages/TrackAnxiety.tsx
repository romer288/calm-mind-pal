
import React from 'react';
import MoodTracker from '@/components/MoodTracker';
import BreathingExercise from '@/components/BreathingExercise';

const TrackAnxiety = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Track Your Anxiety</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <MoodTracker />
          <BreathingExercise />
        </div>
      </div>
    </div>
  );
};

export default TrackAnxiety;
