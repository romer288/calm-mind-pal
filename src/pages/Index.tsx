
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import WelcomeHero from '@/components/WelcomeHero';
import BreathingExercise from '@/components/BreathingExercise';
import MoodTracker from '@/components/MoodTracker';
import CopingStrategies from '@/components/CopingStrategies';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('User is authenticated, checking for role redirection...');
        console.log('User metadata:', session.user.user_metadata);
        
        // First check URL parameters for OAuth state (role passed through OAuth)
        const urlParams = new URLSearchParams(window.location.search);
        const stateRole = urlParams.get('state');
        
        // Check localStorage for pending role
        const pendingRole = localStorage.getItem('pending_user_role');
        
        // Check user metadata for role (from registration)
        const userRole = session.user.user_metadata?.role;
        
        // Determine role priority: URL state > localStorage > user metadata
        let role = stateRole || pendingRole || userRole;
        
        console.log('Role detection:', { stateRole, pendingRole, userRole, finalRole: role });
        
        // Clean up localStorage
        if (pendingRole) {
          localStorage.removeItem('pending_user_role');
        }
        
        // Clean up URL parameters
        if (stateRole) {
          window.history.replaceState({}, '', window.location.pathname);
        }
        
        if (role === 'therapist') {
          console.log('Redirecting therapist to therapist portal');
          navigate('/therapist-portal');
          return;
        } else {
          console.log('Redirecting to patient dashboard');
          navigate('/dashboard');
          return;
        }
      }
    };
    
    checkAuthAndRedirect();
  }, [navigate]);
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
              <h3 className="font-semibold text-blue-900 mb-2">Get Started</h3>
              <p className="text-blue-800 text-sm mb-3">
                Join thousands of users who have found peace and support through our platform
              </p>
              <a 
                href="/registration" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm font-medium transition-colors mr-3"
              >
                Sign Up
              </a>
              <a 
                href="/registration" 
                className="inline-block bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 px-6 py-3 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </a>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-lg mx-auto mt-4">
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
