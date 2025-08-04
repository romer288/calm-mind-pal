
import React from 'react';
import WelcomeHero from '@/components/WelcomeHero';
import BreathingExercise from '@/components/BreathingExercise';
import MoodTracker from '@/components/MoodTracker';
import CopingStrategies from '@/components/CopingStrategies';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <WelcomeHero />
      
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <div className="grid md:grid-cols-2 gap-8">
          <BreathingExercise />
          <MoodTracker />
        </div>
        
        <div className="max-w-2xl mx-auto">
          <CopingStrategies />
        </div>
        
        <div className="text-center py-8">
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-lg mx-auto">
              <h3 className="font-semibold text-blue-900 mb-2">For Mental Health Professionals</h3>
              <p className="text-blue-800 text-sm mb-3">
                Access real-time patient analytics and receive automated weekly progress reports
              </p>
              <a 
                href="/therapist-info" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Learn About Therapist Portal
              </a>
            </div>
          </div>
          <p className="text-gray-500 text-sm">
            Remember: This app is not a substitute for professional mental health care. 
            If you're experiencing severe anxiety or depression, please reach out to a mental health professional.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
